#!/bin/bash

# Export ABIs to canonical web-new package
echo "Exporting ABIs to web-new/public/abi/..."

# Ensure build artifacts exist
forge build

mkdir -p ../web-new/public/abi

# Copy ABI files
cp out/Escrow.sol/Escrow.json ../web-new/public/abi/
cp out/MockERC20.sol/MockERC20.json ../web-new/public/abi/

echo "✅ ABIs exported successfully:"
echo "  - Escrow.json"
echo "  - MockERC20.json"
