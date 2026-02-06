# AMANA Reserve API Reference

Complete API documentation for the AMANA reserve system smart contracts and programs.

## Table of Contents
- [EIP-8004 Agent Infrastructure](#eip-8004-agent-infrastructure)
  - [AgentIdentityRegistry](#agentidentityregistry)
  - [AgentReputationRegistry](#agentreputationregistry)
  - [AgentValidationRegistry](#agentvalidationregistry)
- [Ethereum Core Contracts](#ethereum-core-contracts)
  - [AmanaReserve](#amanareserve)
  - [AmanaDAO](#amanadao)
  - [CircuitBreaker](#circuitbreaker)
  - [AmanaToken](#amanatoken)
  - [HalalActivityIndex](#halalactivityindex)
  - [CapitalPool](#capitalpool)
  - [RiskSharing](#risksharing)
  - [ActivityValidator](#activityvalidator)
- [Solana Programs](#solana-programs)
  - [amana-reserve (Base Layer)](#amana-reserve-program)
  - [amana-reserve (MagicBlock ER)](#amana-reserve-magicblock-er)
  - [amana-dao](#amana-dao-program)
  - [amana-hai](#amana-hai-program)
- [SDK API](#sdk-api)
- [Error Codes](#error-codes)
- [Gas Costs](#gas-costs)

---

## EIP-8004 Agent Infrastructure

The AMANA system implements **EIP-8004 Trustless Agent Infrastructure** on Ethereum for decentralized agent management with portable identities and reputation tracking.

### AgentIdentityRegistry

ERC-721 based registry for agent identity management.

#### State Variables

##### `name`
```solidity
string public constant name = "AMANA Agent Identity"
```
ERC-721 token name.

##### `symbol`
```solidity
string public constant symbol = "AGENT"
```
ERC-721 token symbol.

##### `nextAgentId`
```solidity
uint256 public nextAgentId
```
Counter for next agent ID to be minted.

#### Structs

##### `Agent`
```solidity
struct Agent {
    uint256 agentId;           // Unique agent ID (ERC-721 token ID)
    address owner;             // Owner of the agent NFT
    string metadataURI;        // IPFS hash of agent metadata
    uint256 organizationId;    // Organization scope
    bool isActive;             // Active status
    uint256 createdAt;         // Creation timestamp
}
```

##### `Endpoint`
```solidity
struct Endpoint {
    string id;                 // Endpoint identifier
    EndpointType endpointType; // HTTP or webhook
    string url;                // Endpoint URL
}
```

##### `EndpointType`
```solidity
enum EndpointType {
    HTTP,
    Webhook
}
```

#### Events

##### `AgentRegistered`
```solidity
event AgentRegistered(
    uint256 indexed agentId,
    address indexed owner,
    string metadataURI,
    uint256 organizationId
)
```

##### `AgentTransferred`
```solidity
event AgentTransferred(
    uint256 indexed agentId,
    address indexed from,
    address indexed to
)
```

##### `EndpointAdded`
```solidity
event EndpointAdded(
    uint256 indexed agentId,
    string endpointId,
    EndpointType endpointType,
    string url
)
```

#### Functions

##### `registerAgent`
```solidity
function registerAgent(
    string calldata metadataURI,
    uint256 organizationId,
    Endpoint[] calldata endpoints
) external returns (uint256 agentId)
```
Register a new agent with metadata and endpoints.

**Requirements:**
- Valid metadata URI (IPFS hash)
- Valid organization ID

##### `updateMetadata`
```solidity
function updateMetadata(
    uint256 agentId,
    string calldata metadataURI
) external onlyAgentOwner(agentId)
```
Update agent metadata.

##### `addEndpoint`
```solidity
function addEndpoint(
    uint256 agentId,
    string calldata id,
    EndpointType endpointType,
    string calldata url
) external onlyAgentOwner(agentId)
```
Add a new endpoint to the agent.

##### `removeEndpoint`
```solidity
function removeEndpoint(
    uint256 agentId,
    string calldata id
) external onlyAgentOwner(agentId)
```
Remove an endpoint from the agent.

##### `getAgent`
```solidity
function getAgent(uint256 agentId) external view returns (Agent memory)
```
Get agent details by ID.

##### `getEndpoints`
```solidity
function getEndpoints(uint256 agentId) external view returns (Endpoint[] memory)
```
Get all endpoints for an agent.

##### `getAgentsByOwner`
```solidity
function getAgentsByOwner(address owner) external view returns (uint256[] memory)
```
Get all agent IDs owned by an address.

---

### AgentReputationRegistry

Stake-weighted feedback and reputation tracking for agents.

#### State Variables

##### `DECAY_PERIOD`
```solidity
uint256 public constant DECAY_PERIOD = 90 days
```
Period after which feedback weight decays.

##### `MIN_STAKE`
```solidity
uint256 public constant MIN_STAKE = 0.01 ether
```
Minimum stake required to submit feedback.

#### Structs

##### `Feedback`
```solidity
struct Feedback {
    uint256 agentId;           // Agent being rated
    address submitter;         // Feedback submitter
    uint8 score;               // 1-5 rating
    string tag;                // Category tag
    uint256 stake;             // Stake weight
    uint256 timestamp;         // Submission time
    string comment;            // Optional comment
}
```

#### Events

##### `FeedbackSubmitted`
```solidity
event FeedbackSubmitted(
    uint256 indexed agentId,
    address indexed submitter,
    uint8 score,
    string tag,
    uint256 stake
)
```

##### `ReputationUpdated`
```solidity
event ReputationUpdated(
    uint256 indexed agentId,
    uint256 newScore,
    uint256 tagScore
)
```

#### Functions

##### `submitFeedback`
```solidity
function submitFeedback(
    uint256 agentId,
    uint8 score,
    string calldata tag,
    string calldata comment
) external payable
```
Submit feedback with stake weight.

**Requirements:**
- `msg.value >= MIN_STAKE`
- Score must be 1-5
- Agent must exist

##### `getReputation`
```solidity
function getReputation(uint256 agentId) external view returns (
    uint256 overallScore,
    uint256 feedbackCount,
    string[] memory tags,
    uint256[] memory tagScores
)
```
Get comprehensive reputation data.

##### `getFeedback`
```solidity
function getFeedback(uint256 agentId) external view returns (Feedback[] memory)
```
Get all feedback for an agent.

##### `decayFeedback`
```solidity
function decayFeedback(uint256 agentId) external
```
Manually trigger feedback weight decay.

---

### AgentValidationRegistry

Multi-validator work verification system with staking.

#### State Variables

##### `VALIDATION_PERIOD`
```solidity
uint256 public constant VALIDATION_PERIOD = 7 days
```
Time window for validation.

##### `CHALLENGE_PERIOD`
```solidity
uint256 public constant CHALLENGE_PERIOD = 3 days
```
Time window to challenge validation.

##### `MIN_VALIDATORS`
```solidity
uint256 public constant MIN_VALIDATORS = 3
```
Minimum validators required.

#### Structs

##### `WorkValidation`
```solidity
struct WorkValidation {
    bytes32 workId;                // Unique work identifier
    uint256 agentId;               // Agent submitting work
    uint256 validationAmount;      // Stake for validation
    address[] validators;          // Assigned validators
    mapping(address => bool) approvals; // Validator approvals
    uint256 approvalCount;         // Number of approvals
    bool isValidated;              // Final validation status
    uint256 submittedAt;           // Submission timestamp
    string workURI;                // IPFS hash of work data
}
```

#### Events

##### `WorkSubmitted`
```solidity
event WorkSubmitted(
    bytes32 indexed workId,
    uint256 indexed agentId,
    string workURI,
    uint256 validationAmount
)
```

##### `ValidatorApproved`
```solidity
event ValidatorApproved(
    bytes32 indexed workId,
    address indexed validator,
    bool approved
)
```

##### `WorkValidated`
```solidity
event WorkValidated(
    bytes32 indexed workId,
    uint256 indexed agentId,
    bool isValidated
)
```

#### Functions

##### `submitWork`
```solidity
function submitWork(
    bytes32 workId,
    string calldata workURI,
    uint256 validationAmount
) external payable
```
Submit work for validation with stake.

**Requirements:**
- `msg.value >= validationAmount`
- Agent must be registered

##### `validateWork`
```solidity
function validateWork(
    bytes32 workId,
    bool approved
) external onlyAssignedValidator(workId)
```
Validate submitted work.

##### `challengeValidation`
```solidity
function challengeValidation(
    bytes32 workId,
    string calldata reason
) external payable
```
Challenge a validation with stake.

##### `getValidation`
```solidity
function getValidation(bytes32 workId) external view returns (WorkValidation memory)
```
Get validation details.

---

## Ethereum Core Contracts

### AmanaReserve

Main contract for managing the reserve system, participants, and economic activities.

#### State Variables

##### `VERSION`
```solidity
string public constant VERSION = "1.0.0"
```
Contract version identifier.

##### `totalCapital`
```solidity
uint256 public totalCapital
```
Total capital available in the reserve.

##### `participantCount`
```solidity
uint256 public participantCount
```
Number of active participants in the reserve.

##### `minCapitalContribution`
```solidity
uint256 public minCapitalContribution
```
Minimum capital required to join the reserve.

##### `MAX_PARTICIPANTS`
```solidity
uint256 public constant MAX_PARTICIPANTS = 50
```
Maximum participants for gas-efficient iteration.

#### Structs

##### `Participant`
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

##### `Activity`
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

##### `ActivityStatus` Enum
```solidity
enum ActivityStatus {
    Proposed,   // Activity proposed but not approved
    Approved,   // Activity approved and capital deployed
    Active,     // Activity in progress
    Completed,  // Activity completed
    Rejected    // Activity rejected
}
```

#### Events

##### `ParticipantJoined`
```solidity
event ParticipantJoined(address indexed agent, uint256 capitalContributed)
```

##### `ActivityProposed`
```solidity
event ActivityProposed(bytes32 indexed activityId, address indexed initiator, uint256 capitalRequired)
```

##### `ActivityCompleted`
```solidity
event ActivityCompleted(bytes32 indexed activityId, int256 outcome)
```

##### `ProfitDistributed`
```solidity
event ProfitDistributed(uint256 totalProfit, uint256 participantCount)
```

#### Functions

##### `initialize`
```solidity
function initialize(uint256 _minCapitalContribution) external onlyAdmin notInitialized
```
Initialize the reserve system with minimum capital requirement.

##### `joinReserve`
```solidity
function joinReserve() external payable
```
Join the reserve as a participant.

**Requirements:**
- Must send value ≥ minCapitalContribution
- Cannot already be a participant
- Must not exceed MAX_PARTICIPANTS

##### `proposeActivity`
```solidity
function proposeActivity(bytes32 activityId, uint256 capitalRequired) external onlyParticipant
```
Propose a new economic activity.

##### `completeActivity`
```solidity
function completeActivity(bytes32 activityId, int256 outcome) external onlyParticipant
```
Complete an activity and record outcome with automatic profit/loss distribution.

---

### AmanaDAO

Governance contract with Sharia Advisory Board integration.

#### State Variables

##### `SHARIA_BOARD_ROLE`
```solidity
bytes32 public constant SHARIA_BOARD_ROLE = keccak256("SHARIA_BOARD_ROLE")
```
Role identifier for Sharia Advisory Board members.

#### Structs

##### `ShariaReview`
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

#### Events

##### `ShariaReviewInitiated`
```solidity
event ShariaReviewInitiated(uint256 indexed proposalId, uint256 deadline)
```

##### `ShariaBoardVeto`
```solidity
event ShariaBoardVeto(uint256 indexed proposalId, address indexed boardMember, string reasoning)
```

#### Functions

##### `proposeWithShariaReview`
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

##### `shariaBoardReview`
```solidity
function shariaBoardReview(
    uint256 proposalId,
    bool approved,
    string memory reasoning
) external onlyRole(SHARIA_BOARD_ROLE)
```
Sharia board member votes on proposal compliance.

##### `vetoPauseAction`
```solidity
function vetoPauseAction(uint256 proposalId) external onlyRole(SHARIA_BOARD_ROLE)
```
Veto a proposal that affects Sharia principles.

---

### CircuitBreaker

Emergency stop mechanism with role-based access control.

#### State Variables

##### `status`
```solidity
CircuitBreakerStatus public status
```
Current system status (Normal, Paused, Locked).

##### `autoUnlockDuration`
```solidity
uint256 public autoUnlockDuration
```
Duration for automatic unlock (0 = manual unlock required).

#### Enums

##### `CircuitBreakerStatus`
```solidity
enum CircuitBreakerStatus {
    Normal,     // All operations normal
    Paused,     // System paused (emergency stop)
    Locked      // System locked (requires special unlock)
}
```

#### Functions

##### `pauseSystem`
```solidity
function pauseSystem(string calldata reason) external onlyRole(PAUSER_ROLE)
```
Pause the entire system with emergency stop.

##### `unpauseSystem`
```solidity
function unpauseSystem() external
```
Unpause the system (requires ADMIN_ROLE or SHARIA_BOARD_ROLE).

##### `lockSystem`
```solidity
function lockSystem(string calldata reason) external onlyRole(ADMIN_ROLE)
```
Lock the system requiring special unlock procedure.

---

### AmanaToken

ERC20 governance token with voting and vesting functionality.

#### State Variables

##### `MAX_SUPPLY`
```solidity
uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18
```
Maximum token supply (1 billion tokens).

#### Functions

##### `mint`
```solidity
function mint(address to, uint256 amount) external onlyOwner
```
Mint new tokens (only callable by DAO/owner).

##### `burn`
```solidity
function burn(uint256 amount) external
```
Burn tokens from caller's balance.

##### `setVesting`
```solidity
function setVesting(address account, uint256 endTime) external onlyOwner
```
Set vesting period for an address.

---

### HalalActivityIndex

Tracks the Halal Activity Index (HAI) for Sharia compliance measurement.

#### State Variables

##### `MAX_SCORE`
```solidity
uint256 public constant MAX_SCORE = 10000
```
Maximum HAI score (100.00%).

##### `currentScore`
```solidity
uint256 public currentScore
```
Current HAI score (0-10000).

#### Structs

##### `HAISnapshot`
```solidity
struct HAISnapshot {
    uint256 score;              // Current HAI score (0-10000)
    uint256 totalActivities;    // Total activities tracked
    uint256 compliantActivities; // Number of Sharia-compliant activities
    uint256 assetBackedActivities; // Number of asset-backed activities
    uint256 timestamp;          // Snapshot timestamp
}
```

#### Functions

##### `trackActivity`
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

##### `calculateScore`
```solidity
function calculateScore() public returns (uint256 score)
```
Calculate the HAI score based on tracked activities.

---

## Solana Programs

### amana-reserve (Base Layer)

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
    pub delegate: Option<Pubkey>,     // Delegate for ER
    pub delegate_authority: Option<Pubkey>,
    pub is_initialized: bool,
    pub bump: u8,
}
```

**PDA:** `["reserve"]`

#### Instructions

| Instruction | Parameters | Description |
|-------------|------------|-------------|
| `initialize` | min_capital_contribution, max_participants | Initialize reserve |
| `join_reserve` | amount | Join with capital |
| `propose_activity` | activity_id, capital_required | Propose activity |
| `approve_activity` | activity_id | Approve activity |
| `complete_activity` | outcome | Record profit/loss |
| `delegate_reserve` | authority | Delegate control to ER |

---

### amana-reserve (MagicBlock ER)

Real-time operations on Ephemeral Rollups with zero fees.

#### Accounts

##### Delegate Account
```rust
pub struct DelegateReserve {
    pub base_reserve: Pubkey,     // Original reserve PDA
    pub capital_deployed: u64,
    pub activity_count: u64,
    pub created_at: i64,
    pub bump: u8,
}
```

**PDA:** `["delegate", base_reserve.key().as_ref()]`

#### Instructions

| Instruction | Parameters | Description |
|-------------|------------|-------------|
| `deploy_capital_realtime` | activity_id, amount | Deploy capital with zero fees |
| `execute_activity_realtime` | activity_id, instruction_data | Execute activity instruction |
| `track_hai_realtime` | activity_id, metrics | Track HAI in real-time |
| `commit_and_undelegate` | - | Commit state to base layer |

#### Events

```rust
pub struct CapitalDeployedEvent {
    pub activity_id: [u8; 32],
    pub amount: u64,
    pub executed_at: i64,
}

pub struct HAIUpdatedEvent {
    pub activity_id: [u8; 32],
    pub new_score: u16,
    pub vrf_proof: [u8; 64],
}
```

---

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

#### Instructions

| Instruction | Parameters | Description |
|-------------|------------|-------------|
| `initialize` | voting_delay, voting_period, quorum_percentage | Initialize DAO |
| `create_proposal` | target_account, amount, affects_sharia | Create proposal |
| `vote` | proposal_id, vote, weight | Cast vote |
| `sharia_review` | proposal_id, approved | Sharia board review |
| `execute_proposal` | proposal_id | Execute proposal |

---

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
    pub vrf_enabled: bool,
    pub bump: u8,
}
```

**PDA:** `["hai"]`

#### Instructions

| Instruction | Parameters | Description |
|-------------|------------|-------------|
| `initialize` | initial_score | Initialize HAI tracker |
| `track_activity` | activity_id, metrics | Track activity |
| `create_snapshot` | - | Create metrics snapshot |
| `request_vrf_update` | data_source_count | Request VRF for sampling |

---

## SDK API

### AgentManager Class

EIP-8004 compliant agent lifecycle management.

```typescript
class AgentManager {
  constructor(config: AgentManagerConfig)

  // Registration
  async registerAgent(config: AgentRegistrationConfig): Promise<AgentRegistration>
  async updateMetadata(agentId: string, metadataURI: string): Promise<TransactionResult>
  async addEndpoint(agentId: string, endpoint: EndpointConfig): Promise<TransactionResult>

  // Reputation
  async submitFeedback(agentId: string, feedback: FeedbackSubmission): Promise<TransactionResult>
  async getReputation(agentId: string): Promise<AgentReputation>

  // Validation
  async submitWork(work: WorkSubmission): Promise<TransactionResult>
  async validateWork(workId: string, approved: boolean): Promise<TransactionResult>

  // Cross-chain
  async executeOnSolana(agentId: string, instruction: Instruction): Promise<TransactionResult>
}
```

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
async completeActivity(activityId: string, outcome: bigint, options?: TransactionOptions): Promise<TransactionResult>

// HAI Operations
async getHAIMetrics(): Promise<HAIMetrics>
async createSnapshot(options?: TransactionOptions): Promise<TransactionResult>
```

### AmanaSolanaClient

Solana-specific client methods with MagicBlock ER support.

```typescript
// Connection
async connect(wallet: Signer): Promise<void>
getAddress(): PublicKey | null

// Base Layer Operations
async initializeReserve(minCapitalContribution: number, maxParticipants: number, options?: TransactionOptions): Promise<TransactionResult>
async joinReserve(amount: number, options?: TransactionOptions): Promise<TransactionResult>

// MagicBlock ER Operations
async delegateReserve(authority: PublicKey): Promise<TransactionResult>
async deployCapitalRealtime(activityId: Buffer, amount: number): Promise<TransactionResult>
async commitAndUndlegate(): Promise<TransactionResult>

// HAI Operations with VRF
async requestVRFUpdate(dataSourceCount: number): Promise<TransactionResult>
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

### Agent Errors

| Code | Description |
|------|-------------|
| `AGENT_NOT_FOUND` | Agent ID not registered |
| `AGENT_NOT_ACTIVE` | Agent is inactive |
| `INVALID_METADATA` | Invalid metadata URI |
| `INSUFFICIENT_STAKE` | Stake below minimum |
| `NOT_VALIDATOR` | Not assigned as validator |

### Participant Errors

| Code | Description |
|------|-------------|
| `NOT_PARTICIPANT` | Not a participant |
| `ALREADY_PARTICIPANT` | Already a participant |
| `INSUFFICIENT_CONTRIBUTION` | Below minimum capital |
| `MAX_PARTICIPANTS` | Maximum participants reached |

### Transaction Errors

| Code | Description |
|------|-------------|
| `TRANSACTION_FAILED` | Transaction failed |
| `TRANSACTION_REJECTED` | Transaction rejected by user |
| `GAS_ESTIMATION_FAILED` | Gas estimation failed |

---

## Gas Costs

### Ethereum Gas Costs (at 20 gwei)

| Operation | Gas Limit | Est. Cost (ETH) |
|-----------|-----------|-----------------|
| registerAgent | ~150,000 | ~0.003 ETH |
| submitFeedback | ~80,000 | ~0.0016 ETH |
| submitWork | ~100,000 | ~0.002 ETH |
| joinReserve | ~150,000 | ~0.003 ETH |
| proposeActivity | ~80,000 | ~0.0016 ETH |
| completeActivity (profit) | ~180,000 | ~0.0036 ETH |

### Solana Transaction Costs (Base Layer)

| Operation | Est. Cost (SOL) |
|-----------|-----------------|
| initializeReserve | ~0.005 SOL |
| joinReserve | ~0.0003 SOL |
| proposeActivity | ~0.0002 SOL |
| completeActivity | ~0.0004 SOL |

### MagicBlock ER Costs (Zero Fees)

| Operation | Est. Cost (SOL) |
|-----------|-----------------|
| delegate_reserve | ~0.000005 SOL (rent only) |
| deploy_capital_realtime | **0 SOL** |
| execute_activity_realtime | **0 SOL** |
| track_hai_realtime | **0 SOL** |
| commit_and_undelegate | ~0.00001 SOL |

---

## Contract Interactions

### EIP-8004 Interactions

```
AgentIdentityRegistry
    │
    ├────► AgentReputationRegistry (feedback submission)
    │
    └────► AgentValidationRegistry (work verification)
         │
         └────► AmanaReserve (validated agent operations)
```

### Cross-Chain Interactions

```
Ethereum (EIP-8004)
    │
    ├────► AgentIdentityRegistry (agent IDs)
    │
    └────► Bridge Layer
         │
         ▼
    Solana (MagicBlock ER)
         │
         └────► Real-time execution
```

---

For practical examples, see [EXAMPLES.md](EXAMPLES.md).
For general information, see [README.md](README.md).
