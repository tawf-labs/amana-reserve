# AMANA Reserve

![Status](https://img.shields.io/badge/status-beta-orange)
![License](https://img.shields.io/badge/license-Apache 2.0-blue)
![Solidity](https://img.shields.io/badge/solidity-%5E0.8.26-blue)
![Rust](https://img.shields.io/badge/rust-1.70%2B-orange)
![TypeScript](https://img.shields.io/badge/typescript-5.3%2B-blue)
![EIP-8004](https://img.shields.io/badge/EIP--8004-integrated-green)
![MagicBlock](https://img.shields.io/badge/MagicBlock-ER-purple)

## Overview

AMANA is a **Sharia-native macro reserve system** that enables autonomous agents to coordinate capital through real economic activity, shared risk, and onchain trust—without interest, speculation, or human control.

The system is built as a comprehensive **multi-chain platform** supporting both **Ethereum** and **Solana**, featuring:

- **Real-time Operations** via MagicBlock Ephemeral Rollups (ER) for sub-second finality
- **Trustless Agent Infrastructure** compliant with EIP-8004 standards
- **Unified SDK** with cross-chain agent coordination
- **Governance infrastructure** (AmanaDAO) with Sharia Board oversight
- **Compliance tracking** (HAI Index) with real-time VRF-powered updates
- **Emergency controls** and zero-knowledge privacy features

## Cutting-Edge Technologies

### 🚀 MagicBlock Ephemeral Rollups (Solana)
- **Zero-fee micro-transactions** for high-frequency capital deployment
- **Sub-second finality** with instant state synchronization
- **Auto-commit** of critical state changes to base layer
- **VRF integration** for verifiable randomness in compliance sampling
- **Magic Actions** for automated Sharia compliance checking

### 🤖 EIP-8004 Trustless Agent Infrastructure (Ethereum)
- **Decentralized agent discovery** and registration via ERC-721 tokens
- **Portable agent identities** across organizations
- **Reputation-based trust** mechanisms with on-chain feedback
- **Independent validation** of agent work with staking
- **Sharia-compliant agent** workflows and verification

## Multi-Chain Architecture

AMANA operates across multiple blockchain networks to maximize accessibility and efficiency:

- **Ethereum**: EIP-8004 agent infrastructure, governance, high-value transactions
- **Solana**: High-throughput operations, MagicBlock ER for real-time execution
- **Cross-Chain Bridge**: Seamless asset and data synchronization between chains
- **Unified SDK**: Single interface for all chains and agent operations

## Monorepo Structure

This repository is organized as a monorepo with 7 specialized packages:

```
amana-reserve/
├── packages/
│   ├── ethereum/          # Ethereum smart contracts & deployment
│   ├── solana/           # Solana programs & deployment
│   ├── sdk/              # Unified TypeScript SDK
│   ├── backend/          # API server & indexing
│   ├── frontend/         # Web interface & dashboard
│   ├── zk/               # Zero-knowledge circuits & proofs
│   └── cross-chain/      # Bridge contracts & relayers
├── docs/                 # Documentation
├── scripts/              # Deployment & utility scripts
└── package.json          # Root package configuration
```

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              Autonomous Agents (EIP-8004 Compliant)             │
│  • AgentIdentityRegistry  • AgentReputationRegistry            │
│  • AgentValidationRegistry  • Cross-chain coordination          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Unified SDK (Agent Manager)                   │
│  • Multi-chain abstraction  • Agent lifecycle management       │
│  • Wallet integration      • Real-time ER operations          │
└─────────────┬─────────────────────────────┬─────────────────────┘
              │                             │
              ▼                             ▼
┌─────────────────────────┐       ┌─────────────────────────┐
│      Ethereum Layer     │◄─────►│      Solana Layer       │
│  (EIP-8004 Base Layer)  │       │  (MagicBlock ER)        │
│                         │       │                         │
│  • AgentIdentityRegistry│       │  • amana_reserve.rs     │
│  • AgentReputationRegistry│       │  • delegate_reserve()  │
│  • AgentValidationRegistry│       │  • deploy_capital_*()  │
│  • AmanaReserve.sol     │       │  • amana_dao.rs         │
│  • AmanaDAO.sol         │       │  • amana_hai.rs         │
│  • CircuitBreaker.sol   │       │  • VRF integration      │
│  • AmanaToken.sol       │       │                         │
│  • HalalActivityIndex   │       │                         │
└─────────────┬───────────┘       └─────────────┬───────────┘
              │                                 │
              └─────────────┬───────────────────┘
                            ▼
              ┌─────────────────────────┐
              │    Cross-Chain Bridge   │
              │  • Wormhole support     │
              │  • LayerZero support    │
              │  • HAI synchronization  │
              │  • Agent state sync     │
              └─────────────┬───────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend Services                             │
│  • API Gateway          • HAI Aggregator                        │
│  • Agent Indexer       • WebSocket Service                      │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Zero-Knowledge Layer                           │
│  • Privacy-preserving proofs  • Compliance verification        │
│  • Activity validation       • Identity management             │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend Dashboard                           │
│  • Real-time metrics  • Agent monitoring  • Governance UI      │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack Highlights

### Real-Time Operations (MagicBlock ER)
```
Solana Base Layer          MagicBlock ER
     │                         │
     │ 1. Delegate PDA         │ Zero-fee execution
     ├────────────────────────>│ Sub-second finality
     │                         │
     │ 2. Execute Operations   │ VRF for randomness
     │<────────────────────────┤
     │                         │
     │ 3. Commit State         │ Auto-sync to base
     │<────────────────────────┘
```

### Agent Infrastructure (EIP-8004)
```
                    ┌──────────────────┐
                    │ Agent Discovery  │
                    │  (ERC-721 NFTs)  │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Reputation   │   │   Feedback    │   │  Validation   │
│  Registry     │   │   System      │   │   System      │
│  (On-chain)   │   │  (Staking)    │   │  (Multi-validators)
└───────────────┘   └───────────────┘   └───────────────┘
```

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

## Key Features

### 1. Trustless Agent Infrastructure (EIP-8004)
- **Agent Identity Registry**: ERC-721 based agent registration with portable identities
- **Reputation Registry**: On-chain feedback system with stake-weighted scoring
- **Validation Registry**: Independent work verification by multiple validators
- **Sharia-Compliant Agents**: Built-in compliance verification for all agent operations
- **Cross-Organization Portability**: Agents can work across multiple organizations

### 2. Real-Time Operations (MagicBlock ER)
- **Zero-Fee Micro-Transactions**: High-frequency capital deployment without gas costs
- **Sub-Second Finality**: Instant transaction confirmation on Ephemeral Rollups
- **VRF Integration**: Verifiable randomness for fair compliance sampling
- **Auto-Commit**: Critical state changes automatically sync to Solana base layer
- **Magic Actions**: Automated Sharia compliance checking during execution

### 3. Governance (AmanaDAO)
- **Decentralized Decision Making**: Community-driven governance for protocol upgrades
- **Sharia Board Integration**: Islamic finance scholars with veto power over non-compliant proposals
- **Proposal System**: Submit and vote on system improvements
- **Treasury Management**: Transparent fund allocation and management

### 4. HAI Index (Halal Activity Index)
- **Real-time Compliance Scoring**: Dynamic assessment of economic activities (0-100%)
- **VRF-Powered Updates**: Verifiable randomness for data source sampling
- **Market Intelligence**: Aggregate data on halal investment opportunities
- **Risk Assessment**: Automated evaluation of activity compliance levels
- **ER Integration**: Sub-second score updates via MagicBlock

### 5. Circuit Breaker System
- **Emergency Pause**: Automatic system halt during anomalous conditions
- **Granular Controls**: Pause specific contracts or functions
- **Role-based Access**: Admin, Pauser, and Sharia Board roles
- **Recovery Mechanisms**: Structured restart procedures after incidents

### 6. Token Ecosystem
- **AMANA Token**: Governance and utility token for the ecosystem
- **Voting Power**: Participate in protocol governance decisions
- **Vesting System**: Time-locked rewards to prevent speculation
- **No Interest**: Purely governance-focused, no yield-bearing mechanisms

### 7. Zero-Knowledge Privacy
- **Private Transactions**: Confidential capital movements and activities
- **Compliance Proofs**: Verify Sharia compliance without revealing details
- **Identity Protection**: Anonymous participation while maintaining accountability
- **Selective Disclosure**: Choose what information to share publicly

### 8. Cross-Chain Operations
- **Asset Bridging**: Move capital between Ethereum and Solana seamlessly
- **Agent State Sync**: Maintain consistent agent state across all chains
- **Unified Liquidity**: Access combined liquidity pools from both networks
- **Chain-Agnostic Interface**: Single SDK for all blockchain interactions

## Installation

### Prerequisites
- Node.js 18+ and pnpm
- Foundry (for Ethereum contracts)
- Rust and Anchor (for Solana programs)
- Git

### Setup
```bash
# Clone the repository
git clone https://github.com/tawf-labs/amana-reserve
cd amana-reserve

# Install pnpm if not already installed
npm install -g pnpm

# Install all dependencies
pnpm install

# Build all packages
pnpm build
```

## Quick Start

### Ethereum Package
```bash
# Navigate to Ethereum package
cd packages/ethereum

# Install Foundry dependencies
forge install

# Compile contracts
forge build

# Run tests
forge test

# Deploy to local network
pnpm deploy:local
```

### Solana Package
```bash
# Navigate to Solana package
cd packages/solana

# Build programs
anchor build

# Run tests
anchor test

# Deploy to devnet
pnpm deploy:devnet
```

### SDK Package
```bash
# Navigate to SDK package
cd packages/sdk

# Build TypeScript SDK
pnpm build

# Run tests
pnpm test

# Generate documentation
pnpm docs
```

### Backend Package
```bash
# Navigate to backend package
cd packages/backend

# Start development server
pnpm dev

# Run database migrations
pnpm migrate

# Start indexing services
pnpm index
```

### Frontend Package
```bash
# Navigate to frontend package
cd packages/frontend

# Start development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

### ZK Package
```bash
# Navigate to ZK package
cd packages/zk

# Compile circuits
pnpm compile

# Generate proofs
pnpm prove

# Verify proofs
pnpm verify
```

### Cross-Chain Package
```bash
# Navigate to cross-chain package
cd packages/cross-chain

# Deploy bridge contracts
pnpm deploy:bridge

# Start relayer services
pnpm start:relayer

# Monitor bridge health
pnpm monitor
```

## Usage Examples

### Using the Agent Manager (EIP-8004 + MagicBlock)

```typescript
import { AgentManager } from '@amana/sdk';

// Initialize with both chains and MagicBlock
const agentManager = new AgentManager({
  ethereumProvider,
  solanaConnection,
  magicBlockRouterUrl: 'https://devnet-router.magicblock.app',
  contractAddresses: {
    agentIdentityRegistry: '0x...',
    agentReputationRegistry: '0x...',
    agentValidationRegistry: '0x...'
  }
});

// Register Sharia-compliant agent
const registration = await agentManager.registerAgent({
  uri: 'https://example.com/agent.json',
  shariaCompliant: true,
  capabilities: ['capital-deployment', 'hai-calculation'],
  endpoints: [
    { id: 'halal-investments', type: 'http', url: 'https://...' }
  ]
});
```

### Real-Time Operations (MagicBlock ER)

```typescript
// Deploy capital in real-time on Ephemeral Rollup
const result = await agentManager.executeAgentOperation(
  registration.ethereumAgentId,
  {
    type: 'deploy_capital',
    requiresRealTime: true,
    data: {
      activityId: 'halal-agriculture-001',
      amount: 1000000
    }
  }
);

// Sub-second finality with zero gas fees
console.log('Deployed:', result.txSignature);
```

### EIP-8004 Agent Reputation System

```typescript
// Submit agent work for validation
await agentManager.submitWork({
  agentId: registration.ethereumAgentId,
  workId: 'work-123',
  workUri: 'ipfs://Qm...',
  validationAmount: '0.1' // ETH stake for validation
});

// Provide feedback on agent
await agentManager.submitFeedback({
  agentId: registration.ethereumAgentId,
  feedback: {
    score: 5, // 1-5 rating
    comment: 'Excellent Sharia-compliant execution',
    tag: 'reliability'
  }
});

// Get agent reputation
const reputation = await agentManager.getAgentReputation(
  registration.ethereumAgentId
);
console.log('Reputation Score:', reputation.score);
```

### Using the Unified SDK

```typescript
import { AmanaSDK } from '@amana/sdk';

// Initialize SDK with multi-chain support
const amana = new AmanaSDK({
  chain: 'ethereum',
  ethereum: {
    rpcUrl: 'https://mainnet.infura.io/v3/...',
    contracts: {
      amanaReserve: '0x...',
      halalActivityIndex: '0x...'
    }
  }
});

// Connect wallet
await amana.ethereum.connect(window.ethereum);

// Join reserve on Ethereum
await amana.ethereum.joinReserve('1.0'); // 1 ETH

// Create activity
const activityId = generateActivityId();
await amana.ethereum.proposeActivity(activityId, '0.5');
```

### Cross-Chain Operations

```typescript
// Bridge assets between chains
import { BridgeManager } from '@amana/cross-chain';

const bridge = new BridgeManager(config);

// Transfer from Ethereum to Solana
await bridge.transfer({
  from: 'ethereum',
  to: 'solana',
  amount: '1000000000000000000',
  asset: 'AMANA',
  recipient: 'SolanaAddress...'
});

// Sync HAI across chains
await bridge.syncHAI({ score: 8500, timestamp: Date.now() });
```

### Governance Participation

```typescript
// Create governance proposal
await amana.governance.createProposal({
  title: 'Increase minimum capital threshold',
  description: 'Proposal to increase minimum participation to 2 ETH',
  actions: [
    {
      target: 'AmanaReserve',
      method: 'setMinimumCapital',
      params: ['2000000000000000000'] // 2 ETH in wei
    }
  ]
});

// Vote on proposal
await amana.governance.vote({
  proposalId: 'prop-123',
  support: true,
  reason: 'This will improve system stability'
});
```

### HAI Index Integration with VRF

```typescript
// Get current HAI score for an activity
const haiScore = await amana.hai.getActivityScore('agriculture-pool');

// Subscribe to real-time HAI updates (via MagicBlock ER)
amana.hai.onScoreUpdate((update) => {
  console.log(`HAI score updated: ${update.score} for ${update.activityId}`);
});

// Update HAI with VRF-powered data source sampling
await amana.hai.updateWithVRF({
  activityId: 'agriculture-001',
  dataSourceCount: 10
});

// Get market insights
const insights = await amana.hai.getMarketInsights({
  sector: 'technology',
  timeframe: '30d'
});
```

## Testing

Run tests across all packages:
```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm test --filter=@amana/ethereum

# Run integration tests
pnpm test:integration

# Generate coverage report
pnpm test:coverage
```

## Deployment

### Development Environment
```bash
# Start local blockchain networks
pnpm dev:chains

# Deploy all contracts
pnpm deploy:dev

# Start all services
pnpm dev
```

### Production Deployment
```bash
# Deploy to mainnet (requires environment setup)
pnpm deploy:mainnet

# Verify contracts
pnpm verify:mainnet

# Start production services
pnpm start:prod
```

## Documentation

- [Ethereum Contracts](./packages/ethereum/README.md) - Smart contract documentation
- [Solana Programs](./packages/solana/README.md) - Solana program documentation
- [SDK Reference](./SDK.md) - Complete TypeScript SDK documentation
- [API Documentation](./API.md) - Complete API reference (Ethereum & Solana)
- [Examples](./EXAMPLES.md) - Practical usage examples
- [Sharia Compliance](./SHARIA_COMPLIANCE.md) - Islamic finance compliance guide
- [Architecture](./ARCHITECTURE.md) - System architecture and design
- [Contributing](./CONTRIBUTING.md) - Development and contribution guidelines
- [Deployment](./DEPLOYMENT.md) - Deployment guides for all components
- [MagicBlock + EIP-8004 Integration](./MAGICBLOCK_EIP8004_INTEGRATION.md) - Real-time operations and agent infrastructure

## Package Documentation

- [Backend Services](./packages/backend/README.md) - API server and indexing
- [Frontend Application](./packages/frontend/README.md) - Web interface
- [SDK Package](./packages/sdk/README.md) - TypeScript SDK details
- [ZK Privacy Layer](./packages/zk/README.md) - Zero-knowledge implementation
- [Cross-Chain Bridge](./packages/cross-chain/README.md) - Bridge architecture

## Sharia Compliance Verification

The system ensures Sharia compliance through multiple layers:

1. **No Interest (Riba)**: All returns come from profit/loss sharing of real economic activities
2. **Asset-Backed Capital**: Capital must be deployed to validated economic activities
3. **Prohibited Activity Screening**: Automatic rejection of non-compliant activities
4. **Risk Sharing**: Participants share both profits and losses proportionally
5. **Transparent Operations**: All activities and distributions are onchain and verifiable
6. **Scholar Oversight**: AmanaDAO includes Islamic finance scholars for guidance

## Security Considerations

- All contracts undergo professional security audits before mainnet deployment
- Multi-signature controls for critical system functions
- Circuit breaker mechanisms for emergency situations
- Regular security assessments and penetration testing
- Bug bounty program for community-driven security research

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

### Development Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and test
pnpm test

# Submit pull request
git push origin feature/new-feature
```

## License

Apache 2.0

## Community & Support

- **Discord**: [Join our community](https://discord.gg/amana-reserve)
- **Twitter**: [@AmanaReserve](https://twitter.com/AmanaReserve)
- **Documentation**: [docs.amana.finance](https://docs.amana.finance)
- **GitHub Issues**: [Report bugs or request features](https://github.com/tawf-labs/amana-reserve/issues)

---

**Note**: This system implements core Sharia finance principles in smart contract form. While technically compliant, users should consult with Islamic finance scholars for specific use cases and implementation details. The system is designed for autonomous agent coordination and may require additional considerations for human participants.
