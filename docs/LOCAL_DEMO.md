# Local Demo

This repo's canonical local demo uses:

- `contracts/` for Foundry contracts and deployment scripts
- `web-new/` for the Next.js wallet dApp
- `verifier/` for the Go verifier service
- `infra/docker/docker-compose.dev.yml` for Anvil, IPFS, verifier, and web-new

The older `web/` app and nested `satellite-sla-marketplace/` copy are kept for reference only and are not part of the active demo flow.

## Prerequisites

- Node.js 20.x and pnpm 9.x
- Docker Desktop
- Foundry (`forge`, `cast`, `anvil`)
- Go 1.22+
- ripgrep (`rg`)
- Browser wallet extension such as MetaMask or Rabby

## Quickstart

```bash
make install
make dev
make deploy-local
```

Open the dApp at:

```text
http://localhost:3000
```

`make dev` starts Anvil, local IPFS, the Go verifier, and the canonical `web-new` app. Run `make deploy-local` after Anvil is healthy so the frontend has fresh ABI and address files.

`make install` initializes the canonical Foundry dependency submodule at `contracts/lib/openzeppelin-contracts`, including its recursive `forge-std` dependency, then installs pnpm workspace dependencies for `web-new`.

## Ports

| Service | URL |
| --- | --- |
| Anvil RPC | `http://localhost:8545` |
| IPFS API | `http://localhost:5001` |
| IPFS Gateway | `http://localhost:8080/ipfs` |
| Verifier | `http://localhost:8091` |
| Frontend | `http://localhost:3000` |

The frontend intentionally uses port `3000`; IPFS owns host port `5001`.

## Environment

Copy the example if you want to run `web-new` outside Docker:

```bash
cp web-new/.env.example web-new/.env.local
```

Expected local values:

```ini
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_VERIFIER_URL=http://localhost:8091
VERIFIER_URL=http://localhost:8091
IPFS_API_URL=http://localhost:5001
IPFS_GATEWAY_URL=http://localhost:8080/ipfs
NEXT_PUBLIC_IPFS_API_URL=http://localhost:5001
NEXT_PUBLIC_IPFS_GATEWAY_URL=http://localhost:8080/ipfs
NEXT_PUBLIC_WALLET_CONNECT_ID=local-demo
```

Do not commit real `.env` or `.env.local` files.

## Wallet Setup

Add a local network in your wallet:

- Network name: `Anvil Local`
- RPC URL: `http://localhost:8545`
- Chain ID: `31337`
- Currency symbol: `ETH`

For local development only, import one or more Anvil test accounts printed by Anvil when it starts. The first default account is the deployer used by `make deploy-local`; it receives local ETH and demo MockERC20 tokens. Never use these accounts or keys with real funds.

The deploy script also seeds the first two default Anvil accounts with demo `SAT` tokens:

- Requester/deployer: `0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266`
- Operator: `0x70997970c51812dc3a010c7d01b50e0d17dc79c8`

## Demo Walkthrough

1. Start the stack with `make dev`.
2. Deploy and export contracts with `make deploy-local`.
3. Open `http://localhost:3000`.
4. Connect your wallet on chain `31337`.
5. Create an SLA task from `/new-task`; metadata is uploaded to local IPFS and its CID is stored in the task reference.
6. Fund the task with the local MockERC20 token.
7. Switch to the operator account and accept the funded task.
8. Submit proof from the task detail page; the UI uploads the proof file and proof manifest to local IPFS through `/api/ipfs/add`, then calls the local verifier stub through `/api/verifyProof`.
9. As requester, release payment or raise a dispute while the submitted proof dispute window is open.
10. As contract owner, resolve disputed tasks.
11. Requesters can cancel Created or Funded tasks only after the task deadline has passed.
12. View task lifecycle events at `/events`.

## Proof Flow

Proof submission is deterministic demo plumbing, not real satellite verification:

