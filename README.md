# 🚀 Satellite Tasking Marketplace (Verifiable SLAs)

On-chain marketplace for satellite imaging/capture tasks with **verifiable service-level agreements (SLAs)**.  
Includes escrow, operator bonding, dispute resolution, IPFS storage, and a verifier service with extensible proof hooks.

## ✨ Features
- **Smart Contracts (Foundry):** Escrow lifecycle (create → fund → accept → submit proof → release/dispute).
- **Web App (Next.js 14 + viem + RainbowKit):** Wallet-connected UI for task creation, funding, acceptance, proof submission, and release/dispute.
- **Verifier (Go):** `/verifyProof` stub (extensible to EAS or zk-proofs). Health check on `/healthz`.
- **IPFS Integration:** Upload artifacts/manifests, store CIDs, keccak256 hashing for proofs.
- **Docker Dev Stack:** One command to bring up anvil, web, verifier, and IPFS.
- **CI/CD (GitHub Actions):** Run contracts, verifier, and web tests automatically.

---

## 🛠 Prerequisites
Install locally:
- [Node.js 20.x](https://nodejs.org) + [pnpm](https://pnpm.io)  
  ```bash
  npm i -g pnpm@9
  ```
- [Go 1.22+](https://go.dev/dl/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Foundry](https://book.getfoundry.sh/getting-started/installation)  
  ```bash
  curl -L https://foundry.paradigm.xyz | bash
  foundryup
  ```

---

## ⚡ Quickstart

```bash
# install deps
make setup

# start local stack (anvil, web, verifier, ipfs)
make dev

# deploy contracts to anvil
make deploy-local

# export ABIs + addresses to web/public/abi
make export-abi

# run all tests (contracts + web + verifier)
make test
```

Open the app: **http://localhost:3000**

---

## 🔑 Environment

Create `web/.env.local`:

```ini
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_VERIFIER_URL=http://localhost:8091
NEXT_PUBLIC_IPFS_API=http://localhost:5001
NEXT_PUBLIC_IPFS_GATEWAY=http://localhost:8080
```

---

## 🎮 Demo Flow

1. **Mint & Approve Tokens**
   - Go to `/dev` → Mint TEST → Approve Escrow.

2. **Create + Fund Task**
   - Visit `/new-task` → fill operator address, token amount, deadlines → Create Task → Fund Task.

3. **Operator Accepts**
   - Switch wallet to operator account → `/task/[id]` → Accept Task.

4. **Submit Proof**
   - Upload file (artifact/manifest) → CID stored in IPFS → hashes submitted to contract.

5. **Release or Dispute**
   - Requester releases funds if satisfied, or disputes → arbiter path available.

6. **Events**
   - `/events` shows Escrow lifecycle events in real time.

---

## 🧪 Testing

- **Contracts:**  
  ```bash
  forge test -C contracts
  ```
- **Verifier (Go):**  
  ```bash
  go test ./verifier/...
  ```
- **Web (Next.js):**  
  ```bash
  pnpm -C web test
  ```

Run all at once:
```bash
make test
```

---

## 🧰 Project Structure
```
contracts/    Solidity contracts + Foundry tests
web/          Next.js dApp + RainbowKit + viem
verifier/     Go HTTP verifier service (stubbed for SLA proofs)
infra/docker/ Docker compose for local dev (anvil, ipfs, web, verifier)
.github/      CI workflows
Makefile      Dev/test/deploy helpers
```

---

## ✅ CI/CD
GitHub Actions (`.github/workflows/ci.yml`) runs on each PR:
- `forge test` (contracts)
- `go test ./...` (verifier)
- `pnpm build && pnpm test` (web)

---

## 📌 Roadmap
- [ ] SLA verification with Ethereum Attestation Service (EAS)
- [ ] Operator reputation + slashing logic
- [ ] End-to-end Playwright smoke tests
- [ ] Security audit + fuzzing (Echidna, Slither)

---

## 📜 License
MIT — see [LICENSE](LICENSE) for details.

For questions or support, please create an issue or reach out to the maintainers.
