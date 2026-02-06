# AMANA Ethereum Package

Ethereum smart contracts for the AMANA Sharia-native reserve system with **EIP-8004 Trustless Agent Infrastructure**.

## Overview

This package contains the core Ethereum smart contracts that implement the AMANA reserve system with full Sharia compliance, including profit/loss sharing (Mudarabah/Musharakah), governance, risk management, compliance tracking, and **EIP-8004 compliant agent infrastructure**.

## EIP-8004 Integration

### Trustless Agent Infrastructure

The Ethereum contracts implement the EIP-8004 standard for trustless agent infrastructure:

- **AgentIdentityRegistry.sol**: ERC-721 based agent registration with portable identities
- **AgentReputationRegistry.sol**: On-chain feedback and reputation system
- **AgentValidationRegistry.sol**: Independent work verification by multiple validators

### EIP-8004 Compliance

| Component | EIP-8004 Requirement | Implementation |
|-----------|---------------------|----------------|
| Agent Identity | ERC-721 NFT | AgentIdentityRegistry |
| Agent Discovery | Registry pattern | `getAgentByToken()`, `getAgentById()` |
| Reputation System | On-chain scoring | AgentReputationRegistry |
| Validation System | Multi-validator support | AgentValidationRegistry |
| Compliance | Sharia-compliant agents | Built-in compliance flags |

## Contracts

### AgentIdentityRegistry.sol

ERC-721 based agent registration with portable identities compliant with EIP-8004.

**Key Features:**
- ERC-721 NFT-backed agent identities
- Sharia-compliant agent registration
- Agent wallet verification with EIP-712 signatures
- Metadata management with IPFS integration
- Compliance flagging by Sharia Board
- Cross-organization portability

**State Variables:**
```solidity
uint256 public totalAgents;              // Total registered agents
uint256 public shariaCompliantAgents;   // Compliant agent count
mapping(uint256 => address) public agentByToken;  // Token ID => Agent address
mapping(address => uint256) public tokenByAgent;  // Agent address => Token ID
```

**Main Functions:**
| Function | Description | Access |
|----------|-------------|--------|
| `registerAgent(string, bool, bytes)` | Register new agent with Sharia compliance | External |
| `updateAgentURI(uint256, string)` | Update agent metadata URI | Token owner |
| `verifyAgent(address, bytes)` | Verify agent wallet signature | External |
| `flagAgent(uint256, bool)` | Sharia board flags non-compliant agents | Sharia Board |
| `burn(uint256)` | Burn agent NFT (exit) | Token owner |

**Events:**
```solidity
event AgentRegistered(uint256 indexed tokenId, address indexed agent, bool shariaCompliant);
event AgentUpdated(uint256 indexed tokenId);
event AgentFlagged(uint256 indexed tokenId, bool compliant);
```

### AgentReputationRegistry.sol

On-chain feedback and reputation system for EIP-8004 agents.

**Key Features:**
- Stake-weighted feedback submission
- Tag-based feedback categorization
- Client filtering for feedback aggregation
- Sharia-compliant feedback mechanisms
- Reputation score calculation

**State Variables:**
```solidity
struct AgentReputation {
    uint256 agentId;              // Agent token ID
    uint256 totalScore;           // Aggregate reputation score
    uint256 feedbackCount;        // Number of feedback received
    uint256 positiveCount;        // Positive feedback count
    uint256 negativeCount;        // Negative feedback count
    mapping(bytes32 => uint256) tagScores;  // Category scores
}

mapping(uint256 => AgentReputation) public reputations;
```

**Main Functions:**
| Function | Description | Access |
|----------|-------------|--------|
| `submitFeedback(uint256, uint8, uint256, bytes32)` | Submit stake-weighted feedback | External |
| `revokeFeedback(uint256, bytes32)` | Revoke previously submitted feedback | Feedback submitter |
| `getAgentReputation(uint256)` | Get agent reputation data | View |
| `getFeedbackCount(uint256, bytes32)` | Get feedback count by tag | View |
| `calculateScore(uint256)` | Calculate aggregate reputation score | View |

