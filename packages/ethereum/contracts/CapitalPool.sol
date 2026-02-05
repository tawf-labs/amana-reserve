// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title CapitalPool
 * @notice Manages capital pooling and coordination for autonomous agents
 * @dev Implements Sharia-compliant capital management without interest
 */
contract CapitalPool {
    /// @notice Pool information
    struct Pool {
        bytes32 poolId;
        string purpose;
        uint256 targetCapital;
        uint256 currentCapital;
        uint256 participantCount;
        bool isActive;
        uint256 createdAt;
    }
    
    /// @notice Pool participant information
    struct PoolParticipant {
        address agent;
        uint256 contribution;
        uint256 sharePercentage;
    }
    
    /// @notice Mapping from pool ID to pool
    mapping(bytes32 => Pool) public pools;
    
    /// @notice Mapping from pool ID to participants
    mapping(bytes32 => mapping(address => PoolParticipant)) public poolParticipants;
    
    /// @notice List of pool IDs
    bytes32[] public poolIds;
    
    // Events
    event PoolCreated(bytes32 indexed poolId, string purpose, uint256 targetCapital);
    event CapitalContributed(bytes32 indexed poolId, address indexed agent, uint256 amount);
    event PoolActivated(bytes32 indexed poolId, uint256 totalCapital);
    event PoolClosed(bytes32 indexed poolId);
    
    /**
     * @notice Create a new capital pool
     * @param poolId Unique identifier for the pool
     * @param purpose Description of the pool's economic purpose
     * @param targetCapital Target capital to raise
     */
    function createPool(bytes32 poolId, string memory purpose, uint256 targetCapital) external {
        require(pools[poolId].poolId == bytes32(0), "Pool already exists");
        require(targetCapital > 0, "Target capital must be positive");
        
        pools[poolId] = Pool({
            poolId: poolId,
            purpose: purpose,
            targetCapital: targetCapital,
            currentCapital: 0,
            participantCount: 0,
            isActive: false,
            createdAt: block.timestamp
        });
        
        poolIds.push(poolId);
        
        emit PoolCreated(poolId, purpose, targetCapital);
    }
    
    /**
     * @notice Contribute capital to a pool
     * @param poolId ID of the pool
     */
    function contributeToPool(bytes32 poolId) external payable {
        Pool storage pool = pools[poolId];
        require(pool.poolId != bytes32(0), "Pool does not exist");
        require(!pool.isActive, "Pool already active");
        require(msg.value > 0, "Contribution must be positive");
        
        PoolParticipant storage participant = poolParticipants[poolId][msg.sender];
        
        if (participant.contribution == 0) {
            pool.participantCount++;
            participant.agent = msg.sender;
        }
        
        participant.contribution += msg.value;
        pool.currentCapital += msg.value;
        
        // Calculate share percentage
        participant.sharePercentage = (participant.contribution * 10000) / pool.currentCapital;
        
        emit CapitalContributed(poolId, msg.sender, msg.value);
        
        // Activate pool if target is reached
        if (pool.currentCapital >= pool.targetCapital) {
            pool.isActive = true;
            emit PoolActivated(poolId, pool.currentCapital);
        }
    }
    
    /**
     * @notice Get pool information
     * @param poolId ID of the pool
     */
    function getPool(bytes32 poolId) external view returns (Pool memory) {
        return pools[poolId];
    }
    
    /**
     * @notice Get participant's contribution to a pool
     * @param poolId ID of the pool
     * @param agent Address of the participant
     */
    function getPoolParticipant(bytes32 poolId, address agent) external view returns (PoolParticipant memory) {
        return poolParticipants[poolId][agent];
    }
    
    /**
     * @notice Get total number of pools
     */
    function getPoolCount() external view returns (uint256) {
        return poolIds.length;
    }
}
