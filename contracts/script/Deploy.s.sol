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
    
    // Deploy Mock ERC20 for testing
    MockERC20 token = new MockERC20("Satellite Token", "SAT");
    console.log("MockERC20 deployed to:", address(token));
    console.log("Total supply:", token.totalSupply());
    
    vm.stopBroadcast();
    
    // Export addresses to web package
    string memory chainId = vm.toString(block.chainid);
    string memory escrowAddress = vm.toString(address(escrow));
    string memory tokenAddress = vm.toString(address(token));
    
    // Create address JSON files for web integration
    string memory escrowJson = string.concat('{"', chainId, '":"', escrowAddress, '"}');
    string memory tokenJson = string.concat('{"', chainId, '":"', tokenAddress, '"}');
    
    vm.writeFile("../web/public/abi/escrow.address.json", escrowJson);
    vm.writeFile("../web/public/abi/mockerc20.address.json", tokenJson);
    
    console.log("Addresses exported to web/public/abi/");
    console.log("Deployment completed successfully!");
  }
}