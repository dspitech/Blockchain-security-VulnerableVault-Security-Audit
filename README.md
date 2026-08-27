# Smart Contract Security Audit -VulnerableVault.sol

| Item | Information |
|---|---|
| **Institution** | **ÉSTIAM Paris** |
| **Class / Program** | `4BLOCKC / E4CCSN - Blockchain Security` |
| **Project** | **Final Project** |
| **Trainer** | David de Paula Santos Silva |
| **Group Name** | `BlockHash` |
| **Members** | `Fatou FATY`<br>`Pape LO`<br>`ELODIE IPARRAGUIRRE`<br>`Olivier POLYNICE` |
| **Submission Date** | `27/08/2026` |


A full security audit of `VulnerableVault.sol`, a staking vault seeded with 9 deliberately
planted vulnerabilities (4 High, 3 Medium, 2 Low). This repository contains everything the
project brief asks for, plus working proof-of-concept exploits and a regression suite that
proves every fix actually holds -not just a written claim.

## What's in here

| Deliverable | Location |
|---|---|
| Corrected contract | [`contracts/VulnerableVaultFixed.sol`](contracts/VulnerableVaultFixed.sol) |
| Raw Slither output (before/after) | [`docs/slither/`](docs/slither/) |
| Exploit + fix-verification tests | [`test/`](test/) |

## Repository layout

```
contracts/
  VulnerableVault.sol           # the original, vulnerable contract (unmodified)
  VulnerableVaultFixed.sol      # corrected version -every fix tagged with its finding ID
  mocks/
    MockRewardToken.sol         # minimal ERC20-like token used only by the test suite
    ReentrancyAttacker.sol      # PoC attacker contract for finding H-01
    OnlyOwnerTxOriginDemo.sol   # isolated harness + phisher contract for finding M-01
    PickWinnerCaller.sol        # helper used to prove pickWinner()'s contract-caller guard
test/
  VulnerableVault.exploits.test.js   # 7 tests -actively EXPLOITS the vulnerable contract
  VulnerableVaultFixed.test.js       # 7 tests -proves the fixed contract blocks/handles each attack
scripts/
  compile.js, make_std_input.js, run_slither.sh   # build tooling (see "Reproducing this audit" below)
```

## Findings summary

| ID | Finding | Severity |
|---|---|---|
| H-01 | Reentrancy in `withdraw()` drains vault ETH | High |
| H-02 | `setOwner()` has no access control | High |
| H-03 | `emergencyWithdraw()` has no access control | High |
| H-04 | Reward lottery can be gamed by dust deposits / stale entries | High |
| M-01 | `onlyOwner` uses `tx.origin` (phishable) | Medium |
| M-02 | Predictable / manipulable randomness in `pickWinner()` | Medium |
| M-03 | Unchecked reward-token transfer return value | Medium |
| L-01 | Missing zero-address validation | Low |
| L-02 | `receive()` bypasses the `Deposited` event / staker bookkeeping | Low |

Full write-ups (vulnerable code, impact, fix, and the test that proves each one) are in the
audit report. Two of the four High findings -H-02 and H-04 -are **business-logic bugs
that Slither's default detectors do not flag**; they were only found by asking, for every
function, "who can call this, and can it be gamed?" -exactly as the project brief predicts.

## Full hands-on guide -reproducing the audit on Kali Linux

This section spells out **every single command**, in order, to actually run the tests and
the Slither analysis on a Kali Linux machine, starting from nothing but a stock Kali
install. Copy-paste the commands as-is.

### Step 0 -Get the project

If you have the `VulnerableVault-Security-Audit.zip` file:

```bash
mkdir -p ~/audit && cd ~/audit
```

<img width="831" height="410" alt="image" src="https://github.com/user-attachments/assets/01a7e07b-91f7-412b-9b67-69dd664744d9" />


```bash
git clone https://github.com/dspitech/Blockchain-security-VulnerableVault-Security-Audit.git
```

<img width="1667" height="645" alt="image" src="https://github.com/user-attachments/assets/6d4682f5-9ee8-4176-9643-b4d5f63c98de" />

```bash
cd Blockchain-security-VulnerableVault-Security-Audit
```

<img width="1632" height="572" alt="image" src="https://github.com/user-attachments/assets/c70f0a9f-06a5-4c4c-8f28-bb8353043c61" />


Confirm you're in the right place (you should see `contracts/`, `test/`, `docs/`):

```bash
ls
```

### Step 1 -Check / install prerequisites

Kali is Debian-based, so `apt` is available. You need **Node.js ≥ 18**, `npm`, and
**Python 3 + pip** (for Slither, in Step 6).

```bash
# Check what's already there (if Node isn't installed, this command fails - that's expected)
node --version
npm --version
python3 --version
```

