// Copyright 2026 TAWF Labs
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../contracts/HalalActivityIndex.sol";

contract HalalActivityIndexTest is Test {
    HalalActivityIndex public hai;
    address public admin;
    address public updater;

    uint256 constant MAX_SCORE = 10000;

    event ScoreUpdated(uint256 indexed oldScore, uint256 indexed newScore);
    event ActivityTracked(bytes32 indexed activityId, bool isCompliant, bool isAssetBacked);

    function setUp() public {
        admin = address(this);
        updater = address(0x2);

        hai = new HalalActivityIndex();
        vm.deal(updater, 1 ether);

        // Authorize the updater
        hai.authorizeUpdater(updater);
    }

    function testInitialization() public {
        assertEq(hai.currentScore(), 5000); // Default 50%
        assertEq(hai.totalActivities(), 0);
        assertEq(hai.compliantActivities(), 0);
    }

    function testTrackActivity() public {
        vm.prank(updater);
        hai.trackActivity(
            keccak256("activity1"),
            true,  // isCompliant
            true,  // isAssetBacked
            true,  // hasRealEconomicValue
            5,     // validatorCount
            4      // positiveVotes
        );

        assertEq(hai.totalActivities(), 1);
        assertEq(hai.compliantActivities(), 1);
        assertEq(hai.assetBackedActivities(), 1);
    }

    function testTrackNonCompliantActivity() public {
        vm.prank(updater);
        hai.trackActivity(
            keccak256("activity1"),
            false, // isCompliant
            true,
            true,
            5,
            4
        );

        assertEq(hai.totalActivities(), 1);
        assertEq(hai.compliantActivities(), 0);
    }

    function testCalculateScore() public {
        // Track some activities
        vm.prank(updater);
        hai.trackActivity(keccak256("a1"), true, true, true, 5, 4);
        vm.prank(updater);
        hai.trackActivity(keccak256("a2"), true, true, false, 5, 3);
        vm.prank(updater);
        hai.trackActivity(keccak256("a3"), false, true, true, 5, 2);

        // Score should be between 0 and 10000
        uint256 score = hai.currentScore();
        assertGe(score, 0);
        assertLe(score, MAX_SCORE);
    }

    function testCreateSnapshot() public {
        vm.prank(admin);
        hai.createSnapshot();

        uint256[] memory timestamps = hai.getSnapshotTimestamps();
        // Constructor creates an initial snapshot, so we expect 2
        assertEq(timestamps.length, 2);

        // Get the latest snapshot
        HalalActivityIndex.HAISnapshot memory snapshot = hai.getSnapshot(timestamps[1]);
        assertEq(snapshot.score, hai.currentScore());
    }

    function testAuthorizeUpdater() public {
        address newUpdater = address(0x3);
        hai.authorizeUpdater(newUpdater);
        assertTrue(hai.isAuthorizedUpdater(newUpdater));
    }

    function testOnlyAdminCanAuthorize() public {
        vm.expectRevert();
        vm.prank(updater);
        hai.authorizeUpdater(address(0x3));
    }

    function testUpdateWeights() public {
        uint256 newComplianceWeight = 3500;
        uint256 newAssetWeight = 3000;
        uint256 newEconomicWeight = 2000;
        uint256 newValidatorWeight = 1500;

        vm.prank(admin);
        hai.updateWeights(
            newComplianceWeight,
            newAssetWeight,
            newEconomicWeight,
            newValidatorWeight
        );

        // Should not revert if weights sum to 10000
    }

    function testUpdateWeightsInvalidSum() public {
        vm.prank(admin);
        vm.expectRevert();
        hai.updateWeights(3000, 3000, 2000, 1000); // Sum = 9000
    }

    function testGetHAIPercentage() public {
        uint256 percentage = hai.getHAIPercentage();
        assertEq(percentage, 50); // 5000 / 100
    }

    function testUnauthorizedTracking() public {
        vm.prank(address(0x999));
        vm.expectRevert();
        hai.trackActivity(
            keccak256("activity1"),
            true,
            true,
            true,
            5,
            4
        );
    }
}
