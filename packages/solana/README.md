# AMANA Solana Package

Solana programs (smart contracts) for the AMANA Sharia-native macro reserve system.

## Overview

This package contains Anchor-based Solana programs that implement the AMANA reserve system with full Sharia compliance. The programs are designed for high-throughput operations and low transaction costs.

## Programs

### 1. amana-reserve

Core reserve program managing participants, capital, and economic activities.

**Program ID:** (Generated after deployment)

#### Accounts

##### Reserve Account
```rust
pub struct Reserve {
    pub admin: Pubkey,                    // Admin authority
    pub min_capital_contribution: u64,    // Minimum entry (lamports)
    pub max_participants: u64,            // Maximum participants
    pub total_capital: u64,               // Total reserve capital
    pub participant_count: u64,           // Current participants
    pub is_initialized: bool,             // Initialization flag
    pub bump: u8,                         // PDA bump
}
```

**PDA Seeds:** `["reserve"]`

##### Participant Account
```rust
pub struct Participant {
    pub agent: Pubkey,                    // Participant address
    pub capital_contributed: u64,         // Total contributed
    pub profit_share: u64,                // Accumulated profit
    pub loss_share: u64,                  // Accumulated loss
    pub is_active: bool,                  // Active status
    pub joined_at: i64,                   // Join timestamp
    pub bump: u8,                         // PDA bump
}
```

**PDA Seeds:** `["participant", participant_pubkey.as_ref()]`

##### Activity Account
```rust
pub struct Activity {
    pub activity_id: [u8; 32],           // Unique identifier
    pub initiator: Pubkey,                // Activity creator
    pub capital_required: u64,            // Capital needed
    pub capital_deployed: u64,            // Capital deployed
    pub status: ActivityStatus,           // Current state
    pub created_at: i64,                  // Creation timestamp
    pub completed_at: i64,                // Completion timestamp
    pub outcome: i64,                     // Profit (+) or loss (-)
    pub is_validated: bool,               // Validation status
    pub bump: u8,                         // PDA bump
}
```

**PDA Seeds:** `["activity", activity_id.as_ref()]`

#### Instructions

| Instruction | Description | Accounts |
|-------------|-------------|----------|
| `initialize` | Initialize the reserve system | Reserve, admin, system |
| `join_reserve` | Join as participant with capital | Reserve, participant, user, system |
| `propose_activity` | Propose new economic activity | Reserve, participant, activity, user, system |
| `approve_activity` | Approve proposed activity | Reserve, activity |
| `complete_activity` | Record profit/loss outcome | Reserve, activity |
| `deposit_capital` | Add more capital | Reserve, participant, user, system |
| `withdraw_capital` | Withdraw capital | Reserve, participant, user |

#### Activity Status

```rust
pub enum ActivityStatus {
    Proposed,   // Activity proposed
    Approved,   // Capital deployed
    Active,     // In progress
    Completed,  // Finished with outcome
    Rejected,   // Rejected
}
```

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

### 2. amana-dao

Governance program with Sharia Advisory Board integration.

**Program ID:** (Generated after deployment)

#### Accounts

##### DAO Account
```rust
pub struct Dao {
    pub admin: Pubkey,                    // Admin authority
    pub token_mint: Pubkey,               // Governance token
    pub timelock: Pubkey,                 // Timelock account
    pub voting_delay: i64,                // Delay before voting
    pub voting_period: i64,               // Voting duration
    pub quorum_percentage: u16,           // Quorum requirement
    pub proposal_count: u64,              // Total proposals
    pub bump: u8,                         // PDA bump
}
```

**PDA Seeds:** `["dao"]`

