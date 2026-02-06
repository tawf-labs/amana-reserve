# AMANA SDK

Unified TypeScript SDK for interacting with the AMANA Sharia-native reserve system across Ethereum and Solana, with **EIP-8004 Agent Manager** and **MagicBlock ER** support.

## Overview

The AMANA SDK provides a type-safe, chain-agnostic interface for interacting with all AMANA contracts and programs. It abstracts away the differences between Ethereum and Solana, allowing developers to write code that works seamlessly across both blockchains.

## Key Features

- **Chain-Agnostic API**: Single interface for Ethereum and Solana
- **Agent Manager**: EIP-8004 compliant agent lifecycle management
- **Real-Time Operations**: MagicBlock ER support for zero-fee, sub-second transactions
- **Type Safety**: Full TypeScript support with strict types
- **Wallet Integration**: Seamless connection to browser wallets
- **Event Listening**: Real-time updates through event listeners
- **Privacy Support**: Built-in zero-knowledge proof capabilities

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

### Ethereum with EIP-8004 Agent Manager

```typescript
import { AgentManager } from '@amana/sdk';

// Initialize with EIP-8004 agent infrastructure
const agentManager = new AgentManager({
  ethereumProvider,
  solanaConnection,
  magicBlockRouterUrl: 'https://devnet-router.magicblock.app',
  contractAddresses: {
    agentIdentityRegistry: '0x...',
    agentReputationRegistry: '0x...',
    agentValidationRegistry: '0x...',
    amanaReserve: '0x...',
    halalActivityIndex: '0x...'
  }
});

// Register Sharia-compliant agent
const registration = await agentManager.registerAgent({
  uri: 'ipfs://QmXxx...',
  shariaCompliant: true,
  capabilities: ['capital-deployment', 'hai-calculation'],
  endpoints: [
    { id: 'api', type: 'http', url: 'https://api.example.com' }
  ]
});

// Execute agent operation on Solana via MagicBlock ER
const result = await agentManager.executeAgentOperation(
  registration.ethereumAgentId,
  {
    type: 'deploy_capital',
    requiresRealTime: true,
    data: {
      activityId: 'halal-agriculture-001',
      amount: 1000000 // lamports
    }
  }
);
```

### Solana with MagicBlock ER

```typescript
import { AmanaSolanaClient } from '@amana/sdk';

const client = new AmanaSolanaClient({
  rpcUrl: 'https://api.devnet.solana.com',
  keypair: yourKeypair,
  programIds: {
    reserve: 'AMANareserve...',
    hai: 'AMANAhai...'
  },
  magicBlock: {
    routerUrl: 'https://devnet-router.magicblock.app',
    enableER: true
  }
});

// Deploy capital on ER for zero-fee, sub-second finality
await client.deployCapitalRealtime({
  activityId,
  amount: '1.0', // SOL
  useER: true
});
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

### AgentManager

Main class for EIP-8004 compliant agent lifecycle management.

```typescript
class AgentManager {
  constructor(config: AgentManagerConfig)

  // Agent Registration (EIP-8004)
  async registerAgent(params: {
    uri: string;              // IPFS hash of agent metadata
    shariaCompliant: boolean;
    capabilities: string[];     // Array of capability strings
    endpoints: AgentEndpoint[];
  }): Promise<AgentRegistration>

  // Agent Operations
  async executeAgentOperation(
    agentId: string,
    operation: {
      type: string;
      requiresRealTime?: boolean;
      data?: Record<string, unknown>;
    }
  ): Promise<OperationResult>

  // Work Submission & Validation
  async submitWork(params: {
    agentId: string;
    workId: string;
    workUri: string;
    validationAmount: string;
  }): Promise<TransactionResult>

  async submitFeedback(params: {
    agentId: string;
    feedback: {
      score: number; // 1-5 rating
      comment: string;
      tag: string;  // feedback category
    };
  }): Promise<TransactionResult>

