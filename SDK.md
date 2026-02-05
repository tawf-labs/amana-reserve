# AMANA SDK Documentation

Complete reference guide for the AMANA TypeScript SDK.

## Table of Contents
- [Overview](#overview)
- [Design Principles](#design-principles)
- [Installation](#installation)
- [Configuration](#configuration)
- [Multi-Chain Abstraction](#multi-chain-abstraction)
- [API Reference](#api-reference)
- [Event Handling](#event-handling)
- [Error Handling](#error-handling)
- [TypeScript Types](#typescript-types)
- [Best Practices](#best-practices)

---

## Overview

The AMANA SDK provides a unified, type-safe interface for interacting with the AMANA Sharia-native reserve system across Ethereum and Solana blockchains.

### Key Features

- **Chain-Agnostic API**: Single interface for Ethereum and Solana
- **Type Safety**: Full TypeScript support with strict types
- **Wallet Integration**: Seamless connection to browser wallets
- **Event Listening**: Real-time updates through event listeners
- **Privacy Support**: Built-in zero-knowledge proof capabilities

---

## Design Principles

### 1. Chain Abstraction

The SDK abstracts chain-specific details behind a common interface:

```typescript
// Same pattern works for both chains
const client = amana.isEthereum() ? amana.ethereum : amana.solana;
await client.joinReserve(amount);
await client.proposeActivity(id, capital);
```

### 2. Type Safety

All operations are fully typed:

```typescript
interface TransactionResult {
  hash: string;
  status: 'success' | 'failed';
  gasUsed?: bigint;
  blockNumber?: bigint;
}

const result: TransactionResult = await client.joinReserve('1.0');
```

### 3. Async/Await

All async operations use Promises:

```typescript
const stats = await client.getReserveStats();
console.log(stats.totalCapital);
```

---

## Installation

### NPM

```bash
npm install @amana/sdk
```

### Yarn/PNPM

```bash
yarn add @amana/sdk
# or
pnpm add @amana/sdk
```

### From Source

```bash
cd packages/sdk
pnpm install
pnpm build
pnpm link
```

---

## Configuration

### Ethereum Configuration

```typescript
import { AmanaSDK } from '@amana/sdk';

const amana = new AmanaSDK({
  chain: 'ethereum',
  ethereum: {
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY',
    // Optional: WebSocket for events
    wsUrl: 'wss://mainnet.infura.io/ws/v3/YOUR_KEY',
    chainId: 1,
    contracts: {
      amanaReserve: '0x...',
      halalActivityIndex: '0x...',
      circuitBreaker: '0x...',
      amanaToken: '0x...',
      amanaDao: '0x...'
    }
  }
});
```

### Solana Configuration

```typescript
const amana = new AmanaSDK({
  chain: 'solana',
  solana: {
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    // Optional: WebSocket for events
    wsUrl: 'wss://api.mainnet-beta.solana.com',
    commitment: 'confirmed',
    programIds: {
      amanaReserve: new PublicKey('AMANareserve...'),
      amanaHai: new PublicKey('AMANAhai...'),
      amanaDao: new PublicKey('AMANAdao...')
    }
  }
});
```

### Configuration Interface

```typescript
interface AmanaConfig {
  chain: 'ethereum' | 'solana';
  ethereum?: EthereumConfig;
  solana?: SolanaConfig;
}

interface EthereumConfig {
  rpcUrl: string;
  wsUrl?: string;
  chainId?: number;
  contracts: {
    amanaReserve: string;
    halalActivityIndex?: string;
    circuitBreaker?: string;
    amanaToken?: string;
    amanaDao?: string;
  };
}

interface SolanaConfig {
  rpcUrl: string;
  wsUrl?: string;
  commitment?: 'processed' | 'confirmed' | 'finalized';
  programIds?: {
    amanaReserve?: PublicKey;
    amanaHai?: PublicKey;
    amanaDao?: PublicKey;
  };
}
```

---

## Multi-Chain Abstraction

### Chain Detection

```typescript
// Check active chain
if (amana.isEthereum()) {
  console.log('Using Ethereum');
} else if (amana.isSolana()) {
  console.log('Using Solana');
}

// Get chain type
const chain = amana.getChain();
console.log(chain); // 'ethereum' or 'solana'
```

### Chain-Specific Clients

```typescript
// Get Ethereum client
const ethClient = amana.ethereum;

// Get Solana client
const solClient = amana.solana;

// Access will throw if wrong chain
try {
  const client = amana.ethereum;
} catch (e) {
  console.log('Not on Ethereum');
}
```

### Unified Pattern

```typescript
function executeReserveOperation(operation: string, ...args: any[]) {
  const client = amana.isEthereum() ? amana.ethereum : amana.solana;

  switch (operation) {
    case 'join':
      return client.joinReserve(args[0]);
    case 'propose':
      return client.proposeActivity(args[0], args[1]);
    case 'complete':
      return client.completeActivity(args[0], args[1]);
  }
}
```

---

## API Reference

### AmanaSDK Class

Main SDK entry point.

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

Ethereum-specific client.

#### Connection Methods

```typescript
// Connect wallet (browser)
async connect(signer: ethers.Signer | BrowserProvider): Promise<void>

// Get current address
async getAddress(): Promise<string | null>
```

#### Reserve Operations

```typescript
// Join reserve with capital
async joinReserve(
  amount: BigNumberish,
  options?: TransactionOptions
): Promise<TransactionResult>

// Propose new activity
async proposeActivity(
  activityId: string,
  capitalRequired: BigNumberish,
  options?: TransactionOptions
): Promise<TransactionResult>

// Approve activity
async approveActivity(
  activityId: string,
  options?: TransactionOptions
): Promise<TransactionResult>

// Complete activity with outcome
async completeActivity(
  activityId: string,
  outcome: bigint,
  options?: TransactionOptions
): Promise<TransactionResult>

// Deposit additional capital
async depositCapital(
  amount: BigNumberish,
  options?: TransactionOptions
): Promise<TransactionResult>

// Withdraw capital
async withdrawCapital(
  amount: BigNumberish,
  options?: TransactionOptions
): Promise<TransactionResult>

// Exit reserve (withdraw all)
async exitReserve(
  options?: TransactionOptions
): Promise<TransactionResult>
```

#### View Methods

```typescript
// Get participant info
async getParticipant(agent: string): Promise<Participant>

// Get activity info
async getActivity(activityId: string): Promise<Activity>

// Get all participants
async getParticipants(): Promise<string[]>

// Get reserve statistics
async getReserveStats(): Promise<ReserveStats>

// Get withdrawable balance
async getWithdrawableBalance(participantAddress: string): Promise<bigint>
```

#### HAI Operations

```typescript
// Track activity for HAI
async trackActivity(
  activityId: string,
  isCompliant: boolean,
  isAssetBacked: boolean,
  hasRealEconomicValue: boolean,
  validatorCount: number,
  positiveVotes: number,
  options?: TransactionOptions
): Promise<TransactionResult>

// Get HAI metrics
async getHAIMetrics(): Promise<HAIMetrics>

// Create HAI snapshot
async createSnapshot(
  options?: TransactionOptions
): Promise<TransactionResult>
```

#### Circuit Breaker

```typescript
// Check if paused
async isPaused(): Promise<boolean>

// Pause system
async pauseSystem(
  reason: string,
  options?: TransactionOptions
): Promise<TransactionResult>
```

### AmanaSolanaClient

Solana-specific client.

#### Connection Methods

```typescript
// Connect wallet
async connect(wallet: Signer): Promise<void>

// Get current address
getAddress(): PublicKey | null
```

#### PDA Helpers

```typescript
// Derive reserve PDA
getReservePDA(): [PublicKey, number]

// Derive participant PDA
getParticipantPDA(agent: PublicKey): [PublicKey, number]

// Derive activity PDA
getActivityPDA(activityId: Buffer): [PublicKey, number]

// Derive HAI PDA
getHAIPDA(): [PublicKey, number]

// Derive metrics PDA
getMetricsPDA(activityId: Buffer): [PublicKey, number]
```

#### Reserve Operations

```typescript
// Initialize reserve
async initializeReserve(
  minCapitalContribution: number,
  maxParticipants: number,
  options?: TransactionOptions
): Promise<TransactionResult>

// Join reserve
async joinReserve(
  amount: number,
  options?: TransactionOptions
): Promise<TransactionResult>

// Propose activity
async proposeActivity(
  activityId: Buffer,
  capitalRequired: number,
  description: string,
  options?: TransactionOptions
): Promise<TransactionResult>

// Approve activity
async approveActivity(
  activityId: Buffer,
  options?: TransactionOptions
): Promise<TransactionResult>

// Complete activity
async completeActivity(
  activityId: Buffer,
  outcome: number,
  options?: TransactionOptions
): Promise<TransactionResult>

// Deposit capital
async depositCapital(
  amount: number,
  options?: TransactionOptions
): Promise<TransactionResult>

// Withdraw capital
async withdrawCapital(
  amount: number,
  options?: TransactionOptions
): Promise<TransactionResult>
```

#### HAI Operations

```typescript
// Track activity for HAI
async trackActivity(
  activityId: Buffer,
  isCompliant: boolean,
  isAssetBacked: boolean,
  hasRealEconomicValue: boolean,
  validatorCount: number,
  positiveVotes: number,
  options?: TransactionOptions
): Promise<TransactionResult>

// Create HAI snapshot
async createSnapshot(
  options?: TransactionOptions
): Promise<TransactionResult>
```

---

## Event Handling

### Ethereum Events

```typescript
// Listen for participant joined
amana.ethereum.onParticipantJoined((agent, capital) => {
  console.log(`${agent} joined with ${capital} wei`);
});

// Listen for activity proposed
amana.ethereum.onActivityProposed((activityId, initiator, capital) => {
  console.log(`Activity ${activityId} proposed by ${initiator}`);
});

// Listen for activity completed
amana.ethereum.onActivityCompleted((activityId, outcome) => {
  if (outcome > 0n) {
    console.log(`Activity ${activityId} profit: ${outcome}`);
  } else {
    console.log(`Activity ${activityId} loss: ${-outcome}`);
  }
});

// Remove all listeners
amana.ethereum.removeAllListeners();
```

### Event Callback Types

```typescript
type ParticipantCallback = (agent: string, capital: bigint) => void;
type ActivityProposedCallback = (activityId: string, initiator: string, capital: bigint) => void;
type ActivityCompletedCallback = (activityId: string, outcome: bigint) => void;
```

---

## Error Handling

### Error Types

```typescript
class AmanaError extends Error {
  code: string;
  data?: unknown;
}
```

### Error Codes

```typescript
const ErrorCodes = {
  // General
  UNKNOWN: 'UNKNOWN',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_PARAMS: 'INVALID_PARAMS',

  // Participant
  NOT_PARTICIPANT: 'NOT_PARTICIPANT',
  ALREADY_PARTICIPANT: 'ALREADY_PARTICIPANT',
  INSUFFICIENT_CONTRIBUTION: 'INSUFFICIENT_CONTRIBUTION',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  MAX_PARTICIPANTS: 'MAX_PARTICIPANTS',

  // Activity
  ACTIVITY_NOT_FOUND: 'ACTIVITY_NOT_FOUND',
  ACTIVITY_ALREADY_EXISTS: 'ACTIVITY_ALREADY_EXISTS',
  INVALID_ACTIVITY_STATUS: 'INVALID_ACTIVITY_STATUS',
  INSUFFICIENT_CAPITAL: 'INSUFFICIENT_CAPITAL',

  // Transaction
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  TRANSACTION_REJECTED: 'TRANSACTION_REJECTED',
  GAS_ESTIMATION_FAILED: 'GAS_ESTIMATION_FAILED',

  // Governance
  NOT_AUTHORIZED: 'NOT_AUTHORIZED',
  VOTING_ENDED: 'VOTING_ENDED',
  QUORUM_NOT_MET: 'QUORUM_NOT_MET',
  SHARIA_NOT_APPROVED: 'SHARIA_NOT_APPROVED',
};
```

### Error Handling Pattern

```typescript
import { AmanaError, ErrorCodes } from '@amana/sdk';

try {
  await amana.ethereum.joinReserve('0.01');
} catch (error) {
  if (error instanceof AmanaError) {
    switch (error.code) {
      case ErrorCodes.INSUFFICIENT_CONTRIBUTION:
        console.log('Send more ETH');
        break;
      case ErrorCodes.ALREADY_PARTICIPANT:
        console.log('Already joined');
        break;
      case ErrorCodes.TRANSACTION_REJECTED:
        console.log('User rejected transaction');
        break;
      default:
        console.log('Error:', error.message);
    }
  }
}
```

---

## TypeScript Types

### Core Types

```typescript
// Participant
interface Participant {
  agent: string;
  capitalContributed: bigint;
  profitShare: bigint;
  lossShare: bigint;
  isActive: boolean;
  joinedAt: number;
}

// Activity
enum ActivityStatus {
  Proposed = 0,
  Approved = 1,
  Active = 2,
  Completed = 3,
  Rejected = 4,
}

interface Activity {
  activityId: string;
  initiator: string;
  capitalRequired: bigint;
  capitalDeployed: bigint;
  status: ActivityStatus;
  createdAt: number;
  completedAt: number;
  outcome: bigint;
  isValidated: boolean;
}

// Reserve Stats
interface ReserveStats {
  totalCapital: bigint;
  participantCount: number;
  activityCount: number;
  minCapitalContribution: bigint;
}

// HAI Metrics
interface HAIMetrics {
  score: number;          // 0-10000
  percentage: number;     // 0-100
  totalActivities: number;
  compliantActivities: number;
  complianceRate: number; // 0-10000
}

// Transaction Result
interface TransactionResult {
  hash: string;
  status: 'success' | 'failed';
  gasUsed?: bigint;
  blockNumber?: bigint;
}

// Transaction Options
interface TransactionOptions {
  gasLimit?: bigint;
  gasPrice?: bigint;
  value?: bigint;
}
```

### Type Guards

```typescript
// Check if error is AmanaError
function isAmanaError(error: unknown): error is AmanaError {
  return error instanceof AmanaError;
}

// Check transaction success
function isSuccessful(result: TransactionResult): boolean {
  return result.status === 'success';
}
```

---

## Best Practices

### 1. Always Check Connection

```typescript
// Before transactions
const address = await amana.ethereum.getAddress();
if (!address) {
  await amana.ethereum.connect(wallet);
}
```

### 2. Handle Transaction Results

```typescript
const result = await amana.ethereum.joinReserve('1.0');

if (result.status === 'success') {
  console.log('Success! Hash:', result.hash);
} else {
  console.log('Failed');
}
```

### 3. Use Event Listeners

```typescript
// Set up listeners once
amana.ethereum.onActivityCompleted((id, outcome) => {
  // Handle completion
});

// Clean up when done
// amana.ethereum.removeAllListeners();
```

### 4. Type Your Variables

```typescript
// Good
const activityId: string = generateActivityId();
const amount: bigint = BigInt('1000000000000000000');

// Avoid
const activityId = generateActivityId(); // any
const amount = '1.0'; // string, not bigint
```

### 5. Await Confirmations

```typescript
// For critical operations, wait for confirmation
const result = await amana.ethereum.completeActivity(id, outcome);

// Check block number
if (result.blockNumber) {
  console.log('Confirmed at block:', result.blockNumber);
}
```

---

For more information, see:
- [Ethereum Contracts](./packages/ethereum/README.md)
- [Solana Programs](./packages/solana/README.md)
- [API Reference](./API.md)
- [Examples](./EXAMPLES.md)
