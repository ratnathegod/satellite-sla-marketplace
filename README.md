# Satellite Tasking Marketplace (Verifiable SLAs)

A decentralized marketplace for satellite tasking with verifiable Service Level Agreements (SLAs) built on Ethereum. This platform enables customers to request satellite services and providers to fulfill them with cryptographic proof of completion.

## 🚀 Quick Start

### Prerequisites

- **Node.js 20.x** - JavaScript runtime
- **PNPM 9.x** - Package manager
- **Go 1.22+** - For the verifier service
- **Docker Desktop** - Container runtime
- **Git** - Version control

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd satellite-tasking-marketplace
   ```

2. **Setup development environment**
   ```bash
   make setup
   ```

3. **Start all services**
   ```bash
   make dev
   ```

4. **Verify installation**
   - Web app: http://localhost:3000
   - Verifier health: http://localhost:8081/healthz
   - Anvil RPC: http://localhost:8545
   - IPFS Gateway: http://localhost:8080

5. **Run tests**
   ```bash
   make test
   ```

6. **Stop services**
   ```bash
   make clean
   ```

## 🏗️ Architecture

### Repository Structure

```
├── contracts/              # Solidity smart contracts (Foundry)
│   ├── src/               # Contract source code
│   ├── test/              # Contract tests
│   ├── script/            # Deployment scripts
│   └── foundry.toml       # Foundry configuration
├── verifier/              # Go verification service
│   ├── cmd/verifier/      # Main application
│   ├── internal/          # Internal packages
│   ├── go.mod             # Go module definition
│   └── Dockerfile         # Container image
├── web/                   # Next.js web application
│   ├── src/               # Application source
│   ├── public/            # Static assets
│   ├── package.json       # Dependencies
│   └── Dockerfile         # Container image
├── infra/docker/          # Development infrastructure
│   └── docker-compose.dev.yml
├── .github/workflows/     # CI/CD pipelines
└── docs/                  # Documentation
```

### Services

- **Anvil** (Port 8545): Local Ethereum node for development
- **IPFS** (Ports 5001/8080): Distributed file storage
- **Verifier** (Port 8081): Go service for proof verification
- **Web App** (Port 3000): Next.js frontend application

## 🌐 Web Integration v1

The Next.js application provides read-only integration with the deployed Escrow contract:

### Contract Artifacts Export

- `make export-abi` copies contract ABIs from `contracts/out` to `web/public/abi/`
- `make deploy-local` automatically exports contract addresses to `web/public/abi/*.address.json`
- Address files use chain ID as key: `{"31337": "0x..."}`

### Environment Configuration

The web app reads configuration from environment variables:

```bash
NEXT_PUBLIC_CHAIN_ID=31337                    # Target blockchain
NEXT_PUBLIC_RPC_URL=http://localhost:8545     # RPC endpoint
NEXT_PUBLIC_VERIFIER_URL=http://localhost:8081 # Verifier service
```

### Pages & Features

- **Dashboard (/)**: Shows chain info, contract addresses, owner, and task count
- **Events (/events)**: Lists all contract events with transaction links and decoded parameters
- **Task Details (/task/[id])**: Displays complete task information including status, participants, deadlines, and proofs
- **Read-only Mode**: All pages work without wallet connection using `publicClient`

### Development Utilities

- `pnpm dev-print` - Displays current contract addresses and quick links
- Contract utilities in `web/src/lib/viem.ts` for easy contract interaction
- Reusable components: `Address` (with copy button) and `StatusBadge`

### Testing Integration

After deploying contracts locally:

1. Visit http://localhost:3000 to see contract status
2. Check http://localhost:3000/events for transaction history  
3. View http://localhost:3000/task/1 for task details (after creating tasks)

The integration handles missing contracts gracefully with clear error messages.

## 🔧 Development

### Available Commands

```bash
make setup        # Install dependencies and tools
make dev          # Start development environment
make test         # Run all tests
make deploy-local # Deploy contracts locally
make clean        # Clean up and stop services
make help         # Show all available commands
```

### Component Development

#### Smart Contracts
```bash
cd contracts
forge build        # Compile contracts
forge test         # Run tests
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

#### Verifier Service
```bash
cd verifier
go run cmd/verifier/main.go    # Start service
go test ./...                  # Run tests
go build -o bin/verifier cmd/verifier/main.go
```

#### Web Application
```bash
cd web
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm lint         # Run linter
```

### Environment Configuration

Copy and customize environment files:

```bash
cp web/.env.example web/.env.local
cp verifier/.env.example verifier/.env
```

Key configuration options:
- `NEXT_PUBLIC_CHAIN_ID`: Blockchain network ID
- `NEXT_PUBLIC_RPC_URL`: Ethereum RPC endpoint
- `NEXT_PUBLIC_VERIFIER_URL`: Verifier service URL

## 📋 Features

### Current Implementation

- ✅ **Smart Contracts**: Escrow system with task creation and funding
- ✅ **Verifier Service**: HTTP API with health checks and CORS support
- ✅ **Web Interface**: Wallet connection, task creation, and browsing
- ✅ **Development Stack**: Docker Compose with all services
- ✅ **CI/CD**: GitHub Actions for testing and integration
- ✅ **Documentation**: Comprehensive setup and contribution guides

### Planned Features

- 🔄 **Escrow.sol v1**: Complete task lifecycle with events and tests
- 🔄 **Chain Integration**: Wire web app to read chain ID from environment
- 🔄 **Proof Submission**: Verifier routes for proof validation
- 🔄 **IPFS Integration**: File storage for task data and proofs
- 🔄 **SLA Verification**: Cryptographic proof of service completion

## 🧪 Testing

### Test Coverage

- **Contracts**: Foundry tests with comprehensive coverage
- **Verifier**: Go unit tests with race detection
- **Web**: Build verification and linting
- **Integration**: End-to-end service testing

### Running Tests

```bash
# All tests
make test

# Individual components
forge test -C contracts
go test ./verifier/...
pnpm -C web build && pnpm -C web lint
```

## 🚀 Deployment

### Local Development

The `make dev` command starts all services in Docker containers:

1. **Anvil**: Local Ethereum network
2. **IPFS**: Distributed storage
3. **Verifier**: Proof verification service
4. **Web**: Frontend application

### Production Deployment

Production deployment configurations will be added in future releases.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Standards

- **TypeScript**: Strict mode enabled
- **Solidity**: ^0.8.24 with optimizer
- **Go**: Standard formatting and conventions
- **Testing**: Comprehensive coverage required

## 🔒 Security

Security is a top priority. Please see [SECURITY.md](SECURITY.md) for:

- Vulnerability reporting process
- Security best practices
- Supported versions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Foundry**: Ethereum development toolkit
- **Next.js**: React framework
- **RainbowKit**: Wallet connection library
- **IPFS**: Distributed storage network

---

**Copyright © 2025 Ratnakaru Yalagathala**

For questions or support, please create an issue or reach out to the maintainers.