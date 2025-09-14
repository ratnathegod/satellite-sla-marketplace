// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/Escrow.sol";
import "../src/MockERC20.sol";

contract DemoScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy contracts
        Escrow escrow = new Escrow();
        MockERC20 token = new MockERC20("Satellite Token", "SAT");
        
        console.log("=== Deployment ===");
        console.log("Escrow deployed to:", address(escrow));
        console.log("MockERC20 deployed to:", address(token));
        
        // Create demo accounts
        address requester = vm.addr(1);
        address operator = vm.addr(2);
        
        console.log("\n=== Demo Accounts ===");
        console.log("Requester:", requester);
        console.log("Operator:", operator);
        
        // Mint tokens to demo accounts
        token.mint(requester, 10000e18);
        token.mint(operator, 10000e18);
        
        console.log("\n=== Token Balances ===");
        console.log("Requester balance:", token.balanceOf(requester));
        console.log("Operator balance:", token.balanceOf(operator));
        
        vm.stopBroadcast();
        
        // Demo task lifecycle
        console.log("\n=== Task Lifecycle Demo ===");
        
        // 1. Create task (as requester)
        vm.startBroadcast(1); // requester private key
        
        uint256 taskAmount = 1000e18;
        uint256 bondAmount = 500e18;
        uint64 deadline = uint64(block.timestamp + 7 days);
        uint64 disputeWindow = 3 days;
        string memory taskRefCid = "QmDemoTaskReference";
        
        uint256 taskId = escrow.createTask(
            operator,
            token,
            taskAmount,
            bondAmount,
            deadline,
            disputeWindow,
            taskRefCid
        );
        
        console.log("1. Task created with ID:", taskId);
        
        // 2. Fund task
        token.approve(address(escrow), taskAmount);
        escrow.fundTask(taskId);
        console.log("2. Task funded with", taskAmount, "tokens");
        
        vm.stopBroadcast();
        
        // 3. Accept task (as operator)
        vm.startBroadcast(2); // operator private key
        
        token.approve(address(escrow), bondAmount);
        escrow.acceptTask(taskId);
        console.log("3. Task accepted by operator with", bondAmount, "bond");
        
        // 4. Submit proof
        bytes32 artifactHash = keccak256("demo_artifact");
        bytes32 manifestHash = keccak256("demo_manifest");
        bytes32 attestationId = keccak256("demo_attestation");
        
        escrow.submitProof(taskId, artifactHash, manifestHash, attestationId);
        console.log("4. Proof submitted by operator");
        
        vm.stopBroadcast();
        
        // 5. Release payment (as requester)
        vm.startBroadcast(1); // requester private key
        
        escrow.release(taskId);
        console.log("5. Payment released to operator");
        
        vm.stopBroadcast();
        
        // Final balances
        console.log("\n=== Final Balances ===");
        console.log("Requester balance:", token.balanceOf(requester));
        console.log("Operator balance:", token.balanceOf(operator));
        
        // Task status
        Escrow.Task memory task = escrow.getTask(taskId);
        console.log("\n=== Task Status ===");
        console.log("Status:", uint256(task.status)); // 5 = Released
        console.log("Demo completed successfully!");
    }
}