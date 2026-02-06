// Copyright 2026 TAWF Labs
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * AMANA REST API Server
 *
 * Provides REST endpoints for interacting with the AMANA reserve system.
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// ============================================================================
// Types
// ============================================================================

export interface APIConfig {
  port?: number;
  host?: string;
  cors?: cors.CorsOptions;
  ethereum?: {
    rpcUrl: string;
    contractAddress: string;
  };
  solana?: {
    rpcUrl: string;
    programId: string;
  };
}

export interface ApiError extends Error {
  statusCode: number;
  code: string;
}

// ============================================================================
// Error Handling
// ============================================================================

export class HTTPError extends Error implements ApiError {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'HTTPError';
  }
}

// ============================================================================
// API Routes
// ============================================================================

export function createRoutes(app: Express): void {
  // Health check
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  // Reserve routes
  app.get('/api/v1/reserve/stats', getReserveStats);
  app.get('/api/v1/reserve/participants', getParticipants);
  app.get('/api/v1/reserve/participants/:address', getParticipant);
  app.get('/api/v1/reserve/activities', getActivities);
  app.get('/api/v1/reserve/activities/:activityId', getActivity);

  // HAI routes
  app.get('/api/v1/hai/metrics', getHAIMetrics);
  app.get('/api/v1/hai/snapshots', getHAISnapshots);
  app.post('/api/v1/hai/track', trackActivity);

  // Trust score routes
  app.get('/api/v1/trust/:address', getTrustScore);

  // Governance routes
  app.get('/api/v1/dao/proposals', getProposals);
  app.get('/api/v1/dao/proposals/:proposalId', getProposal);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint not found: ${req.method} ${req.path}`,
      },
    });
  });
}

// ============================================================================
// Route Handlers
// ============================================================================

async function getReserveStats(req: Request, res: Response, next: NextFunction) {
  try {
    // TODO: Implement actual data fetching from contracts
    const stats = {
      totalCapital: '0',
      participantCount: 0,
      activityCount: 0,
      minCapitalContribution: '100000000000000000', // 0.1 ETH
    };

    res.json({ data: stats });
  } catch (error) {
    next(error);
  }
}

async function getParticipants(req: Request, res: Response, next: NextFunction) {
  try {
    const { limit = 50, offset = 0 } = req.query;

    // TODO: Implement actual data fetching
    const participants = {
      items: [],
      limit: Number(limit),
      offset: Number(offset),
      total: 0,
    };

    res.json({ data: participants });
  } catch (error) {
    next(error);
  }
}

async function getParticipant(req: Request, res: Response, next: NextFunction) {
  try {
    const { address } = req.params;

    // TODO: Implement actual data fetching
    const participant = {
      agent: address,
      capitalContributed: '0',
      profitShare: '0',
      lossShare: '0',
      isActive: false,
      joinedAt: 0,
    };

    res.json({ data: participant });
  } catch (error) {
    next(error);
  }
}

async function getActivities(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    // TODO: Implement actual data fetching
    const activities = {
      items: [],
      limit: Number(limit),
      offset: Number(offset),
      total: 0,
      filters: { status },
    };

    res.json({ data: activities });
  } catch (error) {
    next(error);
  }
}

async function getActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const { activityId } = req.params;

    // TODO: Implement actual data fetching
    const activity = {
      activityId,
      initiator: '',
      capitalRequired: '0',
      capitalDeployed: '0',
      status: 0,
      createdAt: 0,
      completedAt: 0,
      outcome: '0',
      isValidated: false,
    };

    res.json({ data: activity });
  } catch (error) {
    next(error);
  }
}

async function getHAIMetrics(req: Request, res: Response, next: NextFunction) {
  try {
    // TODO: Implement actual data fetching
    const metrics = {
      score: 5000,
      percentage: 50,
      totalActivities: 0,
      compliantActivities: 0,
      complianceRate: 0,
    };

    res.json({ data: metrics });
  } catch (error) {
    next(error);
  }
}

async function getHAISnapshots(req: Request, res: Response, next: NextFunction) {
  try {
    const { limit = 50, offset = 0 } = req.query;

    // TODO: Implement actual data fetching
    const snapshots = {
      items: [],
      limit: Number(limit),
      offset: Number(offset),
      total: 0,
    };

    res.json({ data: snapshots });
  } catch (error) {
    next(error);
  }
}

async function trackActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const { activityId, isCompliant, isAssetBacked, hasRealEconomicValue } = req.body;

    // TODO: Implement actual activity tracking
    const result = {
      activityId,
      previousScore: 5000,
      newScore: isCompliant ? 5200 : 4800,
      timestamp: Date.now(),
    };

    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
}

async function getTrustScore(req: Request, res: Response, next: NextFunction) {
  try {
    const { address } = req.params;

    // TODO: Implement actual trust score calculation
    const trustScore = {
      agent: address,
      overallScore: 5000,
      confidence: 50,
      components: {
        complianceScore: 5000,
        performanceScore: 5000,
        reliabilityScore: 5000,
        reputationScore: 5000,
      },
      tier: 'bronze',
      timestamp: Date.now(),
    };

    res.json({ data: trustScore });
  } catch (error) {
    next(error);
  }
}

async function getProposals(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    // TODO: Implement actual data fetching
    const proposals = {
      items: [],
      limit: Number(limit),
      offset: Number(offset),
      total: 0,
      filters: { status },
    };

    res.json({ data: proposals });
  } catch (error) {
    next(error);
  }
}

async function getProposal(req: Request, res: Response, next: NextFunction) {
  try {
    const { proposalId } = req.params;

    // TODO: Implement actual data fetching
    const proposal = {
      proposalId: BigInt(proposalId),
      proposer: '',
      title: '',
      description: '',
      targetAccount: '',
      amount: '0',
      affectsSharia: false,
      status: 0,
      createdAt: 0,
      votingStartsAt: 0,
      votingEndsAt: 0,
      forVotes: '0',
      againstVotes: '0',
      abstainVotes: '0',
      shariaApproved: true,
    };

    res.json({ data: proposal });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// Server Creation
// ============================================================================

export function createServer(config?: APIConfig): Express {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors(config?.cors));

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    });
    next();
  });

  // Routes
  createRoutes(app);

  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof HTTPError) {
      res.status(err.statusCode).json({
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      });
    } else {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    }
  });

  return app;
}

export function startServer(app: Express, port = 3000, host = '0.0.0.0'): void {
  app.listen(port, host, () => {
    console.log(`AMANA API server listening on http://${host}:${port}`);
  });
}

// ============================================================================
// Default Export
// ============================================================================

export default { createServer, startServer, createRoutes };
