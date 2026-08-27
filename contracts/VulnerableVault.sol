// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ============================================================================
 *  ESTIAM  -  Blockchain Security (4BLOCKC / E4CCSN)
 *  FINAL PROJECT  -  Audit target  (v2)
 * ----------------------------------------------------------------------------
 *  Contract:  VulnerableVault
 *  A staking vault: users deposit ETH, can withdraw it, and a periodic
 *  "reward round" pays a randomly chosen staker some reward tokens.
 *
 *  YOUR TASK (see the project brief):
 *    1. Audit this contract and find its security vulnerabilities.
 *    2. Write them up (finding, severity, impact).
 *    3. Fix them and submit the corrected contract.
 *    4. Present your findings.
 *
 *  A static tool (Slither) will find SOME of the bugs for you. But several of
 *  the most important ones are LOGIC / BUSINESS-RULE flaws that no tool will
 *  flag - you only find them by understanding what this contract is SUPPOSED
 *  to do and asking "can someone abuse this?". Those are where the real marks
 *  are. Read every function and think like an attacker.
 *
 *  This contract compiles and "works" for the happy path. It is NOT safe.
 *  Do NOT deploy it with real funds. It exists only to be audited.
 * ============================================================================
 */

interface IRewardToken {
    // Returns true on success, false on failure (does NOT revert).
    function transfer(address to, uint256 amount) external returns (bool);
}

contract VulnerableVault {
    // --- state -------------------------------------------------------------
    address public owner;
    IRewardToken public rewardToken;

    mapping(address => uint256) public balances;   // ETH staked per user
    address[] public stakers;                      // everyone who ever staked
    uint256 public totalStaked;

    uint256 public lastRewardTime;
    uint256 public constant REWARD_INTERVAL = 1 days;
    uint256 public constant REWARD_AMOUNT = 100 ether; // reward tokens per round

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed winner, uint256 amount);
    event OwnerChanged(address indexed newOwner);

    constructor(address _rewardToken) {
        owner = msg.sender;
        rewardToken = IRewardToken(_rewardToken);
        lastRewardTime = block.timestamp;
    }

    // --- access control ----------------------------------------------------
    modifier onlyOwner() {
        // Authenticates the ORIGINAL sender of the transaction.
        require(tx.origin == owner, "not owner");
        _;
    }

    // --- staking -----------------------------------------------------------
    function deposit() external payable {
        require(msg.value > 0, "zero deposit");

        // A staker is added to the list every time they deposit.
        stakers.push(msg.sender);

        balances[msg.sender] += msg.value;
        totalStaked += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * Withdraw part of your staked ETH.
     */
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "insufficient balance");

        // Send the ETH back to the caller.
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "transfer failed");

        // Update the books.
        unchecked {
            balances[msg.sender] -= amount;
            totalStaked -= amount;
        }
        emit Withdrawn(msg.sender, amount);
    }

    // --- rewards -----------------------------------------------------------
    /**
     * Pick a "random" staker and pay them REWARD_AMOUNT reward tokens.
     * A reward round can be triggered once the interval has passed.
     */
    function pickWinner() external {
        require(block.timestamp >= lastRewardTime + REWARD_INTERVAL, "too soon");
        require(stakers.length > 0, "no stakers");

        // Choose a pseudo-random index.
        uint256 rand = uint256(
            keccak256(abi.encodePacked(block.timestamp, blockhash(block.number - 1), stakers.length))
        );
        uint256 winnerIndex = rand % stakers.length;
        address winner = stakers[winnerIndex];

        lastRewardTime = block.timestamp;

        // Pay the reward. (transfer returns a bool.)
        rewardToken.transfer(winner, REWARD_AMOUNT);

        emit RewardPaid(winner, REWARD_AMOUNT);
    }

    // --- administration ----------------------------------------------------
    /**
     * Hand the vault over to a new owner.
     */
    function setOwner(address newOwner) external {
        owner = newOwner;
        emit OwnerChanged(newOwner);
    }

    /**
     * Emergency: pull all ETH out of the contract to a chosen address.
     */
    function emergencyWithdraw(address payable to) external {
        uint256 bal = address(this).balance;
        (bool sent, ) = to.call{value: bal}("");
        require(sent, "rescue failed");
    }

    // --- views -------------------------------------------------------------
    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function stakerCount() external view returns (uint256) {
        return stakers.length;
    }

    receive() external payable {
        // Allow plain ETH transfers to be treated as deposits.
        balances[msg.sender] += msg.value;
        totalStaked += msg.value;
    }
}
