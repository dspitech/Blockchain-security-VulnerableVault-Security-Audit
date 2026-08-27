#!/bin/bash
# Usage: run_slither.sh <contract.sol> <output_prefix>
set -uo pipefail
CONTRACT="$1"
OUT_PREFIX="$2"
export PATH="/home/claude/bin:$PATH"

cd /home/claude/project
node scripts/make_std_input.js "$CONTRACT" /tmp/_slither_input.json >/dev/null

for attempt in 1 2 3 4 5; do
  slither /tmp/_slither_input.json --compile-force-framework solc-json --solc /home/claude/bin/solc \
    > "${OUT_PREFIX}.txt" 2>&1
  if grep -q "result(s) found\|contract(s) analyzed" "${OUT_PREFIX}.txt" 2>/dev/null || grep -q " analyzed (" "${OUT_PREFIX}.txt"; then
    echo "OK on attempt $attempt"
    exit 0
  fi
  echo "attempt $attempt failed, retrying..."
  sleep 1
done

echo "All attempts failed. See ${OUT_PREFIX}.txt"
exit 1
