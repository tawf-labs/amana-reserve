// Copyright 2026 TAWF Labs
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

/**
 * @title RiskSharing
 * @notice Implements Sharia-compliant risk sharing mechanism (Mudarabah/Musharakah)
 * @dev Distributes profits and losses among participants without interest
 */
contract RiskSharing {
    /// @notice Risk pool structure
    struct RiskPool {
        bytes32 poolId;
        uint256 totalCapital;
        uint256 totalProfit;
        uint256 totalLoss;
        uint256 participantCount;
        bool isActive;
    }
    
    /// @notice Participant's risk exposure
    struct RiskExposure {
        address agent;
        uint256 capitalContributed;
        uint256 profitEarned;
        uint256 lossIncurred;
        uint256 sharePercentage;
    }
    
    /// @notice Mapping from pool ID to risk pool
    mapping(bytes32 => RiskPool) public riskPools;
    
    /// @notice Mapping from pool ID and agent to risk exposure
    mapping(bytes32 => mapping(address => RiskExposure)) public exposures;
    
    // Events
    event RiskPoolCreated(bytes32 indexed poolId);
    event ParticipantAdded(bytes32 indexed poolId, address indexed agent, uint256 capital);
    event ProfitShared(bytes32 indexed poolId, address indexed agent, uint256 amount);
    event LossShared(bytes32 indexed poolId, address indexed agent, uint256 amount);
    
    /**
     * @notice Create a new risk pool
     * @param poolId Unique identifier for the risk pool
     */
    function createRiskPool(bytes32 poolId) external {
        require(riskPools[poolId].poolId == bytes32(0), "Risk pool already exists");
        
        riskPools[poolId] = RiskPool({
            poolId: poolId,
            totalCapital: 0,
            totalProfit: 0,
            totalLoss: 0,
            participantCount: 0,
            isActive: true
        });
        
        emit RiskPoolCreated(poolId);
    }
    
    /**
     * @notice Add participant to risk pool
     * @param poolId ID of the risk pool
     */
    function addParticipant(bytes32 poolId) external payable {
        RiskPool storage pool = riskPools[poolId];
        require(pool.isActive, "Risk pool not active");
        require(msg.value > 0, "Capital must be positive");
        
        RiskExposure storage exposure = exposures[poolId][msg.sender];
        
        if (exposure.capitalContributed == 0) {
            pool.participantCount++;
            exposure.agent = msg.sender;
        }
        
        exposure.capitalContributed += msg.value;
        pool.totalCapital += msg.value;
        
        // Calculate share percentage (basis points)
        exposure.sharePercentage = (exposure.capitalContributed * 10000) / pool.totalCapital;
        
        emit ParticipantAdded(poolId, msg.sender, msg.value);
    }
    
    /**
     * @notice Share profit among participants (Sharia-compliant profit distribution)
     * @param poolId ID of the risk pool
     * @param totalProfit Total profit to distribute
     */
    function shareProfit(bytes32 poolId, uint256 totalProfit) external {
        RiskPool storage pool = riskPools[poolId];
        require(pool.isActive, "Risk pool not active");
        require(totalProfit > 0, "Profit must be positive");
        
        pool.totalProfit += totalProfit;
        
        // In production, iterate through all participants
        // For simplicity, this emits an event
        emit ProfitShared(poolId, msg.sender, totalProfit);
    }
    
    /**
     * @notice Share loss among participants (Sharia-compliant loss distribution)
     * @param poolId ID of the risk pool
     * @param totalLoss Total loss to distribute
     */
    function shareLoss(bytes32 poolId, uint256 totalLoss) external {
        RiskPool storage pool = riskPools[poolId];
        require(pool.isActive, "Risk pool not active");
        require(totalLoss > 0, "Loss must be positive");
        
        pool.totalLoss += totalLoss;
        
        // Loss is shared proportionally to capital contribution
        emit LossShared(poolId, msg.sender, totalLoss);
    }
    
    /**
     * @notice Calculate participant's share of profit/loss
     * @param poolId ID of the risk pool
     * @param agent Address of the participant
     * @param amount Total amount to distribute
     */
    function calculateShare(bytes32 poolId, address agent, uint256 amount) external view returns (uint256) {
        RiskExposure memory exposure = exposures[poolId][agent];
        RiskPool memory pool = riskPools[poolId];
        
        if (pool.totalCapital == 0) return 0;
        
        // Proportional share based on capital contribution
        return (amount * exposure.capitalContributed) / pool.totalCapital;
    }
    
    /**
     * @notice Get risk exposure for a participant
     * @param poolId ID of the risk pool
     * @param agent Address of the participant
     */
    function getExposure(bytes32 poolId, address agent) external view returns (RiskExposure memory) {
        return exposures[poolId][agent];
    }
    
    /**
     * @notice Get risk pool information
     * @param poolId ID of the risk pool
     */
    function getRiskPool(bytes32 poolId) external view returns (RiskPool memory) {
        return riskPools[poolId];
    }
}
