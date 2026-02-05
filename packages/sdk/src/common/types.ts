/**
 * Common types for AMANA SDK
 * Shared across Ethereum and Solana implementations
 */

// ============================================================================
// Participant Types
// ============================================================================

export interface Participant {
  agent: string;
  capitalContributed: bigint;
  profitShare: bigint;
  lossShare: bigint;
  isActive: boolean;
  joinedAt: number;
}

// ============================================================================
// Activity Types
// ============================================================================

export enum ActivityStatus {
  Proposed = 0,
  Approved = 1,
  Active = 2,
  Completed = 3,
  Rejected = 4,
}

export interface Activity {
  activityId: string;
  initiator: string;
  capitalRequired: bigint;
  capitalDeployed: bigint;
  status: ActivityStatus;
  createdAt: number;
  completedAt: number;
  outcome: bigint; // Positive for profit, negative for loss
  isValidated: boolean;
}

export interface ActivityProposal {
  activityId: string;
  description: string;
  activityType: string;
  capitalRequired: bigint;
  proposer: string;
}

// ============================================================================
// HAI (Halal Activity Index) Types
// ============================================================================

export interface HAIMetrics {
  score: number; // 0-10000 (0.00%-100.00%)
  percentage: number; // 0-100
  totalActivities: number;
  compliantActivities: number;
  complianceRate: number; // 0-10000 basis points
}

export interface HAISnapshot {
  score: number;
  totalActivities: number;
  compliantActivities: number;
  assetBackedActivities: number;
  timestamp: number;
}

export interface ActivityMetrics {
  activityId: string;
  isCompliant: boolean;
  isAssetBacked: boolean;
  hasRealEconomicValue: boolean;
  validatorCount: number;
  positiveVotes: number;
  timestamp: number;
}

// ============================================================================
// Trust Score Types
// ============================================================================

export interface TrustScore {
  agent: string;
  overallScore: number; // 0-10000
  components: {
    complianceScore: number;
    performanceScore: number;
    reliabilityScore: number;
    reputationScore: number;
  };
  lastUpdated: number;
}

// ============================================================================
// DAO/Governance Types
// ============================================================================

export enum ProposalStatus {
  Pending = 0,
  Active = 1,
  Passed = 2,
  Rejected = 3,
  Executed = 4,
  Canceled = 5,
}

export interface Proposal {
  proposalId: bigint;
  proposer: string;
  title: string;
  description: string;
  targetAccount: string;
  amount: bigint;
  affectsSharia: boolean;
  status: ProposalStatus;
  createdAt: number;
  votingStartsAt: number;
  votingEndsAt: number;
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  shariaApproved: boolean;
}

export interface ShariaReview {
  proposalId: bigint;
  boardMember: string;
  approved: boolean;
  reasoning: string;
  timestamp: number;
}

export enum VoteType {
  For = 0,
  Against = 1,
  Abstain = 2,
}

// ============================================================================
// Reserve Stats Types
// ============================================================================

export interface ReserveStats {
  totalCapital: bigint;
  participantCount: number;
  activityCount: number;
  minCapitalContribution: bigint;
}

// ============================================================================
// Chain Types
// ============================================================================

export enum ChainType {
  Ethereum = 'ethereum',
  Solana = 'solana',
}

export interface ChainConfig {
  chain: ChainType;
  rpcUrl: string;
  wsUrl?: string;
  chainId?: number;
}

// ============================================================================
// Transaction Types
// ============================================================================

export interface TransactionResult {
  hash: string;
  status: 'success' | 'failed';
  gasUsed?: bigint;
  blockNumber?: bigint;
}

export interface TransactionOptions {
  gasLimit?: bigint;
  gasPrice?: bigint;
  value?: bigint;
}

// ============================================================================
// Event Types
// ============================================================================

export interface AmanaEvent {
  type: string;
  data: unknown;
  timestamp: number;
  blockNumber?: number;
  transactionHash?: string;
}

export type EventCallback = (event: AmanaEvent) => void;

// ============================================================================
// Filter Types
// ============================================================================

export interface ActivityFilter {
  status?: ActivityStatus;
  initiator?: string;
  startDate?: number;
  endDate?: number;
}

export interface ParticipantFilter {
  isActive?: boolean;
  minCapital?: bigint;
  maxCapital?: bigint;
}

// ============================================================================
// Error Types
// ============================================================================

export class AmanaError extends Error {
  constructor(
    public code: string,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'AmanaError';
  }
}

export const ErrorCodes = {
  // General errors
  UNKNOWN: 'UNKNOWN',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_PARAMS: 'INVALID_PARAMS',

  // Participant errors
  NOT_PARTICIPANT: 'NOT_PARTICIPANT',
  ALREADY_PARTICIPANT: 'ALREADY_PARTICIPANT',
  INSUFFICIENT_CONTRIBUTION: 'INSUFFICIENT_CONTRIBUTION',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  MAX_PARTICIPANTS: 'MAX_PARTICIPANTS',

  // Activity errors
  ACTIVITY_NOT_FOUND: 'ACTIVITY_NOT_FOUND',
  ACTIVITY_ALREADY_EXISTS: 'ACTIVITY_ALREADY_EXISTS',
  INVALID_ACTIVITY_STATUS: 'INVALID_ACTIVITY_STATUS',
  INSUFFICIENT_CAPITAL: 'INSUFFICIENT_CAPITAL',

  // Transaction errors
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  TRANSACTION_REJECTED: 'TRANSACTION_REJECTED',
  GAS_ESTIMATION_FAILED: 'GAS_ESTIMATION_FAILED',

  // Governance errors
  NOT_AUTHORIZED: 'NOT_AUTHORIZED',
  VOTING_ENDED: 'VOTING_ENDED',
  QUORUM_NOT_MET: 'QUORUM_NOT_MET',
  SHARIA_NOT_APPROVED: 'SHARIA_NOT_APPROVED',
} as const;

// ============================================================================
// Utility Types
// ============================================================================

export type BigNumberish = string | number | bigint;

export function toBigInt(value: BigNumberish): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'string') return BigInt(value);
  return BigInt(Math.floor(value));
}

export function formatUnits(value: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;
  return `${integerPart}.${fractionalPart.toString().padStart(decimals, '0')}`;
}

export function parseUnits(value: string, decimals: number): bigint {
  const [integer, fractional = ''] = value.split('.');
  const paddedFractional = fractional.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(integer) * BigInt(10 ** decimals) + BigInt(paddedFractional || 0);
}
