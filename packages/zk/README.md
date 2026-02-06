# AMANA ZK Package

Zero-knowledge privacy layer for the AMANA Sharia-native reserve system.

## Overview

This package implements zero-knowledge proof functionality for privacy-preserving participation in the AMANA system. It enables anonymous operations while maintaining verifiable Sharia compliance.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│  • Proof generation  • Proof verification  • Identity mgmt  │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Proofs       │   │   Circuits    │   │   Identity    │
│               │   │               │   │               │
│ • Groth16     │   │ • Activity    │   │ • Semaphore   │
│ • Generation  │   │ • HAI         │   │ • Groups      │
│ • Verification│   │ • Compliance  │   │ • Merkle      │
└───────────────┘   └───────────────┘   └───────────────┘
```

## Components

### Proof Generator (`src/proof-generator.ts`)

Handles generation and verification of Groth16 zero-knowledge proofs.

**Features:**
- Proof generation for activities
- Proof verification
- Verification key management
- Public/private input handling

```typescript
import { ProofGenerator } from '@amana/zk';

const generator = new ProofGenerator();

// Generate proof
const proof = await generator.generateProof({
  activityHash: '0x...',
  minCapital: 100000000000000000n,
  complianceRequirement: true,
  // Private inputs
  agentCapital: 500000000000000000n,
  isCompliant: true,
  agentPublicKey: '0x...',
  activitySalt: generateSalt()
});

// Verify proof
const isValid = await generator.verifyProof(proof, publicSignals);
```

### Agent Identity (`src/agent-identity.ts`)

Anonymous identity management using Semaphore protocol.

**Features:**
- Identity creation
- Group membership
- Merkle proof generation
- Signal broadcasting

```typescript
import { AgentIdentity } from '@amana/zk';

// Create identity
const identity = await AgentIdentity.create();
console.log(identity.commitment); // Public commitment
console.log(identity.privateKey); // Keep secret!

// Export for storage
const exported = identity.export();
const imported = await AgentIdentity.import(exported);
```

### Circuits (`circuits/`)

Circom circuits defining zero-knowledge computations.

#### Activity Validation Circuit

**File:** `circuits/activity-validation.circom`

Validates agent capital requirements and Sharia compliance privately.

**Inputs:**
- **Public:**
  - `activityHash` - Hash of activity data
  - `minCapital` - Minimum capital requirement
  - `complianceRequirement` - Compliance flag

- **Private:**
  - `agentCapital` - Agent's actual capital
  - `isCompliant` - Activity compliance status
  - `agentPublicKey` - Agent's public key
  - `activitySalt` - Random salt for uniqueness

**Output:**
- `isValid` - Whether all conditions are met

#### HAI Computation Circuit

**File:** `circuits/hai-computation.circom`

Computes Halal Activity Index score with privacy.

**Inputs:**
- **Public:**
  - `weights[4]` - Scoring weights
  - `expectedScore` - Expected result for verification

- **Private:**
  - `complianceScore` - Compliance component
  - `assetBackingScore` - Asset backing component
  - `economicValueScore` - Economic value component
  - `validatorScore` - Validator participation score

**Output:**
- `haiScore` - Computed HAI score (0-10000)

## Installation

```bash
# From repository root
cd packages/zk

# Install dependencies
pnpm install

# Build circuits (requires Circom)
pnpm build:circuits

# Build TypeScript
pnpm build
```

## Circom Setup

### Install Circom

```bash
# Install Circom
cargo install --git https://github.com/iden3/circom circom

# Install snarkjs
npm install -g snarkjs

# Verify installation
circom --version
snarkjs groth16 --help
```

## Circuit Compilation

```bash
# Navigate to circuits directory
cd circuits

# Compile activity validation circuit
circom activity-validation.circom --r1cs --wasm --sym

# Compile HAI computation circuit
circom hai-computation.circom --r1cs --wasm --sym

# Generate proving key (trusted setup)
snarkjs groth16 setup activity-validation.r1cs pot.ptau activity-validation_0000.zkey

# Export verification key
snarkjs zkey export verificationkey activity-validation_0000.zkey activity-validation_vkey.json
```

## Usage

### Identity Management

```typescript
import { AgentIdentity } from '@amana/zk';

// Create new identity
const identity = await AgentIdentity.create();

// Get public commitment (for registration)
const commitment = identity.getCommitment();

// Generate Merkle proof (for group membership)
const merkleProof = await identity.generateMerkleProof(groupMembers);

