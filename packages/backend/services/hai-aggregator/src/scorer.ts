/**
 * HAI Scorer - Sharia compliance scoring for activities
 *
 * This module provides Sharia compliance scoring for individual activities
 * based on Islamic finance principles.
 */

// ============================================================================
// Types
// ============================================================================

export interface ActivitySubmission {
  activityId: string;
  description: string;
  activityType: string;
  capitalRequired: bigint;
  proposer: string;
  additionalData?: Record<string, unknown>;
}

export interface ComplianceCriteria {
  assetBacked: boolean;
  realEconomicValue: boolean;
  prohibitedActivity: boolean;
  documentationProvided: boolean;
  verifiedByValidators: boolean;
}

export interface ScoringResult {
  activityId: string;
  isCompliant: boolean;
  confidence: number; // 0-100
  criteria: ComplianceCriteria;
  issues: string[];
  suggestions: string[];
  score: number; // 0-10000
}

export interface ActivityTypeConfig {
  allowed: boolean;
  requiresDocumentation: boolean;
  requiresValidation: boolean;
  additionalCriteria?: string[];
}

// ============================================================================
// Prohibited Activities (Non-Sharia-Compliant)
// ============================================================================

const PROHIBITED_ACTIVITIES = new Set([
  'alcohol',
  'gambling',
  'interest-lending',
  'riba',
  'speculation',
  'gambling',
  'weapons',
  'tobacco',
  'pork',
  'adult-entertainment',
  'conventional-banking',
  'insurance-conventional',
  'derivatives',
]);

// ============================================================================
// Allowed Activity Types
// ============================================================================

const ALLOWED_ACTIVITY_TYPES: Record<string, ActivityTypeConfig> = {
  trade: {
    allowed: true,
    requiresDocumentation: true,
    requiresValidation: true,
    additionalCriteria: ['asset-backed', 'real-goods'],
  },
  manufacturing: {
    allowed: true,
    requiresDocumentation: true,
    requiresValidation: true,
    additionalCriteria: ['halal-products'],
  },
  'agriculture': {
    allowed: true,
    requiresDocumentation: true,
    requiresValidation: false,
  },
  'real-estate': {
    allowed: true,
    requiresDocumentation: true,
    requiresValidation: true,
    additionalCriteria: ['no-interest', 'no-riba'],
  },
  technology: {
    allowed: true,
    requiresDocumentation: false,
    requiresValidation: false,
  },
  services: {
    allowed: true,
    requiresDocumentation: true,
    requiresValidation: false,
  },
  'sukuk': {
    allowed: true,
    requiresDocumentation: true,
    requiresValidation: true,
    additionalCriteria: ['asset-backed', 'sharia-board-approved'],
  },
  'mudarabah': {
    allowed: true,
    requiresDocumentation: true,
    requiresValidation: true,
    additionalCriteria: ['profit-loss-sharing'],
  },
  'musharakah': {
    allowed: true,
    requiresDocumentation: true,
    requiresValidation: true,
    additionalCriteria: ['joint-venture'],
  },
};

// ============================================================================
// HAI Scorer
// ============================================================================

export class HAIScorer {
  private customActivityTypes: Map<string, ActivityTypeConfig>;

  constructor() {
    this.customActivityTypes = new Map();
  }

  /**
   * Score an activity submission for Sharia compliance
   */
  score(submission: ActivitySubmission, criteria?: Partial<ComplianceCriteria>): ScoringResult {
    const activityType = this.normalizeActivityType(submission.activityType);
    const typeConfig = this.getActivityConfig(activityType);

    const issues: string[] = [];
    const suggestions: string[] = [];
    const complianceCriteria: ComplianceCriteria = {
      assetBacked: criteria?.assetBacked ?? false,
      realEconomicValue: criteria?.realEconomicValue ?? false,
      prohibitedActivity: PROHIBITED_ACTIVITIES.has(activityType),
      documentationProvided: criteria?.documentationProvided ?? !typeConfig.requiresDocumentation,
      verifiedByValidators: criteria?.verifiedByValidators ?? !typeConfig.requiresValidation,
    };

    // Check if activity type is prohibited
    if (complianceCriteria.prohibitedActivity) {
      return {
        activityId: submission.activityId,
        isCompliant: false,
        confidence: 100,
        criteria: complianceCriteria,
        issues: [`Activity type '${activityType}' is prohibited (non-Sharia-compliant)`],
        suggestions: ['Consider a Sharia-compliant alternative activity type'],
        score: 0,
      };
    }

    // Check if activity type is allowed
    if (!typeConfig.allowed) {
      issues.push(`Activity type '${activityType}' is not recognized or explicitly allowed`);
      suggestions.push('Submit for Sharia board review to determine compliance');
    }

    // Check asset backing
    if (!complianceCriteria.assetBacked) {
      issues.push('Activity is not asset-backed');
      suggestions.push('Ensure the activity is backed by tangible assets');
    }

    // Check real economic value
    if (!complianceCriteria.realEconomicValue) {
      issues.push('Activity has no demonstrable real economic value');
      suggestions.push('Provide evidence of real economic impact');
    }

    // Check documentation
    if (!complianceCriteria.documentationProvided && typeConfig.requiresDocumentation) {
      issues.push('Required documentation not provided');
      suggestions.push('Submit supporting documentation for the activity');
    }

    // Check validator verification
    if (!complianceCriteria.verifiedByValidators && typeConfig.requiresValidation) {
      issues.push('Activity has not been verified by validators');
      suggestions.push('Submit for Sharia validator review');
    }

    // Calculate score
    const score = this.calculateScore(complianceCriteria, issues.length);
    const isCompliant = score >= 5000 && issues.length === 0;
    const confidence = this.calculateConfidence(complianceCriteria);

    return {
      activityId: submission.activityId,
      isCompliant,
      confidence,
      criteria: complianceCriteria,
      issues,
      suggestions,
      score,
    };
  }

