/**
 * AMANA Ethereum Client
 * Provides type-safe interaction with AMANA Ethereum contracts
 */

import { ethers, Contract, BrowserProvider, JsonRpcSigner } from 'ethers';
import {
  Participant,
  Activity,
  ActivityStatus,
  ReserveStats,
  TransactionResult,
  TransactionOptions,
  AmanaError,
  ErrorCodes,
  BigNumberish,
  toBigInt,
  HAIMetrics,
  HAISnapshot,
} from '../common/types';

// ============================================================================
// Contract ABIs (minimal interfaces - full ABIs should be imported)
// ============================================================================

const AMANA_RESERVE_ABI = [
  'function initialize(uint256 _minCapitalContribution) external',
  'function joinReserve() external payable',
  'function proposeActivity(bytes32 activityId, uint256 capitalRequired) external',
  'function approveActivity(bytes32 activityId) external',
  'function completeActivity(bytes32 activityId, int256 outcome) external',
  'function depositCapital() external payable',
  'function withdrawCapital(uint256 amount) external',
  'function exitReserve() external',
  'function getParticipant(address agent) external view returns ((address agent, uint256 capitalContributed, uint256 profitShare, uint256 lossShare, bool isActive, uint256 joinedAt))',
  'function getActivity(bytes32 activityId) external view returns ((bytes32 activityId, address initiator, uint256 capitalRequired, uint256 capitalDeployed, uint8 status, uint256 createdAt, uint256 completedAt, int256 outcome, bool isValidated))',
  'function getActivityCount() external view returns (uint256)',
  'function getParticipants() external view returns (address[] memory)',
  'function getWithdrawableBalance(address participantAddr) external view returns (uint256)',
  'function getReserveStats() external view returns (uint256 totalCapital, uint256 participantCount, uint256 activityCount, uint256 minCapitalContribution)',
  'function totalCapital() external view returns (uint256)',
  'function participantCount() external view returns (uint256)',
  'function minCapitalContribution() external view returns (uint256)',
  'event ParticipantJoined(address indexed agent, uint256 capitalContributed)',
  'event ActivityProposed(bytes32 indexed activityId, address indexed initiator, uint256 capitalRequired)',
  'event ActivityApproved(bytes32 indexed activityId)',
  'event ActivityCompleted(bytes32 indexed activityId, int256 outcome)',
  'event CapitalDeposited(address indexed agent, uint256 amount)',
  'event CapitalWithdrawn(address indexed agent, uint256 amount)',
  'event ProfitPaid(address indexed participant, uint256 amount)',
  'event LossDeducted(address indexed participant, uint256 amount)',
] as const;

const HAI_ABI = [
  'function trackActivity(bytes32 activityId, bool isCompliant, bool isAssetBacked, bool hasRealEconomicValue, uint256 validatorCount, uint256 positiveVotes) external',
  'function createSnapshot() external',
  'function getHAIMetrics() external view returns (uint256 score, uint256 percentage, uint256 total, uint256 compliant, uint256 complianceRate)',
  'function getSnapshot(uint256 timestamp) external view returns ((uint256 score, uint256 totalActivities, uint256 compliantActivities, uint256 assetBackedActivities, uint256 timestamp))',
  'function getSnapshotTimestamps() external view returns (uint256[] memory)',
  'function currentScore() external view returns (uint256)',
  'event ScoreUpdated(uint256 oldScore, uint256 newScore)',
  'event ActivityTracked(bytes32 indexed activityId, bool isCompliant, bool isAssetBacked)',
] as const;

const CIRCUIT_BREAKER_ABI = [
  'function pauseSystem(string reason) external',
  'function unpauseSystem() external',
  'function pauseContract(address targetContract) external',
  'function unpauseContract(address targetContract) external',
  'function isPaused() external view returns (bool)',
  'function canExecute(address contractAddress) external view returns (bool)',
  'event SystemPaused(address indexed initiator, string reason)',
  'event SystemUnpaused(address indexed initiator)',
] as const;

// ============================================================================
// Ethereum Client Configuration
// ============================================================================

export interface EthereumConfig {
  rpcUrl: string;
  wsUrl?: string;
  chainId?: number;
  contracts: {
    amanaReserve: string;
    halalActivityIndex?: string;
    circuitBreaker?: string;
    amanaToken?: string;
    amanaDao?: string;
  };
}

// ============================================================================
// Ethereum Client
// ============================================================================

export class AmanaEthereumClient {
  private provider: ethers.Provider;
  private signer: ethers.Signer | null = null;
  private contracts: {
    amanaReserve: Contract;
    halalActivityIndex?: Contract;
    circuitBreaker?: Contract;
    amanaToken?: Contract;
    amanaDao?: Contract;
  };

