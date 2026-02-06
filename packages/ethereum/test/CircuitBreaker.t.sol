// Copyright 2026 TAWF Labs
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../contracts/CircuitBreaker.sol";

contract CircuitBreakerTest is Test {
    CircuitBreaker public cb;
    address public admin;
    address public pauser;
    address public shariaBoard;

    uint256 constant AUTO_UNLOCK_DURATION = 1 days;

    event SystemPaused(address indexed initiator, string reason);
    event SystemUnpaused(address indexed initiator);

    function setUp() public {
        admin = address(this);
        pauser = address(0x2);
        shariaBoard = address(0x3);

        cb = new CircuitBreaker(AUTO_UNLOCK_DURATION);

        // Grant roles to test addresses
        cb.grantPauserRole(pauser);
        cb.grantRole(cb.SHARIA_BOARD_ROLE(), shariaBoard);
    }

    function testInitialization() public {
        assertEq(uint256(cb.status()), 0); // Normal
        assertFalse(cb.isPaused());
    }

    function testPauseSystem() public {
        vm.prank(pauser);
        cb.pauseSystem("Test pause");

        assertEq(uint256(cb.status()), 1); // Paused
        assertTrue(cb.isPaused());
    }

    function testUnpauseSystem() public {
        vm.prank(pauser);
        cb.pauseSystem("Test pause");

        // Fast forward past auto-unlock duration
        vm.warp(block.timestamp + AUTO_UNLOCK_DURATION + 1);

        vm.prank(admin);
        cb.unpauseSystem();

        assertEq(uint256(cb.status()), 0); // Normal
        assertFalse(cb.isPaused());
    }

    function testCannotUnpauseBeforeAutoUnlock() public {
        vm.prank(pauser);
        cb.pauseSystem("Test pause");

        // Try to unpause before auto-unlock time
        vm.prank(admin);
        vm.expectRevert();
        cb.unpauseSystem();
    }

    function testOnlyPauserCanPause() public {
        vm.expectRevert();
        vm.prank(address(0x999));
        cb.pauseSystem("Unauthorized pause");
    }

    function testOnlyAdminCanUnpause() public {
        vm.prank(pauser);
        cb.pauseSystem("Test pause");

        vm.warp(block.timestamp + AUTO_UNLOCK_DURATION + 1);

        vm.expectRevert();
        vm.prank(pauser);
        cb.unpauseSystem();
    }

    function testPauseContract() public {
        address targetContract = address(0x5);

        vm.prank(pauser);
        cb.pauseContract(targetContract);

        assertTrue(cb.contractPaused(targetContract));
    }

    function testUnpauseContract() public {
        address targetContract = address(0x5);

        vm.prank(pauser);
        cb.pauseContract(targetContract);

        vm.prank(admin);
        cb.unpauseContract(targetContract);

        assertFalse(cb.contractPaused(targetContract));
    }

    function testCanExecute() public {
        address targetContract = address(0x5);

        assertTrue(cb.canExecute(targetContract));

        vm.prank(pauser);
        cb.pauseContract(targetContract);

        assertFalse(cb.canExecute(targetContract));
    }

    function testLockSystem() public {
        vm.prank(admin);
        cb.lockSystem("Critical emergency");

        assertEq(uint256(cb.status()), 2); // Locked
    }

    function testShariaBoardVeto() public {
        // Create a pause action
        vm.prank(pauser);
        cb.pauseSystem("Test pause");

        uint256 actionId = 0; // First action

        // Sharia board vetoes the pause
        vm.prank(shariaBoard);
        cb.vetoPauseAction(actionId);

        // Status should revert to previous (Normal)
        assertEq(uint256(cb.status()), 0);
    }

    function testGetRemainingAutoUnlockTime() public {
        vm.prank(pauser);
        cb.pauseSystem("Test pause");

        uint256 remaining = cb.getRemainingAutoUnlockTime();
        assertGe(remaining, 0);
        assertLe(remaining, AUTO_UNLOCK_DURATION);
    }

    function testAuthorizePauser() public {
        address newPauser = address(0x4);
        cb.grantPauserRole(newPauser);

        // New pauser should be able to pause
        vm.prank(newPauser);
        cb.pauseSystem("Test");
        assertTrue(cb.isPaused());
    }
}
