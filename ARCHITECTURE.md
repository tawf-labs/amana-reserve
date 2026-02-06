# AMANA System Architecture

Deep-dive into the architecture and design of the AMANA Sharia-native reserve system.

## Table of Contents
- [System Overview](#system-overview)
- [Multi-Chain Architecture](#multi-chain-architecture)
- [EIP-8004 Agent Infrastructure](#eip-8004-agent-infrastructure)
- [MagicBlock Real-Time Operations](#magicblock-real-time-operations)
- [Contract Architecture](#contract-architecture)
- [Data Flow](#data-flow)
- [Security Architecture](#security-architecture)
- [Privacy Layer](#privacy-layer)
- [Cross-Chain Messaging](#cross-chain-messaging)
- [Scaling Considerations](#scaling-considerations)
- [Upgrade Patterns](#upgrade-patterns)

---

## System Overview

The AMANA system is designed as a multi-chain, Sharia-compliant reserve platform enabling autonomous agents to coordinate capital through real economic activity. The system integrates **EIP-8004 Trustless Agent Infrastructure** on Ethereum for agent identity and reputation management, and **MagicBlock Ephemeral Rollups (ER)** on Solana for real-time, zero-fee operations.

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
│                    Agent Manager (EIP-8004)                        │
│  • Agent Identity Registry  • Reputation System  • Validation      │
│  • Cross-chain coordination  • Sharia-compliant workflows          │
└─────────────────────────────────────────────────────────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        ▼                          ▼                          ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│   Ethereum Chain  │   │    Solana Chain   │   │  MagicBlock ER    │
│   (EIP-8004)      │   │    (Base Layer)   │   │  (Real-Time)      │
│                   │   │                   │   │                   │
│ • AgentIdentity   │   │ • 3 Programs      │   │ • Zero-fee exec   │
│ • AgentReputation │   │ • Sealevel        │   │ • Sub-second fin  │
│ • AgentValidation │   │ • CPI transactions│   │ • VRF integration │
│ • AmanaReserve    │   │                   │   │ • Auto-commit     │
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
| Ethereum | EIP-8004 agent infrastructure, governance, high-value transactions | Security, decentralization, ERC-721 agent identities |
| Solana | High-throughput operations, capital deployment | Speed, low cost |
| MagicBlock ER | Real-time operations, micro-transactions, VRF sampling | Zero-fee, sub-second finality |
| Future | Scaling, specialized use cases | Based on ecosystem needs |

### Cross-Chain Consistency

```
┌────────────────────────────────────────────────────────────────┐
│                    State Synchronization                     │
│                                                                │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐    │
│  │   Ethereum   │◄─►│  Solana ER   │◄─►│  Base Layer  │    │
│  │   (EIP-8004) │   │  (MagicBlock)│   │   (Solana)   │    │
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
└──────┬───────────────────────┬────────────────────┬─────┘
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

## EIP-8004 Agent Infrastructure

The Ethereum layer implements **EIP-8004 Trustless Agent Infrastructure** for decentralized agent management.

### Agent Identity Registry

```
┌────────────────────────────────────────────────────────────────┐
│                 AgentIdentityRegistry (ERC-721)                │
│                                                                │
│  • Agent NFTs as portable identities                            │
│  • Organization-scoped agent registration                      │
│  • Cross-organization portability                              │
│  • Metadata URI for agent descriptions                          │
│                                                                │
│  struct Agent {                                                │
│    uint256 agentId;           // ERC-721 token ID              │
│    address owner;             // Agent owner                   │
│    string metadataURI;        // IPFS hash of agent data       │
│    uint256 organizationId;    // Organization scope            │
│    bool isActive;             // Active status                 │
│  }                                                            │
└────────────────────────────────────────────────────────────────┘
```

### Agent Reputation Registry

```
┌────────────────────────────────────────────────────────────────┐
│                AgentReputationRegistry                          │
│                                                                │
│  • Stake-weighted feedback system                              │
│  • Tag-based reputation categories                             │
│  • Decay mechanism for outdated feedback                       │
│  • Aggregated reputation scores                                │
│                                                                │
│  struct Feedback {                                             │
│    uint256 agentId;                                            │
│    address submitter;                                          │
│    uint8 score;                  // 1-5 rating                 │
│    string tag;                   // e.g., "reliability"        │
│    uint256 stake;                // Stake weight               │
│    uint256 timestamp;                                          │
│  }                                                            │
└────────────────────────────────────────────────────────────────┘
```

### Agent Validation Registry

```
┌────────────────────────────────────────────────────────────────┐
│               AgentValidationRegistry                           │
│                                                                │
│  • Multi-validator work verification                           │
│  • Stake-based validation incentives                           │
│  • Challenge mechanism for disputes                            │
│  • Slashable validation stakes                                │
│                                                                │
│  struct WorkValidation {                                       │
│    bytes32 workId;                                             │
│    uint256 agentId;                                            │
│    uint256 validationAmount;      // Stake for validation      │
│    mapping(address => bool) validatorApprovals;                │
│    uint256 approvalCount;                                      │
│    bool isValidated;                                           │
│  }                                                            │
└────────────────────────────────────────────────────────────────┘
```

### EIP-8004 Compliance

| Feature | EIP-8004 Requirement | AMANA Implementation |
|---------|---------------------|----------------------|
| Agent Identity | ERC-721 token | AgentIdentityRegistry |
| Metadata | URI pointer | IPFS-based metadata |
| Organization | Scoping | OrganizationId field |
| Portability | Transfer function | Transfer with approval |
| Reputation | Feedback system | AgentReputationRegistry |
| Validation | Work verification | AgentValidationRegistry |

---

## MagicBlock Real-Time Operations

The Solana layer leverages **MagicBlock Ephemeral Rollups (ER)** for high-frequency, zero-fee operations.

### Ephemeral Rollup Flow

```
┌────────────────────────────────────────────────────────────────┐
│                   MagicBlock ER Operations                      │
│                                                                │
│  Solana Base Layer          MagicBlock ER                      │
│       │                         │                             │
│       │ 1. Delegate PDA         │ Zero-fee execution           │
│       ├────────────────────────>│ Sub-second finality          │
│       │                         │                             │
│       │ 2. Execute Operations   │ VRF for randomness           │
│       │<────────────────────────┤                             │
│       │                         │                             │
│       │ 3. Commit State         │                             │
│       │<────────────────────────┘                             │
│       │                                                       │
└───────┴───────────────────────────────────────────────────────┘
```

### PDA Delegation Pattern

```rust
// Reserve PDA on base layer
pub fn delegate_reserve(
    ctx: Context<DelegateReserve>,
    authority: Pubkey,
) -> Result<()> {
    let reserve = &ctx.accounts.reserve;
    let delegate_pda = derive_delegate_pda(reserve.key());

    // Transfer control to ER
    reserve.delegate = delegate_pda;
    reserve.delegate_authority = Some(authority);

    Ok(())
}

// Execute on ER with zero fees
pub fn deploy_capital_realtime(
    ctx: Context<DeployCapitalRealtime>,
    amount: u64,
) -> Result<()> {
    // Execute on ER - no gas fees
    let delegate_account = &ctx.accounts.delegate_pda;
    delegate_account.capital_deployed += amount;

    Ok(())
}

// Commit back to base layer
pub fn commit_and_undelegate(
    ctx: Context<CommitAndUndelegate>,
) -> Result<()> {
    let delegate_account = &ctx.accounts.delegate_pda;
    let reserve = &ctx.accounts.reserve;

    // Sync state to base layer
    reserve.capital_deployed = delegate_account.capital_deployed;
    reserve.delegate = None;
    reserve.delegate_authority = None;

    Ok(())
}
```

### VRF Integration

```rust
// VRF for verifiable randomness in HAI sampling
pub fn request_vrf_hai_update(
    ctx: Context<RequestVRF>,
    data_source_count: u64,
) -> Result<()> {
    let vrf_program = &ctx.accounts.vrf_program;

    // Request VRF randomness
    let request = VrfRequest {
        callback: HaiCallback::UpdateScore,
        seed: ctx.accounts.hai.score,
        config: VrfConfig {
            data_source_count,
            sample_size: calculate_sample_size(data_source_count),
        },
    };

    vrf_program.request(request);
    Ok(())
}
```

---

## Contract Architecture

### Ethereum Contracts

```
┌────────────────────────────────────────────────────────────────┐
│              EIP-8004 Agent Infrastructure                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ AgentIdentity    │  │ AgentReputation  │  │ AgentValid   │ │
│  │ Registry (721)   │  │ Registry         │  │ Registry     │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
└────────────────────────────────────────────────────────────────┘
                            │
                            ▼
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
AgentIdentityRegistry (ERC-721)
    │
    ├────► AgentReputationRegistry (feedback)
    │
    ├────► AgentValidationRegistry (work verification)
    │
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
│  • Reserve account  • Delegate PDA  • ER instructions          │
└───────────────────────────┬────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
┌───────────────────┐              ┌───────────────────┐
│    amana-dao      │              │    amana-hai      │
│                   │              │                   │
│ • DAO account     │              │ • HAI account     │
│ • Proposal accounts│              │ • VRF integration │
│ • Sharia board    │              │ • Metrics accounts │
└───────────────────┘              └───────────────────┘
```

---

## Data Flow

### Agent Registration Flow (EIP-8004)

```
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ Agent Owner  │───►│Identity Registry │───►│  Agent NFT       │
│              │    │  (ERC-721)       │    │  minted          │
└──────────────┘    └──────────────────┘    └──────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │ Reputation Init  │
                  │ Score: 5000      │
                  └──────────────────┘
```

### Real-Time Capital Deployment Flow (MagicBlock ER)

```
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ Agent        │───►│  Delegate PDA    │───►│ MagicBlock ER     │
│              │    │  (Base Layer)    │    │ Zero-fee exec    │
└──────────────┘    └──────────────────┘    └──────────────────┘
                                                     │
                                                     ▼
                                           ┌──────────────────┐
                                           │ Deploy Capital   │
                                           │ Sub-second finality
                                           └──────────────────┘
                                                     │
                                                     ▼
                                           ┌──────────────────┐
                                           │ Commit to Base   │
                                           │ Sync state       │
                                           └──────────────────┘
```

### HAI Scoring Flow

```
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│ Activity Proposal │─────►│   Validation     │─────►│  HAI Tracking    │
│                  │      │                  │      │                  │
│ • Activity type   │      │ • Sharia check   │      │ • Score update   │
│ • Capital amount   │      │ • Asset backing   │      │ • VRF sampling  │
│ • Description     │      │ • Economic value  │      │ • Snapshot       │
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
│  (EIP-8004)  │                      │  (MagicBlock)│
│              │                      │              │
│ • Agent IDs  │                      │ • HAI: 8500   │
│ • Reputation │                      │ • Activities: │
│ • HAI: 8500  │                      │   50         │
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
│  Layer 5: EIP-8004 Agent Security                               │
│  ├─ Stake-based validation                                    │
│  ├─ Slashable misconduct penalties                            │
│  ├─ Multi-validator verification                              │
│  └─ Reputation decay for inactivity                           │
│                                                                │
│  Layer 6: Audit & Monitoring                                   │
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
│  • Agent Validators: Work verification                         │
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
│  • Agent metadata               • Reputation score             │
└────────────────────────────────────────────────────────────────┘
```

### Circuit Types

| Circuit | Purpose | Inputs | Outputs |
|---------|---------|--------|--------|
| Agent Validation | Verify agent eligibility | Agent ID, compliance, stake | Valid/invalid |
| Activity Validation | Verify agent eligibility | Capital, compliance, public key | Valid/invalid |
| HAI Computation | Privacy-preserving scoring | Component scores, weights | HAI score |
| Reputation Proof | Prove reputation without revealing details | Feedback history, salt | Reputation score |

---

## Cross-Chain Messaging

### Message Flow

```
┌──────────────┐                           ┌──────────────┐
│   Ethereum   │                           │   Solana     │
│  (EIP-8004)  │                           │  (MagicBlock)│
│              │                           │              │
│ 1. Emit      │─────┐     ┌───────┐     │              │
│    event     │     │     │       │     │              │
│              │     └────►│Relayer│────►│              │
│              │           │       │     │              │
│              │           │       │─────┐│              │
│              │           │       │     │               │
│              │           │       │     │ 2. Process   │
│              │           └───────┘     │    message    │
│              │                           │              │
│              │◄──────────────────────────│              │
│              │      3. Confirm             │              │
└──────────────┘                           └──────────────┘
```

### Supported Bridges

| Bridge | Speed | Cost | Reliability | Use Case |
|--------|-------|-----|-------------|----------|
| Wormhole | 15-30 min | Medium | High | Large transfers |
| LayerZero | 5-15 min | Low-Medium | High | Standard transfers |
| CCIP | 3-10 min | Medium | Very High | Critical transfers |

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

### MagicBlock ER Scaling

```
┌────────────────────────────────────────────────────────────────┐
│              Ephemeral Rollup Scaling                          │
│                                                                │
│  Base Layer               Ephemeral Rollups                    │
│       │                         │                             │
│       ├─────────┬───────────────┼───────────────┐              │
│       ▼         ▼               ▼               ▼              │
│   ER Pool #1  ER Pool #2     ER Pool #3     ER Pool #N         │
│   (Capital)   (HAI)         (Governance)   (Agents)           │
│       │         │               │               │              │
│       └─────────┴───────────────┴───────────────┘              │
│                           │                                   │
│                           ▼                                   │
│                   Auto-commit State                           │
└────────────────────────────────────────────────────────────────┘
```

### Caching Strategy

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│   Blockchain   │────►│    Cache       │────►│    Clients     │
│   (Source)     │     │  (Redis/Memory)│     │  (Fast reads) │
│                │     │                │     │                │
│ • On-chain state│     │ • HAI scores   │     │ • Dashboard    │
│ • Events       │     │ • Agent reputations│  │ • Stats        │
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
- [MAGICBLOCK_EIP8004_INTEGRATION.md](./MAGICBLOCK_EIP8004_INTEGRATION.md)
- [Contributing](./CONTRIBUTING.md)
- [Deployment](./DEPLOYMENT.md)
