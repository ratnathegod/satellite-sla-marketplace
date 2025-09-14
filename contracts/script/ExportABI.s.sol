// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/Escrow.sol";
import "../src/MockERC20.sol";

contract ExportABIScript is Script {
    function run() external {
        // Export ABIs to web/public/abi/
        string memory escrowABI = vm.readFile("out/Escrow.sol/Escrow.json");
        string memory mockERC20ABI = vm.readFile("out/MockERC20.sol/MockERC20.json");
        
        vm.writeFile("../web/public/abi/Escrow.json", escrowABI);
        vm.writeFile("../web/public/abi/MockERC20.json", mockERC20ABI);
        
        console.log("ABIs exported to web/public/abi/");
        console.log("- Escrow.json");
        console.log("- MockERC20.json");
    }
}