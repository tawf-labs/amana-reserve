# AMANA Backend Package

Backend services for the AMANA Sharia-native macro reserve system.

## Overview

This package provides REST API and WebSocket services for interacting with the AMANA reserve system. It implements a microservices architecture with modular services for API handling, HAI calculation, trust scoring, and real-time updates.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway (Express)                    │
│  • Request routing  • Authentication  • Rate limiting        │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ HAI Aggregator│   │ Trust Score   │   │   WebSocket   │
│               │   │   Engine      │   │   Service     │
│ • Compliance  │   │ • Reputation  │   │ • Real-time   │
│ • Scoring     │   │ • Performance │   │ • Events      │
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                  ┌─────────────────┐
                  │  Blockchain RPC │
                  │  • Ethereum     │
                  │  • Solana       │
                  └─────────────────┘
```

## Services

### API Service

RESTful API server built with Express.js.

**Features:**
- RESTful endpoints for all AMANA operations
- Request validation and error handling
- CORS support
- Request logging and timing
- Pagination support

**Main File:** `services/api/src/index.ts`

### HAI Aggregator

Calculates Halal Activity Index scores.

**Features:**
- Real-time HAI score calculation
- Activity compliance tracking
- Historical snapshots
- Component-based scoring

**Main Files:**
- `services/hai-aggregator/src/calculator.ts` - Core calculation logic
- `services/hai-aggregator/src/scorer.ts` - Scoring components

### Trust Score Engine

Evaluates agent trustworthiness.

**Features:**
- Multi-dimensional trust scoring
- Historical performance tracking
- Reputation calculation
- Risk assessment

**Main File:** `services/trust-score/src/engine.ts`

### WebSocket Service

Real-time updates and notifications.

**Features:**
- Activity status updates
- HAI score changes
- New participant notifications
- Transaction confirmations

**Main File:** `services/websocket/src/handler.ts`

## API Endpoints

### Health

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "api": "ok",
    "hai": "ok",
    "trust": "ok",
    "websocket": "ok"
  }
}
```

### Reserve Stats

```
GET /api/v1/reserve/stats
```

Response:
```json
{
  "totalCapital": "1000000000000000000",
  "participantCount": 25,
  "activityCount": 10,
  "minCapitalContribution": "100000000000000000"
}
```

### Participants

```
GET /api/v1/reserve/participants?page=1&limit=10
```

Response:
```json
{
  "data": [
    {
      "agent": "0x...",
      "capitalContributed": "100000000000000000",
      "profitShare": "5000000000000000",
      "lossShare": "0",
      "isActive": true,
      "joinedAt": 1704067200
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### Participant Details

```
GET /api/v1/reserve/participants/:address
```

### Activities

```
GET /api/v1/reserve/activities?status=Active&page=1
```

Query Parameters:
- `status` - Filter by status (Proposed, Approved, Active, Completed, Rejected)
- `initiator` - Filter by initiator address
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

### Activity Details

```
GET /api/v1/reserve/activities/:activityId
```

### HAI Metrics

```
GET /api/v1/hai/metrics
```

Response:
```json
{
  "score": 8500,
  "percentage": 85,
  "totalActivities": 100,
  "compliantActivities": 85,
  "complianceRate": 8500
}
```

### HAI Snapshots

```
GET /api/v1/hai/snapshots?from=1704067200&to=1704153600
```

### Track Activity (HAI)

```
POST /api/v1/hai/track
```

Body:
```json
{
  "activityId": "0x...",
  "isCompliant": true,
  "isAssetBacked": true,
  "hasRealEconomicValue": true,
  "validatorCount": 3,
  "positiveVotes": 3
}
```

### Trust Score

```
GET /api/v1/trust/:address
```

Response:
```json
{
  "agent": "0x...",
  "overallScore": 7500,
  "components": {
    "complianceScore": 8000,
    "performanceScore": 7500,
    "reliabilityScore": 7000,
    "reputationScore": 7500
  },
  "lastUpdated": 1704067200
}
```

### DAO Proposals

```
GET /api/v1/dao/proposals?status=Active
```

### DAO Proposal Details

```
GET /api/v1/dao/proposals/:proposalId
```

## Installation

```bash
# From repository root
cd packages/backend

