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
 * HAI Calculator - Halal Activity Index calculation logic
 *
 * This module provides the core calculation logic for the Halal Activity Index,
 * which measures the Sharia compliance level of activities in the AMANA system.
 */

// ============================================================================
// Types
// ============================================================================

export interface ActivityData {
  activityId: string;
  isCompliant: boolean;
  isAssetBacked: boolean;
  hasRealEconomicValue: boolean;
  validatorCount: number;
  positiveVotes: number;
  timestamp: number;
}

export interface HAICalculationInput {
  activities: ActivityData[];
  totalActivities: number;
  weights?: HAIWeights;
}

export interface HAIWeights {
  compliance: number; // 0-10000 basis points
  assetBacking: number; // 0-10000 basis points
  economicValue: number; // 0-10000 basis points
  validatorParticipation: number; // 0-10000 basis points
}

export interface HAIResult {
  score: number; // 0-10000
  percentage: number; // 0-100
  components: {
    complianceScore: number;
    assetBackingScore: number;
    economicValueScore: number;
    validatorParticipationScore: number;
  };
  timestamp: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_WEIGHTS: HAIWeights = {
  compliance: 4000, // 40%
  assetBacking: 2500, // 25%
  economicValue: 2000, // 20%
  validatorParticipation: 1500, // 15%
};

export const MAX_SCORE = 10000;
export const BASIS_POINTS_DIVISOR = 10000;

// ============================================================================
// HAI Calculator
// ============================================================================

export class HAICalculator {
  private weights: HAIWeights;

  constructor(weights?: HAIWeights) {
    // Validate weights sum to 10000
    const inputWeights = weights || DEFAULT_WEIGHTS;
    const sum =
      inputWeights.compliance +
      inputWeights.assetBacking +
      inputWeights.economicValue +
      inputWeights.validatorParticipation;

    if (sum !== BASIS_POINTS_DIVISOR) {
      throw new Error(
        `HAI weights must sum to ${BASIS_POINTS_DIVISOR}, got ${sum}`
      );
    }

    this.weights = inputWeights;
  }

  /**
   * Calculate HAI score from activity data
   */
  calculate(input: HAICalculationInput): HAIResult {
    const { activities, totalActivities } = input;

    if (totalActivities === 0) {
      return this.getDefaultResult();
    }

    // Calculate component scores
    const complianceScore = this.calculateComplianceScore(activities, totalActivities);
    const assetBackingScore = this.calculateAssetBackingScore(activities, totalActivities);
    const economicValueScore = this.calculateEconomicValueScore(activities, totalActivities);
    const validatorParticipationScore = this.calculateValidatorParticipationScore(activities);

    // Calculate weighted score
    const score =
      (complianceScore * this.weights.compliance) / BASIS_POINTS_DIVISOR +
      (assetBackingScore * this.weights.assetBacking) / BASIS_POINTS_DIVISOR +
      (economicValueScore * this.weights.economicValue) / BASIS_POINTS_DIVISOR +
      (validatorParticipationScore * this.weights.validatorParticipation) /
        BASIS_POINTS_DIVISOR;

    return {
      score: Math.min(Math.round(score), MAX_SCORE),
      percentage: Math.min(Math.round(score / 100), 100),
      components: {
        complianceScore,
        assetBackingScore,
        economicValueScore,
        validatorParticipationScore,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate compliance component score
   */
  private calculateComplianceScore(
    activities: ActivityData[],
    totalActivities: number
  ): number {
    if (totalActivities === 0) return 5000;

    const compliantCount = activities.filter((a) => a.isCompliant).length;
    return (compliantCount * MAX_SCORE) / totalActivities;
  }

  /**
   * Calculate asset backing component score
   */
  private calculateAssetBackingScore(
    activities: ActivityData[],
    totalActivities: number
  ): number {
    if (totalActivities === 0) return 5000;

    const assetBackedCount = activities.filter((a) => a.isAssetBacked).length;
    return (assetBackedCount * MAX_SCORE) / totalActivities;
  }

  /**
   * Calculate economic value component score
   */
  private calculateEconomicValueScore(
    activities: ActivityData[],
    totalActivities: number
  ): number {
    if (totalActivities === 0) return 5000;

    const economicValueCount = activities.filter((a) => a.hasRealEconomicValue).length;
    return (economicValueCount * MAX_SCORE) / totalActivities;
  }

  /**
   * Calculate validator participation component score
   */
  private calculateValidatorParticipationScore(activities: ActivityData[]): number {
    if (activities.length === 0) return 8000; // Default baseline

    let totalPositiveRatio = 0;
    let count = 0;

    for (const activity of activities) {
      if (activity.validatorCount > 0) {
        totalPositiveRatio += activity.positiveVotes / activity.validatorCount;
        count++;
      }
    }

    if (count === 0) return 8000;

    const avgPositiveRatio = totalPositiveRatio / count;
    return Math.round(avgPositiveRatio * MAX_SCORE);
  }

  /**
   * Get a default/neutral HAI result
   */
  private getDefaultResult(): HAIResult {
    return {
      score: 5000,
      percentage: 50,
      components: {
        complianceScore: 5000,
        assetBackingScore: 5000,
        economicValueScore: 5000,
        validatorParticipationScore: 8000,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Update calculation weights
   */
  updateWeights(weights: Partial<HAIWeights>): void {
    const newWeights = { ...this.weights, ...weights };

    const sum =
      newWeights.compliance +
      newWeights.assetBacking +
      newWeights.economicValue +
      newWeights.validatorParticipation;

    if (sum !== BASIS_POINTS_DIVISOR) {
      throw new Error(
        `HAI weights must sum to ${BASIS_POINTS_DIVISOR}, got ${sum}`
      );
    }

    this.weights = newWeights;
  }

  /**
   * Get current weights
   */
  getWeights(): HAIWeights {
    return { ...this.weights };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a default HAI calculator
 */
export function createHAICalculator(weights?: HAIWeights): HAICalculator {
  return new HAICalculator(weights);
}

/**
 * Calculate HAI from activity data (convenience function)
 */
export function calculateHAI(
  activities: ActivityData[],
  totalActivities: number,
  weights?: HAIWeights
): HAIResult {
  const calculator = new HAICalculator(weights);
  return calculator.calculate({ activities, totalActivities });
}

/**
 * Validate HAI weights
 */
export function validateHAIWeights(weights: HAIWeights): boolean {
  const sum =
    weights.compliance +
    weights.assetBacking +
    weights.economicValue +
    weights.validatorParticipation;
  return sum === BASIS_POINTS_DIVISOR;
}
