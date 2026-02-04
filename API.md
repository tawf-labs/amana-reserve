# AMANA Reserve API Reference

Complete API documentation for the AMANA reserve system smart contracts.

## Table of Contents
- [AmanaReserve](#amanareserve)
- [CapitalPool](#capitalpool)
- [RiskSharing](#risksharing)
- [ActivityValidator](#activityvalidator)

---

## AmanaReserve

Main contract for managing the reserve system, participants, and economic activities.

### State Variables

#### `VERSION`
```solidity
string public constant VERSION = "1.0.0"
```
Contract version identifier.

#### `totalCapital`
```solidity
uint256 public totalCapital
```
Total capital available in the reserve.

#### `participantCount`
```solidity
uint256 public participantCount
```
Number of active participants in the reserve.

#### `minCapitalContribution`
```solidity
uint256 public minCapitalContribution
```
Minimum capital required to join the reserve.

#### `isInitialized`
```solidity
bool public isInitialized
```
Flag indicating if the reserve has been initialized.

### Structs

#### `Participant`
```solidity
struct Participant {
    address agent;              // Participant's address
    uint256 capitalContributed; // Total capital contributed
    uint256 profitShare;        // Accumulated profit share
    uint256 lossShare;          // Accumulated loss share
    bool isActive;              // Active participation status
    uint256 joinedAt;           // Timestamp of joining
}
```

#### `Activity`
```solidity
struct Activity {
    bytes32 activityId;         // Unique activity identifier
    address initiator;          // Address that proposed the activity
    uint256 capitalRequired;    // Capital needed for activity
    uint256 capitalDeployed;    // Capital actually deployed
    ActivityStatus status;      // Current activity status
    uint256 createdAt;          // Creation timestamp
    uint256 completedAt;        // Completion timestamp
    int256 outcome;             // Profit (positive) or loss (negative)
    bool isValidated;           // Validation status
}
```

#### `ActivityStatus` Enum
```solidity
enum ActivityStatus {
    Proposed,   // Activity proposed but not approved
    Approved,   // Activity approved and capital deployed
    Active,     // Activity in progress
    Completed,  // Activity completed
    Rejected    // Activity rejected
}
```

### Events

#### `ParticipantJoined`
```solidity
event ParticipantJoined(address indexed agent, uint256 capitalContributed)
```
Emitted when a new participant joins the reserve.

#### `ActivityProposed`
```solidity
event ActivityProposed(bytes32 indexed activityId, address indexed initiator, uint256 capitalRequired)
```
Emitted when a new economic activity is proposed.

#### `ActivityApproved`
```solidity
event ActivityApproved(bytes32 indexed activityId)
```
Emitted when an activity is approved and capital is deployed.

#### `ActivityCompleted`
```solidity
event ActivityCompleted(bytes32 indexed activityId, int256 outcome)
```
Emitted when an activity is completed with outcome.

#### `ProfitDistributed`
```solidity
event ProfitDistributed(uint256 totalProfit, uint256 participantCount)
```
Emitted when profit is distributed among participants.

#### `LossDistributed`
```solidity
event LossDistributed(uint256 totalLoss, uint256 participantCount)
```
Emitted when loss is distributed among participants.

#### `CapitalDeposited`
```solidity
event CapitalDeposited(address indexed agent, uint256 amount)
```
Emitted when capital is deposited.

#### `CapitalWithdrawn`
```solidity
event CapitalWithdrawn(address indexed agent, uint256 amount)
```
Emitted when capital is withdrawn.

### Functions

#### `initialize`
```solidity
function initialize(uint256 _minCapitalContribution) external onlyAdmin notInitialized
```
Initialize the reserve system with minimum capital requirement.

**Parameters:**
- `_minCapitalContribution`: Minimum capital required to join

**Requirements:**
- Can only be called once
- Caller must be admin

#### `joinReserve`
```solidity
function joinReserve() external payable
```
Join the reserve as a participant.

**Requirements:**
- Must send value ≥ minCapitalContribution
- Cannot already be a participant

**Effects:**
- Creates participant record
- Increases totalCapital
- Increments participantCount

#### `proposeActivity`
```solidity
function proposeActivity(bytes32 activityId, uint256 capitalRequired) external onlyParticipant
```
Propose a new economic activity.

**Parameters:**
- `activityId`: Unique identifier for the activity
- `capitalRequired`: Amount of capital needed

**Requirements:**
- Caller must be active participant
- Activity ID must be unique
- Capital required must be positive and ≤ totalCapital

#### `approveActivity`
```solidity
function approveActivity(bytes32 activityId) external onlyParticipant
```
Approve a proposed activity and deploy capital.

**Parameters:**
- `activityId`: ID of the activity to approve

**Requirements:**
- Activity must be in Proposed status
- Caller must be active participant

**Effects:**
- Changes activity status to Approved
- Deploys capital from reserve
- Reduces totalCapital

#### `completeActivity`
```solidity
function completeActivity(bytes32 activityId, int256 outcome) external onlyParticipant
```
Complete an activity and record outcome.

**Parameters:**
- `activityId`: ID of the activity
- `outcome`: Profit (positive) or loss (negative) in wei

**Requirements:**
- Activity must be Approved
- Caller must be the initiator

**Effects:**
- Changes status to Completed
- Returns deployed capital ± outcome
- Distributes profit or loss

#### `depositCapital`
```solidity
function depositCapital() external payable onlyParticipant
```
Deposit additional capital to the reserve.

**Requirements:**
- Caller must be active participant
- Value must be positive

**Effects:**
- Increases participant's capitalContributed
- Increases totalCapital

#### `withdrawCapital`
```solidity
function withdrawCapital(uint256 amount) external onlyParticipant
```
Withdraw capital from the reserve.

**Parameters:**
- `amount`: Amount to withdraw in wei

**Requirements:**
- Amount must be positive
- Amount ≤ participant's capitalContributed
- Sufficient reserve liquidity

**Effects:**
- Decreases participant's capitalContributed
- Decreases totalCapital
- Transfers funds to participant

#### `getParticipant`
```solidity
function getParticipant(address agent) external view returns (Participant memory)
```
Get participant information.

**Parameters:**
- `agent`: Address of the participant

**Returns:**
- Participant struct with all details

#### `getActivity`
```solidity
function getActivity(bytes32 activityId) external view returns (Activity memory)
```
Get activity information.

**Parameters:**
- `activityId`: ID of the activity

**Returns:**
- Activity struct with all details

#### `isShariaCompliant`
```solidity
function isShariaCompliant() external pure returns (bool)
```
Check if the system is Sharia-compliant.

**Returns:**
- `true` (system is designed to be compliant)

#### `getReserveStats`
```solidity
function getReserveStats() external view returns (
    uint256 _totalCapital,
    uint256 _participantCount,
    uint256 _activityCount,
    uint256 _minCapitalContribution
)
```
Get reserve statistics.

**Returns:**
- Total capital in reserve
- Number of participants
- Number of activities
- Minimum capital contribution

---

## CapitalPool

Manages capital pooling for specific economic purposes.

### Structs

#### `Pool`
```solidity
struct Pool {
    bytes32 poolId;           // Unique pool identifier
    string purpose;           // Economic purpose description
    uint256 targetCapital;    // Target capital to raise
    uint256 currentCapital;   // Current capital in pool
    uint256 participantCount; // Number of participants
    bool isActive;            // Pool activation status
    uint256 createdAt;        // Creation timestamp
}
```

#### `PoolParticipant`
```solidity
struct PoolParticipant {
    address agent;            // Participant address
    uint256 contribution;     // Capital contributed
    uint256 sharePercentage;  // Ownership share in basis points
}
```

### Events

#### `PoolCreated`
```solidity
event PoolCreated(bytes32 indexed poolId, string purpose, uint256 targetCapital)
```

#### `CapitalContributed`
```solidity
event CapitalContributed(bytes32 indexed poolId, address indexed agent, uint256 amount)
```

#### `PoolActivated`
```solidity
event PoolActivated(bytes32 indexed poolId, uint256 totalCapital)
```

### Functions

#### `createPool`
```solidity
function createPool(bytes32 poolId, string memory purpose, uint256 targetCapital) external
```
Create a new capital pool.

**Parameters:**
- `poolId`: Unique identifier
- `purpose`: Description of economic purpose
- `targetCapital`: Target capital to raise

#### `contributeToPool`
```solidity
function contributeToPool(bytes32 poolId) external payable
```
Contribute capital to a pool.

**Parameters:**
- `poolId`: ID of the pool

**Requirements:**
- Pool must exist
- Pool must not be active
- Value must be positive

**Effects:**
- Increases pool capital
- Updates participant share
- Activates pool if target reached

#### `getPool`
```solidity
function getPool(bytes32 poolId) external view returns (Pool memory)
```
Get pool information.

#### `getPoolParticipant`
```solidity
function getPoolParticipant(bytes32 poolId, address agent) external view returns (PoolParticipant memory)
```
Get participant's contribution to a pool.

---

## RiskSharing

Implements Sharia-compliant risk sharing mechanism.

### Structs

#### `RiskPool`
```solidity
struct RiskPool {
    bytes32 poolId;           // Unique identifier
    uint256 totalCapital;     // Total capital in pool
    uint256 totalProfit;      // Accumulated profit
    uint256 totalLoss;        // Accumulated loss
    uint256 participantCount; // Number of participants
    bool isActive;            // Pool status
}
```

#### `RiskExposure`
```solidity
struct RiskExposure {
    address agent;              // Participant address
    uint256 capitalContributed; // Capital contributed
    uint256 profitEarned;       // Profit earned
    uint256 lossIncurred;       // Loss incurred
    uint256 sharePercentage;    // Share in basis points
}
```

### Events

#### `RiskPoolCreated`
```solidity
event RiskPoolCreated(bytes32 indexed poolId)
```

#### `ParticipantAdded`
```solidity
event ParticipantAdded(bytes32 indexed poolId, address indexed agent, uint256 capital)
```

#### `ProfitShared`
```solidity
event ProfitShared(bytes32 indexed poolId, address indexed agent, uint256 amount)
```

#### `LossShared`
```solidity
event LossShared(bytes32 indexed poolId, address indexed agent, uint256 amount)
```

### Functions

#### `createRiskPool`
```solidity
function createRiskPool(bytes32 poolId) external
```
Create a new risk pool.

#### `addParticipant`
```solidity
function addParticipant(bytes32 poolId) external payable
```
Add participant to risk pool with capital.

#### `shareProfit`
```solidity
function shareProfit(bytes32 poolId, uint256 totalProfit) external
```
Distribute profit among participants.

#### `shareLoss`
```solidity
function shareLoss(bytes32 poolId, uint256 totalLoss) external
```
Distribute loss among participants.

#### `calculateShare`
```solidity
function calculateShare(bytes32 poolId, address agent, uint256 amount) external view returns (uint256)
```
Calculate participant's proportional share.

---

## ActivityValidator

Validates economic activities for Sharia compliance.

### Structs

#### `ValidationRecord`
```solidity
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
```

#### `EconomicActivity`
```solidity
struct EconomicActivity {
    bytes32 activityId;
    string description;
    string activityType;
    uint256 capitalRequired;
    address[] assetAddresses;
    bool isValidated;
}
```

### Events

#### `ActivitySubmitted`
```solidity
event ActivitySubmitted(bytes32 indexed activityId, string description)
```

#### `ActivityValidated`
```solidity
event ActivityValidated(bytes32 indexed activityId, bool isValid, bool isShariaCompliant)
```

#### `ValidatorAuthorized`
```solidity
event ValidatorAuthorized(address indexed validator)
```

### Functions

#### `submitActivity`
```solidity
function submitActivity(
    bytes32 activityId,
    string memory description,
    string memory activityType,
    uint256 capitalRequired
) external
```
Submit an economic activity for validation.

#### `validateActivity`
```solidity
function validateActivity(
    bytes32 activityId,
    bool isValid,
    bool isShariaCompliant,
    bool isAssetBacked,
    bool hasRealEconomicValue,
    string memory notes
) external onlyValidator
```
Validate an economic activity.

**Requirements:**
- Caller must be authorized validator
- Activity must exist and not be validated

#### `isShariaCompliant`
```solidity
function isShariaCompliant(string memory activityType) public view returns (bool)
```
Check if an activity type is Sharia-compliant.

**Returns:**
- `true` if allowed, `false` if prohibited

#### `authorizeValidator`
```solidity
function authorizeValidator(address validator) external onlyValidator
```
Authorize a new validator.

#### `addProhibitedActivity`
```solidity
function addProhibitedActivity(string memory activityType) external onlyValidator
```
Add a prohibited activity type.

#### `meetsShariaCompliance`
```solidity
function meetsShariaCompliance(bytes32 activityId) external view returns (bool)
```
Check if activity meets all compliance criteria.

**Returns:**
- `true` if valid, Sharia-compliant, asset-backed, and has real economic value

---

## Common Patterns

### Gas Optimization
- Use `calldata` for read-only parameters
- Batch operations when possible
- Cache storage variables in memory

### Error Handling
- Always check return values
- Use require() for validation
- Provide descriptive error messages

### Event Monitoring
- Subscribe to events for real-time updates
- Use indexed parameters for filtering
- Store event logs for historical analysis

---

For practical examples, see [EXAMPLES.md](EXAMPLES.md).
For general information, see [README.md](README.md).