  constructor(private config: EthereumConfig) {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.contracts = {
      amanaReserve: new Contract(
        config.contracts.amanaReserve,
        AMANA_RESERVE_ABI,
        this.provider
      ),
    };

    if (config.contracts.halalActivityIndex) {
      this.contracts.halalActivityIndex = new Contract(
        config.contracts.halalActivityIndex,
        HAI_ABI,
        this.provider
      );
    }

    if (config.contracts.circuitBreaker) {
      this.contracts.circuitBreaker = new Contract(
        config.contracts.circuitBreaker,
        CIRCUIT_BREAKER_ABI,
        this.provider
      );
    }
  }

  /**
   * Connect a signer (wallet) for transactions
   */
  async connect(signerOrProvider: ethers.Signer | BrowserProvider): Promise<void> {
    this.signer =
      signerOrProvider instanceof BrowserProvider
        ? await signerOrProvider.getSigner()
        : signerOrProvider;

    // Re-create contracts with signer
    this.contracts.amanaReserve = this.contracts.amanaReserve.connect(
      this.signer
    ) as Contract;

    if (this.contracts.halalActivityIndex) {
      this.contracts.halalActivityIndex = this.contracts.halalActivityIndex.connect(
        this.signer
      ) as Contract;
    }

    if (this.contracts.circuitBreaker) {
      this.contracts.circuitBreaker = this.contracts.circuitBreaker.connect(
        this.signer
      ) as Contract;
    }
  }

  /**
   * Get the current signer address
   */
  async getAddress(): Promise<string | null> {
    if (!this.signer) return null;
    return await this.signer.getAddress();
  }

  // ========================================================================
  // Reserve Operations
  // ========================================================================

