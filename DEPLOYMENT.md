# AMANA Deployment Guide

Complete deployment instructions for all components of the AMANA system.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Contract Deployment (Ethereum)](#contract-deployment-ethereum)
- [Program Deployment (Solana)](#program-deployment-solana)
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

### Required Accounts

- Ethereum RPC endpoint (Infura, Alchemy, etc.)
- Solana RPC endpoint
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

# ========== Backend ==========
BACKEND_PORT=3000
BACKEND_HOST=0.0.0.0
DATABASE_URL=postgresql://user:pass@localhost:5432/amana
REDIS_URL=redis://localhost:6379

# ========== Frontend ==========
NEXT_PUBLIC_API_URL=https://api.amana.finance
NEXT_PUBLIC_AMANA_CHAIN=ethereum

# ========== Cross-Chain ==========
WORMHOLE_ETH_RPC=https://mainnet.infura.io/v3/YOUR_KEY
WORMHOLE_SOL_RPC=https://api.mainnet-beta.solana.com

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

### Deployment Script

```bash
# Set deployment private key
export PRIVATE_KEY=your_private_key

# Deploy to Sepolia testnet
forge script script/Deploy.s.sol \
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
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
```

### Manual Deployment

```bash
# Install dependencies
pnpm install --production=false

# Build
pnpm build

# Start in production
NODE_ENV=production pnpm start
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

### Docker Deployment

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Environment Variables

```bash
# .env.production
NEXT_PUBLIC_API_URL=https://api.amana.finance
NEXT_PUBLIC_AMANA_CHAIN=ethereum
NEXT_PUBLIC_AMANA_ETHEREUM_RPC=https://mainnet.infura.io/v3/YOUR_KEY
NEXT_PUBLIC_AMANA_ETHEREUM_RESERVE=0x...
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

const transactionDuration = new Histogram({
  name: 'amana_transaction_duration_seconds',
  help: 'Transaction processing duration',
  labelNames: ['chain', 'operation']
});

register.register();
```

### Health Checks

```bash
# Backend health check
curl https://api.amana.finance/health

# Returns system status
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
- [ ] Environment variables configured
- [ ] DNS records configured
- [ ] SSL certificates installed
- [ ] Monitoring services set up

### Deployment Day

- [ ] Deploy contracts to testnet first
- [ ] Verify all deployments
- [ ] Run integration tests
- [ ] Deploy to production
- [ ] Monitor initial transactions
- [ ] Have rollback plan ready

### Post-Deployment

- [ ] Verify all services operational
- [ ] Check monitoring dashboards
- [ ] Monitor for 24-48 hours
- [ ] Address any issues promptly

---

## Troubleshooting

### Common Issues

**Contract Deployment Fails**
```bash
# Check gas price
cast gas-price --rpc-url $RPC_URL

# Increase gas limit
forge script ... --gas-limit 3000000
```

**Program Size Too Large**
```bash
# Check program size
solana program show <PROGRAM_ID>

# Optimize program
anchor build --verilize
```

**Connection Issues**
```bash
# Check RPC endpoint
curl -X POST $RPC_URL -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

---

For more information, see:
- [README.md](./README.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
