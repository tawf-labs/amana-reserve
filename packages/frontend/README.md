# AMANA Frontend Package

Modern web dashboard for the AMANA Sharia-native macro reserve system.

## Overview

This package provides a user-friendly interface for interacting with the AMANA reserve system. Built with Next.js 15 and React 19, it offers real-time metrics, activity monitoring, and comprehensive visualizations.

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **React:** Version 19
- **Styling:** Tailwind CSS with custom design system
- **Charts:** Recharts for data visualization
- **Icons:** Lucide React
- **Language:** TypeScript

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App Router                       │
│  • Server Components  • Client Components  • API Routes     │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Pages       │   │  Components   │   │     Lib       │
│               │   │               │   │               │
│ • Dashboard   │   │ • Dashboard   │   │ • Utils       │
│ • Activities  │   │ • UI (shadcn) │   │ • SDK wrapper │
│ • HAI         │   │ • Tables      │   │ • Hooks       │
│ • Governance  │   │ • Charts      │   │ • Types       │
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                  ┌─────────────────┐
                  │  AMANA SDK      │
                  │  • Ethereum     │
                  │  • Solana       │
                  │  • Backend API  │
                  └─────────────────┘
```

## Pages

### Dashboard (`/`)

Main dashboard showing system overview.

**Features:**
- Total capital with trend indicator
- Participant count with weekly change
- Active activities counter
- HAI score indicator
- Recent activities table
- Top participants leaderboard
- HAI score chart

### Activities (`/activities`)

Activity management interface.

**Features:**
- Activity list with filters
- Activity detail view
- Status indicators
- Proposal form
- Activity completion tracking

### HAI (`/hai`)

Halal Activity Index dashboard.

**Features:**
- Current HAI score display
- Historical trend chart
- Component breakdown
- Compliance metrics
- Snapshot history

### Governance (`/dao`)

DAO and governance interface.

**Features:**
- Active proposals list
- Proposal detail view
- Voting interface
- Sharia board proposals
- Proposal creation

## Components

### Dashboard Components

```typescript
// HAI Chart component
import { HAIChart } from '@/components/dashboard/hai-chart';

<HAIChart
  data={haiData}
  showTrend={true}
  height={300}
/>

// Recent Activities table
import { RecentActivities } from '@/components/dashboard/recent-activities';

<RecentActivities
  activities={activities}
  maxItems={5}
/>
```

### UI Components (shadcn/ui)

Base UI components built with Radix UI primitives:

- **Card** - Content containers
- **Button** - Action buttons with variants
- **Badge** - Status indicators
- **Table** - Data tables with sorting

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

<Card>
  <CardHeader>
    <CardTitle>Total Capital</CardTitle>
  </CardHeader>
  <CardContent>
    <Badge variant="success">+12.5%</Badge>
  </CardContent>
</Card>
```

## Installation

```bash
# From repository root
cd packages/frontend

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
```

## Configuration

### Environment Variables

```bash
# AMANA SDK Configuration
NEXT_PUBLIC_AMANA_CHAIN=ethereum
NEXT_PUBLIC_AMANA_ETHEREUM_RPC=https://mainnet.infura.io/v3/YOUR_KEY
NEXT_PUBLIC_AMANA_ETHEREUM_RESERVE=0x...
NEXT_PUBLIC_AMANA_ETHEREUM_HAI=0x...

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_ENABLE_DARK_MODE=true
NEXT_PUBLIC_ENABLE_WS=true
```

### Next.js Config

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@amana/sdk'],
  experimental: {
    serverComponentsExternalPackages: ['ethers']
  }
};
```

## Running Locally

### Development Server

```bash
# Start development server
pnpm dev

# Open http://localhost:3000
```

### Production Build

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## Styling

### Tailwind Config

```javascript
module.exports = {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        // ... more colors
      }
    }
  }
}
```

### Global Styles

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    /* ... more variables */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark mode variables */
  }
}
```

## Project Structure

```
packages/frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Dashboard page
│   │   ├── activities/         # Activities pages
│   │   ├── hai/                # HAI pages
│   │   ├── dao/                # Governance pages
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── dashboard/          # Dashboard-specific components
│   │   │   ├── hai-chart.tsx
│   │   │   ├── recent-activities.tsx
│   │   │   └── top-participants.tsx
│   │   ├── ui/                 # Base UI components (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   └── table.tsx
│   │   └── layout/             # Layout components
│   │       ├── header.tsx
│   │       ├── sidebar.tsx
│   │       └── footer.tsx
│   ├── lib/
│   │   ├── utils.ts            # Utility functions
│   │   ├── sdk.ts              # SDK wrapper
│   │   └── hooks.ts            # Custom React hooks
│   └── types/
│       └── index.ts            # Extended types
├── public/                     # Static assets
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## Custom Hooks

```typescript
// useAmanaSDK - SDK connection hook
import { useAmanaSDK } from '@/lib/hooks';

const { sdk, isConnected, connect, address } = useAmanaSDK();

// useReserveStats - Reserve statistics
const { stats, loading, error, refresh } = useReserveStats();

// useHAI - HAI metrics
const { hai, history, loading } = useHAI();

// useActivities - Activity list with filters
const { activities, filters, setFilters } = useActivities();
```

## Utility Functions

```typescript
// cn - Class name merging
import { cn } from '@/lib/utils';

cn('base-class', 'additional-class', { 'conditional': true });

// formatUnits - Token formatting
formatUnits('1000000000000000000', 18); // "1.0"

// formatDate - Date formatting
formatDate(1704067200); // "Nov 3, 2023"

// formatAddress - Address truncation
formatAddress('0x1234...abcd'); // "0x1234...abcd"
```

## State Management

The app uses React built-in state management with hooks:

- **useState** - Local component state
- **useContext** - Global state (theme, wallet connection)
- **useSWR** - Server state caching and revalidation

```typescript
// Example: SWR for data fetching
import useSWR from 'swr';

const { data, error, isLoading } = useSWR(
  '/api/v1/reserve/stats',
  fetcher,
  { refreshInterval: 10000 } // Refresh every 10s
);
```

## Wallet Integration

### Wallet Connection

```typescript
// Using the SDK
import { AmanaSDK } from '@amana/sdk';

const connectWallet = async () => {
  if (window.ethereum) {
    await sdk.ethereum.connect(window.ethereum);
    const address = await sdk.ethereum.getAddress();
    console.log('Connected:', address);
  }
};
```

### Network Switching

```typescript
const switchNetwork = async (chainId: number) => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }]
    });
  } catch (error) {
    console.error('Failed to switch network:', error);
  }
};
```

## Building

```bash
# Development build
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Export static site
pnpm export
```

## Linting

```bash
# Run ESLint
pnpm lint

# Fix linting issues
pnpm lint:fix
```

## Dependencies

### Production

- **next** ^15.0.0 - React framework
- **react** ^19.0.0 - UI library
- **tailwindcss** ^3.4.0 - Styling
- **recharts** ^2.10.0 - Charts
- **lucide-react** ^0.300.0 - Icons
- **@amana/sdk** - AMANA SDK

### Development

- **@types/react** ^18.2.0 - React types
- **typescript** ^5.3.0 - TypeScript compiler
- **eslint** ^8.55.0 - Linting
- **prettier** ^3.1.0 - Formatting

## License

MIT
