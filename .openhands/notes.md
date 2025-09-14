# OpenHands Development Notes

## Model/Tooling Assumptions

- Node.js 20.x with PNPM 9 for package management
- Foundry for Solidity development and testing
- Go 1.22 for verifier service
- Docker Compose v2 for local development stack
- GitHub Actions for CI/CD

## Development Environment

- Uses PNPM workspaces for monorepo management
- Docker services run on specific ports:
  - Anvil (Ethereum): 8545
  - IPFS API: 5001, Gateway: 8080
  - Verifier service: 8081
  - Next.js web app: 3000

## Security Considerations

- Environment variables are templated in .env.example files
- Private keys should never be committed to version control
- All services use secure defaults where possible
- CORS and iframe settings configured for development