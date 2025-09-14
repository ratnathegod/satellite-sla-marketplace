.PHONY: setup dev test deploy-local clean help

# Default target
help:
	@echo "Satellite Tasking Marketplace - Development Commands"
	@echo ""
	@echo "Available targets:"
	@echo "  setup        - Install all dependencies and tools"
	@echo "  dev          - Start development environment with Docker Compose"
	@echo "  test         - Run all tests (contracts, verifier, web)"
	@echo "  deploy-local - Deploy contracts to local anvil (placeholder)"
	@echo "  clean        - Stop services and clean build artifacts"
	@echo "  help         - Show this help message"

# Install dependencies and tools
setup:
	@echo "🚀 Setting up Satellite Tasking Marketplace..."
	@echo "Checking for required tools..."
	@command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Please install Node.js 20.x"; exit 1; }
	@command -v pnpm >/dev/null 2>&1 || { echo "📦 Installing PNPM..."; npm install -g pnpm@9; }
	@command -v forge >/dev/null 2>&1 || { echo "🔨 Installing Foundry..."; curl -L https://foundry.paradigm.xyz | bash && ~/.foundry/bin/foundryup; }
	@command -v go >/dev/null 2>&1 || { echo "❌ Go 1.22+ is required but not installed. Please install Go"; exit 1; }
	@command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Please install Docker"; exit 1; }
	@echo "📦 Installing workspace dependencies..."
	@pnpm install
	@echo "✅ Setup complete!"

# Start development environment
dev:
	@echo "🚀 Starting development environment..."
	@docker compose -f infra/docker/docker-compose.dev.yml up --build

# Run all tests
test:
	@echo "🧪 Running all tests..."
	@echo "Testing contracts..."
	@cd contracts && forge test
	@echo "Testing verifier..."
	@cd verifier && go test ./...
	@echo "Testing web (build only)..."
	@cd web && pnpm build
	@echo "✅ All tests passed!"

# Deploy contracts to local anvil (placeholder)
deploy-local:
	@echo "🚀 Deploying contracts to local anvil..."
	@echo "This is a placeholder - implement actual deployment script"
	@cd contracts && forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast

# Export contract ABIs to web package
export-abi:
	@echo "📦 Exporting contract ABIs to web package..."
	@cd contracts && ./export-abi.sh

# Clean up development environment
clean:
	@echo "🧹 Cleaning up..."
	@docker compose -f infra/docker/docker-compose.dev.yml down -v
	@docker system prune -f
	@cd contracts && forge clean
	@cd verifier && go clean
	@cd web && rm -rf .next node_modules
	@rm -rf node_modules
	@echo "✅ Cleanup complete!"

# Development shortcuts
dev-logs:
	@docker compose -f infra/docker/docker-compose.dev.yml logs -f

dev-stop:
	@docker compose -f infra/docker/docker-compose.dev.yml down

dev-restart:
	@docker compose -f infra/docker/docker-compose.dev.yml restart