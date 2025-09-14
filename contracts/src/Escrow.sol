// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Escrow
 * @dev Placeholder escrow contract for satellite tasking marketplace
 * @notice This is a minimal implementation for bootstrapping purposes
 */
contract Escrow {
  struct Task {
    address client;
    address provider;
    uint256 amount;
    string ipfsHash;
    TaskStatus status;
    uint256 createdAt;
  }

  enum TaskStatus {
    Created,
    Funded,
    InProgress,
    Completed,
    Disputed,
    Resolved
  }

  mapping(uint256 => Task) public tasks;
  uint256 public nextTaskId;

  event TaskCreated(
    uint256 indexed taskId,
    address indexed client,
    string ipfsHash,
    uint256 amount
  );

  event TaskFunded(
    uint256 indexed taskId,
    address indexed client,
    uint256 amount
  );

  event TaskAssigned(
    uint256 indexed taskId,
    address indexed provider
  );

  /**
   * @dev Creates a new satellite task
   * @param ipfsHash IPFS hash containing task specifications
   */
  function createTask(string calldata ipfsHash) external payable returns (uint256) {
    require(bytes(ipfsHash).length > 0, "IPFS hash required");
    require(msg.value > 0, "Task must be funded");

    uint256 taskId = nextTaskId++;
    
    tasks[taskId] = Task({
      client: msg.sender,
      provider: address(0),
      amount: msg.value,
      ipfsHash: ipfsHash,
      status: TaskStatus.Funded,
      createdAt: block.timestamp
    });

    emit TaskCreated(taskId, msg.sender, ipfsHash, msg.value);
    emit TaskFunded(taskId, msg.sender, msg.value);

    return taskId;
  }

  /**
   * @dev Funds an existing task (placeholder implementation)
   * @param taskId The ID of the task to fund
   */
  function fundTask(uint256 taskId) external payable {
    require(taskId < nextTaskId, "Task does not exist");
    require(msg.value > 0, "Funding amount required");
    
    Task storage task = tasks[taskId];
    require(task.client == msg.sender, "Only client can fund task");
    require(task.status == TaskStatus.Created, "Task already funded");

    task.amount += msg.value;
    task.status = TaskStatus.Funded;

    emit TaskFunded(taskId, msg.sender, msg.value);
  }

  /**
   * @dev Gets task details
   * @param taskId The ID of the task
   */
  function getTask(uint256 taskId) external view returns (Task memory) {
    require(taskId < nextTaskId, "Task does not exist");
    return tasks[taskId];
  }

  /**
   * @dev Gets the total number of tasks created
   */
  function getTotalTasks() external view returns (uint256) {
    return nextTaskId;
  }
}