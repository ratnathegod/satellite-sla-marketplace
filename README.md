# Satellite SLA Marketplace

Full-stack local/demo application for satellite task SLA escrow workflows.

The canonical app now lives at:

- `contracts/` - Solidity escrow contracts and Foundry scripts/tests
- `web-new/` - Next.js 14 wallet dApp with RainbowKit, Wagmi, Viem, and Tailwind
- `verifier/` - Go verifier service with `/healthz` and `/verifyProof`
- `infra/docker/` - local Docker Compose stack

The older `web/` app and nested `satellite-sla-marketplace/` copy are not active demo entrypoints.

## Local Demo

See [docs/LOCAL_DEMO.md](docs/LOCAL_DEMO.md) for the full local setup, wallet configuration, walkthrough, and troubleshooting notes.

Quick path:

```bash
make install
make dev
make deploy-local
```

Open:

```text
http://localhost:3000
```

## Local Stack Ports

| Service | Port |
| --- | --- |
| Anvil RPC | `8545` |
| IPFS API | `5001` |
| IPFS Gateway | `8080` |
| Verifier | `8091` |
| Frontend | `3000` |

The frontend intentionally does not use `5001`; that port belongs to IPFS.

## Useful Commands

```bash
make help
make export-abi
make deploy-local
make test
make dev-down
```

## Project Status

The app is demo-oriented. The verifier is still a deterministic stub, IPFS is local/dev only, release/resolve/cancel UI semantics still need a protocol alignment pass, and the system has not been security audited.