  // Agent Information
  async getAgent(agentId: string): Promise<AgentInfo>
  async getAgentReputation(agentId: string): Promise<AgentReputation>
  async getAgentWorkHistory(agentId: string): Promise<WorkRecord[]>
}
```

### AmanaSDK

Main SDK entry point for multi-chain interactions.

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

Solana-specific client with MagicBlock ER support.

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

  // Reserve Operations
  async initializeReserve(minCapitalContribution: number, maxParticipants: number, options?: TransactionOptions): Promise<TransactionResult>
  async joinReserve(amount: number, options?: TransactionOptions): Promise<TransactionResult>
  async proposeActivity(activityId: Buffer, capitalRequired: number, description: string, options?: TransactionOptions): Promise<TransactionResult>
  async approveActivity(activityId: Buffer, options?: TransactionOptions): Promise<TransactionResult>
  async completeActivity(activityId: Buffer, outcome: number, options?: TransactionOptions): Promise<TransactionResult>

  // MagicBlock ER Operations
  async delegateReserve(params: {
    reservePDA: PublicKey;
    authority: Keypair;
    validatorRegion?: string;
  }): Promise<TransactionResult>

  async deployCapitalRealtime(params: {
    activityId: Buffer;
    amount: number;
    reservePDA: PublicKey;
    activityPDA: PublicKey;
    useER?: boolean;
  }): Promise<TransactionResult>

  async commitAndUndelegate(params: {
    reservePDA: PublicKey;
    activityPDA: PublicKey;
    authority: Keypair;
  }): Promise<TransactionResult>

  // HAI Operations with VRF
  async updateHAIWithVRF(params: {
    activityId: Buffer;
    dataSourceCount: number;
  }): Promise<TransactionResult>

  // Account Data
  async getAccountData(account: PublicKey): Promise<Buffer>
}
```

## Configuration

### Agent Manager Configuration

```typescript
interface AgentManagerConfig {
  // Ethereum
  ethereumProvider?: any;
  contractAddresses: {
    agentIdentityRegistry: string;
    agentReputationRegistry: string;
    agentValidationRegistry: string;
    amanaReserve?: string;
    halalActivityIndex?: string;
  };

  // Solana
  solanaConnection?: any;
  magicBlockRouterUrl?: string;

  // Options
  autoSelectChain?: boolean;
  enableRealTime?: boolean;
}
```

### Ethereum Configuration

```typescript
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
    agentIdentityRegistry?: string;
    agentReputationRegistry?: string;
    agentValidationRegistry?: string;
  };
}
```

### Solana Configuration with MagicBlock

```typescript
interface SolanaConfig {
  rpcUrl: string;
  wsUrl?: string;
  commitment?: 'processed' | 'confirmed' | 'finalized';
  programIds?: {
    amanaReserve?: PublicKey;
    amanaHai?: PublicKey;
    amanaDao?: PublicKey;
  };
  magicBlock?: {
    routerUrl?: string;
    enableER?: boolean;
    defaultRegion?: 'Asia' | 'EU' | 'US' | 'TEE';
  };
}
```

### SDK Configuration

```typescript
interface AmanaConfig {
  chain: ChainType;
  ethereum?: EthereumConfig;
  solana?: SolanaConfig;
}
```

## Common Types

### Agent Types (EIP-8004)

```typescript
interface AgentRegistration {
  ethereumAgentId: string;
  solanaAgentId?: string;
  tokenId: string;
  uri: string;
  shariaCompliant: boolean;
  capabilities: string[];
  registeredAt: number;
}

interface AgentEndpoint {
  id: string;
  type: 'http' | 'websocket' | 'custom';
  url: string;
  headers?: Record<string, string>;
}

interface AgentInfo {
  id: string;
  uri: string;
  shariaCompliant: boolean;
  capabilities: string[];
  endpoints: AgentEndpoint[];
  reputationScore: number;
  feedbackCount: number;
  validationCount: number;
}

interface AgentReputation {
  agentId: string;
  totalScore: number;
  feedbackCount: number;
  positiveCount: number;
  negativeCount: number;
  tagScores: Map<string, number>;
  lastUpdated: number;
}
```

