// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Escrow
 * @dev Production-ready escrow contract for satellite tasking marketplace with verifiable SLAs
 * @notice Supports full task lifecycle: creation, funding, acceptance, proof submission, disputes, and resolution
 */
contract Escrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev Task status enumeration
    enum Status {
        Created,    // Task created but not funded
        Funded,     // Task funded by requester
        Accepted,   // Task accepted by operator (with optional bond)
        Submitted,  // Proof submitted by operator
        Disputed,   // Disputed by requester
        Released,   // Payment released to operator
        Cancelled,  // Task cancelled
        Resolved    // Dispute resolved by owner
    }

    /// @dev Task data structure
    struct Task {
        address requester;      // Task creator
        address operator;       // Service provider
        IERC20 token;          // Payment token
        uint256 amount;        // Payment amount
        uint256 bond;          // Operator bond amount
        uint64 deadline;       // Proof submission deadline (UNIX timestamp)
        uint64 disputeWindow;  // Dispute window duration (seconds)
        Status status;         // Current task status
        bytes32 artifactHash;  // Proof artifact hash
        bytes32 manifestHash;  // Proof manifest hash
        bytes32 attestationId; // Attestation identifier
        uint64 submittedAt;    // Timestamp when proof was submitted
    }

    /// @dev Task counter for unique IDs
    uint256 public nextTaskId;
    
    /// @dev Task storage mapping
    mapping(uint256 => Task) public tasks;

    // Events
    event TaskCreated(
        uint256 indexed taskId,
        address indexed requester,
        address indexed operator,
        address token,
        uint256 amount,
        uint256 bond,
        uint64 deadline,
        uint64 disputeWindow,
        string taskRefCid
    );
    
    event TaskFunded(uint256 indexed taskId, address indexed requester, uint256 amount);
    event TaskAccepted(uint256 indexed taskId, address indexed operator, uint256 bond);
    event ProofSubmitted(uint256 indexed taskId, bytes32 artifactHash, bytes32 manifestHash, bytes32 attestationId);
    event TaskReleased(uint256 indexed taskId, address requester, address operator, uint256 paidAmount, uint256 bondReturned);
    event TaskDisputed(uint256 indexed taskId, address indexed requester);
    event TaskResolved(uint256 indexed taskId, bool operatorWins, uint256 toRequester, uint256 toOperator, uint256 bondSlashed);
    event TaskCancelled(uint256 indexed taskId);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Create a new satellite task
     * @param operator The designated service provider
     * @param token The ERC20 token for payment
     * @param amount The payment amount
     * @param bond The required operator bond amount
     * @param deadline The proof submission deadline (UNIX timestamp)
     * @param disputeWindow The dispute window duration in seconds
     * @param taskRefCid IPFS CID reference for task details
     * @return taskId The unique task identifier
     */
    function createTask(
        address operator,
        IERC20 token,
        uint256 amount,
        uint256 bond,
        uint64 deadline,
        uint64 disputeWindow,
        string calldata taskRefCid
    ) external returns (uint256 taskId) {
        require(operator != address(0), "Invalid operator address");
        require(address(token) != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than zero");
        require(deadline > block.timestamp, "Deadline must be in the future");
        require(disputeWindow > 0, "Dispute window must be greater than zero");
        require(bytes(taskRefCid).length > 0, "Task reference CID required");

        taskId = nextTaskId++;
        
        tasks[taskId] = Task({
            requester: msg.sender,
            operator: operator,
            token: token,
            amount: amount,
            bond: bond,
            deadline: deadline,
            disputeWindow: disputeWindow,
            status: Status.Created,
            artifactHash: bytes32(0),
            manifestHash: bytes32(0),
            attestationId: bytes32(0),
            submittedAt: 0
        });

        emit TaskCreated(taskId, msg.sender, operator, address(token), amount, bond, deadline, disputeWindow, taskRefCid);
    }

    /**
     * @notice Fund a created task
     * @param taskId The task identifier
     */
    function fundTask(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        require(task.requester == msg.sender, "Only requester can fund");
        require(task.status == Status.Created, "Task must be in Created status");

        task.status = Status.Funded;
        task.token.safeTransferFrom(msg.sender, address(this), task.amount);

        emit TaskFunded(taskId, msg.sender, task.amount);
    }

    /**
     * @notice Accept a funded task (operator posts bond if required)
     * @param taskId The task identifier
     */
    function acceptTask(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        require(task.operator == msg.sender, "Only designated operator can accept");
        require(task.status == Status.Funded, "Task must be in Funded status");

        task.status = Status.Accepted;

        if (task.bond > 0) {
            task.token.safeTransferFrom(msg.sender, address(this), task.bond);
        }

        emit TaskAccepted(taskId, msg.sender, task.bond);
    }

    /**
     * @notice Submit proof of task completion
     * @param taskId The task identifier
     * @param artifactHash Hash of the task artifact
     * @param manifestHash Hash of the task manifest
     * @param attestationId Attestation identifier
     */
    function submitProof(
        uint256 taskId,
        bytes32 artifactHash,
        bytes32 manifestHash,
        bytes32 attestationId
    ) external {
        Task storage task = tasks[taskId];
        require(task.operator == msg.sender, "Only operator can submit proof");
        require(task.status == Status.Accepted, "Task must be in Accepted status");
        require(block.timestamp <= task.deadline, "Submission deadline has passed");
        require(artifactHash != bytes32(0), "Artifact hash required");
        require(manifestHash != bytes32(0), "Manifest hash required");
        require(attestationId != bytes32(0), "Attestation ID required");

        task.status = Status.Submitted;
        task.artifactHash = artifactHash;
        task.manifestHash = manifestHash;
        task.attestationId = attestationId;
        task.submittedAt = uint64(block.timestamp);

        emit ProofSubmitted(taskId, artifactHash, manifestHash, attestationId);
    }

    /**
     * @notice Release payment to operator (requester accepts the proof)
     * @param taskId The task identifier
     */
    function release(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        require(task.requester == msg.sender, "Only requester can release");
        require(task.status == Status.Submitted, "Task must be in Submitted status");
        require(block.timestamp < task.submittedAt + task.disputeWindow, "Dispute window has expired");

        task.status = Status.Released;

        // Pay operator and return bond
        task.token.safeTransfer(task.operator, task.amount);
        if (task.bond > 0) {
            task.token.safeTransfer(task.operator, task.bond);
        }

        emit TaskReleased(taskId, task.requester, task.operator, task.amount, task.bond);
    }

    /**
     * @notice Dispute a submitted proof
     * @param taskId The task identifier
     */
    function dispute(uint256 taskId) external {
        Task storage task = tasks[taskId];
        require(task.requester == msg.sender, "Only requester can dispute");
        require(task.status == Status.Submitted, "Task must be in Submitted status");
        require(block.timestamp < task.submittedAt + task.disputeWindow, "Dispute window has expired");

        task.status = Status.Disputed;

        emit TaskDisputed(taskId, msg.sender);
    }

    /**
     * @notice Resolve a disputed task (owner decision)
     * @param taskId The task identifier
     * @param operatorWins True if operator wins the dispute
     */
    function resolveDispute(uint256 taskId, bool operatorWins) external onlyOwner nonReentrant {
        Task storage task = tasks[taskId];
        require(task.status == Status.Disputed, "Task must be in Disputed status");

        task.status = Status.Resolved;

        if (operatorWins) {
            // Operator wins: pay amount + return bond
            task.token.safeTransfer(task.operator, task.amount);
            if (task.bond > 0) {
                task.token.safeTransfer(task.operator, task.bond);
            }
            emit TaskResolved(taskId, true, 0, task.amount + task.bond, 0);
        } else {
            // Requester wins: refund amount, slash bond to owner
            task.token.safeTransfer(task.requester, task.amount);
            if (task.bond > 0) {
                task.token.safeTransfer(owner(), task.bond);
            }
            emit TaskResolved(taskId, false, task.amount, 0, task.bond);
        }
    }

    /**
     * @notice Cancel an unaccepted task after deadline
     * @param taskId The task identifier
     */
    function cancelUnaccepted(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        require(task.requester == msg.sender, "Only requester can cancel");
        require(
            task.status == Status.Created || task.status == Status.Funded,
            "Task must be Created or Funded"
        );
        require(block.timestamp > task.deadline, "Deadline has not passed");

        bool wasFunded = task.status == Status.Funded;
        task.status = Status.Cancelled;

        // Refund if task was funded
        if (wasFunded) {
            task.token.safeTransfer(task.requester, task.amount);
        }

        emit TaskCancelled(taskId);
    }

    /**
     * @notice Get task details
     * @param taskId The task identifier
     * @return task The task data
     */
    function getTask(uint256 taskId) external view returns (Task memory task) {
        return tasks[taskId];
    }

    /**
     * @notice Check if dispute window is still active for a submitted task
     * @param taskId The task identifier
     * @return active True if dispute window is still active
     */
    function isDisputeWindowActive(uint256 taskId) external view returns (bool active) {
        Task storage task = tasks[taskId];
        if (task.status != Status.Submitted) {
            return false;
        }
        return block.timestamp < task.submittedAt + task.disputeWindow;
    }
}