1. The operator selects a proof file on the task detail page.
2. The browser sends the file to the Next.js IPFS proxy route at `/api/ipfs/add`.
3. The proxy uploads to the local Kubo API and returns a proof CID plus gateway URL.
4. The frontend creates a simple manifest containing task ID, proof file name/size/type, proof CID, requester, operator, timestamp, and `verifierMode: "deterministic-demo"`.
5. The manifest is uploaded to IPFS through the same proxy route.
6. The frontend calls `/api/verifyProof` with the proof CID, manifest CID, task ID, requester/operator, and file metadata.
7. The Go verifier returns deterministic nonzero `bytes32` values: `artifactHash`, `manifestHash`, and `attestationId`.
8. The frontend validates those values and calls `submitProof(taskId, artifactHash, manifestHash, attestationId)`.

Only the three hashes are stored on-chain. The proof and manifest CIDs are local demo artifacts and are not persisted by a database.

## Known Limitations

- The verifier is a deterministic local stub, not real proof verification.
- IPFS is local/dev only.
- There is no production event indexer.
- Release, dispute, resolve, and cancel controls follow the current contract semantics, but the UX still has limited automated test coverage.
- The frontend may show wallet or IndexedDB warnings during server/static rendering.
- The contracts and app have not been security audited.

## Tests and CI

Run the canonical regression checks locally with:

```bash
make test
```

The target runs:

- `cd contracts && forge build`
- `cd contracts && forge test --offline`
- `cd verifier && go test ./...`
- `pnpm -C web-new test`
- `pnpm -C web-new e2e`
- `pnpm -C web-new build`
- `docker compose -f infra/docker/docker-compose.dev.yml config`
- a stale API/name scan against `web-new`

The Playwright browser smoke tests render the canonical routes and exercise the verifier/IPFS API route behavior without automating a browser wallet. Browser wallet flows are still manual.

GitHub Actions uses the same canonical paths: `contracts/`, `verifier/`, `web-new/`, and `infra/docker/docker-compose.dev.yml`. The older `web/` app and nested duplicate repo are not part of CI.

For local demo smoke checks:

```bash
make smoke
```

This static mode validates canonical demo files, ABI/address JSON, and Docker Compose config. After `make dev` and `make deploy-local`, run:

```bash
make smoke-live
```

Live mode checks the frontend, verifier, IPFS API, deterministic verifier response shape, and deployed bytecode when `cast` is available.

## Troubleshooting

### Port 5001 conflict

Port `5001` belongs to the IPFS API. The frontend runs on `3000`. If another IPFS daemon is already running, stop it or change the compose port mapping and matching env vars.

### Docker is not running

Start Docker Desktop, then rerun:

```bash
make dev
```

### Stale address files

If the app cannot find contracts, redeploy:

```bash
make deploy-local
```

This writes:

- `web-new/public/abi/Escrow.json`
- `web-new/public/abi/MockERC20.json`
- `web-new/public/abi/escrow.address.json`
- `web-new/public/abi/mockerc20.address.json`

### Wallet wrong network

Switch your wallet to chain ID `31337` and RPC `http://localhost:8545`.

### Missing Foundry dependencies

If `forge build` cannot resolve dependencies, install the contract dependency:

```bash
git submodule update --init --recursive contracts/lib/openzeppelin-contracts
```

### IPFS upload or CORS issue

Proof uploads normally go through the Next.js proxy route, which avoids direct browser-to-Kubo CORS problems. If uploads fail, first confirm IPFS is running and restart the service:

```bash
docker compose -f infra/docker/docker-compose.dev.yml restart ipfs
```

If `web-new` runs outside Docker, make sure `IPFS_API_URL` or `NEXT_PUBLIC_IPFS_API_URL` points to `http://localhost:5001`.

### Verifier unavailable

Check the verifier health endpoint:

```bash
curl http://localhost:8091/healthz
```

The proof flow expects `/api/verifyProof` to reach `http://localhost:8091/verifyProof` outside Docker, or `http://verifier:8091/verifyProof` from the Docker web service.

### Invalid bytes32 or transaction revert

The verifier response must include nonzero 32-byte hex strings for `artifactHash`, `manifestHash`, and `attestationId`. If the transaction reverts, confirm the connected wallet is the designated operator, the task is `Accepted`, and the proof deadline has not passed.

### IndexedDB build warnings

`pnpm -C web-new build` may print `indexedDB is not defined` during static generation. The build can still succeed; this is a remaining frontend warning, not a database requirement.

## Database

No database is currently required for the local demo.