### Participant

```typescript
interface Participant {
  agent: string;
  capitalContributed: bigint;
  profitShare: bigint;
  lossShare: bigint;
  isActive: boolean;
  joinedAt: number;
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
  hash: string;
  status: 'success' | 'failed';
  gasUsed?: bigint;
  blockNumber?: bigint;
}
```

## Agent Manager Operations

### Registering Sharia-Compliant Agents

```typescript
import { AgentManager } from '@amana/sdk';

const agentManager = new AgentManager({
  ethereumProvider: window.ethereum,
  contractAddresses: {
    agentIdentityRegistry: '0x...',
    agentReputationRegistry: '0x...',
    agentValidationRegistry: '0x...'
  }
});

// Register agent with compliance verification
const registration = await agentManager.registerAgent({
  uri: 'ipfs://QmXxx...',
  shariaCompliant: true,
  capabilities: [
    'capital-deployment',
    'risk-assessment',
    'hai-calculation',
    'sharia-validation'
  ],
  endpoints: [
    { id: 'api', type: 'http', url: 'https://api.example.com' },
    { id: 'websocket', type: 'websocket', url: 'wss://api.example.com' }
  ]
});

console.log('Agent ID:', registration.ethereumAgentId);
```

### Real-Time Operations via MagicBlock ER

```typescript
// Deploy capital with sub-second finality on ER
const result = await agentManager.executeAgentOperation(
  registration.ethereumAgentId,
  {
    type: 'deploy_capital',
    requiresRealTime: true,
    data: {
      activityId: 'halal-agriculture-001',
      amount: 1000000,
      assetClass: 'halal'
    }
  }
);

console.log('Transaction:', result.hash);
console.log('Finality:', result.finality); // < 1 second if using ER
```

### Agent Validation and Reputation

```typescript
// Submit work for independent validation
await agentManager.submitWork({
  agentId: registration.ethereumAgentId,
  workId: 'work-123',
  workUri: 'ipfs://QmYyy...',
  validationAmount: '0.1' // ETH stake
});

// Provide feedback on agent
await agentManager.submitFeedback({
  agentId: registration.ethereumAgentId,
  feedback: {
    score: 5,
    comment: 'Excellent Sharia-compliant execution',
    tag: 'reliability'
  }
});

// Get agent reputation
const reputation = await agentManager.getAgentReputation(
  registration.ethereumAgentId
);
console.log('Score:', reputation.totalScore);
console.log('Feedback:', reputation.feedbackCount);
```

## Error Handling

```typescript
import { AmanaError, ErrorCodes } from '@amana/sdk';

try {
  await agentManager.registerAgent({
    uri: 'ipfs://...',
    shariaCompliant: true,
    capabilities: ['capital-deployment']
  });
} catch (error) {
  if (error instanceof AmanaError) {
    switch (error.code) {
      case ErrorCodes.AGENT_ALREADY_EXISTS:
        console.log('Agent already registered');
        break;
      case ErrorCodes.INVALID_AGENT_URI:
        console.log('Invalid IPFS URI');
        break;
      case ErrorCodes.NON_SHARIA_COMPLIANT:
        console.log('Agent must be Sharia-compliant');
        break;
      default:
        console.log('Error:', error.message);
    }
  }
}
```

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
│   │   ├── client.ts      # Ethereum client
│   │   └── agent.ts       # EIP-8004 agent manager
│   ├── solana/
│   │   ├── client.ts      # Solana client
│   │   └── er.ts          # MagicBlock ER integration
│   └── utils.ts               # Helper functions
├── package.json
├── tsconfig.json
└── README.md
```

## Dependencies

- **ethers** v6+ - Ethereum interaction
- **@solana/web3.js** - Solana interaction
- **@project-serum/anchor** - Solana program framework
- **magicblock-sdk** - MagicBlock ER integration

## License

Apache 2.0