**Events:**
```solidity
event FeedbackSubmitted(uint256 indexed agentId, address indexed submitter, uint256 score);
event FeedbackRevoked(uint256 indexed agentId, bytes32 indexed feedbackId);
event ReputationUpdated(uint256 indexed agentId, uint256 newScore);
```

### AgentValidationRegistry.sol

Independent work verification by multiple validators per EIP-8004.

**Key Features:**
- Request/response validation system
- Multi-validator support
- Sharia-compliant validation workflows
- Validator tracking and rewards
- Response aggregation and scoring

**State Variables:**
```solidity
struct ValidationRequest {
    uint256 requestId;         // Unique request ID
    address requester;        // Agent requesting validation
    string workUri;           // IPFS hash of work
    uint256 validationAmount;  // Staked amount for validation
    bytes32 tag;               // Validation category tag
    ValidationStatus status;
    uint256 responseCount;    // Number of validator responses
    uint256 createdAt;
}

enum ValidationStatus {
    Pending,    // Awaiting validators
    Active,     // Validation in progress
    Completed,  // Validation finished
    Cancelled   // Request cancelled
}
```

**Main Functions:**
| Function | Description | Access |
|----------|-------------|--------|
| `requestValidation(uint256, string, uint256, bytes32)` | Request work validation | External |
| `submitValidation(uint256, bool, string)` | Submit validation response | Validators |
| `aggregateResponses(uint256)` | Aggregate and score responses | Requester/Anyone after timeout |
| `calculateValidationScore(uint256)` | Calculate aggregated score | View |
| `claimReward(uint256)` | Claim validator reward | Validators |

**Events:**
```solidity
event ValidationRequested(uint256 indexed requestId, address indexed requester);
event ValidationSubmitted(uint256 indexed requestId, address indexed validator, bool approved);
event ValidationCompleted(uint256 indexed requestId, uint256 finalScore);
```

### AmanaReserve.sol

Main orchestrator contract managing participants, capital, and economic activities.

**Key Features:**
- Participant management with capital tracking
- Activity proposal and approval workflow
- Automatic profit/loss distribution following Sharia principles
- Withdraw and exit mechanisms

**State Variables:**
```solidity
uint256 public totalCapital;              // Total reserve capital
uint256 public participantCount;          // Number of active participants
uint256 public minCapitalContribution;    // Minimum entry requirement
uint256 public constant MAX_PARTICIPANTS = 50;  // Gas optimization limit
```

**Structs:**
```solidity
struct Participant {
    address agent;              // Participant address
    uint256 capitalContributed; // Total contributed capital
    uint256 profitShare;        // Accumulated profit
    uint256 lossShare;          // Accumulated loss
    bool isActive;              // Active status
    uint256 joinedAt;           // Join timestamp
}

struct Activity {
    bytes32 activityId;         // Unique identifier
    address initiator;          // Activity creator
    uint256 capitalRequired;    // Capital needed
    uint256 capitalDeployed;    // Capital actually deployed
    ActivityStatus status;      // Current state
    uint256 createdAt;          // Creation timestamp
    uint256 completedAt;        // Completion timestamp
    int256 outcome;             // Profit (+) or loss (-)
    bool isValidated;           // Validation status
}
```

**Main Functions:**
| Function | Description | Access |
|----------|-------------|--------|
| `initialize(uint256)` | Set minimum capital requirement | Admin only |
| `joinReserve()` | Join with capital contribution | External |
| `proposeActivity(bytes32, uint256)` | Propose new economic activity | Participants |
| `approveActivity(bytes32)` | Approve proposed activity | Participants |
| `completeActivity(bytes32, int256)` | Record profit/loss outcome | Initiator |
| `depositCapital()` | Add more capital | Participants |
| `withdrawCapital(uint256)` | Withdraw capital | Participants |
| `exitReserve()` | Exit and withdraw all | Participants |

