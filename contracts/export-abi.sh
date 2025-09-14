#!/bin/bash

# Export ABIs to web package
echo "Exporting ABIs to web/public/abi/..."

# Ensure build artifacts exist
forge build

# Copy ABI files
cp out/Escrow.sol/Escrow.json ../web/public/abi/
cp out/MockERC20.sol/MockERC20.json ../web/public/abi/

echo "✅ ABIs exported successfully:"
echo "  - Escrow.json"
echo "  - MockERC20.json"