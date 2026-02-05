# AMANA Reserve

![Status](https://img.shields.io/badge/status-beta-orange)
![License](https://img.shields.io/badge/license-MIT-blue)
![Solidity](https://img.shields.io/badge/solidity-%5E0.8.26-blue)
![Rust](https://img.shields.io/badge/rust-1.70%2B-orange)
![TypeScript](https://img.shields.io/badge/typescript-5.3%2B-blue)

## Overview

AMANA is a **Sharia-native macro reserve system** that enables autonomous agents to coordinate capital through real economic activity, shared risk, and onchain trust—without interest, speculation, or human control.

The system is built as a comprehensive **multi-chain platform** supporting both **Ethereum** and **Solana**, with a unified TypeScript SDK, governance infrastructure (AmanaDAO), compliance tracking, emergency controls, and zero-knowledge privacy features—all designed to maintain strict adherence to Islamic finance principles.

## Multi-Chain Architecture

AMANA operates across multiple blockchain networks to maximize accessibility and efficiency:

- **Ethereum**: Primary governance and high-value transactions
- **Solana**: High-throughput operations and micro-transactions
- **Cross-Chain Bridge**: Seamless asset and data transfer between chains
- **Unified SDK**: Single interface for all chain interactions

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
│                    Autonomous Agents                            │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Unified SDK                                   │
│  • Multi-chain abstraction  • Event handling                   │
│  • Wallet integration      • Transaction batching              │
└─────────────┬─────────────────────────────┬─────────────────────┘
              │                             │
              ▼                             ▼
┌─────────────────────────┐       ┌─────────────────────────┐
│      Ethereum Layer     │◄─────►│      Solana Layer       │
│  • AmanaReserve.sol     │       │  • amana_reserve.rs     │
│  • AmanaDAO.sol         │       │  • amana_dao.rs         │
│  • CircuitBreaker.sol   │       │  • amana_hai.rs         │
│  • AmanaToken.sol       │       │                         │
│  • HalalActivityIndex   │       │                         │
│  • ActivityValidator    │       │                         │
│  • CapitalPool.sol      │       │                         │
│  • RiskSharing.sol      │       │                         │
└─────────────┬───────────┘       └─────────────┬───────────┘
              │                                 │
              └─────────────┬───────────────────┘
                            ▼
              ┌─────────────────────────┐
              │    Cross-Chain Bridge   │
              │  • Wormhole support     │
              │  • LayerZero support    │
              │  • HAI synchronization  │
              │  • Token bridging       │
              └─────────────┬───────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend Services                             │
│  • API Gateway          • HAI Aggregator                        │
│  • Trust Score Service • WebSocket Service                      │
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
│  • Real-time metrics  • Activity monitoring  • Governance UI   │
└─────────────────────────────────────────────────────────────────┘
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

### 1. Governance (AmanaDAO)
- **Decentralized Decision Making**: Community-driven governance for protocol upgrades
- **Sharia Board Integration**: Islamic finance scholars with veto power over non-compliant proposals
- **Proposal System**: Submit and vote on system improvements
- **Treasury Management**: Transparent fund allocation and management

### 2. HAI Index (Halal Activity Index)
- **Real-time Compliance Scoring**: Dynamic assessment of economic activities (0-100%)
- **Market Intelligence**: Aggregate data on halal investment opportunities
- **Risk Assessment**: Automated evaluation of activity compliance levels
- **Performance Tracking**: Historical analysis of Sharia-compliant returns

### 3. Circuit Breaker System
- **Emergency Pause**: Automatic system halt during anomalous conditions
- **Granular Controls**: Pause specific contracts or functions
- **Role-based Access**: Admin, Pauser, and Sharia Board roles
- **Recovery Mechanisms**: Structured restart procedures after incidents

### 4. Token Ecosystem
- **AMANA Token**: Governance and utility token for the ecosystem
- **Voting Power**: Participate in protocol governance decisions
- **Vesting System**: Time-locked rewards to prevent speculation
- **No Interest**: Purely governance-focused, no yield-bearing mechanisms

### 5. Zero-Knowledge Privacy
- **Private Transactions**: Confidential capital movements and activities
- **Compliance Proofs**: Verify Sharia compliance without revealing details
- **Identity Protection**: Anonymous participation while maintaining accountability
- **Selective Disclosure**: Choose what information to share publicly

### 6. Cross-Chain Operations
- **Asset Bridging**: Move capital between Ethereum and Solana seamlessly
- **State Synchronization**: Maintain consistent data across all chains
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

### HAI Index Integration
```typescript
// Get current HAI score for an activity
const haiScore = await amana.hai.getActivityScore('agriculture-pool');

// Subscribe to HAI updates
amana.hai.onScoreUpdate((update) => {
  console.log(`HAI score updated: ${update.score} for ${update.activityId}`);
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

MIT

## Community & Support

- **Discord**: [Join our community](https://discord.gg/amana-reserve)
- **Twitter**: [@AmanaReserve](https://twitter.com/AmanaReserve)
- **Documentation**: [docs.amana.finance](https://docs.amana.finance)
- **GitHub Issues**: [Report bugs or request features](https://github.com/tawf-labs/amana-reserve/issues)

---

**Note**: This system implements core Sharia finance principles in smart contract form. While technically compliant, users should consult with Islamic finance scholars for specific use cases and implementation details. The system is designed for autonomous agent coordination and may require additional considerations for human participants.
