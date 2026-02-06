// Copyright 2026 TAWF Labs
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

/**
 * @title ActivityValidator
 * @notice Validates real economic activities for Sharia compliance
 * @dev Ensures activities are asset-backed and comply with Islamic finance principles
 */
contract ActivityValidator {
    /// @notice Activity validation record
    struct ValidationRecord {
        bytes32 activityId;
        address validator;
        bool isValid;
        bool isShariaCompliant;
        bool isAssetBacked;
        bool hasRealEconomicValue;
        string validationNotes;
        uint256 validatedAt;
    }

    /// @notice Economic activity details
    struct EconomicActivity {
        bytes32 activityId;
        string description;
        string activityType; // e.g., "trade", "manufacturing", "services"
        uint256 capitalRequired;
        address[] assetAddresses;
        bool isValidated;
    }

    enum ActivityType {
        Trade,
        Manufacturing,
        Services,
        Agriculture,
        RealEstate,
        Technology
    }

    /// @notice Mapping from activity ID to validation record
    mapping(bytes32 => ValidationRecord) public validations;

    /// @notice Mapping from activity ID to economic activity
    mapping(bytes32 => EconomicActivity) public activities;

    /// @notice List of prohibited activities (non-Sharia-compliant)
    mapping(string => bool) public prohibitedActivities;

    /// @notice Authorized validators
    mapping(address => bool) public authorizedValidators;

    // Events
    event ActivitySubmitted(bytes32 indexed activityId, string description);
    event ActivityValidated(bytes32 indexed activityId, bool isValid, bool isShariaCompliant);
    event ValidatorAuthorized(address indexed validator);
    event ValidatorRevoked(address indexed validator);
    event ProhibitedActivityAdded(string activityType);

    constructor() {
        // Add common prohibited activities (non-Sharia-compliant)
        prohibitedActivities["alcohol"] = true;
        prohibitedActivities["gambling"] = true;
        prohibitedActivities["interest-lending"] = true;
        prohibitedActivities["speculation"] = true;
        prohibitedActivities["weapons"] = true;
        prohibitedActivities["tobacco"] = true;

        // Set deployer as initial validator
        authorizedValidators[msg.sender] = true;
    }

    modifier onlyValidator() {
        require(authorizedValidators[msg.sender], "Not an authorized validator");
        _;
    }

    /**
     * @notice Submit an economic activity for validation
     * @param activityId Unique identifier for the activity
     * @param description Description of the economic activity
     * @param activityType Type of economic activity
     * @param capitalRequired Capital required for the activity
     */
    function submitActivity(
        bytes32 activityId,
        string memory description,
        string memory activityType,
        uint256 capitalRequired
    ) external {
        require(activities[activityId].activityId == bytes32(0), "Activity already exists");
        require(capitalRequired > 0, "Capital required must be positive");

        address[] memory emptyAssets;
        activities[activityId] = EconomicActivity({
            activityId: activityId,
            description: description,
            activityType: activityType,
            capitalRequired: capitalRequired,
            assetAddresses: emptyAssets,
            isValidated: false
        });

        emit ActivitySubmitted(activityId, description);
    }

    /**
     * @notice Validate an economic activity
     * @param activityId ID of the activity to validate
     * @param isValid Whether the activity is valid
     * @param shariaCompliant Whether the activity is Sharia-compliant
     * @param isAssetBacked Whether the activity is backed by real assets
     * @param hasRealEconomicValue Whether the activity has real economic value
     * @param notes Validation notes
     */
    function validateActivity(
        bytes32 activityId,
        bool isValid,
        bool shariaCompliant,
        bool isAssetBacked,
        bool hasRealEconomicValue,
        string memory notes
    ) external onlyValidator {
        EconomicActivity storage activity = activities[activityId];
        require(activity.activityId != bytes32(0), "Activity does not exist");
        require(!activity.isValidated, "Activity already validated");

        validations[activityId] = ValidationRecord({
            activityId: activityId,
            validator: msg.sender,
            isValid: isValid,
            isShariaCompliant: shariaCompliant,
            isAssetBacked: isAssetBacked,
            hasRealEconomicValue: hasRealEconomicValue,
            validationNotes: notes,
            validatedAt: block.timestamp
        });

        activity.isValidated = true;

        emit ActivityValidated(activityId, isValid, shariaCompliant);
    }

    /**
     * @notice Check if an activity type is Sharia-compliant
     * @param activityType Type of activity to check
     */
    function isShariaCompliant(string memory activityType) public view returns (bool) {
        return !prohibitedActivities[activityType];
    }

    /**
     * @notice Authorize a new validator
     * @param validator Address of the validator to authorize
     */
    function authorizeValidator(address validator) external onlyValidator {
        require(!authorizedValidators[validator], "Already authorized");

        authorizedValidators[validator] = true;
        emit ValidatorAuthorized(validator);
    }

    /**
     * @notice Revoke validator authorization
     * @param validator Address of the validator to revoke
     */
    function revokeValidator(address validator) external onlyValidator {
        require(authorizedValidators[validator], "Not authorized");

        authorizedValidators[validator] = false;
        emit ValidatorRevoked(validator);
    }

    /**
     * @notice Add a prohibited activity type
     * @param activityType Type of activity to prohibit
     */
    function addProhibitedActivity(string memory activityType) external onlyValidator {
        prohibitedActivities[activityType] = true;
        emit ProhibitedActivityAdded(activityType);
    }

    /**
     * @notice Get validation record for an activity
     * @param activityId ID of the activity
     */
    function getValidation(bytes32 activityId) external view returns (ValidationRecord memory) {
        return validations[activityId];
    }

    /**
     * @notice Get economic activity details
     * @param activityId ID of the activity
     */
    function getActivity(bytes32 activityId) external view returns (EconomicActivity memory) {
        return activities[activityId];
    }

    /**
     * @notice Check if activity meets all Sharia compliance criteria
     * @param activityId ID of the activity
     */
    function meetsShariaCompliance(bytes32 activityId) external view returns (bool) {
        ValidationRecord memory record = validations[activityId];
        return record.isValid && record.isShariaCompliant && record.isAssetBacked && record.hasRealEconomicValue;
    }
}
