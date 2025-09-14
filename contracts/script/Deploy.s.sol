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
  }
}