// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVaultPickWinner {
    function pickWinner() external;
}

/// Used only to prove that VulnerableVaultFixed.pickWinner() reverts when
/// called from a contract (msg.sender != tx.origin).
contract PickWinnerCaller {
    IVaultPickWinner public immutable vault;

    constructor(address _vault) {
        vault = IVaultPickWinner(_vault);
    }

    function call() external {
        vault.pickWinner();
    }
}
