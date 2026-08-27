const fs = require("fs");
const path = require("path");
const solc = require("solc");

const CONTRACTS_DIR = path.join(__dirname, "..", "contracts");
const ARTIFACTS_DIR = path.join(__dirname, "..", "artifacts");

function findSolFiles(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findSolFiles(full));
    } else if (entry.name.endsWith(".sol")) {
      results.push(full);
    }
  }
  return results;
}

const solFiles = findSolFiles(CONTRACTS_DIR);
const sources = {};
for (const file of solFiles) {
  const rel = "contracts/" + path.relative(CONTRACTS_DIR, file).replace(/\\/g, "/");
  sources[rel] = { content: fs.readFileSync(file, "utf8") };
}

const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object", "evm.bytecode.linkReferences", "evm.deployedBytecode.linkReferences"],
      },
    },
  },
};

console.log(`Compiling ${solFiles.length} source file(s) with solc ${solc.version()} ...`);
const output = JSON.parse(solc.compile(JSON.stringify(input)));

let hasError = false;
if (output.errors) {
  for (const err of output.errors) {
    console.log(err.formattedMessage);
    if (err.severity === "error") hasError = true;
  }
}
if (hasError) {
  console.error("Compilation failed.");
  process.exit(1);
}

for (const sourceName of Object.keys(output.contracts)) {
  const outDir = path.join(ARTIFACTS_DIR, sourceName);
  fs.mkdirSync(outDir, { recursive: true });
  const contractsInFile = output.contracts[sourceName];
  for (const contractName of Object.keys(contractsInFile)) {
    const c = contractsInFile[contractName];
    const artifact = {
      _format: "hh-sol-artifact-1",
      contractName,
      sourceName,
      abi: c.abi,
      bytecode: "0x" + c.evm.bytecode.object,
      deployedBytecode: "0x" + c.evm.deployedBytecode.object,
      linkReferences: c.evm.bytecode.linkReferences || {},
      deployedLinkReferences: c.evm.deployedBytecode.linkReferences || {},
    };
    fs.writeFileSync(path.join(outDir, `${contractName}.json`), JSON.stringify(artifact, null, 2));

    // debug file hardhat also expects alongside each artifact
    fs.writeFileSync(
      path.join(outDir, `${contractName}.dbg.json`),
      JSON.stringify({ _format: "hh-sol-dbg-1", buildInfo: null }, null, 2)
    );
  }
}

// Minimal artifacts/contracts-list + console.sol shim aren't needed since we
// never import hardhat/console.log in these contracts.
console.log("Artifacts written to", ARTIFACTS_DIR);
