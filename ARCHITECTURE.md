# AMANA System Architecture

Deep-dive into the architecture and design of the AMANA Sharia-native reserve system.

## Table of Contents
- [System Overview](#system-overview)
- [Multi-Chain Architecture](#multi-chain-architecture)
- [Contract Architecture](#contract-architecture)
- [Data Flow](#data-flow)
- [Security Architecture](#security-architecture)
- [Privacy Layer](#privacy-layer)
- [Cross-Chain Messaging](#cross-chain-messaging)
- [Scaling Considerations](#scaling-considerations)
- [Upgrade Patterns](#upgrade-patterns)

---

## System Overview

The AMANA system is designed as a multi-chain, Sharia-compliant reserve platform enabling autonomous agents to coordinate capital through real economic activity.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Application Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │   Frontend  │  │  Backend    │  │    SDK      │  │  Mobile  │ │
│  │  (Next.js)  │  │  (Express)  │  │  (TypeScript)│  │  (React) │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Unified Interface Layer                     │
│  • Chain abstraction  • Wallet connection  • Event handling        │
└─────────────────────────────────────────────────────────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        ▼                          ▼                          ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│   Ethereum Chain  │   │    Solana Chain   │   │  Future Chains    │
│                   │   │                   │   │                   │
│ • 8 Contracts     │   │ • 3 Programs      │   │ • Polygon         │
│ • EVM Compatible  │   │ • Sealevel        │   │ • Arbitrum        │
└─────────┬─────────┘   └─────────┬─────────┘   └─────────┬─────────┘
          │                         │                         │
          └────────────┬────────────┴────────────┬──────────┘
                       │                         │
                       ▼                         ▼
          ┌────────────────────────────────────────────┐
          │         Cross-Chain Bridge Layer          │
          │  • Wormhole    • LayerZero   • CCIP      │
          └────────────────────────────────────────────┘
                       │
                       ▼
          ┌────────────────────────────────────────────┐
          │       Zero-Knowledge Privacy Layer        │
          │  • Activity proofs  • Identity management  │
          └────────────────────────────────────────────┘
```

---

## Multi-Chain Architecture

### Chain Selection Strategy

| Chain | Use Case | Characteristics |
|-------|----------|----------------|
| Ethereum | Primary governance, high-value transactions | Security, decentralization |
| Solana | High-throughput operations, micro-transactions | Speed, low cost |
| Future | Scaling, specialized use cases | Based on ecosystem needs |

### Cross-Chain Consistency

```
┌────────────────────────────────────────────────────────────────┐
│                    State Synchronization                     │
│                                                                │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐    │
│  │   Ethereum   │◄─►│  Solana      │◄─►│  Future      │    │
│  │   State      │   │  State       │   │  State       │    │
│  └──────────────┘   └──────────────┘   └──────────────┘    │
│           │                  │                  │             │
│           └──────────────────┴──────────────────┘             │
│                              │                                │
│                              ▼                                │
│                   ┌──────────────────┐                        │
│                   │  Canonical State │                        │
│                   │  (Backend API)   │                        │
│                   └──────────────────┘                        │
└────────────────────────────────────────────────────────────────┘
```

### Bridge Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     Bridge Manager                              │
│  • Provider selection  • Fee comparison  • Status tracking     │
└──────┬───────────────────────────────┬────────────────────┬─────┘
       │                               │                    │
       ▼                               ▼                    ▼
┌──────────────────┐          ┌──────────────────┐  ┌──────────────┐
│    Wormhole      │          │    LayerZero     │  │     CCIP      │
│                  │          │                  │  │              │
│ • Guardian net   │          │ • Oracle relayers │  │ • Chainlink  │
│ • VAA messages   │          │ • ULN nodes      │  │ • DON        │
│ • Token bridge   │          │ • OApp contracts  │  │ • Lock/Release│
└──────────────────┘          └──────────────────┘  └──────────────┘
```

---

## Contract Architecture

### Ethereum Contracts

```
┌────────────────────────────────────────────────────────────────┐
│                    AmanaReserve (Core)                         │
│  • Participant management  • Activity lifecycle                │
│  • Profit/loss distribution  • Capital tracking               │
└───────────────────────────┬────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   AmanaDAO    │  │CircuitBreaker │  │  AmanaToken   │
│               │  │               │  │               │
│ • Governance  │  │ • Emergency   │  │ • Voting     │
│ • Sharia board│  │ • Pausing     │  │ • Vesting    │
└───────────────┘  └───────────────┘  └───────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                ┌───────────────────┐
                │HalalActivityIndex │
                │  • HAI scoring     │
                │  • Compliance     │
                │  • Snapshots       │
                └───────────────────┘
```

### Contract Dependencies

```solidity
// Dependency graph
AmanaToken
    │
    ├────► AmanaDAO (governance)
    │
AmanaReserve (core)
    │
    ├────► ActivityValidator ─────► HalalActivityIndex
    │
    ├────► CapitalPool ─────► RiskSharing
    │
    └────► CircuitBreaker (controls all)
```

### Solana Programs

```
┌────────────────────────────────────────────────────────────────┐
│                   amana-reserve (Core)                         │
│  • Reserve account  • Participant accounts  • Activity accounts│
└───────────────────────────┬────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
┌───────────────────┐              ┌───────────────────┐
│    amana-dao      │              │    amana-hai      │
│                   │              │                   │
│ • DAO account     │              │ • HAI account     │
│ • Proposal accounts│              │ • Metrics accounts │
│ • Sharia board    │              │ • Snapshot accounts│
└───────────────────┘              └───────────────────┘
```

---

## Data Flow

### Activity Lifecycle Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Agent   │───►│Validator│───►│ Reserve │───►│Activity │───►│Complete │
│         │    │         │    │         │    │Execution│    │         │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
                                                         │
                                                         ▼
                                                 ┌─────────────────┐
                                                 │ Profit/Loss    │
                                                 │ Distribution   │
                                                 └─────────────────┘
```

### HAI Scoring Flow

```
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│ Activity Proposal │─────►│   Validation     │─────►│  HAI Tracking    │
│                  │      │                  │      │                  │
│ • Activity type   │      │ • Sharia check   │      │ • Score update   │
│ • Capital amount   │      │ • Asset backing   │      │ • Snapshot       │
│ • Description     │      │ • Economic value  │      │ • Weight calc     │
└──────────────────┘      └──────────────────┘      └──────────────────┘
                                                            │
                                                            ▼
                                                 ┌──────────────────────────┐
                                                 │     HAI Score             │
                                                 │  = Σ(component * weight)  │
                                                 │  • Compliance: 40%       │
                                                 │  • Asset backing: 25%    │
                                                 │  • Economic value: 20%   │
                                                 │  • Validator participation│
                                                 └──────────────────────────┘
```

### Cross-Chain Data Flow

```
┌──────────────┐                      ┌──────────────┐
│   Ethereum   │                      │   Solana     │
│              │                      │              │
│ • HAI: 8500   │                      │ • HAI: 8500   │
│ • Activities: │                      │ • Activities: │
│   100        │                      │   50         │
└──────┬───────┘                      └──────┬───────┘
       │                                     │
       │   Bridge Synchronization          │
       │   ┌──────────────────┐           │
       └──►│  Bridge Manager   │◄──────────┘
           │                  │
           │  • State sync    │
           │  • Verify        │
           │  • Apply updates  │
           └──────────────────┘
```

---

## Security Architecture

### Defense in Depth

```
┌────────────────────────────────────────────────────────────────┐
│                    Security Layers                             │
│                                                                │
│  Layer 1: Circuit Breaker (Emergency Pause)                    │
│  ├─ System-wide pause                                          │
│  ├─ Contract-specific pause                                    │
│  └─ Function-specific pause                                    │
│                                                                │
│  Layer 2: Access Control                                        │
│  ├─ Role-based permissions (OpenZeppelin)                      │
│  ├─ Multi-signature controls                                   │
│  └─ Time-lock for critical operations                          │
│                                                                │
│  Layer 3: Input Validation                                      │
│  ├─ Parameter bounds checking                                  │
│  ├─ State transition validation                                │
│  └─ Reentrancy guards                                         │
│                                                                │
│  Layer 4: Sharia Compliance                                      │
│  ├─ Prohibited activity filtering                             │
│  ├─ Sharia board veto                                         │
│  └─ HAI requirement enforcement                               │
│                                                                │
│  Layer 5: Audit & Monitoring                                   │
│  ├─ Event logging                                             │
│  ├─ Off-chain monitoring                                      │
│  └─ Bug bounty program                                       │
└────────────────────────────────────────────────────────────────┘
```

### Role-Based Access Control

```
┌────────────────────────────────────────────────────────────────┐
│                      Role Hierarchy                             │
│                                                                │
│                    ┌──────────────┐                            │
│                    │    Admin     │                            │
│                    │  (deployer)   │                            │
│                    └──────┬───────┘                            │
│                           │                                     │
│         ┌─────────────────┼─────────────────┐                  │
│         ▼                 ▼                 ▼                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐               │
│  │ Pauser   │    │ Sharia   │    │  DAO     │               │
│  │          │    │ Board    │    │          │               │
│  └──────────┘    └──────────┘    └──────────┘               │
│                                                                │
│  Capabilities:                                                  │
│  • Admin: All functions                                        │
│  • Pauser: Emergency controls                                  │
│  • Sharia Board: Veto power                                    │
│  • DAO: Governance voting                                     │
└────────────────────────────────────────────────────────────────┘
```

---

## Privacy Layer

### Zero-Knowledge Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     ZK Privacy Flow                            │
│                                                                │
│  Agent ──► Generate Identity ──► Create Proof ──► Verify    │
│            (Semaphore)           (Groth16)      (On-chain)     │
│                                                                │
│  Private:                        Public:                        │
│  • Capital amount              • Proof validity               │
│  • Identity                     • Activity hash                │
│  • Activity details             • Compliance proof             │
└────────────────────────────────────────────────────────────────┘
```

### Circuit Types

| Circuit | Purpose | Inputs | Outputs |
|---------|---------|--------|--------|
| Activity Validation | Verify agent eligibility | Capital, compliance, public key | Valid/invalid |
| HAI Computation | Privacy-preserving scoring | Component scores, weights | HAI score |

---

## Cross-Chain Messaging

### Message Flow

```
┌──────────────┐                           ┌──────────────┐
│   Ethereum   │                           │   Solana     │
│              │                           │              │
│ 1. Emit      │─────┐     ┌───────┐     │              │
│    event     │     │     │       │     │              │
│              │     └────►│Relayer│────►│              │
│              │           │       │     │              │
│              │           │       │─────┐│              │
│              │           │       │     │               │
│              │           └───────┘     │ 2. Process   │
│              │                           │    message    │
│              │                           │              │
│              │◄──────────────────────────│              │
│              │      3. Confirm             │              │
└──────────────┘                           └──────────────┘
```

### Supported Bridges

| Bridge | Speed | Cost | Reliability |
|--------|-------|-----|-------------|
| Wormhole | 15-30 min | Medium | High |
| LayerZero | 5-15 min | Low-Medium | High |
| CCIP | 3-10 min | Medium | Very High |

---

## Scaling Considerations

### Horizontal Scaling

```
┌────────────────────────────────────────────────────────────────┐
│                    Backend Services                            │
│                                                                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  API #1    │  │  API #2    │  │  API #3    │            │
│  │ (Primary)  │  │ (Replica)  │  │ (Replica)  │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│         │              │              │                       │
│         └──────────────┴──────────────┘                       │
│                        │                                      │
│                        ▼                                      │
│              ┌──────────────────┐                             │
│              │  Load Balancer   │                             │
│              └──────────────────┘                             │
└────────────────────────────────────────────────────────────────┘
```

### Caching Strategy

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│   Blockchain   │────►│    Cache       │────►│    Clients     │
│   (Source)     │     │  (Redis/Memory)│     │  (Fast reads) │
│                │     │                │     │                │
│ • On-chain state│     │ • HAI scores   │     │ • Dashboard    │
│ • Events       │     │ • Participant  │     │ • Stats        │
│ • Transactions  │     │ • Activities   │     │                │
└────────────────┘     └────────────────┘     └────────────────┘
```

---

## Upgrade Patterns

### Proxy Pattern for Upgradability

```
┌────────────────────────────────────────────────────────────────┐
│                     Upgrade Pattern                             │
│                                                                │
│  Users ──► Proxy Contract ──► Implementation Contract              │
│                   │                        │                      │
│                   │                        ▼                      │
│                   │                 Call implementation              │
│                   │                        │                      │
│                   │                 ◄─────────────────────┘      │
│                   │                 Return result                   │
│                   │                        │                      │
│                   ◄────────────────Return result                    │
│                                                                │
│  Upgrade:                                                         │
│  1. Deploy new implementation                                    │
│  2. Admin calls proxy.setImplementation(newImpl)                  │
│  3. All future calls use new implementation                      │
└────────────────────────────────────────────────────────────────┘
```

### Timelock for Critical Changes

```
┌────────────────────────────────────────────────────────────────┐
│                    Timelock Pattern                             │
│                                                                │
│  Proposal ──► Queue (delay) ──► Execution ──► Implementation        │
│                    │                                          │
│                    └──► 24-48h delay ──► Cancelable              │
│                                                                │
│  Benefits:                                                      │
│  • Users can exit before risky changes                          │
│  • Sharia board has time to review                             │
│  • Emergency cancellation possible                               │
└────────────────────────────────────────────────────────────────┘
```

---

For more information, see:
- [README.md](./README.md)
- [Contributing](./CONTRIBUTING.md)
- [Deployment](./DEPLOYMENT.md)
