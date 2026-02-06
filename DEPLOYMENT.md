# AMANA Deployment Guide

Complete deployment instructions for all components of the AMANA system.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [EIP-8004 Agent Infrastructure Deployment](#eip-8004-agent-infrastructure-deployment)
- [Contract Deployment (Ethereum)](#contract-deployment-ethereum)
- [Program Deployment (Solana)](#program-deployment-solana)
- [MagicBlock ER Deployment](#magicblock-er-deployment)
- [Verifying Contracts](#verifying-contracts)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Bridge Deployment](#bridge-deployment)
- [Monitoring Setup](#monitoring-setup)

---

## Prerequisites

### Required Software

- Node.js 18+
- pnpm package manager
- Foundry (for Ethereum)
- Rust and Anchor (for Solana)
- Docker (optional, for containerized deployment)
- MagicBlock CLI (for ER deployment)

### Required Accounts

- Ethereum RPC endpoint (Infura, Alchemy, etc.)
- Solana RPC endpoint
- MagicBlock Router endpoint (for ER deployment)
- Etherscan API key (for verification)
- Domain name (for production frontend)

### Hardware Requirements

**Minimum for Development:**
- 4 CPU cores
- 8GB RAM
- 20GB SSD

**Recommended for Production:**
- 8+ CPU cores
- 16GB+ RAM
- 100GB+ SSD

---

## Environment Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# ========== Ethereum ==========
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
ETHEREUM_CHAIN_ID=1
ETHEREUM_PRIVATE_KEY=your_private_key_here

# ========== Solana ==========
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_PRIVATE_KEY=your_base58_encoded_key

# ========== MagicBlock ER ==========
MAGICBLOCK_ROUTER_URL=https://router.magicblock.app
MAGICBLOCK_DEVNET_URL=https://devnet-router.magicblock.app

# ========== Backend ==========
BACKEND_PORT=3000
BACKEND_HOST=0.0.0.0
DATABASE_URL=postgresql://user:pass@localhost:5432/amana
REDIS_URL=redis://localhost:6379

# ========== Frontend ==========
NEXT_PUBLIC_API_URL=https://api.amana.finance
NEXT_PUBLIC_AMANA_CHAIN=ethereum
NEXT_PUBLIC_ENABLE_MAGICBLOCK=true

# ========== Cross-Chain ==========
WORMHOLE_ETH_RPC=https://mainnet.infura.io/v3/YOUR_KEY
WORMHOLE_SOL_RPC=https://api.mainnet-beta.solana.com

# ========== EIP-8004 Agent Infrastructure ==========
AGENT_IDENTITY_REGISTRY_ADDRESS=0x...
AGENT_REPUTATION_REGISTRY_ADDRESS=0x...
AGENT_VALIDATION_REGISTRY_ADDRESS=0x...

# ========== Monitoring ==========
SENTRY_DSN=https://sentry.io/your-dsn
LOG_LEVEL=info
```

### Network Selection

| Network | Type | Chain ID | RPC |
|---------|------|----------|-----|
| Ethereum | Mainnet | 1 | Your Infura/Alchemy URL |
| Ethereum | Sepolia | 11155111 | https://sepolia.infura.io/v3/YOUR_KEY |
| Solana | Mainnet | N/A | https://api.mainnet-beta.solana.com |
| Solana | Devnet | N/A | https://api.devnet.solana.com |
| MagicBlock ER | Devnet | N/A | https://devnet-router.magicblock.app |

---

## EIP-8004 Agent Infrastructure Deployment

The EIP-8004 contracts must be deployed first as they provide the foundation for agent management.

### Deploy Agent Identity Registry

```bash
cd packages/ethereum

# Deploy AgentIdentityRegistry (ERC-721)
forge create \
  contracts/agent/AgentIdentityRegistry.sol:AgentIdentityRegistry \
  --constructor-args \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --verify \
  --etherscan-api-key $ETHERSCAN_KEY

# Record the address
export AGENT_IDENTITY_REGISTRY=0x...
```

### Deploy Agent Reputation Registry

```bash
# Deploy AgentReputationRegistry
forge create \
  contracts/agent/AgentReputationRegistry.sol:AgentReputationRegistry \
  --constructor-args $(cast abi-encode "constructor(address)" $AGENT_IDENTITY_REGISTRY) \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

export AGENT_REPUTATION_REGISTRY=0x...
```

### Deploy Agent Validation Registry

```bash
# Deploy AgentValidationRegistry
forge create \
  contracts/agent/AgentValidationRegistry.sol:AgentValidationRegistry \
  --constructor-args $(cast abi-encode "constructor(address,address)" $AGENT_IDENTITY_REGISTRY $AGENT_REPUTATION_REGISTRY) \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

export AGENT_VALIDATION_REGISTRY=0x...
```

### Configure Registries

```bash
# Set initial parameters on Identity Registry
cast send \
  $AGENT_IDENTITY_REGISTRY \
  "setOrganizationAdmin(uint256,address)" \
  1 $ADMIN_ADDRESS \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Set validation parameters
cast send \
  $AGENT_VALIDATION_REGISTRY \
  "setValidationParameters(uint256,uint256,uint256)" \
  10000000000000000 300000 5000000000000000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

---

## Contract Deployment (Ethereum)

### Build Contracts

```bash
cd packages/ethereum

# Install dependencies
forge install

# Compile contracts
forge build

# Run tests
forge test

# Check gas costs
forge test --gas-report
```

### Deployment Script with EIP-8004

```bash
# Set deployment private key
export PRIVATE_KEY=your_private_key

# Deploy to Sepolia testnet
forge script script/DeployAll.s.sol \
  --broadcast \
  --rpc-url https://sepolia.infura.io/v3/YOUR_KEY \
  --verify \
  --etherscan-api-key YOUR_ETHERSCAN_KEY \
  --delay 15
```

### Manual Deployment

```bash
# Deploy AmanaReserve
forge create \
  contracts/AmanaReserve.sol:AmanaReserve \
  --constructor-args $(cast abi-encode "constructor(uint256)" 100000000000000000) \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Deploy AmanaToken
forge create \
  contracts/AmanaToken.sol:AmanaToken \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Deploy HalalActivityIndex
forge create \
  contracts/HalalActivityIndex.sol:HalalActivityIndex \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Deploy ActivityValidator
forge create \
  contracts/ActivityValidator.sol:ActivityValidator \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Deploy CapitalPool
forge create \
  contracts/CapitalPool.sol:CapitalPool \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Deploy RiskSharing
forge create \
  contracts/RiskSharing.sol:RiskSharing \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Deploy CircuitBreaker
forge create \
  contracts/CircuitBreaker.sol:CircuitBreaker \
  --constructor-args $(cast abi-encode "constructor(uint256)" 86400) \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Deploy AmanaDAO
forge create \
  contracts/AmanaDAO.sol:AmanaDAO \
  --constructor-args $(cast abi-encode "constructor(address)" 0x...) \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### Post-Deployment Setup

```bash
# Initialize contracts
cast send \
  $RESERVE_ADDRESS \
  "initialize(uint256)" \
  100000000000000000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Set up permissions and roles
cast send \
  $DAO_ADDRESS \
  "grantRole(bytes32,address)" \
  0x... $SHARIA_BOARD_MEMBER \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

---

## Program Deployment (Solana)

### Build Programs

```bash
cd packages/solana

# Build programs
anchor build

# Run tests
anchor test

# Check program size
anchor keys list
```

### Deployment to Devnet

```bash
# Configure for devnet
solana config set --url devnet

# Deploy programs
anchor deploy \
  --program-name amana_reserve \
  --provider.cluster devnet

anchor deploy \
  --program-name amana_dao \
  --provider.cluster devnet

anchor deploy \
  --program-name amana_hai \
  --provider.cluster devnet
```

### Deployment to Mainnet

```bash
# Configure for mainnet
solana config set --url mainnet-beta

# Deploy programs
anchor deploy \
  --program-name amana_reserve \
  --provider.cluster mainnet

anchor deploy \
  --program-name amana_dao \
  --provider.cluster mainnet

anchor deploy \
  --program-name amana_hai \
  --provider.cluster mainnet
```

### Program Size Check

```bash
# Check program size
solana program show <PROGRAM_ID>

# Max size: 1MB (for mainnet)
# If larger, need to optimize or split programs
```

---

## MagicBlock ER Deployment

### Prerequisites

```bash
# Install MagicBlock CLI
npm install -g @magicblock/cli

# Configure MagicBlock
magicblock configure --router https://devnet-router.magicblock.app
```

### Deploy ER Program

```bash
cd packages/solana

# Build for MagicBlock
anchor build --provider.cluster devnet

# Deploy to MagicBlock ER
magicblock deploy \
  --program amana_reserve \
  --ephemeral

# The program will be deployed to the ER environment
# with zero-fee execution capabilities
```

### Configure Delegation

```bash
# Set up delegation authority
magicblock delegate \
  --program amana_reserve \
  --authority $DELEGATE_AUTHORITY

# This allows the delegate PDA to be controlled
# on the ephemeral rollup for zero-fee operations
```

### Test ER Operations

```bash
# Test zero-fee capital deployment
magicblock execute \
  --instruction deploy_capital_realtime \
  --params '{"activity_id": "...", "amount": 1000000}'

# Verify zero fees
magicblock fees --transaction <TX_SIGNATURE>
# Should show: 0 SOL
```

### VRF Integration Setup

```bash
# Configure VRF for HAI sampling
cast send \
  $HAI_PROGRAM_ID \
  "enableVRF(address)" \
  $VRF_PROGRAM_ID \
  --rpc-url $SOLANA_RPC_URL

# Test VRF request
magicblock vrf-request \
  --callback hai_update \
  --seed 12345 \
  --data-source-count 10
```

---

## Verifying Contracts

### Etherscan Verification

```bash
# Verify on Etherscan
forge verify-contract \
  $CONTRACT_ADDRESS \
  src/AmanaReserve.sol:AmanaReserve \
  --constructor-args $(cast abi-encode "constructor(uint256)" 100000000000000000) \
  --chain-id 1 \
  --etherscan-api-key $ETHERSCAN_KEY \
  --watch
```

### Verify EIP-8004 Contracts

```bash
# Verify AgentIdentityRegistry
forge verify-contract \
  $AGENT_IDENTITY_REGISTRY \
  src/agent/AgentIdentityRegistry.sol:AgentIdentityRegistry \
  --chain-id 1 \
  --etherscan-api-key $ETHERSCAN_KEY

# Verify AgentReputationRegistry
forge verify-contract \
  $AGENT_REPUTATION_REGISTRY \
  src/agent/AgentReputationRegistry.sol:AgentReputationRegistry \
  --constructor-args $(cast abi-encode "constructor(address)" $AGENT_IDENTITY_REGISTRY) \
  --chain-id 1 \
  --etherscan-api-key $ETHERSCAN_KEY
```

### Blockscout Verification

```bash
# Verify on Blockscout (cheaper alternative)
forge verify-contract \
  --constructor-args $(cast abi-encode "constructor(uint256)" 100000000000000000) \
  --chain-id 1 \
  --verifier blockscout \
  $CONTRACT_ADDRESS \
  src/AmanaReserve.sol:AmanaReserve
```

---

## Backend Deployment

### Build

```bash
cd packages/backend

# Install dependencies
pnpm install

# Build TypeScript
pnpm build

# Run tests
pnpm test
```

### Docker Deployment

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: ./packages/backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - ETHEREUM_RPC_URL=${ETHEREUM_RPC_URL}
      - SOLANA_RPC_URL=${SOLANA_RPC_URL}
      - MAGICBLOCK_ROUTER_URL=${MAGICBLOCK_ROUTER_URL}
      - AGENT_IDENTITY_REGISTRY_ADDRESS=${AGENT_IDENTITY_REGISTRY_ADDRESS}
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
```

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start process
pm2 start pnpm --name "amana-backend" -- start

# Configure for auto-restart
pm2 startup
pm2 save
```

---

## Frontend Deployment

### Build

```bash
cd packages/frontend

# Install dependencies
pnpm install

# Build for production
pnpm build

# Test production build
pnpm start
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Environment Variables

```bash
# .env.production
NEXT_PUBLIC_API_URL=https://api.amana.finance
NEXT_PUBLIC_AMANA_CHAIN=ethereum
NEXT_PUBLIC_AMANA_ETHEREUM_RPC=https://mainnet.infura.io/v3/YOUR_KEY
NEXT_PUBLIC_AMANA_ETHEREUM_RESERVE=0x...
NEXT_PUBLIC_AGENT_IDENTITY_REGISTRY=0x...
NEXT_PUBLIC_ENABLE_MAGICBLOCK=true
NEXT_PUBLIC_MAGICBLOCK_ROUTER_URL=https://router.magicblock.app
NEXT_PUBLIC_ENABLE_DARK_MODE=true
```

---

## Bridge Deployment

### Deploy Bridge Contracts

```bash
cd packages/cross-chain

# Deploy Wormhole token bridge adapter
forge script script/Bridge.s.sol \
  --broadcast \
  --rpc-url $ETHEREUM_RPC_URL \
  --private-key $PRIVATE_KEY
```

### Start Relayer

```bash
# Install dependencies
pnpm install

# Build relayer
pnpm build

# Start relayer service
pnpm start:relayer
```

### Monitor Bridge Health

```bash
# Check bridge status
pnpm monitor

# View logs
pnpm logs:relayer
```

---

## Monitoring Setup

### Logging

```bash
# Install Winston logger
pnpm add winston winston-daily-rotate-file

# Configure logging in backend
```

### Metrics Collection

```typescript
// Using Prometheus
import { Counter, Histogram, register } from 'prom-client';

const transactionCounter = new Counter({
  name: 'amana_transactions_total',
  help: 'Total transactions processed',
  labelNames: ['chain', 'operation', 'status']
});

const erTransactionCounter = new Counter({
  name: 'amana_er_transactions_total',
  help: 'Total ER transactions (zero-fee)',
  labelNames: ['operation', 'status']
});

register.register();
```

### Health Checks

```bash
# Backend health check
curl https://api.amana.finance/health

# Returns system status including:
# - API status
# - Blockchain connections
# - MagicBlock ER status
# - Agent registry status
```

### Error Tracking (Sentry)

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

---

## Production Checklist

### Pre-Deployment

- [ ] All security audits completed
- [ ] Tests passing with required coverage
- [ ] EIP-8004 contracts deployed and verified
- [ ] Environment variables configured
- [ ] DNS records configured
- [ ] SSL certificates installed
- [ ] Monitoring services set up
- [ ] MagicBlock ER configured

### Deployment Day

- [ ] Deploy EIP-8004 contracts to testnet first
- [ ] Deploy core contracts to testnet
- [ ] Deploy Solana programs to devnet
- [ ] Deploy MagicBlock ER programs
- [ ] Verify all deployments
- [ ] Run integration tests
- [ ] Deploy to production
- [ ] Monitor initial transactions
- [ ] Have rollback plan ready

### Post-Deployment

- [ ] Verify all services operational
- [ ] Check monitoring dashboards
- [ ] Verify EIP-8004 agent registration works
- [ ] Test MagicBlock ER zero-fee operations
- [ ] Monitor for 24-48 hours
- [ ] Address any issues promptly

---

## Troubleshooting

### Common Issues

**EIP-8004 Agent Registration Fails**
```bash
# Check if Identity Registry is deployed
cast code $AGENT_IDENTITY_REGISTRY --rpc-url $RPC_URL

# Verify organization exists
cast call \
  $AGENT_IDENTITY_REGISTRY \
  "getOrganization(uint256)(bool)" \
  1 \
  --rpc-url $RPC_URL
```

**MagicBlock ER Deployment Fails**
```bash
# Check Router status
magicblock status --router https://devnet-router.magicblock.app

# Verify program is ER-compatible
magicblock check --program amana_reserve
```

**Zero-Fee Operations Not Working**
```bash
# Verify delegation is set
magicblock delegate-status --program amana_reserve

# Check if PDA is delegated
cast call \
  $RESERVE_ADDRESS \
  "delegate()(address)" \
  --rpc-url $SOLANA_RPC_URL
```

**VRF Request Fails**
```bash
# Check VRF program integration
cast call \
  $HAI_PROGRAM_ID \
  "vrfEnabled()(bool)" \
  --rpc-url $SOLANA_RPC_URL

# Re-enable VRF if needed
cast send \
  $HAI_PROGRAM_ID \
  "enableVRF(address)" \
  $VRF_PROGRAM_ID \
  --rpc-url $SOLANA_RPC_URL
```

---

For more information, see:
- [README.md](./README.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