<img width="1355" height="577" alt="image" src="https://github.com/user-attachments/assets/41ca4835-2353-4336-9fca-cab88fe11fc0" />


**If `node --version` fails or shows a version below 18**, install Node.js via NodeSource
(Kali's own repo version can be outdated):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version   # should print v20.x.x
```

**If `python3` or `pip3` are missing** (rare on Kali, but just in case):

```bash
sudo apt update
sudo apt install -y python3 python3-pip python3-venv
```

<img width="1846" height="720" alt="image" src="https://github.com/user-attachments/assets/3bc36f7c-f6dd-4a7d-a1b3-e2b199336852" />

<img width="1851" height="996" alt="image" src="https://github.com/user-attachments/assets/715f52ef-1dec-4a0d-a023-920ca4a79628" />



### Step 2 -Install the project's Node dependencies

From the project root (`vulnerablevault-audit/`):

```bash
npm install
```

<img width="1907" height="832" alt="image" src="https://github.com/user-attachments/assets/dedf9f9e-f60b-4f74-b80e-de2d652b2bc7" />


This installs Hardhat, `@nomicfoundation/hardhat-toolbox`, `solc`, and everything the tests
need, into a local `node_modules/` folder (about a minute, ~600 packages). You'll see a
summary like:

```
added 640 packages, and audited 641 packages in 25s
found 0 vulnerabilities
```

You may see `npm warn deprecated ...` warnings -that's normal and harmless, they come from
Hardhat's own transitive dependencies.

### Step 3 -Compile the contracts

On Kali, with full internet access, Hardhat's **native** compilation works out of the box
(it downloads the official `solc` binary on first run):

```bash
rm -rf node_modules package-lock.json

- Installation de Hardhat 2
npm install --save-dev hardhat@^2.28.0

- Installation du Toolbox compatible
npm install --save-dev "@nomicfoundation/hardhat-toolbox@hh2"

Vérification
npx hardhat --version

On doit obtenir une version 2.x.

Restauration de la configuration
Comme on revient à Hardhat 2, il faut supprimer le mode ESM :

npm pkg delete type

- Compiler
npx hardhat compile
```

<img width="1235" height="301" alt="image" src="https://github.com/user-attachments/assets/77878e21-9e6f-4287-9f0a-c4c63967de1e" />

<img width="1622" height="497" alt="image" src="https://github.com/user-attachments/assets/0aba29b2-d400-45a1-80c5-175308f6b865" />


> The repo already ships a pre-built `artifacts/` folder (produced with a fallback solc-js
> compiler, because the environment this project was prepared in couldn't reach
> `binaries.soliditylang.org` -see *"Why a custom compile script?"* below). On your Kali
> box, ignore that detail: `npx hardhat compile` regenerates the artifacts normally with
> the real `solc`, which is actually preferable.

### Step 4 -Run the FULL test suite

This is the core command: it **actually exploits** the vulnerable contract, then proves the
fixed contract blocks every attack.

```bash
npx hardhat test
```

<img width="1927" height="982" alt="image" src="https://github.com/user-attachments/assets/8efeea91-8ad2-4b1a-a099-071d4b42c8b3" />


**If you see `14 passing` with zero `failing`, the audit has been fully reproduced and
verified on your own machine.**

### Step 5 -Run tests individually (handy for the defense / Q&A)

Run only the **exploits** against the vulnerable contract:

```bash
npx hardhat test test/VulnerableVault.exploits.test.js
```

<img width="1911" height="910" alt="image" src="https://github.com/user-attachments/assets/a2a74918-6775-4a6e-9b1e-408d292de2be" />


Run only the **fix verification** suite:

```bash
npx hardhat test test/VulnerableVaultFixed.test.js
```
<img width="1890" height="902" alt="image" src="https://github.com/user-attachments/assets/722b4827-c572-432e-b5ac-6e651847fc6a" />

Run a single named test -e.g. only the H-01 reentrancy demo (handy to isolate one finding
during the Day 4 Q&A):

```bash
npx hardhat test --grep "H-01"
```

<img width="1761" height="737" alt="image" src="https://github.com/user-attachments/assets/5dec65ab-c283-42f7-a0f3-2ea0fe27b4fb" />


Swap `"H-01"` for `"H-02"`, `"H-04"`, `"M-01"`, etc. to isolate any other finding. The
default reporter already prints the full hierarchy and per-test timings, as shown above.

### Step 6 -Install and run Slither natively

On Kali, with internet access, Slither installs and runs normally -no need for the
solc-js wrapper used to prepare this repo (see the next section):

```bash
# A Python virtual environment is recommended (avoids conflicts with Kali's system packages)
python3 -m venv ~/audit/venv
source ~/audit/venv/bin/activate
pip install slither-analyzer solc-select
```

<img width="1892" height="1002" alt="image" src="https://github.com/user-attachments/assets/e7a0f9b9-01e4-4ef8-a7aa-4a24891a7bb3" />


Install and select the exact Solidity version this project uses (0.8.20):

```bash
solc-select install 0.8.20
solc-select use 0.8.20
solc --version   # should confirm 0.8.20
```

<img width="1610" height="692" alt="image" src="https://github.com/user-attachments/assets/c873cf6f-8f0a-472a-a5c7-d0c9ccb51f34" />


Run Slither on the **vulnerable** contract:

```bash
slither contracts/VulnerableVault.sol
```

<img width="1901" height="1002" alt="image" src="https://github.com/user-attachments/assets/e0fde469-df2b-4b20-9151-ce7043443790" />

<img width="1916" height="997" alt="image" src="https://github.com/user-attachments/assets/2e4b4481-f82f-42ed-8e06-19d5352b7fc5" />


Expected output (summary): **14 findings**, including `reentrancy-eth`,
`arbitrary-send-eth`, `weak-prng`, `unchecked-transfer`, `missing-zero-check`, plus a few
informational notes (`timestamp`, `solc-version`, `low-level-calls`, `immutable-states`).

Run Slither on the **fixed** contract:

```bash
slither contracts/VulnerableVaultFixed.sol
```

<img width="1917" height="1016" alt="image" src="https://github.com/user-attachments/assets/7ee61f79-af06-4575-999e-c5955f96d4f7" />


Expected output: **9 findings, all informational** -`reentrancy-eth`, `arbitrary-send-eth`,
`unchecked-transfer`, and `missing-zero-check` are all gone.

To save the output to a file (handy to attach to your own report):

```bash
slither contracts/VulnerableVault.sol > ~/audit/slither_vulnerable.txt 2>&1
slither contracts/VulnerableVaultFixed.sol > ~/audit/slither_fixed.txt 2>&1
```

When you're done, exit the virtual environment:

```bash
deactivate
```

The exact console output we obtained is already saved in [`docs/slither/`](docs/slither/)
for reference, in case you want to compare without reinstalling Slither yourself.

### Step 7 -Troubleshooting (common Kali issues)

| Symptom | Likely cause | Fix |
|---|---|---|
| `command not found: node` | Node.js not installed | See Step 1 (NodeSource) |
| `command not found: npx` | `npm install` not run yet, or Node too old | Run `npm install`, check `node --version` ≥ 18 |
| `EACCES: permission denied` on `npm install` | npm previously used globally as root | Never run `sudo npm install` in this project; re-run without `sudo` |
| `Error HH12: Trying to use a non-local installation of Hardhat` | You ran `hardhat` instead of `npx hardhat` | Always prefix with `npx` |
| Network error during `npx hardhat compile` (proxy, firewall, isolated VM) | Can't reach `binaries.soliditylang.org` | Use the bundled fallback compiler instead: `node scripts/compile.js` then `npx hardhat test --no-compile` (the artifacts already shipped in `artifacts/` also work as-is) |
| `pip: externally-managed-environment` when running `pip install slither-analyzer` | Python's "system-managed" environment (PEP 668), common on recent Kali | Use a venv (Step 6), or add `--break-system-packages` to the `pip install` command |
| Slither: `Invalid solc compilation` | Wrong solc version active | `solc-select use 0.8.20`, then re-run |
| `14 passing` but a test or two runs slower than usual | Normal, depends on machine load | No effect on pass/fail result |

### Step 8 -Clean up / reset

To start over cleanly (useful if something went wrong):

```bash
cd ~/audit/vulnerablevault-audit
rm -rf node_modules artifacts cache
npm install
npx hardhat compile
npx hardhat test
```

## Why a custom compile script?

This sandboxed development environment could not reach `binaries.soliditylang.org` (the
usual source of the native `solc` binary), so `scripts/compile.js` compiles every contract
with the **solc-js** npm package instead and writes Hardhat-compatible artifacts directly.
`scripts/run_slither.sh` similarly wraps `solc-js` so Slither can use it as its compiler
backend. None of this affects the audit's substance -same compiler version (0.8.20), same
optimizer settings -it only affects *how* solc was invoked while building this repository.
On a normal machine with network access, `npx hardhat compile` and a native `solc` install
work exactly as usual.

## Methodology

1. **Static analysis** -Slither (102 detectors), triaged finding-by-finding.
2. **Manual review** -every function read against "who can call this, and can it be
   gamed?", independent of tooling.
3. **Proof of concept** -a Hardhat test that actively exploits the vulnerable contract for
   every finding, not just an assertion about a code pattern.
4. **Fix verification** -the identical attack re-run against the corrected contract, proving
   it now reverts, is rejected, or is otherwise safely handled.


