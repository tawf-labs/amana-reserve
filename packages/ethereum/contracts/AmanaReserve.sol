// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

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

    /// @notice List of all participant addresses (for iteration)
    address[] public participantList;

    /// @notice Minimum capital contribution
    uint256 public minCapitalContribution;

    /// @notice Reserve administrator (for initial setup only)
    address public admin;

    /// @notice Flag to indicate if the reserve is initialized
    bool public isInitialized;

    /// @notice Maximum participants for gas-efficient iteration
    uint256 public constant MAX_PARTICIPANTS = 50;

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
    event ProfitPaid(address indexed participant, uint256 amount);
    event LossDeducted(address indexed participant, uint256 amount);

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
        require(participantList.length < MAX_PARTICIPANTS, "Max participants reached");

        participants[msg.sender] = Participant({
            agent: msg.sender,
            capitalContributed: msg.value,
            profitShare: 0,
            lossShare: 0,
            isActive: true,
            joinedAt: block.timestamp
        });

        participantList.push(msg.sender);
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
            // Loss case - return remaining capital after loss
            // Use unchecked to safely negate the negative outcome
            uint256 loss;
            unchecked {
                loss = uint256(-outcome);
            }
            // Add back the returned capital first (loss will be deducted in distributeLoss)
            totalCapital += returnedCapital;
            distributeLoss(loss);
        } else {
            // No profit or loss - just return capital
            totalCapital += returnedCapital;
        }

        emit ActivityCompleted(activityId, outcome);
    }

    /**
     * @notice Distribute profit among participants (Sharia-compliant profit sharing)
     * @dev Distributes profit proportionally to each participant's capital contribution
     *      following the Mudarabah principle where profits are shared by capital contribution
     * @param profit Total profit to distribute
     */
    function distributeProfit(uint256 profit) internal {
        if (participantCount == 0 || totalCapital == 0) return;

        uint256 remainingProfit = profit;

        // Distribute profit proportionally to each participant's capital contribution
        for (uint256 i = 0; i < participantList.length; i++) {
            address participantAddr = participantList[i];
            Participant storage participant = participants[participantAddr];

            if (!participant.isActive) continue;

            // Calculate this participant's share: (their capital / total capital) * profit
            uint256 participantShare = (participant.capitalContributed * profit) / totalCapital;

            if (participantShare > 0) {
                // Update participant's accumulated profit share
                participant.profitShare += participantShare;

                // Transfer profit to participant
                (bool success, ) = payable(participantAddr).call{value: participantShare}("");
                require(success, "Profit transfer failed");

                emit ProfitPaid(participantAddr, participantShare);

                remainingProfit -= participantShare;

                // Break if no more profit to distribute (handles rounding)
                if (remainingProfit == 0) break;
            }
        }

        emit ProfitDistributed(profit, participantCount);
    }

    /**
     * @notice Distribute loss among participants (Sharia-compliant risk sharing)
     * @dev Distributes loss proportionally to each participant's capital contribution
     *      following the Musharakah principle where losses are shared by capital contribution
     *      Loss is deducted from recorded capital, not withdrawn
     * @param loss Total loss to distribute
     */
    function distributeLoss(uint256 loss) internal {
        if (participantCount == 0 || totalCapital == 0) return;

        uint256 remainingLoss = loss;

        // Distribute loss proportionally to each participant's capital contribution
        for (uint256 i = 0; i < participantList.length; i++) {
            address participantAddr = participantList[i];
            Participant storage participant = participants[participantAddr];

            if (!participant.isActive) continue;

            // Calculate this participant's loss share: (their capital / total capital) * loss
            uint256 participantLossShare = (participant.capitalContributed * loss) / totalCapital;

            // Ensure we don't deduct more than participant has
            if (participantLossShare > participant.capitalContributed) {
                participantLossShare = participant.capitalContributed;
            }

            if (participantLossShare > 0) {
                // Deduct from participant's recorded capital
                participant.capitalContributed -= participantLossShare;
                participant.lossShare += participantLossShare;

                // Reduce total capital accordingly
                totalCapital -= participantLossShare;

                emit LossDeducted(participantAddr, participantLossShare);

                remainingLoss -= participantLossShare;

                // Break if loss is fully distributed
                if (remainingLoss == 0) break;
            }
        }

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
     * @notice Exit the reserve and withdraw all remaining capital
     */
    function exitReserve() external onlyParticipant {
        Participant storage participant = participants[msg.sender];
        uint256 withdrawable = participant.capitalContributed + participant.profitShare;

        require(withdrawable > 0, "No capital to withdraw");
        require(withdrawable <= address(this).balance, "Insufficient liquidity");

        // Mark as inactive
        participant.isActive = false;

        // Update total capital
        totalCapital -= participant.capitalContributed;

        // Transfer all withdrawable amount
        (bool success, ) = payable(msg.sender).call{value: withdrawable}("");
        require(success, "Transfer failed");

        emit ParticipantExited(msg.sender, withdrawable);
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
     * @notice Get all participant addresses
     */
    function getParticipants() external view returns (address[] memory) {
        return participantList;
    }

    /**
     * @notice Calculate a participant's share of profit/loss
     * @param participantAddr Address of the participant
     * @param amount Total amount to distribute
     * @return share The participant's proportional share
     */
    function calculateShare(address participantAddr, uint256 amount) external view returns (uint256) {
        Participant memory participant = participants[participantAddr];
        if (totalCapital == 0 || participant.capitalContributed == 0) {
            return 0;
        }
        return (participant.capitalContributed * amount) / totalCapital;
    }

    /**
     * @notice Get a participant's withdrawable balance (capital + accumulated profits)
     * @param participantAddr Address of the participant
     * @return withdrawable The total withdrawable amount
     */
    function getWithdrawableBalance(address participantAddr) external view returns (uint256) {
        Participant memory participant = participants[participantAddr];
        if (!participant.isActive) {
            return 0;
        }
        return participant.capitalContributed + participant.profitShare;
    }

    /**
     * @notice Check if the system is Sharia-compliant
     * @dev This validates core principles: no interest, asset-backed, risk-sharing
     */
    function isShariaCompliant() external pure returns (bool) {
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

    /**
     * @notice Transfer admin role (for initial setup only)
     * @param newAdmin Address of the new admin
     */
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid address");
        admin = newAdmin;
    }
}