# Install dependencies
pnpm install

# Build all services
pnpm build
```

## Configuration

### Environment Variables

```bash
# Server
PORT=3000
HOST=0.0.0.0

# Ethereum
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY

# Solana
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# API
CORS_ENABLED=true
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=90000

# WebSocket
WS_PORT=3001
WS_PATH=/ws
```

### Configuration File

```typescript
// config/index.ts
export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || '0.0.0.0',
  },
  ethereum: {
    rpcUrl: process.env.ETHEREUM_RPC_URL,
  },
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL,
  },
  cors: {
    enabled: process.env.CORS_ENABLED === 'true',
    origins: process.env.CORS_ORIGINS?.split(',') || ['*'],
  },
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED === 'true',
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '90000'),
  },
};
```

## Running Locally

### Development Mode

```bash
# Start all services
pnpm dev

# Start specific service
pnpm dev:api
pnpm dev:hai
pnpm dev:trust
pnpm dev:websocket
```

### Production Mode

```bash
# Build first
pnpm build

# Start all services
pnpm start

# Start specific service
pnpm start:api
pnpm start:hai
pnpm start:trust
pnpm start:websocket
```

## Building

```bash
# Build all services
pnpm build

# Build specific service
pnpm build:api
pnpm build:hai
pnpm build:trust
pnpm build:websocket

# Clean build artifacts
pnpm clean
```

## Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

## Project Structure

```
packages/backend/
├── services/
│   ├── api/
│   │   └── src/
│   │       ├── index.ts        # Main Express server
│   │       ├── routes/         # API routes
│   │       ├── middleware/     # Express middleware
│   │       └── controllers/    # Request handlers
│   ├── hai-aggregator/
│   │   └── src/
│   │       ├── calculator.ts   # HAI calculation
│   │       ├── scorer.ts       # Scoring components
│   │       └── snapshots.ts    # Snapshot management
│   ├── trust-score/
│   │   └── src/
│   │       ├── engine.ts       # Trust score engine
│   │       ├── reputation.ts   # Reputation calculation
│   │       └── history.ts      # Historical tracking
│   └── websocket/
│       └── src/
│           ├── handler.ts      # WebSocket handler
│           ├── events.ts       # Event definitions
│           └── broadcast.ts    # Broadcasting logic
├── config/
│   └── index.ts                # Centralized configuration
├── shared/
│   └── types.ts                # Shared types
├── package.json
├── tsconfig.json
└── README.md
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Insufficient balance for operation",
    "details": {
      "required": "100000000000000000",
      "available": "50000000000000000"
    }
  }
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |

## WebSocket Events

### Client → Server

```typescript
// Subscribe to HAI updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'hai'
}));

// Subscribe to activity updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'activities',
  filter: { status: 'Active' }
}));
```

### Server → Client

```typescript
// HAI score update
{
  type: 'hai_update',
  data: {
    score: 8500,
    percentage: 85,
    timestamp: 1704067200
  }
}

// Activity update
{
  type: 'activity_update',
  data: {
    activityId: '0x...',
    status: 'Completed',
    outcome: '100000000000000000'
  }
}
```

## Dependencies

### Production

- **ethers** ^6.9.0 - Ethereum interaction
- **express** ^4.18.0 - Web framework
- **ws** ^8.16.0 - WebSocket server

### Development

- **@types/node** ^20.11.0 - Node.js types
- **typescript** ^5.3.3 - TypeScript compiler

## Deployment

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000 3001

CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - ETHEREUM_RPC_URL=${ETHEREUM_RPC_URL}
      - SOLANA_RPC_URL=${SOLANA_RPC_URL}
```

## License

Apache 2.0
