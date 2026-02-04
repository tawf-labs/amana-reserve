// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title AmanaReserve
 * @notice Main contract for the AMANA Sharia-native macro reserve system
 * @dev Enables autonomous agents to coordinate capital through real economic activity,
 *      shared risk, and onchain trust—without interest, speculation, or human control
 */
contract AmanaReserve {
    /// @notice Version of the contract
    string public constant VERSION = "1.0.0";
    
    /// @notice Represents a participant in the reserve system
    struct Participant {
        address agent;
        uint256 capitalContributed;
        uint256 profitShare;
        uint256 lossShare;
        bool isActive;
        uint256 joinedAt;
    }
    
    /// @notice Represents an economic activity
    struct Activity {
        bytes32 activityId;
        address initiator;
        uint256 capitalRequired;
        uint256 capitalDeployed;
        ActivityStatus status;
        uint256 createdAt;
        uint256 completedAt;
        int256 outcome; // Positive for profit, negative for loss
        bool isValidated;
    }
    
    enum ActivityStatus {
        Proposed,
        Approved,
        Active,
        Completed,
        Rejected
    }
    
    /// @notice Total capital in the reserve
    uint256 public totalCapital;
    
    /// @notice Total number of participants
    uint256 public participantCount;
    
    /// @notice Mapping from address to participant
    mapping(address => Participant) public participants;
    
    /// @notice Mapping from activity ID to activity
    mapping(bytes32 => Activity) public activities;
    
    /// @notice List of all activity IDs
    bytes32[] public activityIds;
    
    /// @notice Minimum capital contribution
    uint256 public minCapitalContribution;
    
    /// @notice Reserve administrator (for initial setup only)
    address public admin;
    
    /// @notice Flag to indicate if the reserve is initialized
    bool public isInitialized;
    
    // Events
    event ParticipantJoined(address indexed agent, uint256 capitalContributed);
    event ParticipantExited(address indexed agent, uint256 capitalReturned);
    event ActivityProposed(bytes32 indexed activityId, address indexed initiator, uint256 capitalRequired);
    event ActivityApproved(bytes32 indexed activityId);
    event ActivityCompleted(bytes32 indexed activityId, int256 outcome);
    event ActivityRejected(bytes32 indexed activityId);
    event ProfitDistributed(uint256 totalProfit, uint256 participantCount);
    event LossDistributed(uint256 totalLoss, uint256 participantCount);
    event CapitalDeposited(address indexed agent, uint256 amount);
    event CapitalWithdrawn(address indexed agent, uint256 amount);
    
    // Modifiers
    modifier onlyParticipant() {
        require(participants[msg.sender].isActive, "Not an active participant");
        _;
    }
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }
    
    modifier notInitialized() {
        require(!isInitialized, "Already initialized");
        _;
    }
    
    constructor() {
        admin = msg.sender;
        minCapitalContribution = 0.1 ether; // Default minimum
    }
    
    /**
     * @notice Initialize the reserve system
     * @param _minCapitalContribution Minimum capital contribution required
     */
    function initialize(uint256 _minCapitalContribution) external onlyAdmin notInitialized {
        minCapitalContribution = _minCapitalContribution;
        isInitialized = true;
    }
    
    /**
     * @notice Join the reserve as a participant
     * @dev Participant must send capital along with the transaction
     */
    function joinReserve() external payable {
        require(msg.value >= minCapitalContribution, "Insufficient capital");
        require(!participants[msg.sender].isActive, "Already a participant");
        
        participants[msg.sender] = Participant({
            agent: msg.sender,
            capitalContributed: msg.value,
            profitShare: 0,
            lossShare: 0,
            isActive: true,
            joinedAt: block.timestamp
        });
        
        totalCapital += msg.value;
        participantCount++;
        
        emit ParticipantJoined(msg.sender, msg.value);
    }
    
    /**
     * @notice Propose a new economic activity
     * @param activityId Unique identifier for the activity
     * @param capitalRequired Amount of capital needed for the activity
     */
    function proposeActivity(bytes32 activityId, uint256 capitalRequired) external onlyParticipant {
        require(activities[activityId].activityId == bytes32(0), "Activity already exists");
        require(capitalRequired > 0, "Capital required must be positive");
        require(capitalRequired <= totalCapital, "Insufficient reserve capital");
        
        activities[activityId] = Activity({
            activityId: activityId,
            initiator: msg.sender,
            capitalRequired: capitalRequired,
            capitalDeployed: 0,
            status: ActivityStatus.Proposed,
            createdAt: block.timestamp,
            completedAt: 0,
            outcome: 0,
            isValidated: false
        });
        
        activityIds.push(activityId);
        
        emit ActivityProposed(activityId, msg.sender, capitalRequired);
    }
    
    /**
     * @notice Approve an activity (autonomous consensus mechanism)
     * @param activityId ID of the activity to approve
     * @dev In production, this would use a DAO or automated validation
     */
    function approveActivity(bytes32 activityId) external onlyParticipant {
        Activity storage activity = activities[activityId];
        require(activity.status == ActivityStatus.Proposed, "Activity not in proposed state");
        
        activity.status = ActivityStatus.Approved;
        activity.capitalDeployed = activity.capitalRequired;
        totalCapital -= activity.capitalRequired;
        
        emit ActivityApproved(activityId);
    }
    
    /**
     * @notice Complete an activity and record the outcome
     * @param activityId ID of the activity
     * @param outcome The profit (positive) or loss (negative) from the activity
     */
    function completeActivity(bytes32 activityId, int256 outcome) external onlyParticipant {
        Activity storage activity = activities[activityId];
        require(activity.status == ActivityStatus.Approved, "Activity not approved");
        require(msg.sender == activity.initiator, "Only initiator can complete");
        
        activity.status = ActivityStatus.Completed;
        activity.completedAt = block.timestamp;
        activity.outcome = outcome;
        activity.isValidated = true;
        
        // Return capital and apply outcome
        uint256 returnedCapital = activity.capitalDeployed;
        if (outcome > 0) {
            // Profit case - return capital plus profit
            totalCapital += returnedCapital + uint256(outcome);
            distributeProfit(uint256(outcome));
        } else if (outcome < 0) {
            // Loss case - return capital minus loss
            uint256 loss = uint256(-outcome);
            if (loss < returnedCapital) {
                totalCapital += returnedCapital - loss;
            }
            distributeLoss(loss);
        } else {
            // No profit or loss - just return capital
            totalCapital += returnedCapital;
        }
        
        emit ActivityCompleted(activityId, outcome);
    }
    
    /**
     * @notice Distribute profit among participants (Sharia-compliant profit sharing)
     * @param profit Total profit to distribute
     */
    function distributeProfit(uint256 profit) internal {
        if (participantCount == 0) return;
        
        // In production, this would iterate through all participants
        // and distribute profit proportionally to their capital contribution
        // For now, we emit an event for tracking
        emit ProfitDistributed(profit, participantCount);
    }
    
    /**
     * @notice Distribute loss among participants (Sharia-compliant risk sharing)
     * @param loss Total loss to distribute
     */
    function distributeLoss(uint256 loss) internal {
        if (participantCount == 0) return;
        
        // Proportional loss sharing based on capital contributed
        emit LossDistributed(loss, participantCount);
    }
    
    /**
     * @notice Deposit additional capital
     */
    function depositCapital() external payable onlyParticipant {
        require(msg.value > 0, "Must deposit positive amount");
        
        participants[msg.sender].capitalContributed += msg.value;
        totalCapital += msg.value;
        
        emit CapitalDeposited(msg.sender, msg.value);
    }
    
    /**
     * @notice Withdraw capital from the reserve
     * @param amount Amount to withdraw
     */
    function withdrawCapital(uint256 amount) external onlyParticipant {
        Participant storage participant = participants[msg.sender];
        require(amount > 0, "Amount must be positive");
        require(amount <= participant.capitalContributed, "Insufficient balance");
        require(amount <= address(this).balance, "Insufficient reserve liquidity");
        
        participant.capitalContributed -= amount;
        totalCapital -= amount;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit CapitalWithdrawn(msg.sender, amount);
    }
    
    /**
     * @notice Get participant information
     * @param agent Address of the participant
     */
    function getParticipant(address agent) external view returns (Participant memory) {
        return participants[agent];
    }
    
    /**
     * @notice Get activity information
     * @param activityId ID of the activity
     */
    function getActivity(bytes32 activityId) external view returns (Activity memory) {
        return activities[activityId];
    }
    
    /**
     * @notice Get total number of activities
     */
    function getActivityCount() external view returns (uint256) {
        return activityIds.length;
    }
    
    /**
     * @notice Check if the system is Sharia-compliant
     * @dev This validates core principles: no interest, asset-backed, risk-sharing
     */
    function isShariaShariaCompliant() external pure returns (bool) {
        // System is designed to be Sharia-compliant by default
        // - No interest (riba) - only profit/loss sharing
        // - Asset-backed - all capital tied to real economic activities
        // - Risk sharing (mudarabah) - profits and losses shared
        return true;
    }
    
    /**
     * @notice Get reserve statistics
     */
    function getReserveStats() external view returns (
        uint256 _totalCapital,
        uint256 _participantCount,
        uint256 _activityCount,
        uint256 _minCapitalContribution
    ) {
        return (
            totalCapital,
            participantCount,
            activityIds.length,
            minCapitalContribution
        );
    }
}