**Events:**
```solidity
event ParticipantJoined(address indexed agent, uint256 capitalContributed);
event ActivityProposed(bytes32 indexed activityId, address indexed initiator, uint256 capitalRequired);
event ActivityCompleted(bytes32 indexed activityId, int256 outcome);
event ProfitDistributed(uint256 totalProfit, uint256 participantCount);
event LossDistributed(uint256 totalLoss, uint256 participantCount);
```

### AmanaDAO.sol

Decentralized governance with Sharia Advisory Board integration.

**Key Features:**
- On-chain proposal system
- Token-weighted voting
- Sharia Board veto power
- Time-locked execution

**Roles:**
```solidity
bytes32 public constant SHARIA_BOARD_ROLE = keccak256("SHARIA_BOARD_ROLE");
bytes32 public constant EMERGENCY_COUNCIL_ROLE = keccak256("EMERGENCY_COUNCIL_ROLE");
```

**Main Functions:**
| Function | Description | Access |
|----------|-------------|--------|
| `proposeWithShariaReview(...)` | Create proposal with optional Sharia review | Public |
| `shariaBoardReview(uint256, bool, string)` | Sharia board votes on proposal | Sharia Board |
| `vetoPauseAction(uint256)` | Veto a pause action | Sharia Board |
| `castVote(uint256, uint8)` | Vote on proposal | Token holders |

### CircuitBreaker.sol

Emergency stop mechanism with granular controls.

**Status States:**
```solidity
enum CircuitBreakerStatus {
    Normal,   // All operations active
    Paused,   // Emergency stop active
    Locked    // Special unlock required
}
```

**Main Functions:**
| Function | Description | Access |
|----------|-------------|--------|
| `pauseSystem(string)` | Pause all operations | Pauser |
| `unpauseSystem()` | Resume operations | Admin/Sharia Board |
| `lockSystem(string)` | Lock requiring special unlock | Admin |
| `pauseContract(address)` | Pause specific contract | Pauser |
| `pauseFunction(bytes4)` | Pause specific function | Pauser |

### AmanaToken.sol

ERC20 governance token with vesting and voting controls.

**Key Features:**
- Fixed maximum supply (1 billion tokens)
- Voting power with vesting schedule
- Governance-only utility (no interest)
- Custodian support for exchanges

**Constants:**
```solidity
uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
uint256 public constant MIN_VESTING_PERIOD = 90 days;
```

**Main Functions:**
| Function | Description |
|----------|-------------|
| `mint(address, uint256)` | Mint new tokens (DAO only) |
| `burn(uint256)` | Burn tokens from caller |
| `setVesting(address, uint256)` | Set vesting end time |
| `hasVotingPower(address)` | Check if voting is available |
| `delegate(address)` | Delegate voting power |

### HalalActivityIndex.sol

Sharia compliance scoring and tracking system (HAI).

**Score Components:**
- Compliance (40%)
- Asset Backing (25%)
- Economic Value (20%)
- Validator Participation (15%)

**Main Functions:**
| Function | Description |
|----------|-------------|
| `trackActivity(...)` | Record activity for HAI calculation |
| `calculateScore()` | Compute current HAI score |
| `createSnapshot()` | Save current metrics snapshot |
| `getHAIPercentage()` | Get score as percentage (0-100) |
| `updateWeights(...)` | Update scoring weights |

### ActivityValidator.sol

Validates economic activities for Sharia compliance.

**Validation Criteria:**
```solidity
bool isShariaCompliant;      // No prohibited activities
bool isAssetBacked;          // Real asset backing
bool hasRealEconomicValue;   // Genuine economic contribution
```

**Main Functions:**
| Function | Description | Access |
|----------|-------------|--------|
| `submitActivity(...)` | Submit activity for validation | Public |
| `validateActivity(...)` | Validate activity | Validators |
| `meetsShariaCompliance(bytes32)` | Check compliance | View |

