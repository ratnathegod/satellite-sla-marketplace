# Contributing to Satellite Tasking Marketplace

Thank you for your interest in contributing to the Satellite Tasking Marketplace! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- Node.js 20.x
- PNPM 9.x
- Go 1.22+
- Docker Desktop
- Git

### Development Setup

1. Fork and clone the repository
2. Run the setup command:
   ```bash
   make setup
   ```
3. Start the development environment:
   ```bash
   make dev
   ```

## Development Workflow

### Branch Naming

- Feature branches: `feature/description`
- Bug fixes: `fix/description`
- Documentation: `docs/description`
- Refactoring: `refactor/description`

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation changes
- `style:` formatting changes
- `refactor:` code refactoring
- `test:` adding or updating tests
- `chore:` maintenance tasks

Example:
```
feat(contracts): add task completion verification

- Implement proof submission validation
- Add event emission for task completion
- Update tests for new functionality
```

### Code Style

#### TypeScript/JavaScript
- Use TypeScript strict mode
- 2 spaces for indentation
- Semicolons required
- Use ESLint and Prettier configurations

#### Solidity
- Pragma version ^0.8.24
- Use OpenZeppelin contracts where applicable
- Comprehensive NatSpec documentation
- Follow Solidity style guide

#### Go
- Use `gofmt` for formatting
- Follow Go naming conventions
- Include comprehensive error handling
- Write table-driven tests

### Testing

#### Running Tests
```bash
# All tests
make test

# Individual components
cd contracts && forge test
cd verifier && go test ./...
cd web && pnpm test
```

#### Test Requirements
- All new features must include tests
- Maintain or improve test coverage
- Include both positive and negative test cases
- Test edge cases and error conditions

### Pull Request Process

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow coding standards
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   make test
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: your descriptive commit message"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a pull request through GitHub.

### PR Requirements

- [ ] All tests pass
- [ ] Code follows style guidelines
- [ ] Documentation updated (if applicable)
- [ ] No merge conflicts
- [ ] Descriptive PR title and description
- [ ] Link to related issues (if applicable)

## Project Structure

```
├── contracts/          # Solidity smart contracts (Foundry)
├── verifier/           # Go verification service
├── web/               # Next.js web application
├── infra/docker/      # Docker development stack
├── .github/           # GitHub Actions workflows
└── docs/              # Additional documentation
```

## Component Guidelines

### Smart Contracts (`/contracts`)
- Use established patterns and libraries
- Implement comprehensive access controls
- Emit events for all state changes
- Include detailed NatSpec documentation
- Write extensive test coverage

### Verifier Service (`/verifier`)
- Follow Go best practices
- Implement proper error handling
- Use structured logging
- Include health checks and metrics
- Write unit and integration tests

### Web Application (`/web`)
- Use TypeScript for type safety
- Implement responsive design
- Follow accessibility guidelines
- Handle loading and error states
- Include user-friendly error messages

## Documentation

- Update README.md for significant changes
- Include inline code comments for complex logic
- Update API documentation for service changes
- Add examples for new features

## Issue Reporting

When reporting issues, please include:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, versions, etc.)
- Relevant logs or error messages

## Questions and Support

- Create a GitHub issue for bugs or feature requests
- Use GitHub Discussions for questions and ideas
- Check existing issues before creating new ones

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow the project's coding standards

Thank you for contributing to the Satellite Tasking Marketplace!