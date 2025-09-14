// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/Escrow.sol";

contract EscrowTest is Test {
  Escrow public escrow;
  address public client = address(0x1);
  address public provider = address(0x2);

  function setUp() public {
    escrow = new Escrow();
    vm.deal(client, 10 ether);
    vm.deal(provider, 10 ether);
  }

  function testCreateTask() public {
    vm.startPrank(client);
    
    string memory ipfsHash = "QmTest123";
    uint256 amount = 1 ether;
    
    uint256 taskId = escrow.createTask{value: amount}(ipfsHash);
    
    assertEq(taskId, 0);
    assertEq(escrow.getTotalTasks(), 1);
    
    Escrow.Task memory task = escrow.getTask(taskId);
    assertEq(task.client, client);
    assertEq(task.amount, amount);
    assertEq(task.ipfsHash, ipfsHash);
    assertEq(uint256(task.status), uint256(Escrow.TaskStatus.Funded));
    
    vm.stopPrank();
  }

  function testCreateTaskEmitsEvents() public {
    vm.startPrank(client);
    
    string memory ipfsHash = "QmTest123";
    uint256 amount = 1 ether;
    
    vm.expectEmit(true, true, false, true);
    emit Escrow.TaskCreated(0, client, ipfsHash, amount);
    
    vm.expectEmit(true, true, false, true);
    emit Escrow.TaskFunded(0, client, amount);
    
    escrow.createTask{value: amount}(ipfsHash);
    
    vm.stopPrank();
  }

  function testCreateTaskRequiresIPFSHash() public {
    vm.startPrank(client);
    
    vm.expectRevert("IPFS hash required");
    escrow.createTask{value: 1 ether}("");
    
    vm.stopPrank();
  }

  function testCreateTaskRequiresFunding() public {
    vm.startPrank(client);
    
    vm.expectRevert("Task must be funded");
    escrow.createTask{value: 0}("QmTest123");
    
    vm.stopPrank();
  }

  function testGetNonExistentTask() public {
    vm.expectRevert("Task does not exist");
    escrow.getTask(0);
  }

  function testMultipleTasks() public {
    vm.startPrank(client);
    
    uint256 taskId1 = escrow.createTask{value: 1 ether}("QmTest1");
    uint256 taskId2 = escrow.createTask{value: 2 ether}("QmTest2");
    
    assertEq(taskId1, 0);
    assertEq(taskId2, 1);
    assertEq(escrow.getTotalTasks(), 2);
    
    Escrow.Task memory task1 = escrow.getTask(taskId1);
    Escrow.Task memory task2 = escrow.getTask(taskId2);
    
    assertEq(task1.amount, 1 ether);
    assertEq(task2.amount, 2 ether);
    assertEq(task1.ipfsHash, "QmTest1");
    assertEq(task2.ipfsHash, "QmTest2");
    
    vm.stopPrank();
  }
}