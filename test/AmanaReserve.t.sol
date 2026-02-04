// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "../src/AmanaReserve.sol";

contract AmanaReserveTest is Test {
    AmanaReserve public reserve;
    address public participant1;
    address public participant2;
    address public participant3;
    
    uint256 constant MIN_CAPITAL = 0.1 ether;
    
    event ParticipantJoined(address indexed agent, uint256 capitalContributed);
    event ActivityProposed(bytes32 indexed activityId, address indexed initiator, uint256 capitalRequired);
    event ActivityApproved(bytes32 indexed activityId);
    event ActivityCompleted(bytes32 indexed activityId, int256 outcome);
    
    function setUp() public {
        reserve = new AmanaReserve();
        reserve.initialize(MIN_CAPITAL);
        
        participant1 = address(0x1);
        participant2 = address(0x2);
        participant3 = address(0x3);
        
        vm.deal(participant1, 10 ether);
        vm.deal(participant2, 10 ether);
        vm.deal(participant3, 10 ether);
    }
    
    function testInitialization() public {
        assertEq(reserve.minCapitalContribution(), MIN_CAPITAL);
        assertEq(reserve.totalCapital(), 0);
        assertEq(reserve.participantCount(), 0);
        assertTrue(reserve.isInitialized());
    }
    
    function testJoinReserve() public {
        vm.prank(participant1);
        vm.expectEmit(true, false, false, true);
        emit ParticipantJoined(participant1, 1 ether);
        reserve.joinReserve{value: 1 ether}();
        
        assertEq(reserve.totalCapital(), 1 ether);
        assertEq(reserve.participantCount(), 1);
        
        AmanaReserve.Participant memory p = reserve.getParticipant(participant1);
        assertEq(p.agent, participant1);
        assertEq(p.capitalContributed, 1 ether);
        assertTrue(p.isActive);
    }
    
    function testJoinReserveInsufficientCapital() public {
        vm.prank(participant1);
        vm.expectRevert("Insufficient capital");
        reserve.joinReserve{value: 0.05 ether}();
    }
    
    function testJoinReserveTwice() public {
        vm.startPrank(participant1);
        reserve.joinReserve{value: 1 ether}();
        
        vm.expectRevert("Already a participant");
        reserve.joinReserve{value: 1 ether}();
        vm.stopPrank();
    }
    
    function testProposeActivity() public {
        vm.prank(participant1);
        reserve.joinReserve{value: 1 ether}();
        
        bytes32 activityId = keccak256("activity1");
        
        vm.prank(participant1);
        vm.expectEmit(true, true, false, true);
        emit ActivityProposed(activityId, participant1, 0.5 ether);
        reserve.proposeActivity(activityId, 0.5 ether);
        
        AmanaReserve.Activity memory activity = reserve.getActivity(activityId);
        assertEq(activity.activityId, activityId);
        assertEq(activity.initiator, participant1);
        assertEq(activity.capitalRequired, 0.5 ether);
        assertTrue(activity.status == AmanaReserve.ActivityStatus.Proposed);
    }
    
    function testProposeActivityNotParticipant() public {
        bytes32 activityId = keccak256("activity1");
        
        vm.prank(participant1);
        vm.expectRevert("Not an active participant");
        reserve.proposeActivity(activityId, 0.5 ether);
    }
    
    function testApproveActivity() public {
        vm.prank(participant1);
        reserve.joinReserve{value: 1 ether}();
        
        bytes32 activityId = keccak256("activity1");
        
        vm.prank(participant1);
        reserve.proposeActivity(activityId, 0.5 ether);
        
        uint256 capitalBefore = reserve.totalCapital();
        
        vm.prank(participant1);
        vm.expectEmit(true, false, false, false);
        emit ActivityApproved(activityId);
        reserve.approveActivity(activityId);
        
        AmanaReserve.Activity memory activity = reserve.getActivity(activityId);
        assertTrue(activity.status == AmanaReserve.ActivityStatus.Approved);
        assertEq(activity.capitalDeployed, 0.5 ether);
        assertEq(reserve.totalCapital(), capitalBefore - 0.5 ether);
    }
    
    function testCompleteActivityWithProfit() public {
        vm.prank(participant1);
        reserve.joinReserve{value: 1 ether}();
        
        bytes32 activityId = keccak256("activity1");
        
        vm.prank(participant1);
        reserve.proposeActivity(activityId, 0.5 ether);
        
        vm.prank(participant1);
        reserve.approveActivity(activityId);
        
        uint256 capitalBefore = reserve.totalCapital();
        
        vm.prank(participant1);
        vm.expectEmit(true, false, false, true);
        emit ActivityCompleted(activityId, 0.2 ether);
        reserve.completeActivity(activityId, int256(0.2 ether));
        
        AmanaReserve.Activity memory activity = reserve.getActivity(activityId);
        assertTrue(activity.status == AmanaReserve.ActivityStatus.Completed);
        assertEq(activity.outcome, int256(0.2 ether));
        assertTrue(activity.isValidated);
        
        // Capital should return plus profit
        assertEq(reserve.totalCapital(), capitalBefore + 0.5 ether + 0.2 ether);
    }
    
    function testCompleteActivityWithLoss() public {
        vm.prank(participant1);
        reserve.joinReserve{value: 1 ether}();
        
        bytes32 activityId = keccak256("activity1");
        
        vm.prank(participant1);
        reserve.proposeActivity(activityId, 0.5 ether);
        
        vm.prank(participant1);
        reserve.approveActivity(activityId);
        
        uint256 capitalBefore = reserve.totalCapital();
        
        vm.prank(participant1);
        reserve.completeActivity(activityId, -int256(0.1 ether));
        
        AmanaReserve.Activity memory activity = reserve.getActivity(activityId);
        assertTrue(activity.status == AmanaReserve.ActivityStatus.Completed);
        assertEq(activity.outcome, -int256(0.1 ether));
        
        // Capital should return minus loss
        assertEq(reserve.totalCapital(), capitalBefore + 0.5 ether - 0.1 ether);
    }
    
    function testDepositCapital() public {
        vm.prank(participant1);
        reserve.joinReserve{value: 1 ether}();
        
        vm.prank(participant1);
        reserve.depositCapital{value: 0.5 ether}();
        
        AmanaReserve.Participant memory p = reserve.getParticipant(participant1);
        assertEq(p.capitalContributed, 1.5 ether);
        assertEq(reserve.totalCapital(), 1.5 ether);
    }
    
    function testWithdrawCapital() public {
        vm.prank(participant1);
        reserve.joinReserve{value: 1 ether}();
        
        uint256 balanceBefore = participant1.balance;
        
        vm.prank(participant1);
        reserve.withdrawCapital(0.5 ether);
        
        AmanaReserve.Participant memory p = reserve.getParticipant(participant1);
        assertEq(p.capitalContributed, 0.5 ether);
        assertEq(reserve.totalCapital(), 0.5 ether);
        assertEq(participant1.balance, balanceBefore + 0.5 ether);
    }
    
    function testWithdrawCapitalInsufficientBalance() public {
        vm.prank(participant1);
        reserve.joinReserve{value: 1 ether}();
        
        vm.prank(participant1);
        vm.expectRevert("Insufficient balance");
        reserve.withdrawCapital(2 ether);
    }
    
    function testIsShariaCompliant() public {
        assertTrue(reserve.isShariaCompliant());
    }
    
    function testGetReserveStats() public {
        vm.prank(participant1);
        reserve.joinReserve{value: 1 ether}();
        
        vm.prank(participant2);
        reserve.joinReserve{value: 2 ether}();
        
        (
            uint256 totalCapital,
            uint256 participantCount,
            uint256 activityCount,
            uint256 minCapital
        ) = reserve.getReserveStats();
        
        assertEq(totalCapital, 3 ether);
        assertEq(participantCount, 2);
        assertEq(activityCount, 0);
        assertEq(minCapital, MIN_CAPITAL);
    }
    
    function testMultipleParticipants() public {
        vm.prank(participant1);
        reserve.joinReserve{value: 1 ether}();
        
        vm.prank(participant2);
        reserve.joinReserve{value: 2 ether}();
        
        vm.prank(participant3);
        reserve.joinReserve{value: 0.5 ether}();
        
        assertEq(reserve.participantCount(), 3);
        assertEq(reserve.totalCapital(), 3.5 ether);
    }
}
