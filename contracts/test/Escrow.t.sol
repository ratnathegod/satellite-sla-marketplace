// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/Escrow.sol";
import "../src/MockERC20.sol";

contract EscrowTest is Test {
    Escrow public escrow;
    MockERC20 public token;
    
    address public owner = address(0x1);
    address public requester = address(0x2);
    address public operator = address(0x3);
    address public other = address(0x4);
    
    uint256 public constant TASK_AMOUNT = 1000e18;
    uint256 public constant BOND_AMOUNT = 500e18;
    uint64 public constant DISPUTE_WINDOW = 3 days;
    
    uint64 public deadline;
    string public constant TASK_REF_CID = "QmTestTaskReference";
    
    bytes32 public constant ARTIFACT_HASH = keccak256("artifact");
    bytes32 public constant MANIFEST_HASH = keccak256("manifest");
    bytes32 public constant ATTESTATION_ID = keccak256("attestation");

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

    function setUp() public {
        vm.startPrank(owner);
        escrow = new Escrow();
        token = new MockERC20("Test Token", "TEST");
        vm.stopPrank();
        
        deadline = uint64(block.timestamp + 7 days);
        
        // Mint tokens to test accounts
        token.mint(requester, 10000e18);
        token.mint(operator, 10000e18);
        
        // Approve escrow contract
        vm.prank(requester);
        token.approve(address(escrow), type(uint256).max);
        
        vm.prank(operator);
        token.approve(address(escrow), type(uint256).max);
    }

    function testHappyPathRelease() public {
        // 1. Create task
        vm.prank(requester);
        vm.expectEmit(true, true, true, true);
        emit TaskCreated(0, requester, operator, address(token), TASK_AMOUNT, BOND_AMOUNT, deadline, DISPUTE_WINDOW, TASK_REF_CID);
        uint256 taskId = escrow.createTask(operator, token, TASK_AMOUNT, BOND_AMOUNT, deadline, DISPUTE_WINDOW, TASK_REF_CID);
        
        // 2. Fund task
        vm.prank(requester);
        vm.expectEmit(true, true, false, true);
        emit TaskFunded(taskId, requester, TASK_AMOUNT);
        escrow.fundTask(taskId);
        
        // 3. Accept task (with bond)
        vm.prank(operator);
        vm.expectEmit(true, true, false, true);
        emit TaskAccepted(taskId, operator, BOND_AMOUNT);
        escrow.acceptTask(taskId);
        
        // 4. Submit proof
        vm.prank(operator);
        vm.expectEmit(true, false, false, true);
        emit ProofSubmitted(taskId, ARTIFACT_HASH, MANIFEST_HASH, ATTESTATION_ID);
        escrow.submitProof(taskId, ARTIFACT_HASH, MANIFEST_HASH, ATTESTATION_ID);
        
        // 5. Release payment
        uint256 operatorBalanceBefore = token.balanceOf(operator);
        uint256 escrowBalanceBefore = token.balanceOf(address(escrow));
        
        vm.prank(requester);
        vm.expectEmit(true, false, false, true);
        emit TaskReleased(taskId, requester, operator, TASK_AMOUNT, BOND_AMOUNT);
        escrow.release(taskId);
        
        // Verify balances
        assertEq(token.balanceOf(operator), operatorBalanceBefore + TASK_AMOUNT + BOND_AMOUNT);
        assertEq(token.balanceOf(address(escrow)), escrowBalanceBefore - TASK_AMOUNT - BOND_AMOUNT);
        
        // Verify task status
        Escrow.Task memory task = escrow.getTask(taskId);
        assertEq(uint256(task.status), uint256(Escrow.Status.Released));
    }

    function testDisputeOperatorLoses() public {
        // Setup: Create, fund, accept, submit proof
        vm.prank(requester);
        uint256 taskId = escrow.createTask(operator, token, TASK_AMOUNT, BOND_AMOUNT, deadline, DISPUTE_WINDOW, TASK_REF_CID);
        
        vm.prank(requester);
        escrow.fundTask(taskId);
        
        vm.prank(operator);
        escrow.acceptTask(taskId);
        
        vm.prank(operator);
        escrow.submitProof(taskId, ARTIFACT_HASH, MANIFEST_HASH, ATTESTATION_ID);
        
        // Dispute
        vm.prank(requester);
        vm.expectEmit(true, true, false, false);
        emit TaskDisputed(taskId, requester);
        escrow.dispute(taskId);
        
        // Resolve dispute - requester wins
        uint256 requesterBalanceBefore = token.balanceOf(requester);
        uint256 ownerBalanceBefore = token.balanceOf(owner);
        
        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit TaskResolved(taskId, false, TASK_AMOUNT, 0, BOND_AMOUNT);
        escrow.resolveDispute(taskId, false);
        
        // Verify balances: requester gets refund, owner gets slashed bond
        assertEq(token.balanceOf(requester), requesterBalanceBefore + TASK_AMOUNT);
        assertEq(token.balanceOf(owner), ownerBalanceBefore + BOND_AMOUNT);
        
        // Verify task status
        Escrow.Task memory task = escrow.getTask(taskId);
        assertEq(uint256(task.status), uint256(Escrow.Status.Resolved));
    }

    function testDisputeOperatorWins() public {
        // Setup: Create, fund, accept, submit proof
        vm.prank(requester);
        uint256 taskId = escrow.createTask(operator, token, TASK_AMOUNT, BOND_AMOUNT, deadline, DISPUTE_WINDOW, TASK_REF_CID);
        
        vm.prank(requester);
        escrow.fundTask(taskId);
        
        vm.prank(operator);
        escrow.acceptTask(taskId);
        
        vm.prank(operator);
        escrow.submitProof(taskId, ARTIFACT_HASH, MANIFEST_HASH, ATTESTATION_ID);
        
        // Dispute
        vm.prank(requester);
        escrow.dispute(taskId);
        
        // Resolve dispute - operator wins
        uint256 operatorBalanceBefore = token.balanceOf(operator);
        
        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit TaskResolved(taskId, true, 0, TASK_AMOUNT + BOND_AMOUNT, 0);
        escrow.resolveDispute(taskId, true);
        
        // Verify balances: operator gets payment + bond back
        assertEq(token.balanceOf(operator), operatorBalanceBefore + TASK_AMOUNT + BOND_AMOUNT);
        
        // Verify task status
        Escrow.Task memory task = escrow.getTask(taskId);
        assertEq(uint256(task.status), uint256(Escrow.Status.Resolved));
    }

    function testCancelBeforeAcceptAfterDeadline() public {
        // Create and fund task
        vm.prank(requester);
        uint256 taskId = escrow.createTask(operator, token, TASK_AMOUNT, BOND_AMOUNT, deadline, DISPUTE_WINDOW, TASK_REF_CID);
        
        vm.prank(requester);
        escrow.fundTask(taskId);
        
        // Warp time past deadline
        vm.warp(deadline + 1);
        
        // Cancel task
        uint256 requesterBalanceBefore = token.balanceOf(requester);
        
        vm.prank(requester);
        vm.expectEmit(true, false, false, false);
        emit TaskCancelled(taskId);
        escrow.cancelUnaccepted(taskId);
        
        // Verify refund
        assertEq(token.balanceOf(requester), requesterBalanceBefore + TASK_AMOUNT);
        
        // Verify task status
        Escrow.Task memory task = escrow.getTask(taskId);
        assertEq(uint256(task.status), uint256(Escrow.Status.Cancelled));
    }

    function testOnlyRoles() public {
        // Create task
        vm.prank(requester);
        uint256 taskId = escrow.createTask(operator, token, TASK_AMOUNT, BOND_AMOUNT, deadline, DISPUTE_WINDOW, TASK_REF_CID);
        
        // Only requester can fund
        vm.prank(other);
        vm.expectRevert("Only requester can fund");
        escrow.fundTask(taskId);
        
        // Fund task
        vm.prank(requester);
        escrow.fundTask(taskId);
        
        // Only designated operator can accept
        vm.prank(other);
        vm.expectRevert("Only designated operator can accept");
        escrow.acceptTask(taskId);
        
        // Accept task
        vm.prank(operator);
        escrow.acceptTask(taskId);
        
        // Only operator can submit proof
        vm.prank(other);
        vm.expectRevert("Only operator can submit proof");
        escrow.submitProof(taskId, ARTIFACT_HASH, MANIFEST_HASH, ATTESTATION_ID);
        
        // Submit proof
        vm.prank(operator);
        escrow.submitProof(taskId, ARTIFACT_HASH, MANIFEST_HASH, ATTESTATION_ID);
        
        // Only requester can release
        vm.prank(other);
        vm.expectRevert("Only requester can release");
        escrow.release(taskId);
        
        // Only requester can dispute
        vm.prank(other);
        vm.expectRevert("Only requester can dispute");
        escrow.dispute(taskId);
        
        // Dispute
        vm.prank(requester);
        escrow.dispute(taskId);
        
        // Only owner can resolve dispute
        vm.prank(other);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, other));
        escrow.resolveDispute(taskId, true);
    }

    function testDoubleActionsRevert() public {
        // Create and fund task
        vm.prank(requester);
        uint256 taskId = escrow.createTask(operator, token, TASK_AMOUNT, BOND_AMOUNT, deadline, DISPUTE_WINDOW, TASK_REF_CID);
        
        vm.prank(requester);
        escrow.fundTask(taskId);
        
        // Cannot fund twice
        vm.prank(requester);
        vm.expectRevert("Task must be in Created status");
        escrow.fundTask(taskId);
        
        // Accept task
        vm.prank(operator);
        escrow.acceptTask(taskId);
        
        // Cannot accept twice
        vm.prank(operator);
        vm.expectRevert("Task must be in Funded status");
        escrow.acceptTask(taskId);
        
        // Submit proof
        vm.prank(operator);
        escrow.submitProof(taskId, ARTIFACT_HASH, MANIFEST_HASH, ATTESTATION_ID);
        
        // Cannot submit proof twice
        vm.prank(operator);
        vm.expectRevert("Task must be in Accepted status");
        escrow.submitProof(taskId, ARTIFACT_HASH, MANIFEST_HASH, ATTESTATION_ID);
        
        // Release payment
        vm.prank(requester);
        escrow.release(taskId);
        
        // Cannot release twice
        vm.prank(requester);
        vm.expectRevert("Task must be in Submitted status");
        escrow.release(taskId);
    }

    function testSubmitAfterDeadline() public {
        // Create, fund, accept task
        vm.prank(requester);
        uint256 taskId = escrow.createTask(operator, token, TASK_AMOUNT, BOND_AMOUNT, deadline, DISPUTE_WINDOW, TASK_REF_CID);
        
        vm.prank(requester);
        escrow.fundTask(taskId);
        
        vm.prank(operator);
        escrow.acceptTask(taskId);
        
        // Warp past deadline
        vm.warp(deadline + 1);
        
        // Cannot submit proof after deadline
        vm.prank(operator);
        vm.expectRevert("Submission deadline has passed");
        escrow.submitProof(taskId, ARTIFACT_HASH, MANIFEST_HASH, ATTESTATION_ID);
    }

    function testDisputeAfterWindow() public {
        // Setup: Create, fund, accept, submit proof
        vm.prank(requester);
        uint256 taskId = escrow.createTask(operator, token, TASK_AMOUNT, BOND_AMOUNT, deadline, DISPUTE_WINDOW, TASK_REF_CID);
        
        vm.prank(requester);
        escrow.fundTask(taskId);
        
        vm.prank(operator);
        escrow.acceptTask(taskId);
        
        vm.prank(operator);
        escrow.submitProof(taskId, ARTIFACT_HASH, MANIFEST_HASH, ATTESTATION_ID);
        
        // Warp past dispute window
        vm.warp(block.timestamp + DISPUTE_WINDOW + 1);
        
        // Cannot dispute after window
        vm.prank(requester);
        vm.expectRevert("Dispute window has expired");
        escrow.dispute(taskId);
        
        // Cannot release after window either
        vm.prank(requester);
        vm.expectRevert("Dispute window has expired");
        escrow.release(taskId);
    }

    function testTaskWithoutBond() public {
        // Create task without bond
        vm.prank(requester);
        uint256 taskId = escrow.createTask(operator, token, TASK_AMOUNT, 0, deadline, DISPUTE_WINDOW, TASK_REF_CID);
        
        vm.prank(requester);
        escrow.fundTask(taskId);
        
        // Accept task (no bond transfer)
        uint256 operatorBalanceBefore = token.balanceOf(operator);
        vm.prank(operator);
        escrow.acceptTask(taskId);
        
        // Verify no bond was transferred
        assertEq(token.balanceOf(operator), operatorBalanceBefore);
        
        // Complete happy path
        vm.prank(operator);
        escrow.submitProof(taskId, ARTIFACT_HASH, MANIFEST_HASH, ATTESTATION_ID);
        
        vm.prank(requester);
        escrow.release(taskId);
        
        // Verify operator only received payment (no bond to return)
        assertEq(token.balanceOf(operator), operatorBalanceBefore + TASK_AMOUNT);
    }

    function testInvalidTaskCreation() public {
        vm.startPrank(requester);
        
        // Invalid operator address
        vm.expectRevert("Invalid operator address");
        escrow.createTask(address(0), token, TASK_AMOUNT, BOND_AMOUNT, deadline, DISPUTE_WINDOW, TASK_REF_CID);
        
        // Invalid token address
        vm.expectRevert("Invalid token address");
        escrow.createTask(operator, IERC20(address(0)), TASK_AMOUNT, BOND_AMOUNT, deadline, DISPUTE_WINDOW, TASK_REF_CID);
        
        // Zero amount
        vm.expectRevert("Amount must be greater than zero");
        escrow.createTask(operator, token, 0, BOND_AMOUNT, deadline, DISPUTE_WINDOW, TASK_REF_CID);
        
        // Past deadline
        vm.expectRevert("Deadline must be in the future");
        escrow.createTask(operator, token, TASK_AMOUNT, BOND_AMOUNT, uint64(block.timestamp - 1), DISPUTE_WINDOW, TASK_REF_CID);
        
        // Zero dispute window
        vm.expectRevert("Dispute window must be greater than zero");
        escrow.createTask(operator, token, TASK_AMOUNT, BOND_AMOUNT, deadline, 0, TASK_REF_CID);
        
        // Empty task reference CID
        vm.expectRevert("Task reference CID required");
        escrow.createTask(operator, token, TASK_AMOUNT, BOND_AMOUNT, deadline, DISPUTE_WINDOW, "");
        
        vm.stopPrank();
    }

    function testInvalidProofSubmission() public {
        // Setup task
        vm.prank(requester);
        uint256 taskId = escrow.createTask(operator, token, TASK_AMOUNT, BOND_AMOUNT, deadline, DISPUTE_WINDOW, TASK_REF_CID);
        
        vm.prank(requester);
        escrow.fundTask(taskId);
        
        vm.prank(operator);
        escrow.acceptTask(taskId);
        
        vm.startPrank(operator);
        
        // Empty artifact hash
        vm.expectRevert("Artifact hash required");
        escrow.submitProof(taskId, bytes32(0), MANIFEST_HASH, ATTESTATION_ID);
        
        // Empty manifest hash
        vm.expectRevert("Manifest hash required");
        escrow.submitProof(taskId, ARTIFACT_HASH, bytes32(0), ATTESTATION_ID);
        
        // Empty attestation ID
        vm.expectRevert("Attestation ID required");
        escrow.submitProof(taskId, ARTIFACT_HASH, MANIFEST_HASH, bytes32(0));
        
        vm.stopPrank();
    }

    function testIsDisputeWindowActive() public {
        // Create, fund, accept task
        vm.prank(requester);
        uint256 taskId = escrow.createTask(operator, token, TASK_AMOUNT, BOND_AMOUNT, deadline, DISPUTE_WINDOW, TASK_REF_CID);
        
        vm.prank(requester);
        escrow.fundTask(taskId);
        
        vm.prank(operator);
        escrow.acceptTask(taskId);
        
        // Before submission, dispute window is not active
        assertFalse(escrow.isDisputeWindowActive(taskId));
        
        // Submit proof
        vm.prank(operator);
        escrow.submitProof(taskId, ARTIFACT_HASH, MANIFEST_HASH, ATTESTATION_ID);
        
        // After submission, dispute window is active
        assertTrue(escrow.isDisputeWindowActive(taskId));
        
        // Warp past dispute window
        vm.warp(block.timestamp + DISPUTE_WINDOW + 1);
        
        // Dispute window is no longer active
        assertFalse(escrow.isDisputeWindowActive(taskId));
    }

    function testCancelUnfundedTask() public {
        // Create task but don't fund
        vm.prank(requester);
        uint256 taskId = escrow.createTask(operator, token, TASK_AMOUNT, BOND_AMOUNT, deadline, DISPUTE_WINDOW, TASK_REF_CID);
        
        // Warp past deadline
        vm.warp(deadline + 1);
        
        // Cancel unfunded task (no refund needed)
        uint256 requesterBalanceBefore = token.balanceOf(requester);
        
        vm.prank(requester);
        escrow.cancelUnaccepted(taskId);
        
        // No balance change since task wasn't funded
        assertEq(token.balanceOf(requester), requesterBalanceBefore);
        
        // Verify task status
        Escrow.Task memory task = escrow.getTask(taskId);
        assertEq(uint256(task.status), uint256(Escrow.Status.Cancelled));
    }
}