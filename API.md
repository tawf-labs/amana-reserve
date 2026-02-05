# AMANA Reserve API Reference

Complete API documentation for the AMANA reserve system smart contracts and programs.

## Table of Contents
- [Ethereum Contracts](#ethereum-contracts)
  - [AmanaReserve](#amanareserve)
  - [AmanaDAO](#amanadao)
  - [CircuitBreaker](#circuitbreaker)
  - [AmanaToken](#amanatoken)
  - [HalalActivityIndex](#halalactivityindex)
  - [CapitalPool](#capitalpool)
  - [RiskSharing](#risksharing)
  - [ActivityValidator](#activityvalidator)
- [Solana Programs](#solana-programs)
  - [amana-reserve](#amana-reserve-program)
  - [amana-dao](#amana-dao-program)
  - [amana-hai](#amana-hai-program)
- [SDK API](#sdk-api)
- [Error Codes](#error-codes)
- [Gas Costs](#gas-costs)

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

#### `MAX_PARTICIPANTS`
```solidity
uint256 public constant MAX_PARTICIPANTS = 50
```
Maximum participants for gas-efficient iteration.

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

#### `ActivityProposed`
```solidity
event ActivityProposed(bytes32 indexed activityId, address indexed initiator, uint256 capitalRequired)
```

#### `ActivityCompleted`
```solidity
event ActivityCompleted(bytes32 indexed activityId, int256 outcome)
```

#### `ProfitDistributed`
```solidity
event ProfitDistributed(uint256 totalProfit, uint256 participantCount)
```

#### `ProfitPaid`
```solidity
event ProfitPaid(address indexed participant, uint256 amount)
```

### Functions

#### `initialize`
```solidity
function initialize(uint256 _minCapitalContribution) external onlyAdmin notInitialized
```
Initialize the reserve system with minimum capital requirement.

#### `joinReserve`
```solidity
function joinReserve() external payable
```
Join the reserve as a participant.

**Requirements:**
- Must send value ≥ minCapitalContribution
- Cannot already be a participant
- Must not exceed MAX_PARTICIPANTS

#### `proposeActivity`
```solidity
function proposeActivity(bytes32 activityId, uint256 capitalRequired) external onlyParticipant
```
Propose a new economic activity.

#### `completeActivity`
```solidity
function completeActivity(bytes32 activityId, int256 outcome) external onlyParticipant
```
Complete an activity and record outcome with automatic profit/loss distribution.

#### `distributeProfit`
```solidity
function distributeProfit(uint256 profit) internal
```
Distributes profit proportionally to each participant's capital contribution following Mudarabah principles.

#### `distributeLoss`
```solidity
function distributeLoss(uint256 loss) internal
```
Distributes loss proportionally among participants following Musharakah principles.

#### `getWithdrawableBalance`
```solidity
function getWithdrawableBalance(address participantAddr) external view returns (uint256)
```
Get a participant's total withdrawable balance (capital + accumulated profits).

---

## AmanaDAO

Governance contract with Sharia Advisory Board integration.

### State Variables

#### `SHARIA_BOARD_ROLE`
```solidity
bytes32 public constant SHARIA_BOARD_ROLE = keccak256("SHARIA_BOARD_ROLE")
```
Role identifier for Sharia Advisory Board members.

#### `EMERGENCY_COUNCIL_ROLE`
```solidity
bytes32 public constant EMERGENCY_COUNCIL_ROLE = keccak256("EMERGENCY_COUNCIL_ROLE")
```
Role for emergency council members.

### Structs

#### `ShariaReview`
```solidity
struct ShariaReview {
    bool reviewed;                // Whether the proposal has been reviewed
    bool approved;                // Whether the Sharia board approved
    uint256 approvalCount;         // Number of Sharia board approvals
    uint256 disapprovalCount;      // Number of Sharia board disapprovals
    uint256 reviewDeadline;        // Deadline for Sharia review
    string reasoning;              // Reasoning for the decision
}
```

### Events

#### `ShariaReviewInitiated`
```solidity
event ShariaReviewInitiated(uint256 indexed proposalId, uint256 deadline)
```

#### `ShariaBoardVoted`
```solidity
event ShariaBoardVoted(uint256 indexed proposalId, address indexed boardMember, bool approve)
```

#### `ShariaBoardVeto`
```solidity
event ShariaBoardVeto(uint256 indexed proposalId, address indexed boardMember, string reasoning)
```

### Functions

#### `proposeWithShariaReview`
```solidity
function proposeWithShariaReview(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    string memory description,
    bool affectsSharia
) public returns (uint256 proposalId)
```
Create a proposal with optional Sharia review requirement.

#### `shariaBoardReview`
```solidity
function shariaBoardReview(
    uint256 proposalId,
    bool approved,
    string memory reasoning
) external onlyRole(SHARIA_BOARD_ROLE)
```
Sharia board member votes on proposal compliance.

#### `vetoPauseAction`
```solidity
function vetoPauseAction(uint256 proposalId) external onlyRole(SHARIA_BOARD_ROLE)
```
Veto a proposal that affects Sharia principles.

#### `isShariaCompliant`
```solidity
function isShariaCompliant(uint256 proposalId) public view returns (bool)
```
Check if a proposal meets Sharia compliance requirements.

---

## CircuitBreaker

Emergency stop mechanism with role-based access control.

### State Variables

#### `status`
```solidity
CircuitBreakerStatus public status
```
Current system status (Normal, Paused, Locked).

#### `autoUnlockDuration`
```solidity
uint256 public autoUnlockDuration
```
Duration for automatic unlock (0 = manual unlock required).

### Enums

#### `CircuitBreakerStatus`
```solidity
enum CircuitBreakerStatus {
    Normal,     // All operations normal
    Paused,     // System paused (emergency stop)
    Locked      // System locked (requires special unlock)
}
```

### Structs

#### `PauseAction`
```solidity
struct PauseAction {
    address initiator;        // Who initiated the pause
    address targetContract;   // Contract affected (address(0) for global)
    bytes4 functionSelector;  // Function affected (bytes4(0) for all)
    bool isPause;             // true = pause, false = unpause
    CircuitBreakerStatus previousStatus; // Previous status
    uint256 timestamp;        // When the action occurred
    string reason;            // Reason for the action
}
```

### Functions

#### `pauseSystem`
```solidity
function pauseSystem(string calldata reason) external onlyRole(PAUSER_ROLE)
```
Pause the entire system with emergency stop.

#### `unpauseSystem`
```solidity
function unpauseSystem() external
```
Unpause the system (requires ADMIN_ROLE or SHARIA_BOARD_ROLE).

#### `lockSystem`
```solidity
function lockSystem(string calldata reason) external onlyRole(ADMIN_ROLE)
```
Lock the system requiring special unlock procedure.

#### `vetoPauseAction`
```solidity
function vetoPauseAction(uint256 actionId) external onlyRole(SHARIA_BOARD_ROLE)
```
Sharia board can veto pause actions.

#### `pauseContract`
```solidity
function pauseContract(address targetContract) external onlyRole(PAUSER_ROLE)
```
Pause a specific contract.

#### `pauseFunction`
```solidity
function pauseFunction(bytes4 functionSelector) external onlyRole(PAUSER_ROLE)
```
Pause a specific function across all contracts.

---

## AmanaToken

ERC20 governance token with voting and vesting functionality.

### State Variables

#### `MAX_SUPPLY`
```solidity
uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18
```
Maximum token supply (1 billion tokens).

#### `MIN_VESTING_PERIOD`
```solidity
uint256 public constant MIN_VESTING_PERIOD = 90 days
```
Minimum vesting period for governance rewards.

### Functions

#### `mint`
```solidity
function mint(address to, uint256 amount) external onlyOwner
```
Mint new tokens (only callable by DAO/owner).

**Requirements:**
- Total supply + amount ≤ MAX_SUPPLY
- Valid recipient address

#### `burn`
```solidity
function burn(uint256 amount) external
```
Burn tokens from caller's balance.

#### `setVesting`
```solidity
function setVesting(address account, uint256 endTime) external onlyOwner
```
Set vesting period for an address.

#### `hasVotingPower`
```solidity
function hasVotingPower(address account) external view returns (bool)
```
Check if voting power is available (considering vesting).

#### `addCustodian`
```solidity
function addCustodian(address custodian) external onlyOwner
```
Add a trusted custodian (e.g., exchanges).

#### `getVestingEnd`
```solidity
function getVestingEnd(address account) external view returns (uint256)
```
Get the vesting end time for an address.

---

## HalalActivityIndex

Tracks the Halal Activity Index (HAI) for Sharia compliance measurement.

### State Variables

#### `MAX_SCORE`
```solidity
uint256 public constant MAX_SCORE = 10000
```
Maximum HAI score (100.00%).

#### `currentScore`
```solidity
uint256 public currentScore
```
Current HAI score (0-10000).

#### `complianceWeight`
```solidity
uint256 public complianceWeight = 4000
```
Weight for compliance component (40%).

### Structs

#### `HAISnapshot`
```solidity
struct HAISnapshot {
    uint256 score;              // Current HAI score (0-10000)
    uint256 totalActivities;    // Total activities tracked
    uint256 compliantActivities; // Number of Sharia-compliant activities
    uint256 assetBackedActivities; // Number of asset-backed activities
    uint256 timestamp;          // Snapshot timestamp
}
```

#### `ActivityMetrics`
```solidity
struct ActivityMetrics {
    bytes32 activityId;
    bool isCompliant;           // Sharia compliance status
    bool isAssetBacked;         // Asset backing status
    bool hasRealEconomicValue;  // Economic value status
    uint256 validatorCount;     // Number of validators who reviewed
    uint256 positiveVotes;      // Number of positive validation votes
    uint256 timestamp;          // Activity timestamp
}
```

### Functions

#### `trackActivity`
```solidity
function trackActivity(
    bytes32 activityId,
    bool isCompliant,
    bool isAssetBacked,
    bool hasRealEconomicValue,
    uint256 validatorCount,
    uint256 positiveVotes
) external
```
Track an activity for HAI calculation.

#### `calculateScore`
```solidity
function calculateScore() public returns (uint256 score)
```
Calculate the HAI score based on tracked activities.

#### `createSnapshot`
```solidity
function createSnapshot() external onlyOwner
```
Create a snapshot of current HAI metrics.

#### `getHAIPercentage`
```solidity
function getHAIPercentage() external view returns (uint256 percentage)
```
Get HAI score as a percentage (0-100).

#### `getHAIMetrics`
```solidity
function getHAIMetrics() external view returns (
    uint256 score,
    uint256 percentage,
    uint256 total,
    uint256 compliant,
    uint256 complianceRate
)
```
Get detailed HAI metrics.

#### `updateWeights`
```solidity
function updateWeights(
    uint256 _complianceWeight,
    uint256 _assetBackingWeight,
    uint256 _economicValueWeight,
    uint256 _validatorParticipationWeight
) external onlyOwner
```
Update HAI calculation weights (must sum to 10000).

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

### Functions

#### `createPool`
```solidity
function createPool(bytes32 poolId, string memory purpose, uint256 targetCapital) external
```
Create a new capital pool.

#### `contributeToPool`
```solidity
function contributeToPool(bytes32 poolId) external payable
```
Contribute capital to a pool. Pool activates automatically when target is reached.

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

### Functions

#### `createRiskPool`
```solidity
function createRiskPool(bytes32 poolId) external
```
Create a new risk pool.

#### `shareProfit`
```solidity
function shareProfit(bytes32 poolId, uint256 totalProfit) external
```
Distribute profit among participants proportionally.

#### `shareLoss`
```solidity
function shareLoss(bytes32 poolId, uint256 totalLoss) external
```
Distribute loss among participants proportionally.

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

#### `meetsShariaCompliance`
```solidity
function meetsShariaCompliance(bytes32 activityId) external view returns (bool)
```
Check if activity meets all compliance criteria.

---

## Solana Programs

### amana-reserve

Core reserve program managing participants, capital, and activities on Solana.

#### Accounts

##### Reserve Account
```rust
pub struct Reserve {
    pub admin: Pubkey,
    pub min_capital_contribution: u64,
    pub max_participants: u64,
    pub total_capital: u64,
    pub participant_count: u64,
    pub is_initialized: bool,
    pub bump: u8,
}
```

**PDA:** `["reserve"]`

##### Participant Account
```rust
pub struct Participant {
    pub agent: Pubkey,
    pub capital_contributed: u64,
    pub profit_share: u64,
    pub loss_share: u64,
    pub is_active: bool,
    pub joined_at: i64,
    pub bump: u8,
}
```

**PDA:** `["participant", agent_pubkey.as_ref()]`

##### Activity Account
```rust
pub struct Activity {
    pub activity_id: [u8; 32],
    pub initiator: Pubkey,
    pub capital_required: u64,
    pub capital_deployed: u64,
    pub status: ActivityStatus,
    pub created_at: i64,
    pub completed_at: i64,
    pub outcome: i64,
    pub is_validated: bool,
    pub bump: u8,
}
```

**PDA:** `["activity", activity_id.as_ref()]`

#### Instructions

| Instruction | Parameters | Description |
|-------------|------------|-------------|
| `initialize` | min_capital_contribution, max_participants | Initialize reserve |
| `join_reserve` | amount | Join with capital |
| `propose_activity` | activity_id, capital_required | Propose activity |
| `approve_activity` | - | Approve activity |
| `complete_activity` | outcome | Record profit/loss |
| `deposit_capital` | amount | Add more capital |
| `withdraw_capital` | amount | Withdraw capital |

#### Events

```rust
pub struct ParticipantJoinedEvent {
    pub agent: Pubkey,
    pub capital_contributed: u64,
}

pub struct ActivityProposedEvent {
    pub activity_id: [u8; 32],
    pub initiator: Pubkey,
    pub capital_required: u64,
}

pub struct ActivityCompletedEvent {
    pub activity_id: [u8; 32],
    pub outcome: i64,
}
```

#### Errors

| Error Code | Description |
|------------|-------------|
| `InsufficientContribution` | Below minimum capital |
| `MaxParticipantsReached` | At capacity limit |
| `InvalidCapitalAmount` | Invalid amount |
| `InvalidActivityStatus` | Wrong state for operation |
| `MathOverflow` | Arithmetic overflow |
| `InsufficientBalance` | Not enough balance |
| `InsufficientLiquidity` | Reserve lacks funds |
| `InactiveParticipant` | Not an active participant |
| `Unauthorized` | Not authorized |

### amana-dao

Governance program with Sharia Advisory Board integration.

#### Accounts

##### DAO Account
```rust
pub struct Dao {
    pub admin: Pubkey,
    pub token_mint: Pubkey,
    pub timelock: Pubkey,
    pub voting_delay: i64,
    pub voting_period: i64,
    pub quorum_percentage: u16,
    pub proposal_count: u64,
    pub bump: u8,
}
```

**PDA:** `["dao"]`

##### Proposal Account
```rust
pub struct Proposal {
    pub proposal_id: u64,
    pub proposer: Pubkey,
    pub target_account: Pubkey,
    pub amount: u64,
    pub affects_sharia: bool,
    pub status: ProposalStatus,
    pub created_at: i64,
    pub voting_starts_at: i64,
    pub voting_ends_at: i64,
    pub for_votes: u64,
    pub against_votes: u64,
    pub abstain_votes: u64,
    pub sharia_approved: bool,
    pub bump: u8,
}
```

**PDA:** `["proposal", proposal_id.to_le_bytes().as_ref()]`

##### Sharia Board Account
```rust
pub struct ShariaBoard {
    pub admin: Pubkey,
    pub member_count: u32,
    pub bump: u8,
}
```

**PDA:** `["sharia_board"]`

#### Instructions

| Instruction | Parameters | Description |
|-------------|------------|-------------|
| `initialize` | voting_delay, voting_period, quorum_percentage | Initialize DAO |
| `init_sharia_board` | - | Initialize Sharia board |
| `create_proposal` | target_account, amount, affects_sharia | Create proposal |
| `vote` | proposal_id, vote, weight | Cast vote |
| `sharia_review` | proposal_id, approved | Sharia board review |
| `execute_proposal` | - | Execute proposal |
| `cancel_proposal` | - | Cancel proposal |

#### Events

```rust
pub struct ProposalCreatedEvent {
    pub proposal_id: u64,
    pub proposer: Pubkey,
    pub affects_sharia: bool,
}

pub struct VoteCastEvent {
    pub proposal_id: u64,
    pub voter: Pubkey,
    pub vote: u8,
    pub weight: u64,
}

pub struct ShariaReviewEvent {
    pub proposal_id: u64,
    pub board_member: Pubkey,
    pub approved: bool,
}
```

### amana-hai

Halal Activity Index (HAI) tracking and scoring program.

#### Accounts

##### HAI Account
```rust
pub struct Hai {
    pub admin: Pubkey,
    pub current_score: u16,        // 0-10000 (0-100%)
    pub total_activities: u64,
    pub compliant_activities: u64,
    pub asset_backed_activities: u64,
    pub economic_value_activities: u64,
    pub snapshot_count: u64,
    // Weights (in basis points)
    pub compliance_weight: u16,
    pub asset_backing_weight: u16,
    pub economic_value_weight: u16,
    pub validator_participation_weight: u16,
    pub bump: u8,
}
```

**PDA:** `["hai"]`

##### Activity Metrics Account
```rust
pub struct ActivityMetrics {
    pub activity_id: [u8; 32],
    pub is_compliant: bool,
    pub is_asset_backed: bool,
    pub has_real_economic_value: bool,
    pub validator_count: u32,
    pub positive_votes: u32,
    pub timestamp: i64,
    pub bump: u8,
}
```

**PDA:** `["metrics", activity_id.as_ref()]`

#### Instructions

| Instruction | Parameters | Description |
|-------------|------------|-------------|
| `initialize` | initial_score | Initialize HAI tracker |
| `track_activity` | activity_id, is_compliant, is_asset_backed, has_real_economic_value, validator_count, positive_votes | Track activity |
| `create_snapshot` | - | Create metrics snapshot |
| `update_weights` | compliance_weight, asset_backing_weight, economic_value_weight, validator_participation_weight | Update weights |

#### Events

```rust
pub struct ActivityTrackedEvent {
    pub activity_id: [u8; 32],
    pub is_compliant: bool,
    pub is_asset_backed: bool,
    pub new_score: u16,
}

pub struct SnapshotCreatedEvent {
    pub snapshot_id: u64,
    pub score: u16,
}
```

---

## SDK API

### AmanaSDK Class

Main SDK entry point for multi-chain interactions.

```typescript
class AmanaSDK {
  constructor(config: AmanaConfig)
  get ethereum(): AmanaEthereumClient
  get solana(): AmanaSolanaClient
  getChain(): ChainType
  isEthereum(): boolean
  isSolana(): boolean
}
```

### AmanaEthereumClient

Ethereum-specific client methods.

```typescript
// Connection
async connect(signer: ethers.Signer | BrowserProvider): Promise<void>
async getAddress(): Promise<string | null>

// Reserve Operations
async joinReserve(amount: BigNumberish, options?: TransactionOptions): Promise<TransactionResult>
async proposeActivity(activityId: string, capitalRequired: BigNumberish, options?: TransactionOptions): Promise<TransactionResult>
async approveActivity(activityId: string, options?: TransactionOptions): Promise<TransactionResult>
async completeActivity(activityId: string, outcome: bigint, options?: TransactionOptions): Promise<TransactionResult>
async depositCapital(amount: BigNumberish, options?: TransactionOptions): Promise<TransactionResult>
async withdrawCapital(amount: BigNumberish, options?: TransactionOptions): Promise<TransactionResult>
async exitReserve(options?: TransactionOptions): Promise<TransactionResult>

// View Functions
async getParticipant(agent: string): Promise<Participant>
async getActivity(activityId: string): Promise<Activity>
async getParticipants(): Promise<string[]>
async getReserveStats(): Promise<ReserveStats>
async getWithdrawableBalance(participantAddress: string): Promise<bigint>

// HAI Operations
async getHAIMetrics(): Promise<HAIMetrics>
async createSnapshot(options?: TransactionOptions): Promise<TransactionResult>

// Event Listeners
onParticipantJoined(callback: (agent: string, capital: bigint) => void): void
onActivityProposed(callback: (activityId: string, initiator: string, capital: bigint) => void): void
onActivityCompleted(callback: (activityId: string, outcome: bigint) => void): void
```

### AmanaSolanaClient

Solana-specific client methods.

```typescript
// Connection
async connect(wallet: Signer): Promise<void>
getAddress(): PublicKey | null

// PDA Helpers
getReservePDA(): [PublicKey, number]
getParticipantPDA(agent: PublicKey): [PublicKey, number]
getActivityPDA(activityId: Buffer): [PublicKey, number]
getHAIPDA(): [PublicKey, number]

// Reserve Operations
async initializeReserve(minCapitalContribution: number, maxParticipants: number, options?: TransactionOptions): Promise<TransactionResult>
async joinReserve(amount: number, options?: TransactionOptions): Promise<TransactionResult>
async proposeActivity(activityId: Buffer, capitalRequired: number, description: string, options?: TransactionOptions): Promise<TransactionResult>
async approveActivity(activityId: Buffer, options?: TransactionOptions): Promise<TransactionResult>
async completeActivity(activityId: Buffer, outcome: number, options?: TransactionOptions): Promise<TransactionResult>

// HAI Operations
async trackActivity(activityId: Buffer, isCompliant: boolean, isAssetBacked: boolean, hasRealEconomicValue: boolean, validatorCount: number, positiveVotes: number, options?: TransactionOptions): Promise<TransactionResult>
```

---

## Error Codes

### Common Errors

| Code | Description |
|------|-------------|
| `UNKNOWN` | Unknown error |
| `NETWORK_ERROR` | Network connection error |
| `INVALID_PARAMS` | Invalid parameters |
| `NOT_AUTHORIZED` | Not authorized for operation |

### Participant Errors

| Code | Description |
|------|-------------|
| `NOT_PARTICIPANT` | Not a participant |
| `ALREADY_PARTICIPANT` | Already a participant |
| `INSUFFICIENT_CONTRIBUTION` | Below minimum contribution |
| `INSUFFICIENT_BALANCE` | Insufficient balance |
| `MAX_PARTICIPANTS` | Maximum participants reached |

### Activity Errors

| Code | Description |
|------|-------------|
| `ACTIVITY_NOT_FOUND` | Activity not found |
| `ACTIVITY_ALREADY_EXISTS` | Activity already exists |
| `INVALID_ACTIVITY_STATUS` | Invalid activity status |
| `INSUFFICIENT_CAPITAL` | Insufficient reserve capital |

### Transaction Errors

| Code | Description |
|------|-------------|
| `TRANSACTION_FAILED` | Transaction failed |
| `TRANSACTION_REJECTED` | Transaction rejected by user |
| `GAS_ESTIMATION_FAILED` | Gas estimation failed |

### Governance Errors

| Code | Description |
|------|-------------|
| `VOTING_ENDED` | Voting period ended |
| `QUORUM_NOT_MET` | Quorum not reached |
| `SHARIA_NOT_APPROVED` | Sharia board approval required |

---

## Gas Costs

### Ethereum Gas Costs (at 20 gwei)

| Operation | Gas Limit | Est. Cost (ETH) |
|-----------|-----------|-----------------|
| joinReserve | ~150,000 | ~0.003 ETH |
| proposeActivity | ~80,000 | ~0.0016 ETH |
| approveActivity | ~60,000 | ~0.0012 ETH |
| completeActivity (profit) | ~180,000 | ~0.0036 ETH |
| distributeProfit (per participant) | ~25,000 | ~0.0005 ETH |
| withdrawCapital | ~70,000 | ~0.0014 ETH |

### Solana Transaction Costs

| Operation | Est. Cost (SOL) |
|-----------|-----------------|
| initializeReserve | ~0.005 SOL |
| joinReserve | ~0.0003 SOL |
| proposeActivity | ~0.0002 SOL |
| completeActivity | ~0.0004 SOL |
| trackHAIActivity | ~0.0002 SOL |

---

## Contract Interactions

### AmanaReserve ↔ AmanaDAO
- DAO can update reserve parameters
- Reserve emits events for DAO proposals

### AmanaReserve ↔ CircuitBreaker
- Circuit breaker can pause reserve operations
- Sharia board can veto emergency pauses

### AmanaDAO ↔ AmanaToken
- Token holders vote on DAO proposals
- DAO controls token minting/burning

### HalalActivityIndex ↔ ActivityValidator
- HAI tracks validated activities
- Validator results feed into HAI scoring

### All Contracts ↔ CircuitBreaker
- Circuit breaker can pause any contract
- Granular function-level pausing available

---

For practical examples, see [EXAMPLES.md](EXAMPLES.md).
For general information, see [README.md](README.md).
