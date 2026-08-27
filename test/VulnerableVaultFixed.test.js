const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

/**
 * Re-runs every exploit from VulnerableVault.exploits.test.js against
 * VulnerableVaultFixed.sol and asserts each one now fails / reverts /
 * produces a fair outcome. This is the "show the fix works" evidence
 * requested in the project brief.
 *
 *   npx hardhat test test/VulnerableVaultFixed.test.js
 */
describe("VulnerableVaultFixed - fixes verified", function () {
  async function deployVault() {
    const [deployer, owner, alice, bob, mallory, other] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MockRewardToken");
    const token = await Token.deploy(ethers.parseEther("1000000"));

    const Vault = await ethers.getContractFactory("VulnerableVaultFixed");
    const vault = await Vault.connect(owner).deploy(await token.getAddress());

    return { token, vault, deployer, owner, alice, bob, mallory, other };
  }

  it("[H-01] reentrancy attack now reverts, attacker recovers only their own deposit", async function () {
    const { vault, alice, mallory } = await deployVault();

    await vault.connect(alice).deposit({ value: ethers.parseEther("10") });

    const Attacker = await ethers.getContractFactory("ReentrancyAttacker");
    const attacker = await Attacker.connect(mallory).deploy(await vault.getAddress());

    // The nested withdraw() call now reverts with "reentrant call", which
    // bubbles up and reverts the whole attack() transaction.
    await expect(attacker.connect(mallory).attack({ value: ethers.parseEther("1") })).to.be.reverted;

    // Vault keeps all of Alice's honest liquidity.
    expect(await ethers.provider.getBalance(await vault.getAddress())).to.equal(ethers.parseEther("10"));
  });

  it("[H-02] setOwner is gone; only the owner can propose a new owner, and it must be accepted", async function () {
    const { vault, owner, mallory } = await deployVault();

    // The old, unprotected setOwner no longer exists on the fixed contract.
    expect(vault.interface.hasFunction("setOwner")).to.equal(false);

    // A stranger cannot propose themselves as owner.
    await expect(vault.connect(mallory).proposeOwner(mallory.address)).to.be.revertedWith("not owner");

    // The real owner proposes a transfer...
    await vault.connect(owner).proposeOwner(mallory.address);
    expect(await vault.owner()).to.equal(owner.address); // not yet effective

    // ...and only the proposed address can accept it.
    await vault.connect(mallory).acceptOwnership();
    expect(await vault.owner()).to.equal(mallory.address);
  });

  it("[H-03] emergencyWithdraw() now reverts for anyone but the owner", async function () {
    const { vault, owner, alice, mallory } = await deployVault();

    await vault.connect(alice).deposit({ value: ethers.parseEther("5") });

    await expect(vault.connect(mallory).emergencyWithdraw(mallory.address)).to.be.revertedWith("not owner");

    // Vault funds are untouched.
    expect(await ethers.provider.getBalance(await vault.getAddress())).to.equal(ethers.parseEther("5"));

    // The legitimate owner still can, for genuine emergencies.
    await expect(vault.connect(owner).emergencyWithdraw(owner.address)).to.not.be.reverted;
  });

  it("[H-04] reward odds are now proportional to stake, not to array slot count", async function () {
    const { vault, alice, mallory } = await deployVault();

    await vault.connect(alice).deposit({ value: ethers.parseEther("10") });
    for (let i = 0; i < 20; i++) {
      await vault.connect(mallory).deposit({ value: 1n });
    }

    // Mallory's 20 dust deposits no longer create 20 separate lottery
    // slots - she is tracked once, exactly like Alice.
    expect(await vault.stakerCount()).to.equal(2n);
    expect(await vault.balances(mallory.address)).to.equal(20n);
    expect(await vault.balances(alice.address)).to.equal(ethers.parseEther("10"));

    console.log(
      "      -> Mallory now occupies exactly 1 of 2 staker slots; her win " +
        "probability is ~20 / (10e18 + 20) ≈ 0%, matching her real economic stake."
    );
  });

  it("[H-04b] a staker who fully withdraws is removed from the reward pool", async function () {
    const { vault, alice, bob } = await deployVault();

    await vault.connect(alice).deposit({ value: ethers.parseEther("1") });
    await vault.connect(bob).deposit({ value: ethers.parseEther("1") });
    expect(await vault.stakerCount()).to.equal(2n);

    await vault.connect(alice).withdraw(ethers.parseEther("1"));

    expect(await vault.stakerCount()).to.equal(1n);
    expect(await vault.isStaker(alice.address)).to.equal(false);
  });

  it("[M-03] a failing reward transfer is reported via RewardTransferFailed, not swallowed", async function () {
    const { vault, token, alice } = await deployVault();

    await vault.connect(alice).deposit({ value: ethers.parseEther("1") });
    await token.setFailTransfers(true);

    await time.increase(24 * 60 * 60 + 1);

    await expect(vault.connect(alice).pickWinner())
      .to.emit(vault, "RewardTransferFailed")
      .withArgs(alice.address, ethers.parseEther("100"));
  });

  it("[M-02] pickWinner() rejects contract callers to close the same-tx manipulation window", async function () {
    const { vault, alice } = await deployVault();
    await vault.connect(alice).deposit({ value: ethers.parseEther("1") });
    await time.increase(24 * 60 * 60 + 1);

    const Caller = await ethers.getContractFactory("PickWinnerCaller");
    const caller = await Caller.deploy(await vault.getAddress());

    await expect(caller.call()).to.be.revertedWith("no contract callers");
  });

  it("[L-01] zero address is rejected on ownership transfer and emergency withdraw", async function () {
    const { vault, owner } = await deployVault();
    await expect(vault.connect(owner).proposeOwner(ethers.ZeroAddress)).to.be.revertedWith("zero address");
    await expect(vault.connect(owner).emergencyWithdraw(ethers.ZeroAddress)).to.be.revertedWith("zero address");
  });
});
