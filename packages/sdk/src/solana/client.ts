/**
 * AMANA Solana Client
 * Provides type-safe interaction with AMANA Solana programs
 */

import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  Signer,
  TransactionInstruction,
  AccountMeta,
  Commitment,
} from '@solana/web3.js';
import {
  Program,
  AnchorProvider,
  web3,
  setProvider,
  Provider,
} from '@project-serum/anchor';
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
} from '../common/types';

// ============================================================================
// Program IDs
// ============================================================================

const AMANA_RESERVE_PROGRAM_ID = new PublicKey(
  'AMANareserve11111111111111111111111111'
);
const AMANA_HAI_PROGRAM_ID = new PublicKey(
  'AMANAhai111111111111111111111111111111'
);
const AMANA_DAO_PROGRAM_ID = new PublicKey(
  'AMANAdao1111111111111111111111111111111'
);

// ============================================================================
// PDA Seeds
// ============================================================================

const RESERVE_SEED = Buffer.from('reserve');
const PARTICIPANT_SEED = Buffer.from('participant');
const ACTIVITY_SEED = Buffer.from('activity');
const HAI_SEED = Buffer.from('hai');
const METRICS_SEED = Buffer.from('metrics');
const SNAPSHOT_SEED = Buffer.from('snapshot');
const DAO_SEED = Buffer.from('dao');
const PROPOSAL_SEED = Buffer.from('proposal');

// ============================================================================
// Solana Client Configuration
// ============================================================================

export interface SolanaConfig {
  rpcUrl: string;
  wsUrl?: string;
  commitment?: Commitment;
  programIds?: {
    amanaReserve?: PublicKey;
    amanaHai?: PublicKey;
    amanaDao?: PublicKey;
  };
}

// ============================================================================
// Solana Client
// ============================================================================

export class AmanaSolanaClient {
  private connection: Connection;
  private wallet: Signer | null = null;
  private provider: AnchorProvider | null = null;
  private programIds: {
    amanaReserve: PublicKey;
    amanaHai: PublicKey;
    amanaDao: PublicKey;
  };

  constructor(config: SolanaConfig) {
    this.connection = new Connection(config.rpcUrl, {
      wsEndpoint: config.wsUrl,
      commitment: config.commitment || 'confirmed',
    });

    this.programIds = {
      amanaReserve: config.programIds?.amanaReserve ?? AMANA_RESERVE_PROGRAM_ID,
      amanaHai: config.programIds?.amanaHai ?? AMANA_HAI_PROGRAM_ID,
      amanaDao: config.programIds?.amanaDao ?? AMANA_DAO_PROGRAM_ID,
    };
  }

  /**
   * Connect a wallet for transactions
   */
  async connect(wallet: Signer): Promise<void> {
    this.wallet = wallet;
    this.provider = new AnchorProvider(
      this.connection,
      wallet as unknown as Provider['wallet'],
      { commitment: 'confirmed' }
    );
    setProvider(this.provider);
  }

  /**
   * Get the current wallet address
   */
  getAddress(): PublicKey | null {
    return this.wallet?.publicKey ?? null;
  }

  // ========================================================================
  // PDA Helpers
  // ========================================================================

