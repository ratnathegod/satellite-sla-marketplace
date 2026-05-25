// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/Escrow.sol";
import "../src/MockERC20.sol";

contract DeployScript is Script {
  function run() external {
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    
    vm.startBroadcast(deployerPrivateKey);
    
    // Deploy Escrow contract
    Escrow escrow = new Escrow();
    console.log("Escrow deployed to:", address(escrow));
    console.log("Owner:", escrow.owner());
    
    // Deploy Mock ERC20 for local/demo payments
    MockERC20 token = new MockERC20("Satellite Token", "SAT");
    console.log("MockERC20 deployed to:", address(token));
    console.log("Total supply:", token.totalSupply());

    // Seed the first two default Anvil accounts for a requester/operator demo.
    address demoRequester = address(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266);
    address demoOperator = address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
    uint256 demoMintAmount = 10_000 ether;
    token.mint(demoRequester, demoMintAmount);
    token.mint(demoOperator, demoMintAmount);
    console.log("Demo tokens minted to requester:", demoRequester);
    console.log("Demo tokens minted to operator:", demoOperator);
    
    vm.stopBroadcast();
    
    // Export addresses to canonical web-new package
    string memory chainId = vm.toString(block.chainid);
    string memory escrowAddress = vm.toString(address(escrow));
    string memory tokenAddress = vm.toString(address(token));
    
    // Create address JSON files for web integration
    string memory escrowJson = string.concat('{"', chainId, '":"', escrowAddress, '"}');
    string memory tokenJson = string.concat('{"', chainId, '":"', tokenAddress, '"}');
    
    vm.writeFile("../web-new/public/abi/escrow.address.json", escrowJson);
    vm.writeFile("../web-new/public/abi/mockerc20.address.json", tokenJson);
    
    console.log("Addresses exported to web-new/public/abi/");
    console.log("Deployment completed successfully!");
  }
}