##### Proposal Account
```rust
pub struct Proposal {
    pub proposal_id: u64,                 // Unique ID
    pub proposer: Pubkey,                 // Creator
    pub target_account: Pubkey,           // Execution target
    pub amount: u64,                      // Execution amount
    pub affects_sharia: bool,             // Requires Sharia review
    pub status: ProposalStatus,           // Current state
    pub created_at: i64,                  // Creation time
    pub voting_starts_at: i64,            // Voting start
    pub voting_ends_at: i64,              // Voting end
    pub for_votes: u64,                   // For votes
    pub against_votes: u64,               // Against votes
    pub abstain_votes: u64,               // Abstain votes
    pub sharia_approved: bool,            // Sharia board approval
    pub bump: u8,                         // PDA bump
}
```

**PDA Seeds:** `["proposal", proposal_id.to_le_bytes().as_ref()]`

##### Sharia Board Account
```rust
pub struct ShariaBoard {
    pub admin: Pubkey,                    // Admin authority
    pub member_count: u32,                // Board members
    pub bump: u8,                         // PDA bump
}
```

**PDA Seeds:** `["sharia_board"]`

##### Sharia Review Account
```rust
pub struct ShariaReview {
    pub proposal_id: u64,                 // Related proposal
    pub board_member: Pubkey,             // Reviewer
    pub approved: bool,                   // Approval decision
    pub timestamp: i64,                   // Review time
    pub bump: u8,                         // PDA bump
}
```

**PDA Seeds:** `["review", proposal_id.to_le_bytes().as_ref(), member_key.as_ref()]`

#### Instructions

| Instruction | Description | Accounts |
|-------------|-------------|----------|
| `initialize` | Initialize the DAO | DAO, token_mint, timelock, admin, system |
| `init_sharia_board` | Initialize Sharia board | Sharia_board, admin, system |
| `create_proposal` | Create new proposal | DAO, proposal, proposer, system |
| `vote` | Cast vote on proposal | DAO, proposal, voter |
| `sharia_review` | Sharia board review | Proposal, review, board_member, system |
| `execute_proposal` | Execute successful proposal | DAO, proposal |
| `cancel_proposal` | Cancel proposal | Proposal, authority |
| `add_sharia_board_member` | Add board member | DAO, sharia_board, admin |
| `remove_sharia_board_member` | Remove member | DAO, sharia_board, admin |

#### Proposal Status

```rust
pub enum ProposalStatus {
    Pending,   // Waiting for voting to start
    Active,    // Voting in progress
    Passed,    // Voting passed
    Rejected,  // Voting failed
    Executed,  // Proposal executed
    Canceled,  // Proposal canceled
}
```

#### Vote Types

```rust
pub enum VoteType {
    For,       // Support proposal
    Against,   // Oppose proposal
    Abstain,   // Neutral
}
```

### 3. amana-hai

Halal Activity Index (HAI) tracking and scoring program.

**Program ID:** (Generated after deployment)

#### Accounts

##### HAI Account
```rust
pub struct Hai {
    pub admin: Pubkey,                         // Admin authority
    pub current_score: u16,                    // 0-10000 (0-100%)
    pub total_activities: u64,                 // Total tracked
    pub compliant_activities: u64,             // Compliant count
    pub asset_backed_activities: u64,          // Asset-backed count
    pub economic_value_activities: u64,        // Economic value count
    pub snapshot_count: u64,                   // Snapshot count
    pub compliance_weight: u16,                // Compliance weight (bps)
    pub asset_backing_weight: u16,             // Asset backing weight (bps)
    pub economic_value_weight: u16,            // Economic value weight (bps)
    pub validator_participation_weight: u16,   // Validator weight (bps)
    pub bump: u8,                              // PDA bump
}
```

**PDA Seeds:** `["hai"]`

##### Activity Metrics Account
```rust
pub struct ActivityMetrics {
    pub activity_id: [u8; 32],                // Activity identifier
    pub is_compliant: bool,                    // Sharia compliant
    pub is_asset_backed: bool,                 // Has asset backing
    pub has_real_economic_value: bool,         // Real economic value
    pub validator_count: u32,                  // Validator count
    pub positive_votes: u32,                   // Positive validations
    pub timestamp: i64,                        // Tracking time
    pub bump: u8,                              // PDA bump
}
```

