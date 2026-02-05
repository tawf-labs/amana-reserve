# AMANA Ethereum Package

Ethereum smart contracts for the AMANA Sharia-native macro reserve system.

## Overview

This package contains the core Ethereum smart contracts that implement the AMANA reserve system with full Sharia compliance, including profit/loss sharing (Mudarabah/Musharakah), governance, risk management, and compliance tracking.

## Contracts

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
│                     AmanaReserve                            │
│  • Core reserve logic                                       │
│  • Participant management                                   │
│  • Activity lifecycle                                       │
│  • Profit/loss distribution                                 │
└──────────┬──────────────────────────────────┬───────────────┘
           │                                  │
           ▼                                  ▼
┌─────────────────────┐           ┌─────────────────────────┐
│     AmanaDAO        │           │    CircuitBreaker       │
│  • Governance       │           │  • Emergency controls   │
│  • Voting           │           │  • Pause mechanisms     │
│  • Sharia Board     │           │  • Granular pausing     │
└─────────────────────┘           └─────────────────────────┘
           │                                  │
           ▼                                  ▼
┌─────────────────────┐           ┌─────────────────────────┐
│    AmanaToken       │           │  HalalActivityIndex     │
│  • Governance token │           │  • HAI scoring          │
│  • Vesting          │           │  • Compliance tracking  │
│  • Voting           │           │  • Snapshots            │
└─────────────────────┘           └─────────────────────────┘
           │                                  │
           └────────────┬─────────────────────┘
                        ▼
           ┌─────────────────────────┐
           │   ActivityValidator     │
           │  • Sharia compliance    │
           │  • Asset verification   │
           │  • Economic value check │
           └───────────┬─────────────┘
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
┌─────────────────────┐   ┌─────────────────────┐
│    CapitalPool      │   │    RiskSharing      │
│  • Pool creation    │   │  • Profit sharing   │
│  • Contributions    │   │  • Loss sharing     │
└─────────────────────┘   └─────────────────────┘
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
2. **AmanaReserve** - Main reserve
3. **ActivityValidator** - Compliance validator
4. **HalalActivityIndex** - HAI tracker
5. **CapitalPool** - Pool manager
6. **RiskSharing** - Risk manager
7. **CircuitBreaker** - Emergency controls
8. **AmanaDAO** - Governance (last, depends on others)

## Contract Addresses

After deployment, record contract addresses:

```bash
# From deployment output
AmanaToken:       0x...
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
import { AmanaSDK } from '@amana/sdk';

const amana = new AmanaSDK({
  chain: 'ethereum',
  ethereum: {
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY',
    privateKey: process.env.PRIVATE_KEY,
    addresses: {
      reserve: '0x...',
      dao: '0x...',
      token: '0x...',
    }
  }
});

// Join reserve
await amana.ethereum.joinReserve({ amount: '1.0' });
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
| joinReserve | ~150,000 | ~0.003 ETH |
| proposeActivity | ~80,000 | ~0.0016 ETH |
| approveActivity | ~60,000 | ~0.0012 ETH |
| completeActivity (profit) | ~180,000 | ~0.0036 ETH |
| distributeProfit (per participant) | ~25,000 | ~0.0005 ETH |
| withdrawCapital | ~70,000 | ~0.0014 ETH |

## Security Considerations

- All contracts use OpenZeppelin's AccessControl for role management
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

MIT
