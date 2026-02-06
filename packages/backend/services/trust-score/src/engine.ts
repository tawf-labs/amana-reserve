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
 * Trust Score Engine - Calculate trust scores for agents
 *
 * This module provides trust score calculation for autonomous agents
 * participating in the AMANA reserve system.
 */

// ============================================================================
// Types
// ============================================================================

export interface AgentData {
  address: string;
  activitiesCompleted: number;
  activitiesProposed: number;
  totalCapitalContributed: bigint;
  profitGenerated: bigint;
  lossIncurred: bigint;
  successfulActivities: number;
  failedActivities: number;
  joinedAt: number;
  lastActivity: number;
  shariaComplianceRate?: number; // 0-100
  responseTime?: number; // Average response time in ms
}

export interface TrustScoreInput {
  agent: string;
  data: AgentData;
  historicalScores?: TrustScore[];
  globalMetrics: {
    totalAgents: number;
    totalActivities: number;
    averageCompliance: number;
  };
}

export interface TrustScore {
  agent: string;
  overallScore: number; // 0-10000
  confidence: number; // 0-100
  components: {
    complianceScore: number; // 0-10000
    performanceScore: number; // 0-10000
    reliabilityScore: number; // 0-10000
    reputationScore: number; // 0-10000
  };
  tier: TrustTier;
  timestamp: number;
}

export enum TrustTier {
  Untrusted = 'untrusted',
  Bronze = 'bronze',
  Silver = 'silver',
  Gold = 'gold',
  Platinum = 'platinum',
}

export interface ScoreWeights {
  compliance: number; // 0-10000
  performance: number; // 0-10000
  reliability: number; // 0-10000
  reputation: number; // 0-10000
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_WEIGHTS: ScoreWeights = {
  compliance: 3500, // 35%
  performance: 3000, // 30%
  reliability: 2000, // 20%
  reputation: 1500, // 15%
};

export const TRUST_TIERS: Record<TrustTier, { minScore: number; maxScore: number }> = {
  [TrustTier.Untrusted]: { minScore: 0, maxScore: 2999 },
  [TrustTier.Bronze]: { minScore: 3000, maxScore: 4999 },
  [TrustTier.Silver]: { minScore: 5000, maxScore: 6999 },
  [TrustTier.Gold]: { minScore: 7000, maxScore: 8999 },
  [TrustTier.Platinum]: { minScore: 9000, maxScore: 10000 },
};

// ============================================================================
// Trust Score Engine
// ============================================================================

export class TrustScoreEngine {
  private weights: ScoreWeights;
  private decayRate: number; // Score decay per day of inactivity
  private minActivityThreshold: number;

  constructor(config?: {
    weights?: Partial<ScoreWeights>;
    decayRate?: number;
    minActivityThreshold?: number;
  }) {
    this.weights = { ...DEFAULT_WEIGHTS, ...config?.weights };
    this.decayRate = config?.decayRate ?? 10; // 10 points per day
    this.minActivityThreshold = config?.minActivityThreshold ?? 3;
  }

