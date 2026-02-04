# AMANA Reserve

## Overview

AMANA is a **Sharia-native macro reserve system** that enables autonomous agents to coordinate capital through real economic activity, shared risk, and onchain trust—without interest, speculation, or human control.

## Core Principles

### Sharia Compliance
- **No Interest (Riba)**: The system operates on profit/loss sharing rather than interest-based returns
- **Asset-Backed**: All capital is tied to real economic activities and tangible assets
- **Risk Sharing (Mudarabah/Musharakah)**: Profits and losses are shared among participants
- **Prohibited Activities**: Excludes alcohol, gambling, interest-lending, speculation, weapons, and tobacco
- **Real Economic Value**: Only validates activities with genuine economic substance

### Autonomous Operation
- Designed for autonomous agent coordination
- Onchain trust mechanisms
- Minimal human intervention required
- Transparent and verifiable operations

## Smart Contracts

### AmanaReserve.sol
The main contract managing the reserve system with:
- Participant management (join, exit, capital deposit/withdrawal)
- Economic activity lifecycle (propose, approve, complete)
- Sharia-compliant profit/loss distribution
- Capital coordination without interest

### CapitalPool.sol
Manages capital pooling for specific economic purposes:
- Create pools for different economic activities
- Coordinate capital contributions from multiple agents
- Automatic pool activation when target capital is reached
- Share-based participation tracking

### RiskSharing.sol
Implements Sharia-compliant risk distribution:
- Create risk pools for shared exposure
- Proportional profit sharing based on capital contribution
- Proportional loss sharing based on capital stake
- No interest-based mechanisms

### ActivityValidator.sol
Validates economic activities for Sharia compliance:
- Submit activities for validation
- Verify asset-backing and real economic value
- Ensure compliance with Islamic finance principles
- Block prohibited activity types

## Architecture

```
┌─────────────────────────────────────────────┐
│         Autonomous Agents                    │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│          AmanaReserve (Main)                 │
│  • Participant Management                    │
│  • Activity Coordination                     │
│  • Profit/Loss Distribution                  │
└────────┬──────────────────────┬──────────────┘
         │                      │
         ▼                      ▼
┌──────────────────┐   ┌──────────────────┐
│  CapitalPool     │   │  RiskSharing     │
│  • Pool Creation │   │  • Risk Pools    │
│  • Contributions │   │  • P/L Sharing   │
└──────────────────┘   └──────────────────┘
         │                      │
         └──────────┬───────────┘
                    ▼
         ┌──────────────────────┐
         │  ActivityValidator   │
         │  • Sharia Validation │
         │  • Asset Verification│
         └──────────────────────┘
```

## Key Features

### 1. Capital Coordination
- Minimum capital contribution threshold
- Transparent capital tracking
- Flexible deposit and withdrawal
- Multi-agent participation

### 2. Economic Activity Management
- Propose activities with capital requirements
- Autonomous approval mechanisms
- Track activity lifecycle (proposed → approved → active → completed)
- Record outcomes (profit/loss)

### 3. Sharia-Compliant Distribution
- **Profit Sharing**: Distributed proportionally among participants
- **Loss Sharing**: Shared based on capital contribution
- **No Interest**: All returns from actual economic activity
- **Asset-Backed**: Capital deployed to real economic activities

### 4. Autonomous Agent Integration
- Designed for programmatic interaction
- Event-driven architecture
- Transparent onchain state
- No human gatekeepers

## Installation

### Prerequisites
- Foundry (for Solidity development)
- Git

### Setup
```bash
# Clone the repository
git clone https://github.com/tawf-labs/amana-reserve
cd amana-reserve

# Install Foundry (if not already installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install dependencies
forge install
```

## Building

```bash
# Compile contracts
forge build

# Run tests
forge test

# Run tests with verbosity
forge test -vvv

# Generate gas report
forge test --gas-report

# Check code coverage
forge coverage
```

## Testing

The project includes comprehensive test suites:

- `AmanaReserve.t.sol`: Tests for main reserve functionality
- `CapitalPool.t.sol`: Tests for capital pooling
- `ActivityValidator.t.sol`: Tests for activity validation

Run specific test:
```bash
forge test --match-contract AmanaReserveTest
```

## Usage Example

### Joining the Reserve
```solidity
// Agent joins with capital contribution
amanaReserve.joinReserve{value: 1 ether}();
```

### Proposing an Economic Activity
```solidity
// Propose a trading activity requiring 0.5 ETH
bytes32 activityId = keccak256("halal-trade-1");
amanaReserve.proposeActivity(activityId, 0.5 ether);
```

### Completing an Activity
```solidity
// Complete activity with profit
amanaReserve.completeActivity(activityId, 0.2 ether); // 0.2 ETH profit

// Complete activity with loss
amanaReserve.completeActivity(activityId, -0.1 ether); // 0.1 ETH loss
```

### Creating a Capital Pool
```solidity
bytes32 poolId = keccak256("agriculture-pool");
capitalPool.createPool(poolId, "Halal agriculture", 10 ether);
capitalPool.contributeToPool{value: 5 ether}(poolId);
```

### Validating Activities
```solidity
// Submit activity for validation
validator.submitActivity(activityId, "Halal food trade", "trade", 5 ether);

// Validate activity
validator.validateActivity(
    activityId,
    true,  // isValid
    true,  // isShariaShariaCompliant
    true,  // isAssetBacked
    true,  // hasRealEconomicValue
    "Verified halal food trading activity"
);
```

## Sharia Compliance Verification

The system ensures Sharia compliance through:

1. **No Interest (Riba)**: All returns come from profit/loss sharing of real economic activities
2. **Asset-Backed Capital**: Capital must be deployed to validated economic activities
3. **Prohibited Activity Screening**: Automatic rejection of non-compliant activities
4. **Risk Sharing**: Participants share both profits and losses proportionally
5. **Transparent Operations**: All activities and distributions are onchain and verifiable

Check compliance:
```solidity
bool isCompliant = amanaReserve.isShariaShariaCompliant(); // returns true
```

## Deployment

### Local Deployment
```bash
# Start local node
anvil

# Deploy contracts
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

### Testnet Deployment
```bash
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
```

## Security Considerations

- All contracts should undergo professional security audit before mainnet deployment
- Economic activity validation requires robust mechanisms in production
- Autonomous approval may need DAO or multi-sig implementation
- Consider implementing time-locks for large withdrawals
- Rate limiting for activity proposals

## License

MIT

## Contributing

Contributions are welcome! Please ensure:
1. All tests pass
2. Code follows existing style
3. New features include tests
4. Sharia compliance is maintained

## Contact

For questions or support, please open an issue on GitHub.

---

**Note**: This system implements core Sharia finance principles in smart contract form. While technically compliant, users should consult with Islamic finance scholars for specific use cases and implementation details.