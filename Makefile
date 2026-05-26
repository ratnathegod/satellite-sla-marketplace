COMPOSE_FILE := infra/docker/docker-compose.dev.yml
ANVIL_RPC_URL := http://localhost:8545
ANVIL_PRIVATE_KEY := 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

.PHONY: help install setup dev dev-down dev-stop dev-logs dev-restart web deploy-local export-abi test smoke smoke-live clean

help:
	@echo "Satellite SLA Marketplace - Development Commands"
	@echo ""
	@echo "Available targets:"
	@echo "  install      - Check local tools and install pnpm workspace deps"
	@echo "  setup        - Alias for install"
	@echo "  dev          - Start anvil, IPFS, verifier, and canonical web-new"
	@echo "  dev-down     - Stop the Docker dev stack"
	@echo "  deploy-local - Deploy Escrow + MockERC20 to local anvil and export addresses"
	@echo "  export-abi   - Build contracts and export ABIs to web-new/public/abi"
	@echo "  web          - Run canonical web-new locally outside Docker on port 3000"
	@echo "  test         - Run canonical contracts, verifier, web-new, Docker config, and stale-name checks"
	@echo "  smoke        - Run static local demo smoke checks"
	@echo "  smoke-live   - Check a running local demo after make dev and make deploy-local"
	@echo "  clean        - Stop services and clean generated build artifacts"
	@echo "  help         - Show this help message"

install:
	@echo "Checking required tools..."
	@command -v node >/dev/null 2>&1 || { echo "Node.js 20.x is required."; exit 1; }
	@command -v pnpm >/dev/null 2>&1 || { echo "pnpm 9.x is required. Install with: npm install -g pnpm@9"; exit 1; }
	@command -v forge >/dev/null 2>&1 || { echo "Foundry is required. Install from https://book.getfoundry.sh/"; exit 1; }
	@command -v go >/dev/null 2>&1 || { echo "Go 1.22+ is required."; exit 1; }
	@command -v docker >/dev/null 2>&1 || { echo "Docker is required."; exit 1; }
	@command -v rg >/dev/null 2>&1 || { echo "ripgrep is required for stale API scans."; exit 1; }
	@echo "Initializing Foundry contract dependencies..."
	@git submodule update --init --recursive contracts/lib/openzeppelin-contracts
	@test -f contracts/lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol || { echo "Missing OpenZeppelin contracts after submodule init."; exit 1; }
	@test -f contracts/lib/openzeppelin-contracts/lib/forge-std/src/Test.sol || { echo "Missing forge-std dependency after recursive submodule init."; exit 1; }
	@echo "Installing pnpm workspace dependencies..."
	@pnpm install
	@echo "Install complete."

setup: install

dev:
	@echo "Starting canonical local demo stack..."
	@docker compose -f $(COMPOSE_FILE) up --build

dev-down:
	@docker compose -f $(COMPOSE_FILE) down

dev-stop: dev-down

dev-logs:
	@docker compose -f $(COMPOSE_FILE) logs -f

dev-restart:
	@docker compose -f $(COMPOSE_FILE) restart

web:
	@pnpm -C web-new dev

deploy-local: export-abi
	@echo "Deploying contracts to local anvil at $(ANVIL_RPC_URL)..."
	@cd contracts && PRIVATE_KEY=$(ANVIL_PRIVATE_KEY) forge script script/Deploy.s.sol --rpc-url $(ANVIL_RPC_URL) --private-key $(ANVIL_PRIVATE_KEY) --broadcast
	@echo "Contracts deployed and addresses exported to web-new/public/abi/."

export-abi:
	@echo "Exporting contract ABIs to web-new/public/abi/..."
	@cd contracts && ./export-abi.sh

test:
	@echo "Building contracts..."
	@cd contracts && forge build
	@echo "Running contract tests..."
	@cd contracts && forge test --offline
	@echo "Running verifier tests..."
	@cd verifier && go test ./...
	@echo "Running canonical web-new tests..."
	@pnpm -C web-new test
	@echo "Running canonical web-new browser smoke tests..."
	@pnpm -C web-new e2e
	@echo "Building canonical web-new..."
	@pnpm -C web-new build
	@echo "Validating Docker Compose config..."
	@docker compose -f $(COMPOSE_FILE) config >/dev/null
	@echo "Scanning canonical web-new for stale contract/API names..."
	@if rg "releasePayment|disputeTask|taskCount|getTaskProof|DisputeResolved" web-new; then \
		echo "Stale contract/API names found in web-new."; \
		exit 1; \
	fi
	@echo "All checks passed."

smoke:
	@scripts/check-local-demo.sh --static

smoke-live:
	@scripts/check-local-demo.sh --live

clean:
	@echo "Cleaning local demo artifacts..."
	@docker compose -f $(COMPOSE_FILE) down -v
	@cd contracts && forge clean
	@cd verifier && go clean
	@rm -rf web-new/.next
	@echo "Clean complete."