  /**
   * Join the reserve as a participant
   */
  async joinReserve(
    amount: BigNumberish,
    options?: TransactionOptions
  ): Promise<TransactionResult> {
    if (!this.signer) throw new AmanaError(ErrorCodes.NOT_AUTHORIZED, 'No signer connected');

    try {
      const tx = await this.contracts.amanaReserve.joinReserve({
        value: toBigInt(amount),
        gasLimit: options?.gasLimit,
        gasPrice: options?.gasPrice,
      });

      const receipt = await tx.wait();
      return {
        hash: receipt!.hash,
        status: receipt!.status === 1 ? 'success' : 'failed',
        gasUsed: receipt!.gasUsed,
        blockNumber: receipt!.blockNumber,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Propose a new activity
   */
  async proposeActivity(
    activityId: string,
    capitalRequired: BigNumberish,
    options?: TransactionOptions
  ): Promise<TransactionResult> {
    if (!this.signer) throw new AmanaError(ErrorCodes.NOT_AUTHORIZED, 'No signer connected');

    try {
      const tx = await this.contracts.amanaReserve.proposeActivity(
        activityId,
        capitalRequired,
        {
          gasLimit: options?.gasLimit,
          gasPrice: options?.gasPrice,
        }
      );

      const receipt = await tx.wait();
      return {
        hash: receipt!.hash,
        status: receipt!.status === 1 ? 'success' : 'failed',
        gasUsed: receipt!.gasUsed,
        blockNumber: receipt!.blockNumber,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Approve an activity
   */
  async approveActivity(
    activityId: string,
    options?: TransactionOptions
  ): Promise<TransactionResult> {
    if (!this.signer) throw new AmanaError(ErrorCodes.NOT_AUTHORIZED, 'No signer connected');

    try {
      const tx = await this.contracts.amanaReserve.approveActivity(activityId, {
        gasLimit: options?.gasLimit,
        gasPrice: options?.gasPrice,
      });

      const receipt = await tx.wait();
      return {
        hash: receipt!.hash,
        status: receipt!.status === 1 ? 'success' : 'failed',
        gasUsed: receipt!.gasUsed,
        blockNumber: receipt!.blockNumber,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Complete an activity with profit/loss outcome
   */
  async completeActivity(
    activityId: string,
    outcome: bigint,
    options?: TransactionOptions
  ): Promise<TransactionResult> {
    if (!this.signer) throw new AmanaError(ErrorCodes.NOT_AUTHORIZED, 'No signer connected');

    try {
      const tx = await this.contracts.amanaReserve.completeActivity(
        activityId,
        outcome,
        {
          gasLimit: options?.gasLimit,
          gasPrice: options?.gasPrice,
        }
      );

      const receipt = await tx.wait();
      return {
        hash: receipt!.hash,
        status: receipt!.status === 1 ? 'success' : 'failed',
        gasUsed: receipt!.gasUsed,
        blockNumber: receipt!.blockNumber,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Deposit additional capital
   */
  async depositCapital(
    amount: BigNumberish,
    options?: TransactionOptions
  ): Promise<TransactionResult> {
    if (!this.signer) throw new AmanaError(ErrorCodes.NOT_AUTHORIZED, 'No signer connected');

    try {
      const tx = await this.contracts.amanaReserve.depositCapital({
        value: toBigInt(amount),
        gasLimit: options?.gasLimit,
        gasPrice: options?.gasPrice,
      });

      const receipt = await tx.wait();
      return {
        hash: receipt!.hash,
        status: receipt!.status === 1 ? 'success' : 'failed',
        gasUsed: receipt!.gasUsed,
        blockNumber: receipt!.blockNumber,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Withdraw capital from the reserve
   */
  async withdrawCapital(
    amount: BigNumberish,
    options?: TransactionOptions
  ): Promise<TransactionResult> {
    if (!this.signer) throw new AmanaError(ErrorCodes.NOT_AUTHORIZED, 'No signer connected');

    try {
      const tx = await this.contracts.amanaReserve.withdrawCapital(amount, {
        gasLimit: options?.gasLimit,
        gasPrice: options?.gasPrice,
      });

      const receipt = await tx.wait();
      return {
        hash: receipt!.hash,
        status: receipt!.status === 1 ? 'success' : 'failed',
        gasUsed: receipt!.gasUsed,
        blockNumber: receipt!.blockNumber,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Exit the reserve and withdraw all capital
   */
  async exitReserve(options?: TransactionOptions): Promise<TransactionResult> {
    if (!this.signer) throw new AmanaError(ErrorCodes.NOT_AUTHORIZED, 'No signer connected');

    try {
      const tx = await this.contracts.amanaReserve.exitReserve({
        gasLimit: options?.gasLimit,
        gasPrice: options?.gasPrice,
      });

      const receipt = await tx.wait();
      return {
        hash: receipt!.hash,
        status: receipt!.status === 1 ? 'success' : 'failed',
        gasUsed: receipt!.gasUsed,
        blockNumber: receipt!.blockNumber,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ========================================================================
  // View Functions
  // ========================================================================

  /**
   * Get participant information
   */
  async getParticipant(agent: string): Promise<Participant> {
    try {
      const result = await this.contracts.amanaReserve.getParticipant(agent);
      return {
        agent: result.agent,
        capitalContributed: toBigInt(result.capitalContributed),
        profitShare: toBigInt(result.profitShare),
        lossShare: toBigInt(result.lossShare),
        isActive: result.isActive,
        joinedAt: Number(result.joinedAt),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get activity information
   */
  async getActivity(activityId: string): Promise<Activity> {
    try {
      const result = await this.contracts.amanaReserve.getActivity(activityId);
      return {
        activityId: result.activityId,
        initiator: result.initiator,
        capitalRequired: toBigInt(result.capitalRequired),
        capitalDeployed: toBigInt(result.capitalDeployed),
        status: result.status,
        createdAt: Number(result.createdAt),
        completedAt: Number(result.completedAt),
        outcome: toBigInt(result.outcome),
        isValidated: result.isValidated,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all participants
   */
  async getParticipants(): Promise<string[]> {
    try {
      return await this.contracts.amanaReserve.getParticipants();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get reserve statistics
   */
  async getReserveStats(): Promise<ReserveStats> {
    try {
      const result = await this.contracts.amanaReserve.getReserveStats();
      return {
        totalCapital: toBigInt(result.totalCapital),
        participantCount: Number(result.participantCount),
        activityCount: Number(result.activityCount),
        minCapitalContribution: toBigInt(result.minCapitalContribution),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get withdrawable balance for a participant
   */
  async getWithdrawableBalance(participantAddress: string): Promise<bigint> {
    try {
      const result = await this.contracts.amanaReserve.getWithdrawableBalance(
        participantAddress
      );
      return toBigInt(result);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ========================================================================
  // HAI Operations
  // ========================================================================

  /**
   * Track an activity for HAI calculation
   */
  async trackActivity(
    activityId: string,
    isCompliant: boolean,
    isAssetBacked: boolean,
    hasRealEconomicValue: boolean,
    validatorCount: number,
    positiveVotes: number,
    options?: TransactionOptions
  ): Promise<TransactionResult> {
    if (!this.signer) throw new AmanaError(ErrorCodes.NOT_AUTHORIZED, 'No signer connected');
    if (!this.contracts.halalActivityIndex)
      throw new AmanaError(ErrorCodes.UNKNOWN, 'HAI contract not configured');

    try {
      const tx = await this.contracts.halalActivityIndex.trackActivity(
        activityId,
        isCompliant,
        isAssetBacked,
        hasRealEconomicValue,
        validatorCount,
        positiveVotes,
        {
          gasLimit: options?.gasLimit,
          gasPrice: options?.gasPrice,
        }
      );

      const receipt = await tx.wait();
      return {
        hash: receipt!.hash,
        status: receipt!.status === 1 ? 'success' : 'failed',
        gasUsed: receipt!.gasUsed,
        blockNumber: receipt!.blockNumber,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get HAI metrics
   */
  async getHAIMetrics(): Promise<HAIMetrics> {
    if (!this.contracts.halalActivityIndex)
      throw new AmanaError(ErrorCodes.UNKNOWN, 'HAI contract not configured');

    try {
      const result = await this.contracts.halalActivityIndex.getHAIMetrics();
      return {
        score: Number(result.score),
        percentage: Number(result.percentage),
        totalActivities: Number(result.total),
        compliantActivities: Number(result.compliant),
        complianceRate: Number(result.complianceRate),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create an HAI snapshot
   */
  async createSnapshot(options?: TransactionOptions): Promise<TransactionResult> {
    if (!this.signer) throw new AmanaError(ErrorCodes.NOT_AUTHORIZED, 'No signer connected');
    if (!this.contracts.halalActivityIndex)
      throw new AmanaError(ErrorCodes.UNKNOWN, 'HAI contract not configured');

    try {
      const tx = await this.contracts.halalActivityIndex.createSnapshot({
        gasLimit: options?.gasLimit,
        gasPrice: options?.gasPrice,
      });

      const receipt = await tx.wait();
      return {
        hash: receipt!.hash,
        status: receipt!.status === 1 ? 'success' : 'failed',
        gasUsed: receipt!.gasUsed,
        blockNumber: receipt!.blockNumber,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ========================================================================
  // Circuit Breaker Operations
  // ========================================================================

  /**
   * Check if the system is paused
   */
  async isPaused(): Promise<boolean> {
    if (!this.contracts.circuitBreaker)
      throw new AmanaError(ErrorCodes.UNKNOWN, 'Circuit breaker not configured');

    try {
      return await this.contracts.circuitBreaker.isPaused();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Pause the system
   */
  async pauseSystem(
    reason: string,
    options?: TransactionOptions
  ): Promise<TransactionResult> {
    if (!this.signer) throw new AmanaError(ErrorCodes.NOT_AUTHORIZED, 'No signer connected');
    if (!this.contracts.circuitBreaker)
      throw new AmanaError(ErrorCodes.UNKNOWN, 'Circuit breaker not configured');

    try {
      const tx = await this.contracts.circuitBreaker.pauseSystem(reason, {
        gasLimit: options?.gasLimit,
        gasPrice: options?.gasPrice,
      });

      const receipt = await tx.wait();
      return {
        hash: receipt!.hash,
        status: receipt!.status === 1 ? 'success' : 'failed',
        gasUsed: receipt!.gasUsed,
        blockNumber: receipt!.blockNumber,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ========================================================================
  // Event Listeners
  // ========================================================================

  /**
   * Listen for participant joined events
   */
  onParticipantJoined(callback: (agent: string, capital: bigint) => void): void {
    this.contracts.amanaReserve.on('ParticipantJoined', (agent, capital) => {
      callback(agent, toBigInt(capital));
    });
  }

  /**
   * Listen for activity proposed events
   */
  onActivityProposed(
    callback: (activityId: string, initiator: string, capital: bigint) => void
  ): void {
    this.contracts.amanaReserve.on(
      'ActivityProposed',
      (activityId, initiator, capital) => {
        callback(activityId, initiator, toBigInt(capital));
      }
    );
  }

  /**
   * Listen for activity completed events
   */
  onActivityCompleted(
    callback: (activityId: string, outcome: bigint) => void
  ): void {
    this.contracts.amanaReserve.on('ActivityCompleted', (activityId, outcome) => {
      callback(activityId, toBigInt(outcome));
    });
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.contracts.amanaReserve.removeAllListeners();
    this.contracts.halalActivityIndex?.removeAllListeners();
    this.contracts.circuitBreaker?.removeAllListeners();
  }

  // ========================================================================
  // Utility Functions
  // ========================================================================

  private handleError(error: unknown): AmanaError {
    if (error instanceof AmanaError) return error;

    if (typeof error === 'object' && error !== null) {
      const e = error as { code?: string; reason?: string; message?: string };
      return new AmanaError(
        e.code ?? ErrorCodes.UNKNOWN,
        e.reason ?? e.message ?? 'Unknown error'
      );
    }

    return new AmanaError(ErrorCodes.UNKNOWN, String(error));
  }
}
