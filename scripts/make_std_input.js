const fs = require("fs");
const path = require("path");

const target = process.argv[2];
if (!target) {
  console.error("usage: node make_std_input.js <contract.sol> [outfile.json]");
  process.exit(1);
}
const outFile = process.argv[3] || "/tmp/std_input.json";

const relName = "contracts/" + path.basename(target);
const input = {
  language: "Solidity",
  sources: {
    [relName]: { content: fs.readFileSync(target, "utf8") },
  },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode", "evm.deployedBytecode", "evm.bytecode.sourceMap", "evm.deployedBytecode.sourceMap"],
        "": ["ast"],
      },
    },
  },
};

fs.writeFileSync(outFile, JSON.stringify(input));
console.log("Wrote", outFile);
