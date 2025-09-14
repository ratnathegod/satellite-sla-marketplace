// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/Escrow.sol";

contract DeployScript is Script {
  function run() external {
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    
    vm.startBroadcast(deployerPrivateKey);
    
    Escrow escrow = new Escrow();
    
    console.log("Escrow deployed to:", address(escrow));
    
    vm.stopBroadcast();
  }
}