**PDA Seeds:** `["metrics", activity_id.as_ref()]`

##### Snapshot Account
```rust
pub struct HaiSnapshot {
    pub snapshot_id: u64,                      // Snapshot ID
    pub score: u16,                            // HAI score
    pub total_activities: u64,                 // Total activities
    pub compliant_activities: u64,             // Compliant count
    pub asset_backed_activities: u64,          // Asset-backed count
    pub timestamp: i64,                        // Snapshot time
    pub bump: u8,                              // PDA bump
}
```

**PDA Seeds:** `["snapshot", snapshot_id.to_le_bytes().as_ref()]`

#### HAI Score Calculation

```
HAI = (compliance_score * compliance_weight +
       asset_backing_score * asset_backing_weight +
       economic_value_score * economic_value_weight +
       validator_score * validator_weight) / 10000

Where each score component is 0-10000 and weights are in basis points.
```

Default weights:
- Compliance: 40% (4000 bps)
- Asset Backing: 25% (2500 bps)
- Economic Value: 20% (2000 bps)
- Validator Participation: 15% (1500 bps)

#### Instructions

| Instruction | Description | Accounts |
|-------------|-------------|----------|
| `initialize` | Initialize HAI tracker | HAI, admin, system |
| `track_activity` | Track activity for HAI | HAI, metrics, payer, system |
| `create_snapshot` | Create metrics snapshot | HAI, snapshot, payer, system |
| `update_weights` | Update scoring weights | HAI, admin |
| `authorize_updater` | Authorize activity updater | HAI, updater_account, admin, system |
| `revoke_updater` | Revoke updater authorization | HAI, updater_account, admin |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client/SDK Layer                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ amana-reserve │   │  amana-dao    │   │   amana-hai   │
│               │   │               │   │               │
│ • Reserve     │   │ • DAO         │   │ • HAI tracker │
│ • Participant │   │ • Proposal    │   │ • Metrics     │
│ • Activity    │   │ • ShariaBoard │   │ • Snapshot    │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                  ┌─────────────────┐
                  │  Solana Runtime  │
                  │  • PDAs          │
                  │  • CPIs          │
                  │  • Events        │
                  └─────────────────┘
```

## Setup

### Prerequisites

- Rust 1.70+
- Solana CLI 1.16+
- Anchor 0.29+

### Installation

```bash
# From repository root
cd packages/solana

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Build programs
anchor build
```

## Configuration

### Anchor.toml

```toml
[tool.anchor]

[features]
seeds = false
skip-lint = false

[programs.localnet]
amana_reserve = "AMANA_RESERVE_PROGRAM_ID"
amana_dao = "AMANA_DAO_PROGRAM_ID"
amana_hai = "AMANA_HAI_PROGRAM_ID"

[programs.devnet]
amana_reserve = "AMANA_RESERVE_PROGRAM_ID"
amana_dao = "AMANA_DAO_PROGRAM_ID"
amana_hai = "AMANA_HAI_PROGRAM_ID"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "Devnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
```

## Building

```bash
# Build all programs
anchor build

# Build specific program
anchor build --program-name amana_reserve

# Build with verbose output
anchor build -v
```

## Testing

```bash
# Run all tests
anchor test

# Run with local validator
anchor test --local

# Run specific test file
anchor test --skip-local-validator

# Run with detailed output
anchor test -- --nocapture
```

### Test Structure

```
tests/
├── amana-reserve.ts      # Reserve program tests
├── amana-dao.ts          # DAO program tests
└── amana-hai.ts          # HAI program tests
```

## Deployment

### Local Deployment

```bash
# Start local validator (in separate terminal)
solana-test-validator

# Deploy to local
anchor deploy --local
```

### Devnet Deployment

```bash
# Configure for devnet
solana config set --url devnet

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Verify program deployment
solana program show <PROGRAM_ID>
```

### Mainnet Deployment

```bash
# DANGER: Only after thorough testing
solana config set --url mainnet-beta