  /**
   * Derive the reserve PDA
   */
  getReservePDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [RESERVE_SEED],
      this.programIds.amanaReserve
    );
  }

  /**
   * Derive a participant PDA
   */
  getParticipantPDA(agent: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [PARTICIPANT_SEED, agent.toBuffer()],
      this.programIds.amanaReserve
    );
  }

  /**
   * Derive an activity PDA
   */
  getActivityPDA(activityId: Buffer): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [ACTIVITY_SEED, activityId],
      this.programIds.amanaReserve
    );
  }

  /**
   * Derive the HAI PDA
   */
  getHAIPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [HAI_SEED],
      this.programIds.amanaHai
    );
  }

  /**
   * Derive metrics PDA for an activity
   */
  getMetricsPDA(activityId: Buffer): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [METRICS_SEED, activityId],
      this.programIds.amanaHai
    );
  }

  // ========================================================================
  // Reserve Operations
  // ========================================================================

  /**
   * Initialize the AMANA reserve
   */
  async initializeReserve(
    minCapitalContribution: number,
    maxParticipants: number,
    options?: TransactionOptions
  ): Promise<TransactionResult> {
    if (!this.wallet || !this.provider) {
      throw new AmanaError(ErrorCodes.NOT_AUTHORIZED, 'No wallet connected');
    }

    const [reservePda] = this.getReservePDA();

    const instruction = new TransactionInstruction({
      keys: [
        {
          pubkey: reservePda,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: this.wallet.publicKey,
          isSigner: true,
          isWritable: true,
        },
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
      ],
      programId: this.programIds.amanaReserve,
      data: this.encodeInitializeData(minCapitalContribution, maxParticipants),
    });

    const result = await this.sendTransaction(instruction, options);
    return result;
  }

  /**
   * Join the reserve as a participant
   */
  async joinReserve(
    amount: number,
    options?: TransactionOptions
  ): Promise<TransactionResult> {
    if (!this.wallet || !this.provider) {
      throw new AmanaError(ErrorCodes.NOT_AUTHORIZED, 'No wallet connected');
    }

    const [reservePda] = this.getReservePDA();
    const [participantPda] = this.getParticipantPDA(this.wallet.publicKey);

    const instruction = new TransactionInstruction({
      keys: [
        {
          pubkey: reservePda,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: participantPda,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: this.wallet.publicKey,
          isSigner: true,
          isWritable: true,
        },
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
      ],
      programId: this.programIds.amanaReserve,
      data: this.encodeJoinReserveData(amount),
    });

    const result = await this.sendTransaction(instruction, options);
    return result;
  }

  /**
   * Propose a new activity
   */
  async proposeActivity(
    activityId: Buffer,
    capitalRequired: number,
    description: string,
    options?: TransactionOptions
  ): Promise<TransactionResult> {
    if (!this.wallet || !this.provider) {
      throw new AmanaError(ErrorCodes.NOT_AUTHORIZED, 'No wallet connected');
    }

    const [reservePda] = this.getReservePDA();
    const [participantPda] = this.getParticipantPDA(this.wallet.publicKey);
    const [activityPda] = this.getActivityPDA(activityId);

    // Create activity ID account (unchecked - used as seed)
    const activityIdKeypair = Keypair.generate();

    const instruction = new TransactionInstruction({
      keys: [
        {
          pubkey: reservePda,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: participantPda,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: activityPda,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: this.wallet.publicKey,
          isSigner: true,
          isWritable: true,
        },
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
      ],
      programId: this.programIds.amanaReserve,
      data: this.encodeProposeActivityData(activityId, capitalRequired, description),
    });

    const result = await this.sendTransaction(instruction, options);
    return result;
  }

  /**
   * Approve an activity
   */
  async approveActivity(
    activityId: Buffer,
    options?: TransactionOptions
  ): Promise<TransactionResult> {
    if (!this.wallet || !this.provider) {
      throw new AmanaError(ErrorCodes.NOT_AUTHORIZED, 'No wallet connected');
    }

    const [reservePda] = this.getReservePDA();
    const [activityPda] = this.getActivityPDA(activityId);

    const instruction = new TransactionInstruction({
      keys: [
        {
          pubkey: reservePda,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: activityPda,
          isSigner: false,
          isWritable: true,
        },
      ],
      programId: this.programIds.amanaReserve,
      data: Buffer.from([3]), // Approve activity instruction index
    });

    const result = await this.sendTransaction(instruction, options);
    return result;
  }

  /**
   * Complete an activity with profit/loss outcome
   */
  async completeActivity(
    activityId: Buffer,
    outcome: number,
    options?: TransactionOptions
  ): Promise<TransactionResult> {
    if (!this.wallet || !this.provider) {
      throw new AmanaError(ErrorCodes.NOT_AUTHORIZED, 'No wallet connected');
    }

    const [reservePda] = this.getReservePDA();
    const [activityPda] = this.getActivityPDA(activityId);

    const data = Buffer.alloc(9);
    data.writeUInt8(4, 0); // Complete activity instruction index
    data.writeInt64LE(BigInt(outcome), 1); // Outcome as i64

    const instruction = new TransactionInstruction({
      keys: [
        {
          pubkey: reservePda,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: activityPda,
          isSigner: false,
          isWritable: true,
        },
      ],
      programId: this.programIds.amanaReserve,
      data,
    });

    const result = await this.sendTransaction(instruction, options);
    return result;
  }

  /**
   * Deposit additional capital
   */
  async depositCapital(
    amount: number,
    options?: TransactionOptions
  ): Promise<TransactionResult> {
    if (!this.wallet || !this.provider) {
      throw new AmanaError(ErrorCodes.NOT_AUTHORIZED, 'No wallet connected');
    }

    const [reservePda] = this.getReservePDA();
    const [participantPda] = this.getParticipantPDA(this.wallet.publicKey);

    const data = Buffer.alloc(9);
    data.writeUInt8(5, 0); // Deposit capital instruction index
    data.writeBigUInt64LE(BigInt(amount), 1); // Amount as u64

    const instruction = new TransactionInstruction({
      keys: [
        {
          pubkey: reservePda,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: participantPda,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: this.wallet.publicKey,
          isSigner: true,
          isWritable: true,
        },
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
      ],
      programId: this.programIds.amanaReserve,
      data,
    });

    const result = await this.sendTransaction(instruction, options);
    return result;
  }

  /**
   * Withdraw capital from the reserve
   */
  async withdrawCapital(
    amount: number,
    options?: TransactionOptions
  ): Promise<TransactionResult> {
    if (!this.wallet || !this.provider) {
      throw new AmanaError(ErrorCodes.NOT_AUTHORIZED, 'No wallet connected');
    }

    const [reservePda] = this.getReservePDA();
    const [participantPda] = this.getParticipantPDA(this.wallet.publicKey);

    const data = Buffer.alloc(9);
    data.writeUInt8(6, 0); // Withdraw capital instruction index
    data.writeBigUInt64LE(BigInt(amount), 1); // Amount as u64

    const instruction = new TransactionInstruction({
      keys: [
        {
          pubkey: reservePda,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: participantPda,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: this.wallet.publicKey,
          isSigner: true,
          isWritable: true,
        },
      ],
      programId: this.programIds.amanaReserve,
      data,
    });

    const result = await this.sendTransaction(instruction, options);
    return result;
  }

  // ========================================================================
  // HAI Operations
  // ========================================================================

  /**
   * Track an activity for HAI calculation
   */
  async trackActivity(
    activityId: Buffer,
    isCompliant: boolean,
    isAssetBacked: boolean,
    hasRealEconomicValue: boolean,
    validatorCount: number,
    positiveVotes: number,
    options?: TransactionOptions
  ): Promise<TransactionResult> {
    if (!this.wallet || !this.provider) {
      throw new AmanaError(ErrorCodes.NOT_AUTHORIZED, 'No wallet connected');
    }

    const [haiPda] = this.getHAIPDA();
    const [metricsPda] = this.getMetricsPDA(activityId);

    const instruction = new TransactionInstruction({
      keys: [
        {
          pubkey: haiPda,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: metricsPda,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: this.wallet.publicKey,
          isSigner: true,
          isWritable: true,
        },
        {
          pubkey: new PublicKey(activityId), // Activity ID as account
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
      ],
      programId: this.programIds.amanaHai,
      data: this.encodeTrackActivityData(
        isCompliant,
        isAssetBacked,
        hasRealEconomicValue,
        validatorCount,
        positiveVotes
      ),
    });

    const result = await this.sendTransaction(instruction, options);
    return result;
  }

  /**
   * Create an HAI snapshot
   */
  async createSnapshot(options?: TransactionOptions): Promise<TransactionResult> {
    if (!this.wallet || !this.provider) {
      throw new AmanaError(ErrorCodes.NOT_AUTHORIZED, 'No wallet connected');
    }

    const [haiPda] = this.getHAIPDA();
    const snapshotId = Date.now(); // Simplified - should get from HAI account

    const [snapshotPda] = PublicKey.findProgramAddressSync(
      [SNAPSHOT_SEED, Buffer.from(snapshotId.toString())],
      this.programIds.amanaHai
    );

    const instruction = new TransactionInstruction({
      keys: [
        {
          pubkey: haiPda,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: snapshotPda,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: this.wallet.publicKey,
          isSigner: true,
          isWritable: true,
        },
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
      ],
      programId: this.programIds.amanaHai,
      data: Buffer.from([2]), // Create snapshot instruction index
    });

    const result = await this.sendTransaction(instruction, options);
    return result;
  }

  // ========================================================================
  // Transaction Helpers
  // ========================================================================

  private async sendTransaction(
    instruction: TransactionInstruction,
    options?: TransactionOptions
  ): Promise<TransactionResult> {
    if (!this.wallet || !this.provider) {
      throw new AmanaError(ErrorCodes.NOT_AUTHORIZED, 'No wallet connected');
    }

    try {
      const transaction = new Transaction().add(instruction);

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet.publicKey;

      const signature = await this.connection.sendTransaction(
        transaction,
        this.wallet as Signer,
        {
          skipPreflight: options?.gasLimit === undefined,
        }
      );

      const confirmation = await this.connection.confirmTransaction(
        signature,
        this.provider.opts.commitment
      });

      if (confirmation.value.err) {
        throw new AmanaError(
          ErrorCodes.TRANSACTION_FAILED,
          'Transaction failed',
          confirmation.value.err
        );
      }

      return {
        hash: signature,
        status: 'success',
        blockNumber: confirmation.value.slot
          ? toBigInt(confirmation.value.slot)
          : undefined,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ========================================================================
  // Instruction Encoders
  // ========================================================================

  private encodeInitializeData(
    minCapitalContribution: number,
    maxParticipants: number
  ): Buffer {
    const data = Buffer.alloc(17);
    data.writeUInt8(0, 0); // Instruction index
    data.writeBigUInt64LE(BigInt(minCapitalContribution), 1);
    data.writeBigUInt64LE(BigInt(maxParticipants), 9);
    return data;
  }

  private encodeJoinReserveData(amount: number): Buffer {
    const data = Buffer.alloc(9);
    data.writeUInt8(1, 0); // Instruction index
    data.writeBigUInt64LE(BigInt(amount), 1);
    return data;
  }

  private encodeProposeActivityData(
    activityId: Buffer,
    capitalRequired: number,
    description: string
  ): Buffer {
    const activityIdBytes = activityId.slice(0, 32);
    const descriptionBytes = Buffer.from(description.slice(0, 100));

    const data = Buffer.alloc(1 + 32 + 8 + descriptionBytes.length);
    data.writeUInt8(2, 0); // Instruction index
    activityIdBytes.copy(data, 1);
    data.writeBigUInt64LE(BigInt(capitalRequired), 33);
    descriptionBytes.copy(data, 41);

    return data;
  }

  private encodeTrackActivityData(
    isCompliant: boolean,
    isAssetBacked: boolean,
    hasRealEconomicValue: boolean,
    validatorCount: number,
    positiveVotes: number
  ): Buffer {
    const data = Buffer.alloc(1 + 1 + 1 + 1 + 4 + 4);
    data.writeUInt8(1, 0); // Instruction index
    data.writeUInt8(isCompliant ? 1 : 0, 1);
    data.writeUInt8(isAssetBacked ? 1 : 0, 2);
    data.writeUInt8(hasRealEconomicValue ? 1 : 0, 3);
    data.writeUInt32LE(validatorCount, 4);
    data.writeUInt32LE(positiveVotes, 8);
    return data;
  }

  // ========================================================================
  // Utility Functions
  // ========================================================================

  private handleError(error: unknown): AmanaError {
    if (error instanceof AmanaError) return error;

    if (typeof error === 'object' && error !== null) {
      const e = error as { name?: string; message?: string };
      return new AmanaError(
        e.name === 'SendTransactionError'
          ? ErrorCodes.TRANSACTION_FAILED
          : ErrorCodes.UNKNOWN,
        e.message ?? 'Unknown error'
      );
    }

    return new AmanaError(ErrorCodes.UNKNOWN, String(error));
  }

  /**
   * Get account data
   */
  async getAccountData(account: PublicKey): Promise<Buffer> {
    const accountInfo = await this.connection.getAccountInfo(account);
    if (!accountInfo || !accountInfo.data) {
      throw new AmanaError(ErrorCodes.UNKNOWN, 'Account not found');
    }
    return accountInfo.data;
  }
}
