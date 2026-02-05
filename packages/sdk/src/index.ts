/**
 * AMANA SDK - Main entry point
 *
 * Provides a unified interface for interacting with the AMANA Sharia-native
 * macro reserve system across Ethereum and Solana blockchains.
 */

// Re-export all common types
export * from './common/types';

// Re-export Ethereum client
export { AmanaEthereumClient } from './ethereum/client';
export type { EthereumConfig } from './ethereum/client';

// Re-export Solana client
export { AmanaSolanaClient } from './solana/client';
export type { SolanaConfig } from './solana/client';

import { AmanaEthereumClient, EthereumConfig } from './ethereum/client';
import { AmanaSolanaClient, SolanaConfig } from './solana/client';
import { ChainType, AmanaError, ErrorCodes } from './common/types';

// ============================================================================
// AMANA SDK - Unified Interface
// ============================================================================

export interface AmanaConfig {
  chain: ChainType;
  ethereum?: EthereumConfig;
  solana?: SolanaConfig;
}

export class AmanaSDK {
  private ethereumClient?: AmanaEthereumClient;
  private solanaClient?: AmanaSolanaClient;
  private chain: ChainType;

  constructor(config: AmanaConfig) {
    this.chain = config.chain;

    if (config.chain === ChainType.Ethereum && config.ethereum) {
      this.ethereumClient = new AmanaEthereumClient(config.ethereum);
    } else if (config.chain === ChainType.Solana && config.solana) {
      this.solanaClient = new AmanaSolanaClient(config.solana);
    } else {
      throw new AmanaError(
        ErrorCodes.INVALID_PARAMS,
        `Invalid configuration for ${config.chain}`
      );
    }
  }

  /**
   * Get the Ethereum client (only available on Ethereum)
   */
  get ethereum(): AmanaEthereumClient {
    if (!this.ethereumClient) {
      throw new AmanaError(
        ErrorCodes.INVALID_PARAMS,
        'Ethereum client not available'
      );
    }
    return this.ethereumClient;
  }

  /**
   * Get the Solana client (only available on Solana)
   */
  get solana(): AmanaSolanaClient {
    if (!this.solanaClient) {
      throw new AmanaError(
        ErrorCodes.INVALID_PARAMS,
        'Solana client not available'
      );
    }
    return this.solanaClient;
  }

  /**
   * Get the active chain type
   */
  getChain(): ChainType {
    return this.chain;
  }

  /**
   * Check if the SDK is connected to Ethereum
   */
  isEthereum(): boolean {
    return this.chain === ChainType.Ethereum;
  }

  /**
   * Check if the SDK is connected to Solana
   */
  isSolana(): boolean {
    return this.chain === ChainType.Solana;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create an AMANA SDK instance for Ethereum
 */
export function createEthereumSDK(config: EthereumConfig): AmanaSDK {
  return new AmanaSDK({
    chain: ChainType.Ethereum,
    ethereum: config,
  });
}

/**
 * Create an AMANA SDK instance for Solana
 */
export function createSolanaSDK(config: SolanaConfig): AmanaSDK {
  return new AmanaSDK({
    chain: ChainType.Solana,
    solana: config,
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a random activity ID for proposals
 */
export function generateActivityId(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return '0x' + Buffer.from(array).toString('hex');
}

/**
 * Convert an amount to token units (with decimals)
 */
export function toTokenUnits(amount: number | string, decimals: number): bigint {
  const value = typeof amount === 'string' ? amount : amount.toString();
  const [integer, fractional = ''] = value.split('.');
  const paddedFractional = fractional.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(integer) * BigInt(10 ** decimals) + BigInt(paddedFractional || '0');
}

/**
 * Convert token units to a readable amount
 */
export function fromTokenUnits(amount: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const integerPart = amount / divisor;
  const fractionalPart = amount % divisor;
  return `${integerPart}.${fractionalPart.toString().padStart(decimals, '0')}`;
}

/**
 * Format a timestamp to a human-readable date
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

/**
 * Calculate percentage from basis points
 */
export function basisPointsToPercentage(bps: number): number {
  return bps / 100;
}

/**
 * Convert percentage to basis points
 */
export function percentageToBasisPoints(percentage: number): number {
  return Math.round(percentage * 100);
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default configuration values
 */
export const DEFAULTS = {
  // Ethereum defaults
  ETHEREUM_CHAIN_ID: 1,
  ETHEREUM_GAS_LIMIT: 300000,
  ETHEREUM_MIN_CONTRIBUTION: '100000000000000000', // 0.1 ETH

  // Solana defaults
  SOLANA_COMMITMENT: 'confirmed' as const,
  SOLANA_MIN_CONTRIBUTION: 100000000, // 0.1 SOL

  // HAI defaults
  HAI_MAX_SCORE: 10000,
  HAI_DEFAULT_SCORE: 5000,

  // DAO defaults
  DAO_VOTING_DELAY: 86400, // 1 day in seconds
  DAO_VOTING_PERIOD: 604800, // 1 week in seconds
  DAO_QUORUM_PERCENTAGE: 400, // 4%
} as const;

// ============================================================================
// Version Information
// ============================================================================

export const SDK_VERSION = '1.0.0';

export const PACKAGE_INFO = {
  name: '@amana/sdk',
  version: SDK_VERSION,
  description: 'AMANA Sharia-native macro reserve system SDK',
  homepage: 'https://github.com/tawf-labs/amana-reserve',
} as const;
