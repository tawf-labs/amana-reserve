// Copyright 2026 TAWF Labs
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title HalalActivityIndex
 * @notice Tracks the Halal Activity Index (HAI) - a measure of Sharia compliance
 * @dev HAI score ranges from 0 to 10000 (0.00% to 100.00%)
 *
 * The HAI is calculated based on:
 * - Activity validation rate (approved/rejected ratio)
 * - Sharia compliance score of activities
 * - Asset backing verification
 * - Economic value verification
 *
 * Score Components (weighted):
 * - Compliance Score: 40%
 * - Asset Backing: 25%
 * - Economic Value: 20%
 * - Validator Participation: 15%
 */
contract HalalActivityIndex is Ownable, ReentrancyGuard {
    /// @notice Version of the contract
    string public constant VERSION = "1.0.0";

    /// @notice Maximum HAI score (100%)
    uint256 public constant MAX_SCORE = 10000;

    /// @notice Snapshot of HAI metrics at a point in time
    struct HAISnapshot {
        uint256 score; // Current HAI score (0-10000)
        uint256 totalActivities; // Total activities tracked
        uint256 compliantActivities; // Number of Sharia-compliant activities
        uint256 assetBackedActivities; // Number of asset-backed activities
        uint256 timestamp; // Snapshot timestamp
    }

    /// @notice Activity metrics for HAI calculation
    struct ActivityMetrics {
        bytes32 activityId;
        bool isCompliant; // Sharia compliance status
        bool isAssetBacked; // Asset backing status
        bool hasRealEconomicValue; // Economic value status
        uint256 validatorCount; // Number of validators who reviewed
        uint256 positiveVotes; // Number of positive validation votes
        uint256 timestamp; // Activity timestamp
    }

    /// @notice Current HAI score
    uint256 public currentScore;

    /// @notice Total activities tracked
    uint256 public totalActivities;

    /// @notice Compliant activities count
    uint256 public compliantActivities;

    /// @notice Asset-backed activities count
    uint256 public assetBackedActivities;

    /// @notice Economic value verified count
    uint256 public economicValueActivities;

    /// @notice Latest snapshot
    HAISnapshot public latestSnapshot;

    /// @notice Historical snapshots
    uint256[] public snapshotTimestamps;

    /// @notice Mapping from timestamp to snapshot
    mapping(uint256 => HAISnapshot) public snapshots;

    /// @notice Mapping from activity ID to metrics
    mapping(bytes32 => ActivityMetrics) public activityMetrics;

    /// @notice Authorized score updaters
    mapping(address => bool) public authorizedUpdaters;

    /// @notice HAI score calculation weights (in basis points)
    uint256 public complianceWeight = 4000; // 40%
    uint256 public assetBackingWeight = 2500; // 25%
    uint256 public economicValueWeight = 2000; // 20%
    uint256 public validatorParticipationWeight = 1500; // 15%

    // Events
    event ScoreUpdated(uint256 oldScore, uint256 newScore);
    event ActivityTracked(bytes32 indexed activityId, bool isCompliant, bool isAssetBacked);
    event SnapshotCreated(uint256 indexed timestamp, uint256 score);
    event UpdaterAuthorized(address indexed updater);
    event UpdaterRevoked(address indexed updater);
    event WeightsUpdated(uint256 compliance, uint256 assetBacking, uint256 economicValue, uint256 validator);

    constructor() Ownable(msg.sender) {
        // Initialize with a neutral score
        currentScore = 5000; // 50.00%
        _createSnapshot();
    }

    /**
     * @notice Track an activity for HAI calculation
     * @param activityId Unique identifier for the activity
     * @param isCompliant Whether the activity is Sharia-compliant
     * @param isAssetBacked Whether the activity is asset-backed
     * @param hasRealEconomicValue Whether the activity has real economic value
     * @param validatorCount Number of validators who reviewed
     * @param positiveVotes Number of positive validation votes
     */
    function trackActivity(
        bytes32 activityId,
        bool isCompliant,
        bool isAssetBacked,
        bool hasRealEconomicValue,
        uint256 validatorCount,
        uint256 positiveVotes
    ) external nonReentrant {
        require(authorizedUpdaters[msg.sender] || msg.sender == owner(), "Not authorized");

        activityMetrics[activityId] = ActivityMetrics({
            activityId: activityId,
            isCompliant: isCompliant,
            isAssetBacked: isAssetBacked,
            hasRealEconomicValue: hasRealEconomicValue,
            validatorCount: validatorCount,
            positiveVotes: positiveVotes,
            timestamp: block.timestamp
        });

        totalActivities++;
        if (isCompliant) compliantActivities++;
        if (isAssetBacked) assetBackedActivities++;
        if (hasRealEconomicValue) economicValueActivities++;

        emit ActivityTracked(activityId, isCompliant, isAssetBacked);

        // Recalculate HAI score
        _calculateScore();
    }

    /**
     * @notice Calculate the HAI score based on tracked activities
     * @return score The calculated HAI score (0-10000)
     */
    function calculateScore() public returns (uint256 score) {
        if (totalActivities == 0) {
            return currentScore;
        }

        // Compliance component: ratio of compliant activities
        uint256 complianceScore = (compliantActivities * MAX_SCORE) / totalActivities;

        // Asset backing component: ratio of asset-backed activities
        uint256 assetBackingScore = (assetBackedActivities * MAX_SCORE) / totalActivities;

        // Economic value component: ratio of activities with real economic value
        uint256 economicValueScore = (economicValueActivities * MAX_SCORE) / totalActivities;

        // Validator participation: average positive vote ratio (simplified)
        // For now, use a fixed score since we don't track total votes
        uint256 validatorParticipationScore = 8000; // 80% baseline

        // Weighted calculation
        score = (complianceScore * complianceWeight) / 10000 + (assetBackingScore * assetBackingWeight) / 10000
            + (economicValueScore * economicValueWeight) / 10000
            + (validatorParticipationScore * validatorParticipationWeight) / 10000;

        // Cap at MAX_SCORE
        if (score > MAX_SCORE) {
            score = MAX_SCORE;
        }

        return score;
    }

    /**
     * @notice Internal function to calculate and update score
     */
    function _calculateScore() internal {
        uint256 oldScore = currentScore;
        currentScore = calculateScore();

        if (oldScore != currentScore) {
            emit ScoreUpdated(oldScore, currentScore);
        }
    }

    /**
     * @notice Create a snapshot of current HAI metrics
     */
    function createSnapshot() external onlyOwner {
        _createSnapshot();
    }

    /**
     * @notice Internal function to create snapshot
     */
    function _createSnapshot() internal {
        uint256 timestamp = block.timestamp;

        HAISnapshot memory snapshot = HAISnapshot({
            score: currentScore,
            totalActivities: totalActivities,
            compliantActivities: compliantActivities,
            assetBackedActivities: assetBackedActivities,
            timestamp: timestamp
        });

        snapshots[timestamp] = snapshot;
        snapshotTimestamps.push(timestamp);
        latestSnapshot = snapshot;

        emit SnapshotCreated(timestamp, currentScore);
    }

    /**
     * @notice Get HAI score as a percentage (0-100)
     * @return percentage The HAI score as a percentage
     */
    function getHAIPercentage() external view returns (uint256 percentage) {
        return currentScore / 100; // Convert from basis points to percentage
    }

    /**
     * @notice Get detailed HAI metrics
     * @return score Current HAI score
     * @return percentage HAI score as percentage
     * @return total Total activities tracked
     * @return compliant Number of compliant activities
     * @return complianceRate Compliance rate (in basis points)
     */
    function getHAIMetrics()
        external
        view
        returns (uint256 score, uint256 percentage, uint256 total, uint256 compliant, uint256 complianceRate)
    {
        total = totalActivities;
        compliant = compliantActivities;
        score = currentScore;
        percentage = currentScore / 100;
        complianceRate = total > 0 ? (compliant * 10000) / total : 0;
    }

    /**
     * @notice Get activity metrics
     * @param activityId ID of the activity
     */
    function getActivityMetrics(bytes32 activityId) external view returns (ActivityMetrics memory) {
        return activityMetrics[activityId];
    }

    /**
     * @notice Get snapshot by timestamp
     * @param timestamp Timestamp of the snapshot
     */
    function getSnapshot(uint256 timestamp) external view returns (HAISnapshot memory) {
        return snapshots[timestamp];
    }

    /**
     * @notice Get all snapshot timestamps
     */
    function getSnapshotTimestamps() external view returns (uint256[] memory) {
        return snapshotTimestamps;
    }

    /**
     * @notice Authorize an address to update HAI
     * @param updater Address to authorize
     */
    function authorizeUpdater(address updater) external onlyOwner {
        require(!authorizedUpdaters[updater], "Already authorized");
        authorizedUpdaters[updater] = true;
        emit UpdaterAuthorized(updater);
    }

    /**
     * @notice Revoke authorization from an address
     * @param updater Address to revoke
     */
    function revokeUpdater(address updater) external onlyOwner {
        require(authorizedUpdaters[updater], "Not authorized");
        authorizedUpdaters[updater] = false;
        emit UpdaterRevoked(updater);
    }

    /**
     * @notice Update HAI calculation weights
     * @param _complianceWeight Weight for compliance component
     * @param _assetBackingWeight Weight for asset backing component
     * @param _economicValueWeight Weight for economic value component
     * @param _validatorParticipationWeight Weight for validator participation
     */
    function updateWeights(
        uint256 _complianceWeight,
        uint256 _assetBackingWeight,
        uint256 _economicValueWeight,
        uint256 _validatorParticipationWeight
    ) external onlyOwner {
        uint256 totalWeight = _complianceWeight + _assetBackingWeight + _economicValueWeight
            + _validatorParticipationWeight;
        require(totalWeight == 10000, "Weights must sum to 10000");

        complianceWeight = _complianceWeight;
        assetBackingWeight = _assetBackingWeight;
        economicValueWeight = _economicValueWeight;
        validatorParticipationWeight = _validatorParticipationWeight;

        _calculateScore();

        emit WeightsUpdated(_complianceWeight, _assetBackingWeight, _economicValueWeight, _validatorParticipationWeight);
    }

    /**
     * @notice Check if an address is authorized to update HAI
     * @param updater Address to check
     */
    function isAuthorizedUpdater(address updater) external view returns (bool) {
        return authorizedUpdaters[updater];
    }
}