### CapitalPool.sol

Manages capital pooling for specific economic purposes.

**Struct:**
```solidity
struct Pool {
    bytes32 poolId;           // Unique identifier
    string purpose;           // Economic purpose
    uint256 targetCapital;    // Funding goal
    uint256 currentCapital;   // Current raised
    uint256 participantCount; // Number of contributors
    bool isActive;            // Active status
    uint256 createdAt;        // Creation time
}
```

**Main Functions:**
| Function | Description |
|----------|-------------|
| `createPool(bytes32, string, uint256)` | Create new pool |
| `contributeToPool(bytes32)` | Contribute capital |

### RiskSharing.sol

Implements Sharia-compliant risk sharing (Musharakah).

**Struct:**
```solidity
struct RiskPool {
    bytes32 poolId;           // Unique identifier
    uint256 totalCapital;     // Total pool capital
    uint256 totalProfit;      // Accumulated profit
    uint256 totalLoss;        // Accumulated loss
    uint256 participantCount; // Number of participants
    bool isActive;            // Pool status
}
```

**Main Functions:**
| Function | Description |
|----------|-------------|
| `createRiskPool(bytes32)` | Create new risk pool |
| `shareProfit(bytes32, uint256)` | Distribute profit proportionally |
| `shareLoss(bytes32, uint256)` | Distribute loss proportionally |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   EIP-8004 Agent Layer                    │
│  • AgentIdentityRegistry  • AgentReputationRegistry        │
│  • AgentValidationRegistry  • Cross-org portability       │
└────────────────────────────┬────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│AmanaReserve│       │  AmanaDAO   │       │CircuitBreaker│
│             │       │             │       │             │
│ • Core logic │       │• Governance│       │• Emergency  │
│• Participants│       │• Sharia    │       │• Controls   │
└──────┬──────┘       └──────┬──────┘       └──────┬──────┘
       │                     │                     │
       └─────────────┬───────┴─────────────┘
                     ▼
       ┌─────────────────────────┐
       │   HalalActivityIndex    │
       │  • HAI scoring           │
       │  • Compliance tracking  │
       │  • Snapshots             │
       └───────────┬─────────────┘
                   │
     ┌─────────────┴─────────────┐
     ▼                           ▼
┌─────────────┐         ┌─────────────┐
│Activity    │         │CapitalPool  │
│Validator   │         │RiskSharing  │
└─────────────┘         └─────────────┘
```

## Setup

### Prerequisites

- Foundry (`forge` and `cast`)
- Node.js 18+ (for deployment scripts)
- An Ethereum RPC endpoint

### Installation

```bash
# From repository root
cd packages/ethereum

# Install Foundry dependencies
forge install

# Install Node dependencies (for scripts)
npm install
```

## Compilation

```bash
# Compile all contracts
forge build

# Compile with verbose output
forge build -v

# Compile specific contract
forge build --contracts-path src contracts/AmanaReserve.sol:AmanaReserve
```

## Testing

```bash
# Run all tests
forge test

# Run tests with gas reporting
forge test --gas-report

# Run specific contract tests
forge test --match-path test/AmanaReserve.t.sol

# Run with detailed output
forge test -vvv

# Generate coverage report
forge coverage
```

### Test Structure

```
test/
├── AmanaReserve.t.sol       # Main reserve tests
├── AmanaDAO.t.sol           # Governance tests
├── CircuitBreaker.t.sol     # Emergency controls tests
├── AmanaToken.t.sol         # Token tests
├── HalalActivityIndex.t.sol # HAI tests
├── AgentIdentityRegistry.t.sol    # EIP-8004 agent tests
├── AgentReputationRegistry.t.sol  # Reputation system tests
├── AgentValidationRegistry.t.sol  # Validation tests
└── Integration.t.sol        # Cross-contract tests
```

## Deployment

### Local Deployment

```bash
# Start local Anvil node (in separate terminal)
anvil

