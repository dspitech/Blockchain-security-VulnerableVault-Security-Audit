// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Minimal reward token used only in the test suite to simulate the real
 * IRewardToken dependency of VulnerableVault. Intentionally simple: it is
 * NOT part of the audited surface, it just needs a `transfer` that behaves
 * like a standard (non-reverting-on-failure) ERC20 token.
 */
contract MockRewardToken {
    string public name = "Mock Reward Token";
    string public symbol = "MRT";
    uint8 public decimals = 18;

    mapping(address => uint256) public balanceOf;

    // When true, transfer() returns false instead of moving tokens -
    // used to demonstrate the "unchecked return value" finding.
    bool public failTransfers;

    event Transfer(address indexed from, address indexed to, uint256 value);

    constructor(uint256 initialSupply) {
        balanceOf[msg.sender] = initialSupply;
    }

    function setFailTransfers(bool v) external {
        failTransfers = v;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        if (failTransfers) {
            return false; // silently "fails", like a paused/blacklisting token
        }
        if (balanceOf[msg.sender] < amount) {
            return false;
        }
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
}
