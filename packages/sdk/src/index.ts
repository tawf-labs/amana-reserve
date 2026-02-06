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