  /**
   * Calculate trust score for an agent
   */
  calculate(input: TrustScoreInput): TrustScore {
    const components = {
      complianceScore: this.calculateComplianceScore(input),
      performanceScore: this.calculatePerformanceScore(input),
      reliabilityScore: this.calculateReliabilityScore(input),
      reputationScore: this.calculateReputationScore(input),
    };

    // Apply weights
    const overallScore =
      (components.complianceScore * this.weights.compliance) / 10000 +
      (components.performanceScore * this.weights.performance) / 10000 +
      (components.reliabilityScore * this.weights.reliability) / 10000 +
      (components.reputationScore * this.weights.reputation) / 10000;

    // Apply inactivity decay
    const daysSinceLastActivity = Math.floor(
      (Date.now() - input.data.lastActivity) / (1000 * 60 * 60 * 24)
    );
    const decayedScore = Math.max(
      0,
      overallScore - daysSinceLastActivity * this.decayRate
    );

    const confidence = this.calculateConfidence(input);

    return {
      agent: input.agent,
      overallScore: Math.round(decayedScore),
      confidence,
      components,
      tier: this.getTier(decayedScore),
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate compliance score component
   */
  private calculateComplianceScore(input: TrustScoreInput): number {
    const { data, globalMetrics } = input;

    // Sharia compliance rate
    const complianceRate = data.shariaComplianceRate ?? globalMetrics.averageCompliance;
    let score = (complianceRate / 100) * 7000; // 70% from direct compliance

    // Bonus for completing activities successfully
    const successRate =
      data.activitiesCompleted > 0
        ? (data.successfulActivities / data.activitiesCompleted) * 100
        : 50;
    score += (successRate / 100) * 3000; // 30% from success rate

    return Math.min(10000, Math.round(score));
  }

  /**
   * Calculate performance score component
   */
  private calculatePerformanceScore(input: TrustScoreInput): number {
    const { data } = input;
    let score = 5000; // Base score

    if (data.activitiesCompleted === 0) return score;

    // Profit/loss ratio
    const totalOutcome = Number(data.profitGenerated) - Number(data.lossIncurred);
    const capitalRatio =
      Number(data.totalCapitalContributed) > 0
        ? totalOutcome / Number(data.totalCapitalContributed)
        : 0;

    if (capitalRatio > 0) {
      // Positive performance
      score += Math.min(3000, capitalRatio * 10000); // Cap at 30% bonus
    } else if (capitalRatio < 0) {
      // Negative performance
      score -= Math.min(2000, Math.abs(capitalRatio) * 5000); // Cap at 20% penalty
    }

    // Activity completion rate
    const completionRate =
      data.activitiesProposed > 0
        ? data.activitiesCompleted / data.activitiesProposed
        : 0;
    score += completionRate * 2000; // Up to 20% for completion

    return Math.min(10000, Math.max(0, Math.round(score)));
  }

  /**
   * Calculate reliability score component
   */
  private calculateReliabilityScore(input: TrustScoreInput): number {
    const { data } = input;
    let score = 5000; // Base score

    // Failed activities penalty
    if (data.activitiesCompleted > 0) {
      const failureRate = data.failedActivities / data.activitiesCompleted;
      score -= failureRate * 4000; // Up to 40% penalty for failures
    }

    // Consistency bonus (steady activity over time)
    const daysActive = Math.floor(
      (data.lastActivity - data.joinedAt) / (1000 * 60 * 60 * 24)
    );
    if (daysActive > 30 && data.activitiesCompleted >= this.minActivityThreshold) {
      const activityRate = data.activitiesCompleted / daysActive;
      score += Math.min(2000, activityRate * 1000); // Bonus for consistent activity
    }

    // Response time bonus (if available)
    if (data.responseTime !== undefined) {
      // Lower response time is better (target: < 1 hour)
      if (data.responseTime < 3600000) {
        score += 1000;
      } else if (data.responseTime < 86400000) {
        score += 500;
      }
    }

    return Math.min(10000, Math.max(0, Math.round(score)));
  }

  /**
   * Calculate reputation score component
   */
  private calculateReputationScore(input: TrustScoreInput): number {
    const { data, globalMetrics, historicalScores } = input;
    let score = 5000; // Base score

    // Age bonus (longer participation = higher reputation)
    const daysSinceJoin = Math.floor(
      (Date.now() - data.joinedAt) / (1000 * 60 * 60 * 24)
    );
    score += Math.min(2000, daysSinceJoin * 10); // Up to 20% for age

    // Activity volume bonus
    const activityPercentile =
      globalMetrics.totalAgents > 0
        ? data.activitiesCompleted / globalMetrics.totalAgents
        : 0;
    score += Math.min(2000, activityPercentile * 10000); // Up to 20% for activity

    // Capital contribution bonus
    const capitalPercentile =
      Number(data.totalCapitalContributed) > 0 ? 0.1 : 0; // Simplified
    score += capitalPercentile * 1000;

    // Historical score stability
    if (historicalScores && historicalScores.length > 0) {
      const avgScore =
        historicalScores.reduce((sum, s) => sum + s.overallScore, 0) /
        historicalScores.length;
      const stability = 1 - Math.abs(avgScore - 5000) / 5000; // How close to average
      score += stability * 1000; // Up to 10% for stability
    }

    return Math.min(10000, Math.max(0, Math.round(score)));
  }

  /**
   * Calculate confidence in the score
   */
  private calculateConfidence(input: TrustScoreInput): number {
    const { data } = input;
    let confidence = 0;

    // More activities = higher confidence
    if (data.activitiesCompleted >= 10) confidence += 40;
    else if (data.activitiesCompleted >= 5) confidence += 30;
    else if (data.activitiesCompleted >= 3) confidence += 20;
    else if (data.activitiesCompleted >= 1) confidence += 10;

    // Longer participation = higher confidence
    const daysActive = Math.floor((Date.now() - data.joinedAt) / (1000 * 60 * 60 * 24));
    if (daysActive >= 90) confidence += 30;
    else if (daysActive >= 30) confidence += 20;
    else if (daysActive >= 7) confidence += 10;

    // Recent activity = higher confidence
    const daysSinceLastActivity = Math.floor(
      (Date.now() - data.lastActivity) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastActivity <= 7) confidence += 20;
    else if (daysSinceLastActivity <= 30) confidence += 10;
    else if (daysSinceLastActivity > 90) confidence -= 20;

    // Data completeness = higher confidence
    if (data.shariaComplianceRate !== undefined) confidence += 5;
    if (data.responseTime !== undefined) confidence += 5;

    return Math.min(100, Math.max(0, confidence));
  }

  /**
   * Get trust tier from score
   */
  private getTier(score: number): TrustTier {
    for (const [tier, range] of Object.entries(TRUST_TIERS)) {
      if (score >= range.minScore && score <= range.maxScore) {
        return tier as TrustTier;
      }
    }
    return TrustTier.Untrusted;
  }

  /**
   * Batch calculate scores for multiple agents
   */
  batchCalculate(inputs: TrustScoreInput[]): TrustScore[] {
    return inputs.map((input) => this.calculate(input));
  }

  /**
   * Update engine weights
   */
  updateWeights(weights: Partial<ScoreWeights>): void {
    const sum =
      (weights.compliance ?? this.weights.compliance) +
      (weights.performance ?? this.weights.performance) +
      (weights.reliability ?? this.weights.reliability) +
      (weights.reputation ?? this.weights.reputation);

    if (sum !== 10000) {
      throw new Error(`Score weights must sum to 10000, got ${sum}`);
    }

    this.weights = { ...this.weights, ...weights };
  }

  /**
   * Get current weights
   */
  getWeights(): ScoreWeights {
    return { ...this.weights };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a default trust score engine
 */
export function createTrustScoreEngine(config?: {
  weights?: Partial<ScoreWeights>;
  decayRate?: number;
  minActivityThreshold?: number;
}): TrustScoreEngine {
  return new TrustScoreEngine(config);
}

/**
 * Quick trust score calculation
 */
export function calculateTrustScore(input: TrustScoreInput): TrustScore {
  const engine = new TrustScoreEngine();
  return engine.calculate(input);
}

/**
 * Get trust tier from score
 */
export function getTrustTier(score: number): TrustTier {
  for (const [tier, range] of Object.entries(TRUST_TIERS)) {
    if (score >= range.minScore && score <= range.maxScore) {
      return tier as TrustTier;
    }
  }
  return TrustTier.Untrusted;
}

/**
 * Check if score meets minimum trust threshold
 */
export function isTrustedScore(score: number, minTier: TrustTier = TrustTier.Bronze): boolean {
  const minScore = TRUST_TIERS[minTier].minScore;
  return score >= minScore;
}