  /**
   * Batch score multiple activities
   */
  batchScore(submissions: ActivitySubmission[]): ScoringResult[] {
    return submissions.map((submission) => this.score(submission));
  }

  /**
   * Add a custom activity type configuration
   */
  addActivityType(name: string, config: ActivityTypeConfig): void {
    this.customActivityTypes.set(this.normalizeActivityType(name), config);
  }

  /**
   * Remove a custom activity type
   */
  removeActivityType(name: string): void {
    this.customActivityTypes.delete(this.normalizeActivityType(name));
  }

  /**
   * Get activity type configuration
   */
  getActivityConfig(type: string): ActivityTypeConfig {
    return (
      this.customActivityTypes.get(type) ?? ALLOWED_ACTIVITY_TYPES[type] ?? {
        allowed: false,
        requiresDocumentation: true,
        requiresValidation: true,
      }
    );
  }

  /**
   * Check if an activity type is prohibited
   */
  isProhibited(activityType: string): boolean {
    return PROHIBITED_ACTIVITIES.has(this.normalizeActivityType(activityType));
  }

  /**
   * Get all prohibited activity types
   */
  getProhibitedActivities(): string[] {
    return Array.from(PROHIBITED_ACTIVITIES);
  }

  /**
   * Get all allowed activity types
   */
  getAllowedActivityTypes(): string[] {
    return [
      ...Object.keys(ALLOWED_ACTIVITY_TYPES),
      ...Array.from(this.customActivityTypes.keys()),
    ];
  }

  // ========================================================================
  // Private Methods
  // ========================================================================

  /**
   * Normalize activity type string
   */
  private normalizeActivityType(type: string): string {
    return type.toLowerCase().trim().replace(/\s+/g, '-');
  }

  /**
   * Calculate compliance score
   */
  private calculateScore(criteria: ComplianceCriteria, issueCount: number): number {
    let score = 0;

    // Asset backing: 30% of score
    if (criteria.assetBacked) score += 3000;

    // Real economic value: 25% of score
    if (criteria.realEconomicValue) score += 2500;

    // Not prohibited: 25% of score
    if (!criteria.prohibitedActivity) score += 2500;

    // Documentation: 10% of score
    if (criteria.documentationProvided) score += 1000;

    // Validator verification: 10% of score
    if (criteria.verifiedByValidators) score += 1000;

    // Penalize for issues
    score = Math.max(0, score - issueCount * 500);

    return score;
  }

  /**
   * Calculate confidence in the scoring decision
   */
  private calculateConfidence(criteria: ComplianceCriteria): number {
    let confidence = 0;

    if (criteria.prohibitedActivity) return 100; // Highest confidence for prohibited
    if (criteria.assetBacked) confidence += 30;
    if (criteria.realEconomicValue) confidence += 25;
    if (criteria.documentationProvided) confidence += 20;
    if (criteria.verifiedByValidators) confidence += 25;

    return Math.min(100, confidence);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a default HAI scorer
 */
export function createHAIScorer(): HAIScorer {
  return new HAIScorer();
}

/**
 * Quick check if an activity type is Sharia-compliant
 */
export function isActivityTypeCompliant(activityType: string): boolean {
  const scorer = new HAIScorer();
  return !scorer.isProhibited(activityType);
}

/**
 * Get list of allowed activity types
 */
export function getAllowedActivityTypes(): string[] {
  return Object.keys(ALLOWED_ACTIVITY_TYPES);
}

/**
 * Get list of prohibited activity types
 */
export function getProhibitedActivityTypes(): string[] {
  return Array.from(PROHIBITED_ACTIVITIES);
}
