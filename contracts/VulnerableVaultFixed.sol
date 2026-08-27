// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ============================================================================
 *  ESTIAM - Blockchain Security (4BLOCKC / E4CCSN) - Final Project
 * ----------------------------------------------------------------------------
 *  Contract:  VulnerableVaultFixed
 *  Corrected version of VulnerableVault.sol. Every change below is tagged
 *  with the finding ID it resolves - cross-reference the audit report.
 *
 *  Fixes applied:
 *    [H-01] Reentrancy in withdraw()            -> checks-effects-interactions
 *                                                    + nonReentrant guard
 *    [H-02] Missing access control on setOwner() -> onlyOwner + 2-step transfer
 *    [H-03] Missing access control on
 *           emergencyWithdraw()                  -> onlyOwner
 *    [H-04] Stakers array can be gamed / stale
 *           entries after full withdrawal        -> unique staker set +
 *                                                    stake-weighted lottery
 *    [M-01] tx.origin used for authentication    -> msg.sender
 *    [M-02] Weak / predictable randomness         -> extra entropy + restrict
 *                                                    to EOA callers + documented
 *                                                    residual risk (see report)
 *    [M-03] Unchecked ERC20 return value          -> require() on transfer()
 *    [L-01] No zero-address validation            -> added
 *    [L-02] receive() bypassed the Deposited event -> routed through _deposit()
 * ============================================================================
 */

interface IRewardToken {
    function transfer(address to, uint256 amount) external returns (bool);
}