// Broadcast signal anonymously
const signal = await identity.broadcastSignal(groupMembers, merkleProof, "Hello!");
```

### Activity Proof

```typescript
import { ProofGenerator, ProofInputs } from '@amana/zk';

const generator = new ProofGenerator('activity-validation');

// Prepare inputs
const inputs: ProofInputs = {
  // Public
  activityHash: hashActivity(activityData),
  minCapital: 100000000000000000n,
  complianceRequirement: true,

  // Private
  agentCapital: 500000000000000000n,
  isCompliant: true,
  agentPublicKey: identity.publicKey,
  activitySalt: generateSalt()
};

// Generate proof
const proof = await generator.generateProof(inputs);

// Get public signals
const publicSignals = generator.getPublicSignals(inputs);

// Verify (for testing)
const isValid = await generator.verifyProof(proof, publicSignals);
```

### HAI Proof

```typescript
const haiGenerator = new ProofGenerator('hai-computation');

const haiInputs: ProofInputs = {
  // Public
  weights: [4000, 2500, 2000, 1500],
  expectedScore: 8500,

  // Private
  complianceScore: 90,
  assetBackingScore: 85,
  economicValueScore: 80,
  validatorScore: 85
};

const haiProof = await haiGenerator.generateProof(haiInputs);
```

## API Reference

### ProofGenerator

```typescript
class ProofGenerator {
  constructor(circuitName: 'activity-validation' | 'hai-computation')

  // Generate proof
  async generateProof(inputs: ProofInputs): Promise<Proof>

  // Verify proof
  async verifyProof(proof: Proof, publicSignals: string[]): Promise<boolean>

  // Export verification key
  exportVerificationKey(): object

  // Calculate public signals
  getPublicSignals(inputs: ProofInputs): string[]
}
```

### AgentIdentity

```typescript
class AgentIdentity {
  // Create new identity
  static async create(): Promise<AgentIdentity>

  // Import existing identity
  static async import(data: string): Promise<AgentIdentity>

  // Export identity
  export(): string

  // Get commitment
  getCommitment(): string

  // Generate Merkle proof
  async generateMerkleProof(groupMembers: string[]): Promise<MerkleProof>

  // Broadcast signal
  async broadcastSignal(
    groupMembers: string[],
    merkleProof: MerkleProof,
    signal: string
  ): Promise<BroadcastResult>

  // Verify signal
  static async verifySignal(
    signal: string,
    proof: MerkleProof,
    root: string
  ): Promise<boolean>
}
```

### Types

```typescript
interface ProofInputs {
  // Public inputs
  activityHash?: string;
  minCapital?: bigint;
  complianceRequirement?: boolean;
  weights?: number[];
  expectedScore?: number;

  // Private inputs
  agentCapital?: bigint;
  isCompliant?: boolean;
  agentPublicKey?: string;
  activitySalt?: bigint;
  complianceScore?: number;
  assetBackingScore?: number;
  economicValueScore?: number;
  validatorScore?: number;
}

interface Proof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
  curve: string;
}

interface MerkleProof {
  pathElements: string[];
  pathIndices: number[];
  root: string;
}
```

## Building

```bash
# Build TypeScript
pnpm build

# Build circuits
pnpm build:circuits

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

# Watch mode
pnpm test:watch
```

## Project Structure

```
packages/zk/
├── circuits/
│   ├── activity-validation.circom
│   ├── hai-computation.circom
│   └── build/                  # Compiled circuit outputs
├── src/
│   ├── proof-generator.ts      # Proof generation/verification
│   ├── agent-identity.ts       # Identity management
│   ├── circuits/
│   │   ├── activity.ts         # Activity circuit interface
│   │   └── hai.ts              # HAI circuit interface
│   └── utils.ts                # Helper functions
├── test/
│   ├── proof.test.ts
│   ├── identity.test.ts
│   └── circuits.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Security Considerations

1. **Trusted Setup**: Circuit proving keys require a trusted setup ceremony
2. **Private Key Storage**: Identity private keys must be securely stored
3. **Randomness**: Use secure random number generation for salts
4. **Verification**: Always verify proofs before accepting results

## Performance

| Operation | Time (avg) |
|-----------|------------|
| Identity creation | ~100ms |
| Proof generation | ~5-10s |
| Proof verification | ~100ms |
| Merkle proof generation | ~50ms |

## Dependencies

- **snarkjs** - Groth16 proof system
- **circom** - Circuit compiler
- **@semaphore-protocol** - Anonymous identity
- **ethers** - Ethereum utilities

## License

Apache 2.0
