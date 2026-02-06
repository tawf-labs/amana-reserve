# AMANA Cross-Chain Package

Cross-chain interoperability layer for the AMANA Sharia-native reserve system.

## Overview

This package enables seamless asset transfers and data synchronization between Ethereum and Solana blockchains. It provides a unified bridge interface supporting multiple bridge providers.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Bridge Manager                            │
│  • Provider selection  • Fee comparison  • Status tracking  │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
┌─────────────────────┐           ┌─────────────────────────┐
│   Wormhole Bridge   │           │    LayerZero Bridge      │
│                     │           │                         │
│ • VAA handling      │           │ • Ultra-light nodes     │
│ • Guardian network  │           │ • Packet messaging      │
│ • Token transfers   │           │ • Endpoint management   │
└─────────────────────┘           └─────────────────────────┘
        │                                       │
        └───────────────────┬───────────────────┘
                            ▼
                  ┌─────────────────┐
                  │  Chain Abstraction│
                  │  • Ethereum      │
                  │  • Solana        │
                  └─────────────────┘
```

## Features

### Token Bridging

Transfer AMANA tokens and other assets between chains.

```typescript
import { BridgeManager } from '@amana/cross-chain';

const bridge = new BridgeManager({
  ethereum: { rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY' },
  solana: { rpcUrl: 'https://api.mainnet-beta.solana.com' }
});

// Bridge tokens from Ethereum to Solana
const transfer = await bridge.transfer({
  from: 'ethereum',
  to: 'solana',
  amount: '1000000000000000000', // 1 AMANA
  asset: 'AMANA',
  recipient: 'SolanaAddress...'
});

console.log('Transfer ID:', transfer.id);
```

### HAI Synchronization

Synchronize Halal Activity Index scores across chains.

```typescript
// Broadcast HAI update to all chains
await bridge.syncHAI({
  score: 8500,
  timestamp: Date.now(),
  activities: 100,
  compliant: 85
});

// Get HAI from any chain
const hai = await bridge.getHAI('solana');
```

### Multi-Provider Support

Automatic selection of optimal bridge provider.

```typescript
// Get fee estimates from all providers
const fees = await bridge.estimateFees({
  from: 'ethereum',
  to: 'solana',
  amount: '1000000000000000000'
});

console.log(fees);
// {
//   wormhole: { amount: '5000000000000000', usd: '10.50' },
//   layerzero: { amount: '3000000000000000', usd: '6.30' }
// }

// Use cheapest provider automatically
const transfer = await bridge.transfer({
  from: 'ethereum',
  to: 'solana',
  amount: '1000000000000000000',
  autoSelectProvider: true
});
```

## Installation

```bash
# From repository root
cd packages/cross-chain

# Install dependencies
pnpm install

# Build TypeScript
pnpm build
```

## Configuration

### Bridge Configuration

```typescript
interface BridgeConfig {
  ethereum: {
    rpcUrl: string;
    wormhole?: {
      tokenBridge: string;    // Wormhole token bridge address
      relayer?: string;        // Optional relayer
    };
    layerzero?: {
      endpoint: string;        // LayerZero endpoint address
    };
  };
  solana: {
    rpcUrl: string;
    wormhole?: {
      tokenBridge: string;    // Wormhole program ID
    };
    layerzero?: {
      endpoint: string;        // LayerZero program ID
    };
  };
}
```

### Environment Variables

```bash
# Ethereum
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
WORMHOLE_ETH_TOKEN_BRIDGE=0x...
LAYERZERO_ETH_ENDPOINT=0x...

# Solana
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
WORMHOLE_SOL_TOKEN_BRIDGE= wormholeTokenBridge...
LAYERZERO_SOL_ENDPOINT= layerzeroEndpoint...

# Bridge Settings
DEFAULT_BRIDGE=wormhole
AUTO_SELECT_PROVIDER=true
MAX_FEE_USD=50
```

## API Reference

### BridgeManager

Main class for cross-chain operations.

```typescript
class BridgeManager {
  constructor(config: BridgeConfig)

  // Token transfers
  async transfer(params: TransferParams): Promise<TransferResult>
  async estimateFees(params: FeeEstimateParams): Promise<FeeEstimates>
  async getTransferStatus(transferId: string): Promise<TransferStatus>

  // HAI synchronization
  async syncHAI(data: HAIData): Promise<SyncResult>
  async getHAI(chain: Chain): Promise<HAIData>

  // Provider management
  async setDefaultProvider(provider: BridgeProvider): void
  async getProviders(): Promise<BridgeProvider[]>

  // Status
  async isTransferComplete(transferId: string): Promise<boolean>
}
```

### Transfer Parameters

```typescript
interface TransferParams {
  from: 'ethereum' | 'solana';
  to: 'ethereum' | 'solana';
  amount: string;              // Amount in smallest units
  asset: string;               // Token symbol or address
  recipient: string;           // Recipient address
  provider?: 'wormhole' | 'layerzero';
  autoSelectProvider?: boolean;
}
```

### Transfer Result

```typescript
interface TransferResult {
  id: string;                  // Unique transfer ID
  provider: BridgeProvider;
  fromChain: Chain;
  toChain: Chain;
  amount: string;
  asset: string;
  recipient: string;
  estimatedTime: number;       // Seconds
  txHash: string;              // Initial transaction hash
}
```

### Transfer Status

```typescript
interface TransferStatus {
  id: string;
  status: 'pending' | 'confirming' | 'completed' | 'failed';
  provider: BridgeProvider;
  fromChain: Chain;
  toChain: Chain;
  amount: string;
  createdAt: number;
  confirmedAt?: number;
  completedAt?: number;
  vaa?: string;                // Wormhole VAA (if applicable)
}
```

## Wormhole Integration

### Wormhole Bridge

```typescript
import { WormholeBridge } from '@amana/cross-chain';

const bridge = new WormholeBridge({
  ethereum: {
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY',
    tokenBridge: '0x...'
  },
  solana: {
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    tokenBridge: 'wormholeTokenBridge...'
  }
});

// Initiate transfer
const result = await bridge.transfer({
  from: 'ethereum',
  to: 'solana',
  amount: '1000000000000000000',
  recipient: 'SolanaAddress...'
});

// Get VAA (when ready)
const vaa = await bridge.getVAA(result.id);
```

### VAA Handling

```typescript
// Parse VAA
const parsed = WormholeBridge.parseVAA(vaaBytes);

// Verify VAA
const isValid = await WormholeBridge.verifyVAA(vaaBytes);

// Redeem VAA on destination chain
await bridge.redeem(vaaBytes);
```

## LayerZero Integration

### LayerZero Bridge

```typescript
import { LayerZeroBridge } from '@amana/cross-chain';

const bridge = new LayerZeroBridge({
  ethereum: {
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY',
    endpoint: '0x...'
  },
  solana: {
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    endpoint: 'layerzeroEndpoint...'
  }
});

// Send message/packet
const result = await bridge.send({
  from: 'ethereum',
  to: 'solana',
  payload: encodePayload(data),
  recipient: 'SolanaAddress...'
});
```

## HAI Synchronization

### Broadcasting Updates

```typescript
import { BridgeManager } from '@amana/cross-chain';

const bridge = new BridgeManager(config);

// Broadcast HAI update from Ethereum to other chains
await bridge.syncHAI({
  score: 8500,
  timestamp: Date.now(),
  activities: 100,
  compliant: 85,
  assetBacked: 90,
  economicValue: 88
});
```

### Receiving Updates

```typescript
// Listen for HAI updates
bridge.onHAIUpdate((update, sourceChain) => {
  console.log(`HAI update from ${sourceChain}:`, update);

  // Verify and apply update
  if (verifyUpdate(update)) {
    applyHAIUpdate(update);
  }
});
```

## Chain Utilities

```typescript
import { ChainUtils } from '@amana/cross-chain';

// Convert chain ID to name
const name = ChainUtils.idToName(1); // 'ethereum'

// Get chain-specific address format
const formatted = ChainUtils.formatAddress(address, 'solana');

// Validate address for chain
const isValid = ChainUtils.isValidAddress(address, 'ethereum');

// Convert transaction hash format
const txHash = ChainUtils.convertTxHash(solanaSignature, 'ethereum');
```

## Error Handling

```typescript
import { BridgeError, ErrorCodes } from '@amana/cross-chain';

try {
  await bridge.transfer(params);
} catch (error) {
  if (error instanceof BridgeError) {
    switch (error.code) {
      case ErrorCodes.INSUFFICIENT_BALANCE:
        // Handle insufficient balance
        break;
      case ErrorCodes.INVALID_AMOUNT:
        // Handle invalid amount
        break;
      case ErrorCodes.BRIDGE_UNAVAILABLE:
        // Handle bridge unavailable
        break;
      case ErrorCodes.TRANSFER_TIMEOUT:
        // Handle timeout
        break;
    }
  }
}
```

## Building

```bash
# Build TypeScript
pnpm build

# Watch mode
pnpm build:watch

# Clean
pnpm clean
```

## Testing

```bash
# Run tests
pnpm test

# Run with coverage
pnpm test:coverage

# Integration tests (requires testnet)
pnpm test:integration
```

## Project Structure

```
packages/cross-chain/
├── src/
│   ├── bridge.ts              # Main bridge manager
│   ├── providers/
│   │   ├── wormhole.ts        # Wormhole implementation
│   │   └── layerzero.ts       # LayerZero implementation
│   ├── chains/
│   │   ├── ethereum.ts        # Ethereum utilities
│   │   └── solana.ts          # Solana utilities
│   ├── sync/
│   │   ├── hai.ts             # HAI synchronization
│   │   └── state.ts           # State sync
│   ├── utils.ts               # Helper functions
│   └── types.ts               # TypeScript types
├── test/
│   ├── bridge.test.ts
│   ├── providers.test.ts
│   └── sync.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Transfer Flow

```
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│   Ethereum  │          │   Bridge    │          │   Solana    │
│   Source    │          │   Network   │          │  Dest.      │
└──────┬──────┘          └──────┬──────┘          └──────┬──────┘
       │                        │                        │
       │  1. Lock tokens        │                        │
       │───────────────────────>│                        │
       │                        │                        │
       │  2. Emit VAA/Packet    │                        │
       │<───────────────────────│                        │
       │                        │                        │
       │                        │  3. Relay VAA/Packet   │
       │                        │───────────────────────>│
       │                        │                        │
       │                        │  4. Verify & Release  │
       │                        │<───────────────────────│
       │                        │                        │
       │                        │  5. Confirm completion │
       │                        │<───────────────────────│
```

## Security Considerations

1. **Trusted Relayers**: Wormhole uses guardian network, LayerZero uses oracles
2. **Finality**: Wait for chain finality before trusting transfers
3. **Verification**: Always verify VAAs and packets before redemption
4. **Reentrancy**: Protect against reentrancy in bridge contracts
5. **Authorization**: Verify sender authorization for cross-chain messages

## Fee Comparison

| Bridge Provider | Est. Time | Est. Cost (USD) |
|-----------------|-----------|-----------------|
| Wormhole | 15-30 min | $10-20 |
| LayerZero | 5-15 min | $5-15 |

## Dependencies

- **ethers** ^6.9.0 - Ethereum interaction
- **viem** ^2.0.0 - Ethereum client
- **@solana/web3.js** - Solana interaction

## License

Apache 2.0
