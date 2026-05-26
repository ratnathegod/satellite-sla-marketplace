#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="${1:---static}"

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

require_file() {
  local file="$1"
  test -f "$ROOT_DIR/$file" || fail "Missing required file: $file"
}

validate_json() {
  local file="$1"
  node - "$ROOT_DIR/$file" <<'NODE'
const fs = require('fs')
const file = process.argv[2]
JSON.parse(fs.readFileSync(file, 'utf8'))
NODE
}

read_address() {
  local file="$1"
  node - "$ROOT_DIR/$file" <<'NODE'
const fs = require('fs')
const file = process.argv[2]
const data = JSON.parse(fs.readFileSync(file, 'utf8'))
const value = data['31337'] || Object.values(data)[0]
if (!value) process.exit(1)
process.stdout.write(value)
NODE
}

echo "Checking canonical local demo files..."

require_file "infra/docker/docker-compose.dev.yml"
require_file "web-new/public/abi/Escrow.json"
require_file "web-new/public/abi/MockERC20.json"
require_file "web-new/public/abi/escrow.address.json"
require_file "web-new/public/abi/mockerc20.address.json"

validate_json "web-new/public/abi/Escrow.json"
validate_json "web-new/public/abi/MockERC20.json"
validate_json "web-new/public/abi/escrow.address.json"
validate_json "web-new/public/abi/mockerc20.address.json"

docker compose -f "$ROOT_DIR/infra/docker/docker-compose.dev.yml" config >/dev/null

if [[ "$MODE" != "--live" ]]; then
  echo "Static smoke checks passed."
  echo "Run scripts/check-local-demo.sh --live after make dev and make deploy-local for service checks."
  exit 0
fi

echo "Checking live local demo services..."

curl -fsS "http://localhost:3000" >/dev/null ||
  fail "Frontend is not reachable at http://localhost:3000. Start it with make dev."

curl -fsS "http://localhost:8091/healthz" >/dev/null ||
  fail "Verifier is not reachable at http://localhost:8091/healthz. Start it with make dev."

curl -fsS -X POST "http://localhost:5001/api/v0/version" >/dev/null ||
  fail "IPFS API is not reachable at http://localhost:5001. Start it with make dev."

verifier_response="$(curl -fsS -X POST "http://localhost:8091/verifyProof" \
  -H "Content-Type: application/json" \
  -d '{"taskId":"1","proofCid":"bafyproof","manifestCid":"bafymanifest","proofFileName":"proof.txt","proofFileSize":12,"proofFileType":"text/plain","verifierMode":"deterministic-demo"}')"

node - "$verifier_response" <<'NODE'
const response = JSON.parse(process.argv[2])
const bytes32 = /^0x[0-9a-fA-F]{64}$/
if (response.valid !== true) throw new Error('verifier response was not valid')
for (const key of ['artifactHash', 'manifestHash', 'attestationId']) {
  if (!bytes32.test(response[key])) throw new Error(`${key} was not bytes32`)
}
NODE

if command -v cast >/dev/null 2>&1; then
  escrow_address="$(read_address "web-new/public/abi/escrow.address.json")"
  token_address="$(read_address "web-new/public/abi/mockerc20.address.json")"
  escrow_code="$(cast code "$escrow_address" --rpc-url http://localhost:8545)"
  token_code="$(cast code "$token_address" --rpc-url http://localhost:8545)"
  [[ "$escrow_code" != "0x" ]] || fail "No bytecode found for Escrow at $escrow_address."
  [[ "$token_code" != "0x" ]] || fail "No bytecode found for MockERC20 at $token_address."
else
  echo "WARN: cast not found; skipping deployed bytecode checks."
fi

echo "Live local demo smoke checks passed."
