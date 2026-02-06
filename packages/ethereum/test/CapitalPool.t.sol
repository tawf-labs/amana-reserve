// Copyright 2026 TAWF Labs
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../contracts/CapitalPool.sol";

contract CapitalPoolTest is Test {
    CapitalPool public capitalPool;
    address public agent1;
    address public agent2;

    event PoolCreated(bytes32 indexed poolId, string purpose, uint256 targetCapital);
    event CapitalContributed(bytes32 indexed poolId, address indexed agent, uint256 amount);
    event PoolActivated(bytes32 indexed poolId, uint256 totalCapital);

    function setUp() public {
        capitalPool = new CapitalPool();
        agent1 = address(0x1);
        agent2 = address(0x2);

        vm.deal(agent1, 10 ether);
        vm.deal(agent2, 10 ether);
    }

    function testCreatePool() public {
        bytes32 poolId = keccak256("pool1");
        string memory purpose = "Agricultural investment";
        uint256 target = 10 ether;

        vm.expectEmit(true, false, false, true);
        emit PoolCreated(poolId, purpose, target);
        capitalPool.createPool(poolId, purpose, target);

        CapitalPool.Pool memory pool = capitalPool.getPool(poolId);
        assertEq(pool.poolId, poolId);
        assertEq(pool.purpose, purpose);
        assertEq(pool.targetCapital, target);
        assertEq(pool.currentCapital, 0);
        assertFalse(pool.isActive);
    }

    function testContributeToPool() public {
        bytes32 poolId = keccak256("pool1");
        capitalPool.createPool(poolId, "Trade", 5 ether);

        vm.prank(agent1);
        vm.expectEmit(true, true, false, true);
        emit CapitalContributed(poolId, agent1, 2 ether);
        capitalPool.contributeToPool{value: 2 ether}(poolId);

        CapitalPool.Pool memory pool = capitalPool.getPool(poolId);
        assertEq(pool.currentCapital, 2 ether);
        assertEq(pool.participantCount, 1);

        CapitalPool.PoolParticipant memory participant = capitalPool.getPoolParticipant(poolId, agent1);
        assertEq(participant.agent, agent1);
        assertEq(participant.contribution, 2 ether);
    }

    function testPoolActivation() public {
        bytes32 poolId = keccak256("pool1");
        capitalPool.createPool(poolId, "Manufacturing", 5 ether);

        vm.prank(agent1);
        capitalPool.contributeToPool{value: 3 ether}(poolId);

        CapitalPool.Pool memory pool = capitalPool.getPool(poolId);
        assertFalse(pool.isActive);

        vm.prank(agent2);
        vm.expectEmit(true, false, false, true);
        emit PoolActivated(poolId, 5 ether);
        capitalPool.contributeToPool{value: 2 ether}(poolId);

        pool = capitalPool.getPool(poolId);
        assertTrue(pool.isActive);
        assertEq(pool.currentCapital, 5 ether);
    }

    function testMultipleContributions() public {
        bytes32 poolId = keccak256("pool1");
        capitalPool.createPool(poolId, "Services", 10 ether);

        vm.prank(agent1);
        capitalPool.contributeToPool{value: 2 ether}(poolId);

        vm.prank(agent1);
        capitalPool.contributeToPool{value: 3 ether}(poolId);

        CapitalPool.PoolParticipant memory participant = capitalPool.getPoolParticipant(poolId, agent1);
        assertEq(participant.contribution, 5 ether);

        CapitalPool.Pool memory pool = capitalPool.getPool(poolId);
        assertEq(pool.participantCount, 1);
    }

    function testGetPoolCount() public {
        capitalPool.createPool(keccak256("pool1"), "Pool 1", 1 ether);
        capitalPool.createPool(keccak256("pool2"), "Pool 2", 2 ether);
        capitalPool.createPool(keccak256("pool3"), "Pool 3", 3 ether);

        assertEq(capitalPool.getPoolCount(), 3);
    }
}