contract VulnerableVaultFixed {
    // --- state -------------------------------------------------------------
    address public owner;
    address public pendingOwner; // [H-02] two-step ownership transfer
    IRewardToken public rewardToken;

    mapping(address => uint256) public balances;    // ETH staked per user
    mapping(address => bool) public isStaker;        // [H-04] de-dup guard
    mapping(address => uint256) private stakerIndex1; // 1-based index into `stakers`
    address[] public stakers;                         // unique stakers only
    uint256 public totalStaked;

    uint256 public lastRewardTime;
    uint256 public constant REWARD_INTERVAL = 1 days;
    uint256 public constant REWARD_AMOUNT = 100 ether;

    // [H-01] reentrancy guard
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status = _NOT_ENTERED;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed winner, uint256 amount);
    event RewardTransferFailed(address indexed winner, uint256 amount); // [M-03]
    event OwnerChangeProposed(address indexed newOwner);
    event OwnerChanged(address indexed previousOwner, address indexed newOwner);
    event EmergencyWithdraw(address indexed to, uint256 amount);

    constructor(address _rewardToken) {
        require(_rewardToken != address(0), "zero reward token"); // [L-01]
        owner = msg.sender;
        rewardToken = IRewardToken(_rewardToken);
        lastRewardTime = block.timestamp;
    }

    // --- access control ------------------------------------------------
    modifier onlyOwner() {
        // [M-01] msg.sender, not tx.origin: a malicious contract the owner
        // interacts with can no longer impersonate the owner.
        require(msg.sender == owner, "not owner");
        _;
    }

    // [H-01] minimal reentrancy guard (OpenZeppelin ReentrancyGuard pattern)
    modifier nonReentrant() {
        require(_status != _ENTERED, "reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    // --- staking ---------------------------------------------------------
    function deposit() external payable {
        _deposit(msg.sender, msg.value);
    }

    function _deposit(address user, uint256 amount) internal {
        require(amount > 0, "zero deposit");

        // [H-04] only add a staker once - duplicates used to let a user
        // inflate their odds of winning pickWinner() by depositing many
        // times with dust amounts.
        if (!isStaker[user]) {
            isStaker[user] = true;
            stakers.push(user);
            stakerIndex1[user] = stakers.length; // 1-based
        }

        balances[user] += amount;
        totalStaked += amount;
        emit Deposited(user, amount);
    }

    /**
     * Withdraw part (or all) of your staked ETH.
     * [H-01] Follows checks-effects-interactions: balances are updated
     * BEFORE the external call, and nonReentrant blocks any re-entry
     * regardless. [H-04] a staker whose balance drops to zero is removed
     * from the lottery pool so they can no longer win with zero stake.
     */
    function withdraw(uint256 amount) external nonReentrant {
        uint256 bal = balances[msg.sender];
        require(bal >= amount, "insufficient balance");
        require(amount > 0, "zero withdraw");

        // --- effects (state updated first) ---
        balances[msg.sender] = bal - amount;
        totalStaked -= amount;

        if (balances[msg.sender] == 0) {
            _removeStaker(msg.sender);
        }

        // --- interaction (external call last) ---
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    function _removeStaker(address user) internal {
        uint256 idx1 = stakerIndex1[user];
        if (idx1 == 0) return; // not tracked (shouldn't happen)

        uint256 idx = idx1 - 1;
        uint256 lastIdx = stakers.length - 1;
        address lastStaker = stakers[lastIdx];

        stakers[idx] = lastStaker;
        stakerIndex1[lastStaker] = idx + 1;

        stakers.pop();
        delete stakerIndex1[user];
        isStaker[user] = false;
    }

    // --- rewards -----------------------------------------------------------
    /**
     * Pick a staker and pay them REWARD_AMOUNT reward tokens.
     *
     * [H-04] Selection is now WEIGHTED BY STAKE: the probability of winning
     * is proportional to `balances[staker] / totalStaked`, computed over a
     * cumulative sum. This removes the incentive to spam small deposits to
     * appear multiple times in the pool - one staker with X ETH now has
     * exactly the same odds whether they got there in one deposit or fifty.
     *
     * [M-02] Randomness note: this still uses on-chain pseudo-randomness
     * (block.prevrandao + blockhash + a monotonic nonce), which is NOT safe
     * against a sophisticated validator who can bias block.prevrandao or
     * selectively reorder/withhold a block. Restricting the call to EOAs
     * (tx.origin == msg.sender) blocks same-transaction manipulation via a
     * helper contract, but a MEV-capable validator can still bias the
     * outcome. This is flagged as a residual risk in the audit report -
     * production deployments should use Chainlink VRF or a commit-reveal
     * scheme instead.
     */
    uint256 private _nonce; // [M-02] extra entropy source, increases every round

    function pickWinner() external {
        require(block.timestamp >= lastRewardTime + REWARD_INTERVAL, "too soon");
        require(stakers.length > 0, "no stakers");
        require(totalStaked > 0, "nothing staked");
        // [M-02] blocks a contract from computing the outcome and acting on
        // it atomically in the same transaction.
        require(msg.sender == tx.origin, "no contract callers");

        _nonce += 1;
        uint256 rand = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    blockhash(block.number - 1),
                    _nonce,
                    address(this)
                )
            )
        );

        uint256 target = rand % totalStaked;
        address winner = _weightedPick(target);

        lastRewardTime = block.timestamp;

        // [M-03] check the return value instead of ignoring it; a token
        // that silently "fails" (paused, blacklisted recipient, etc.) no
        // longer results in a reward that is announced but never paid.
        bool ok = rewardToken.transfer(winner, REWARD_AMOUNT);
        if (ok) {
            emit RewardPaid(winner, REWARD_AMOUNT);
        } else {
            emit RewardTransferFailed(winner, REWARD_AMOUNT);
        }
    }

    function _weightedPick(uint256 target) internal view returns (address) {
        uint256 cumulative;
        uint256 len = stakers.length;
        for (uint256 i = 0; i < len; i++) {
            address staker = stakers[i];
            cumulative += balances[staker];
            if (target < cumulative) {
                return staker;
            }
        }
        // Should be unreachable if totalStaked/balances bookkeeping is correct.
        return stakers[len - 1];
    }

    // --- administration ------------------------------------------------
    /**
     * [H-02] Two-step ownership transfer, restricted to the current owner.
     * Prevents both "anyone can call setOwner" (the original bug) and an
     * accidental transfer to an unreachable address (typo-proofing).
     */
    function proposeOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero address"); // [L-01]
        pendingOwner = newOwner;
        emit OwnerChangeProposed(newOwner);
    }

    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "not pending owner");
        address previous = owner;
        owner = pendingOwner;
        pendingOwner = address(0);
        emit OwnerChanged(previous, owner);
    }

    /**
     * [H-03] Restricted to the owner. Still a centralization risk by design
     * (the owner key can move all staked ETH) - flagged as an accepted /
     * informational risk in the report; production deployments should
     * consider a timelock + multisig owner.
     */
    function emergencyWithdraw(address payable to) external onlyOwner nonReentrant {
        require(to != address(0), "zero address"); // [L-01]
        uint256 bal = address(this).balance;
        (bool sent, ) = to.call{value: bal}("");
        require(sent, "rescue failed");
        emit EmergencyWithdraw(to, bal);
    }

    // --- views -------------------------------------------------------------
    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function stakerCount() external view returns (uint256) {
        return stakers.length;
    }

    // [L-02] routed through _deposit() so plain ETH transfers still emit
    // Deposited and are still subject to the de-dup / bookkeeping logic.
    receive() external payable {
        _deposit(msg.sender, msg.value);
    }
}