# Deploy to local network
forge script script/Deploy.s.sol --broadcast --rpc-url http://localhost:8545
```

### Testnet Deployment

```bash
# Set deployment private key
export PRIVATE_KEY=your_private_key

# Deploy to Sepolia testnet
forge script script/Deploy.s.sol \
  --broadcast \
  --rpc-url https://sepolia.infura.io/v3/YOUR_KEY \
  --verify

# Deploy with specific verifier
forge script script/Deploy.s.sol \
  --broadcast \
  --rpc-url https://sepolia.infura.io/v3/YOUR_KEY \
  --verify \
  --etherscan-api-key YOUR_KEY
```

### Mainnet Deployment

```bash
# DANGER: Only use with thorough testing and audits
forge script script/Deploy.s.sol \
  --broadcast \
  --rpc-url https://mainnet.infura.io/v3/YOUR_KEY \
  --verify \
  --etherscan-api-key YOUR_KEY \
  --delay 15
```

## Deployment Script

The deployment script (`script/Deploy.s.sol`) deploys all contracts in this order:

1. **AmanaToken** - Governance token
2. **AgentIdentityRegistry** - EIP-8004 agent identities
3. **AgentReputationRegistry** - Agent reputation system
4. **AgentValidationRegistry** - Agent validation system
5. **AmanaReserve** - Main reserve
6. **ActivityValidator** - Compliance validator
7. **HalalActivityIndex** - HAI tracker
8. **CapitalPool** - Pool manager
9. **RiskSharing** - Risk manager
10. **CircuitBreaker** - Emergency controls
11. **AmanaDAO** - Governance (last, depends on others)

## Contract Addresses

After deployment, record contract addresses:

```bash
# From deployment output
AmanaToken:       0x...
AgentIdentityRegistry:      0x...
AgentReputationRegistry:    0x...
AgentValidationRegistry:   0x...
AmanaReserve:     0x...
ActivityValidator: 0x...
HalalActivityIndex: 0x...
CapitalPool:      0x...
RiskSharing:      0x...
CircuitBreaker:   0x...
AmanaDAO:         0x...
```

## Contract Interaction

### Using Cast

```bash
# Join reserve (requires ETH)
cast send \
  $RESERVE_ADDRESS \
  "joinReserve()" \
  --value 0.1ether \
  --private-key $PRIVATE_KEY

# Register EIP-8004 agent
cast send \
  $IDENTITY_REGISTRY_ADDRESS \
  "registerAgent(string,bool,bytes)" \
  "ipfs://Qm..." true 0x... \
  --private-key $PRIVATE_KEY

# Submit agent feedback
cast send \
  $REPUTATION_REGISTRY_ADDRESS \
  "submitFeedback(uint256,uint8,uint256,bytes32)" \
  123 5 100000000000000000 "reliability" \
  --private-key $PRIVATE_KEY

# Request validation
cast send \
  $VALIDATION_REGISTRY_ADDRESS \
  "requestValidation(uint256,string,uint256,bytes32)" \
  456 "ipfs://Qm..." 100000000000000000 "capital-deployment" \
  --private-key $PRIVATE_KEY

# Propose activity
cast send \
  $RESERVE_ADDRESS \
  "proposeActivity(bytes32,uint256)" \
  0x$(echo -n "activity-1" | xxd -p -c 32) \
  1000000000000000000 \
  --private-key $PRIVATE_KEY

# Check reserve stats
cast call \
  $RESERVE_ADDRESS \
  "getReserveStats()(uint256,uint256,uint256,uint256)"
```

### Using SDK

```typescript
import { AmanaSDK, AgentManager } from '@amana/sdk';

const amana = new AmanaSDK({
  chain: 'ethereum',
  ethereum: {
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY',
    privateKey: process.env.PRIVATE_KEY,
    addresses: {
      reserve: '0x...',
      dao: '0x...',
      token: '0x...',
      agentIdentityRegistry: '0x...',
      agentReputationRegistry: '0x...',
      agentValidationRegistry: '0x...'
    }
  }
});