# Deploy to mainnet
anchor deploy --provider.cluster mainnet

# Verify
solana program show <PROGRAM_ID>
```

## Program Sizes

| Program | Approx. Size |
|---------|--------------|
| amana-reserve | ~150 KB |
| amana-dao | ~120 KB |
| amana-hai | ~90 KB |

## Cost Estimates

| Operation | Est. Cost (SOL) |
|-----------|-----------------|
| Initialize reserve | ~0.005 SOL |
| Join reserve | ~0.0003 SOL |
| Propose activity | ~0.0002 SOL |
| Complete activity | ~0.0004 SOL |
| Create proposal | ~0.0003 SOL |
| Cast vote | ~0.0001 SOL |
| Track HAI activity | ~0.0002 SOL |

## PDA Derivation

### Reserve PDA
```typescript
const [reservePDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("reserve")],
  PROGRAM_ID
);
```

### Participant PDA
```typescript
const [participantPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("participant"), participantPubkey.toBuffer()],
  PROGRAM_ID
);
```

### Activity PDA
```typescript
const [activityPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("activity"), activityIdBuffer],
  PROGRAM_ID
);
```

### Proposal PDA
```typescript
const [proposalPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("proposal"), proposalIdToLeBytes()],
  PROGRAM_ID
);
```

### HAI PDA
```typescript
const [haiPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("hai")],
  HAI_PROGRAM_ID
);
```

## Using with SDK

```typescript
import { AmanaSolanaClient } from '@amana/sdk';

const client = new AmanaSolanaClient({
  rpcUrl: 'https://api.devnet.solana.com',
  keypair: yourKeypair,
  programIds: {
    reserve: 'AMANA_RESERVE_PROGRAM_ID',
    dao: 'AMANA_DAO_PROGRAM_ID',
    hai: 'AMANA_HAI_PROGRAM_ID',
  }
});

// Join reserve
await client.joinReserve({
  amount: '1.0', // 1 SOL
  minCapital: '0.1'
});

// Propose activity
await client.proposeActivity({
  activityId: generateActivityId(),
  capitalRequired: '0.5'
});

// Get HAI score
const haiScore = await client.getHAIScore();
console.log(`HAI: ${haiScore / 100}%`);
```

## Cross-Program Invocations (CPI)

Programs can invoke each other using CPI:

```rust
// Example: amana-reserve calling amana-hai
let cpi_program = ctx.accounts.hai_program.to_account_info();
let cpi_accounts = hai::TrackActivityCpiAccounts {
    hai: ctx.accounts.hai.to_account_info(),
    metrics: ctx.accounts.metrics.to_account_info(),
    payer: ctx.accounts.payer.to_account_info(),
    system_program: ctx.accounts.system_program.to_account_info(),
};

let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
hai::cpi::track_activity(
    cpi_ctx,
    activity_id,
    is_compliant,
    is_asset_backed,
    has_real_economic_value,
    validator_count,
    positive_votes,
)?;
```

## Security Considerations

- All PDAs use program-derived seeds for security
- Owner checks on all account validations
- Overflow checks on all arithmetic operations
- Event emission for all state changes
- Proper signer checks on privileged operations

## Sharia Compliance

The Solana programs implement the same Sharia compliance features as Ethereum:

1. **No Riba** - Only profit/loss sharing
2. **Asset-Backed** - Activities require asset validation
3. **Mudarabah/Musharakah** - Proportional profit/loss
4. **Sharia Board** - Veto power on governance
5. **Transparency** - All data onchain

## Troubleshooting

### Build Errors

```bash
# Clean build artifacts
anchor clean

# Rebuild
anchor build
```

### Test Failures

```bash
# Check validator is running
solana-test-validator --log

# Run with logs
anchor test -- --nocapture
```

### Deployment Issues

```bash
# Check balance
solana balance

# Check program exists
solana program show <PROGRAM_ID>

# Close program (if needed)
solana program close <PROGRAM_ID>
```

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT
