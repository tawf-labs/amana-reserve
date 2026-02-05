# AMANA SDK

Unified TypeScript SDK for interacting with the AMANA Sharia-native macro reserve system across Ethereum and Solana blockchains.

## Overview

The AMANA SDK provides a type-safe, chain-agnostic interface for interacting with all AMANA contracts and programs. It abstracts away the differences between Ethereum and Solana, allowing developers to write code that works seamlessly across both blockchains.

## Installation

```bash
# From repository root
cd packages/sdk

# Install dependencies
pnpm install

# Build SDK
pnpm build
```

## Quick Start

### Ethereum Setup

```typescript
import { AmanaSDK } from '@amana/sdk';

// Initialize for Ethereum
const amana = new AmanaSDK({
  chain: 'ethereum',
  ethereum: {
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY',
    contracts: {
      amanaReserve: '0x...',
      halalActivityIndex: '0x...',
      circuitBreaker: '0x...',
      amanaToken: '0x...',
      amanaDao: '0x...',
    }
  }
});

// Connect a wallet (browser)
await amana.ethereum.connect(window.ethereum);

// Join the reserve
const result = await amana.ethereum.joinReserve('1.0'); // 1 ETH
console.log('Transaction:', result.hash);
```

### Solana Setup

```typescript
import { AmanaSDK } from '@amana/sdk';

// Initialize for Solana
const amana = new AmanaSDK({
  chain: 'solana',
  solana: {
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    programIds: {
      amanaReserve: new PublicKey('AMANareserve...'),
      amanaHai: new PublicKey('AMANAhai...'),
      amanaDao: new PublicKey('AMANAdao...'),
    }
  }
});

// Connect a wallet
await amana.solana.connect(wallet.adapter);

// Join the reserve
const result = await amana.solana.joinReserve(1_000_000_000); // 1 SOL
console.log('Signature:', result.hash);
```

## Multi-Chain Abstraction

The SDK provides a unified interface that works across both chains:

```typescript
// The same code pattern works for both chains
const chain = amana.isEthereum() ? amana.ethereum : amana.solana;

// Join reserve
await chain.joinReserve(amount);

// Propose activity
await chain.proposeActivity(activityId, capital);

// Get stats
const stats = await chain.getReserveStats();
```

## Client Classes

### AmanaSDK

Main SDK entry point. Creates and manages chain-specific clients.

```typescript
class AmanaSDK {
  constructor(config: AmanaConfig)

  // Accessors
  get ethereum(): AmanaEthereumClient
  get solana(): AmanaSolanaClient
  getChain(): ChainType
  isEthereum(): boolean
  isSolana(): boolean
}
```

### AmanaEthereumClient

Ethereum-specific client using ethers.js v6.

```typescript
class AmanaEthereumClient {
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
  async trackActivity(activityId: string, isCompliant: boolean, isAssetBacked: boolean, hasRealEconomicValue: boolean, validatorCount: number, positiveVotes: number, options?: TransactionOptions): Promise<TransactionResult>
  async getHAIMetrics(): Promise<HAIMetrics>
  async createSnapshot(options?: TransactionOptions): Promise<TransactionResult>

  // Circuit Breaker
  async isPaused(): Promise<boolean>
  async pauseSystem(reason: string, options?: TransactionOptions): Promise<TransactionResult>

  // Event Listeners
  onParticipantJoined(callback: (agent: string, capital: bigint) => void): void
  onActivityProposed(callback: (activityId: string, initiator: string, capital: bigint) => void): void
  onActivityCompleted(callback: (activityId: string, outcome: bigint) => void): void
  removeAllListeners(): void
}
```

### AmanaSolanaClient

Solana-specific client using @solana/web3.js.

```typescript
class AmanaSolanaClient {
  // Connection
  async connect(wallet: Signer): Promise<void>
  getAddress(): PublicKey | null

  // PDA Helpers
  getReservePDA(): [PublicKey, number]
  getParticipantPDA(agent: PublicKey): [PublicKey, number]
  getActivityPDA(activityId: Buffer): [PublicKey, number]
  getHAIPDA(): [PublicKey, number]
  getMetricsPDA(activityId: Buffer): [PublicKey, number]

  // Reserve Operations
  async initializeReserve(minCapitalContribution: number, maxParticipants: number, options?: TransactionOptions): Promise<TransactionResult>
  async joinReserve(amount: number, options?: TransactionOptions): Promise<TransactionResult>
  async proposeActivity(activityId: Buffer, capitalRequired: number, description: string, options?: TransactionOptions): Promise<TransactionResult>
  async approveActivity(activityId: Buffer, options?: TransactionOptions): Promise<TransactionResult>
  async completeActivity(activityId: Buffer, outcome: number, options?: TransactionOptions): Promise<TransactionResult>
  async depositCapital(amount: number, options?: TransactionOptions): Promise<TransactionResult>
  async withdrawCapital(amount: number, options?: TransactionOptions): Promise<TransactionResult>

  // HAI Operations
  async trackActivity(activityId: Buffer, isCompliant: boolean, isAssetBacked: boolean, hasRealEconomicValue: boolean, validatorCount: number, positiveVotes: number, options?: TransactionOptions): Promise<TransactionResult>
  async createSnapshot(options?: TransactionOptions): Promise<TransactionResult>

  // Account Data
  async getAccountData(account: PublicKey): Promise<Buffer>
}
```

## Configuration

### Ethereum Configuration

```typescript
interface EthereumConfig {
  rpcUrl: string;                    // RPC endpoint URL
  wsUrl?: string;                    // Optional WebSocket URL
  chainId?: number;                  // Chain ID for validation
  contracts: {
    amanaReserve: string;            // Required
    halalActivityIndex?: string;     // Optional
    circuitBreaker?: string;         // Optional
    amanaToken?: string;             // Optional
    amanaDao?: string;               // Optional
  };
}
```

### Solana Configuration

```typescript
interface SolanaConfig {
  rpcUrl: string;                    // RPC endpoint URL
  wsUrl?: string;                    // Optional WebSocket URL
  commitment?: Commitment;           // 'processed' | 'confirmed' | 'finalized'
  programIds?: {
    amanaReserve?: PublicKey;
    amanaHai?: PublicKey;
    amanaDao?: PublicKey;
  };
}
```

### SDK Configuration

```typescript
interface AmanaConfig {
  chain: ChainType;                  // 'ethereum' | 'solana'
  ethereum?: EthereumConfig;
  solana?: SolanaConfig;
}
```

## Common Types

### Participant

```typescript
interface Participant {
  agent: string;                     // Address/PublicKey
  capitalContributed: bigint;        // Total contributed
  profitShare: bigint;               // Accumulated profit
  lossShare: bigint;                 // Accumulated loss
  isActive: boolean;                 // Active status
  joinedAt: number;                  // Join timestamp
}
```

### Activity

```typescript
enum ActivityStatus {
  Proposed = 0,
  Approved = 1,
  Active = 2,
  Completed = 3,
  Rejected = 4,
}

interface Activity {
  activityId: string;                // Unique identifier
  initiator: string;                 // Creator address
  capitalRequired: bigint;           // Capital needed
  capitalDeployed: bigint;           // Capital deployed
  status: ActivityStatus;            // Current state
  createdAt: number;                 // Creation timestamp
  completedAt: number;               // Completion timestamp
  outcome: bigint;                   // Profit (+) or loss (-)
  isValidated: boolean;              // Validation status
}
```

### HAI Metrics

```typescript
interface HAIMetrics {
  score: number;                     // 0-10000 (basis points)
  percentage: number;                // 0-100
  totalActivities: number;
  compliantActivities: number;
  complianceRate: number;            // 0-10000 bps
}
```

### Transaction Result

```typescript
interface TransactionResult {
  hash: string;                      // Transaction hash/signature
  status: 'success' | 'failed';
  gasUsed?: bigint;                  // Ethereum only
  blockNumber?: bigint;              // Ethereum: block, Solana: slot
}
```

### Transaction Options

```typescript
interface TransactionOptions {
  gasLimit?: bigint;                 // Ethereum only
  gasPrice?: bigint;                 // Ethereum only
  value?: bigint;                    // Ethereum only
}
```

## Usage Examples

### Join Reserve and Propose Activity

```typescript
// Ethereum
const amana = new AmanaSDK({ chain: 'ethereum', ethereum: config });
await amana.ethereum.connect(signer);

// Join with 1 ETH
const joinResult = await amana.ethereum.joinReserve('1.0');
console.log('Joined:', joinResult.hash);

// Propose activity
const activityId = generateActivityId();
const proposeResult = await amana.ethereum.proposeActivity(activityId, '0.5');
console.log('Proposed:', proposeResult.hash);
```

### Complete Activity with Profit

```typescript
// Complete with 0.1 ETH profit
const profit = BigInt('100000000000000000'); // 0.1 ETH
const result = await amana.ethereum.completeActivity(activityId, profit);
console.log('Completed:', result.hash);
```

### Get HAI Score

```typescript
// Get current HAI metrics
const metrics = await amana.ethereum.getHAIMetrics();
console.log(`HAI Score: ${metrics.percentage}%`);
console.log(`Compliant: ${metrics.compliantActivities}/${metrics.totalActivities}`);
```

### Event Listening

```typescript
// Listen for new activities
amana.ethereum.onActivityProposed((activityId, initiator, capital) => {
  console.log(`New activity ${activityId} by ${initiator} for ${capital} wei`);
});

// Listen for completions
amana.ethereum.onActivityCompleted((activityId, outcome) => {
  if (outcome > 0n) {
    console.log(`Activity ${activityId} profit: ${outcome} wei`);
  } else {
    console.log(`Activity ${activityId} loss: ${-outcome} wei`);
  }
});

// Clean up listeners
amana.ethereum.removeAllListeners();
```

### Multi-Chain Pattern

```typescript
// Abstract chain selection
function getAmanaClient(chain: 'ethereum' | 'solana') {
  const config = chain === 'ethereum' ? ethConfig : solConfig;
  return new AmanaSDK({ chain, [chain]: config });
}

// Use with any chain
const amana = getAmanaClient('ethereum');
const client = amana.isEthereum() ? amana.ethereum : amana.solana;

// Same operations work for both
await client.joinReserve(amount);
await client.proposeActivity(id, capital);
```

## Error Handling

```typescript
import { AmanaError, ErrorCodes } from '@amana/sdk';

try {
  await amana.ethereum.joinReserve('0.01');
} catch (error) {
  if (error instanceof AmanaError) {
    switch (error.code) {
      case ErrorCodes.INSUFFICIENT_CONTRIBUTION:
        console.log('Minimum contribution required');
        break;
      case ErrorCodes.ALREADY_PARTICIPANT:
        console.log('Already a participant');
        break;
      case ErrorCodes.TRANSACTION_REJECTED:
        console.log('Transaction rejected by user');
        break;
      default:
        console.log('Error:', error.message);
    }
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `UNKNOWN` | Unknown error |
| `NETWORK_ERROR` | Network connection error |
| `INVALID_PARAMS` | Invalid parameters |
| `NOT_PARTICIPANT` | Not a participant |
| `ALREADY_PARTICIPANT` | Already a participant |
| `INSUFFICIENT_CONTRIBUTION` | Below minimum contribution |
| `INSUFFICIENT_BALANCE` | Insufficient balance |
| `MAX_PARTICIPANTS` | Maximum participants reached |
| `ACTIVITY_NOT_FOUND` | Activity not found |
| `TRANSACTION_FAILED` | Transaction failed |
| `TRANSACTION_REJECTED` | Transaction rejected by user |
| `NOT_AUTHORIZED` | Not authorized for operation |

## Utility Functions

```typescript
import {
  generateActivityId,
  toTokenUnits,
  fromTokenUnits,
  formatDate,
  basisPointsToPercentage,
  percentageToBasisPoints,
  DEFAULTS
} from '@amana/sdk';

// Generate activity ID
const id = generateActivityId(); // 0x1234...

// Token unit conversions
const wei = toTokenUnits('1.5', 18); // 1500000000000000000n
const eth = fromTokenUnits(wei, 18);  // "1.5"

// Format timestamp
const date = formatDate(1699000000); // "2023-11-03T12:46:40.000Z"

// Basis points conversion
const pct = basisPointsToPercentage(4250); // 42.5
const bps = percentageToBasisPoints(42.5); // 4250

// Defaults
console.log(DEFAULTS.ETHEREUM_MIN_CONTRIBUTION); // "100000000000000000"
console.log(DEFAULTS.SOLANA_MIN_CONTRIBUTION);  // 100000000
console.log(DEFAULTS.HAI_MAX_SCORE);            // 10000
```

## Factory Functions

```typescript
import { createEthereumSDK, createSolanaSDK } from '@amana/sdk';

// Quick creation without full config
const ethSDK = createEthereumSDK({
  rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY',
  contracts: { amanaReserve: '0x...' }
});

const solSDK = createSolanaSDK({
  rpcUrl: 'https://api.mainnet-beta.solana.com'
});
```

## Building

```bash
# Build TypeScript
pnpm build

# Watch mode
pnpm build:watch

# Type check
pnpm type-check

# Lint
pnpm lint
```

## Testing

```bash
# Run tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

## Project Structure

```
packages/sdk/
├── src/
│   ├── index.ts           # Main entry point
│   ├── common/
│   │   └── types.ts       # Shared types
│   ├── ethereum/
│   │   └── client.ts      # Ethereum client
│   └── solana/
│       └── client.ts      # Solana client
├── package.json
├── tsconfig.json
└── README.md
```

## Dependencies

- **ethers** v6+ - Ethereum interaction
- **@solana/web3.js** - Solana interaction
- **@project-serum/anchor** - Solana program framework

## License

MIT