// Register EIP-8004 agent
const agent = new AgentManager(amana.ethereum);
const tokenId = await agent.registerAgent({
  uri: 'ipfs://Qm...',
  shariaCompliant: true,
  capabilities: ['capital-deployment', 'hai-calculation']
});

// Join reserve
await amana.ethereum.joinReserve({ amount: '1.0' });

// Deploy capital
await amana.ethereum.proposeActivity(activityId, '0.5');
```

## EIP-8004 Agent Operations

### Registering an Agent

```typescript
// Register Sharia-compliant agent
const registration = await agentManager.registerAgent({
  uri: 'ipfs://QmXxx...',
  shariaCompliant: true,
  capabilities: ['capital-deployment', 'risk-assessment'],
  endpoints: [
    { id: 'api', type: 'http', url: 'https://api.example.com' }
  ]
});
```

### Submitting Work for Validation

```typescript
// Submit work for independent validation
await agentManager.submitWork({
  agentId: registration.tokenId,
  workId: 'work-123',
  workUri: 'ipfs://QmYyy...',
  validationAmount: '0.1' // ETH stake for validation
});
```

### Managing Reputation

```typescript
// Provide feedback on agent
await agentManager.submitFeedback({
  agentId: registration.tokenId,
  feedback: {
    score: 5, // 1-5 rating
    comment: 'Excellent Sharia-compliant execution',
    tag: 'reliability'
  }
});

// Get agent reputation
const reputation = await agentManager.getAgentReputation(registration.tokenId);
console.log('Reputation Score:', reputation.score);
console.log('Feedback Count:', reputation.feedbackCount);
```

## Verification

```bash
# Verify on Etherscan
forge verify-contract \
  $CONTRACT_ADDRESS \
  src/AmanaReserve.sol:AmanaReserve \
  --constructor-args $(cast abi-encode "constructor(uint256)" 100000000000000000) \
  --chain-id 1 \
  --etherscan-api-key $ETHERSCAN_KEY
```

## Gas Costs

Estimated gas costs for main operations:

| Operation | Gas Limit | Est. Cost (at 20 gwei) |
|-----------|-----------|------------------------|
| Register agent | ~150,000 | ~0.003 ETH |
| Submit feedback | ~80,000 | ~0.0016 ETH |
| joinReserve | ~150,000 | ~0.003 ETH |
| proposeActivity | ~80,000 | ~0.0016 ETH |
| approveActivity | ~60,000 | ~0.0012 ETH |
| completeActivity (profit) | ~180,000 | ~0.0036 ETH |
| distributeProfit (per participant) | ~25,000 | ~0.0005 ETH |
| withdrawCapital | ~70,000 | ~0.0014 ETH |

## Security Considerations

- All contracts use OpenZeppelin's AccessControl for role management
- EIP-8004 agent contracts follow ERC-721 and EIP-7007 standards
- Circuit breaker can pause any function in emergencies
- Sharia Board has veto power over governance decisions
- Reentrancy guards on all external calls
- Overflow/underflow protection (Solidity 0.8+)

## Sharia Compliance

These contracts implement:

1. **No Riba (Interest)** - Only profit/loss sharing from real activities
2. **Asset-Backed** - Capital tied to validated economic activities
3. **Mudarabah** - Profit sharing proportional to capital
4. **Musharakah** - Loss sharing proportional to capital
5. **Transparency** - All events emitted onchain
6. **Agent Compliance** - EIP-8004 agents must be Sharia-compliant

## Development

### Code Style

```bash
# Format contracts
forge fmt

# Check formatting
forge fmt --check

# Lint with Solhint
npx solhint 'src/**/*.sol'
```

### Slither Analysis

```bash
# Run Slither static analyzer
slither . --detect reentrancy-eth
slither . --detect unused-return
```

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

Apache 2.0
