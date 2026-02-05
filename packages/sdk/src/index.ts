export { AgentManager } from './AgentManager';
export type {
  AgentConfig,
  AgentEndpoint,
  AgentRegistration,
  OperationResult,
  AgentOperation,
} from './AgentManager';

// Re-export commonly used types from dependencies
export type { PublicKey, Connection } from '@solana/web3.js';
export type { Wallet } from '@coral-xyz/anchor';
export { ethers } from 'ethers';

/**
 * AMANA Reserve SDK with MagicBlock and EIP-8004 Integration
 * 
 * This SDK provides a unified interface for:
 * - Agent registration and management (EIP-8004)
 * - Real-time operations via MagicBlock Ephemeral Rollups
 * - Cross-chain coordination between Ethereum and Solana
 * - Sharia-compliant agent interactions
 * - Reputation and validation systems
 */
