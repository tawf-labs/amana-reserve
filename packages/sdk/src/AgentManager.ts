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

import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js';
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { ethers } from 'ethers';

export interface AgentConfig {
  uri: string;
  shariaCompliant: boolean;
  capabilities: string[];
  endpoints: AgentEndpoint[];
}

export interface AgentEndpoint {
  name: string;
  endpoint: string;
  version?: string;
}

export interface AgentRegistration {
  ethereumAgentId: number;
  solanaAgentId?: PublicKey;
  crossChainLinked: boolean;
}

export interface OperationResult {
  success: boolean;
  transactionHash: string;
  data?: any;
}

export interface AgentOperation {
  type: 'deploy_capital' | 'update_hai' | 'vote' | 'validate';
  requiresRealTime: boolean;
  data: any;
}

/**
 * Unified Agent Manager for AMANA Reserve with MagicBlock and EIP-8004 integration
 */
export class AgentManager {
  private ethereumProvider: ethers.Provider;
  private solanaConnection: Connection;
  private magicBlockRouter: Connection;
  private ethereumSigner?: ethers.Signer;
  private solanaWallet?: Wallet;

  // Contract addresses
  private identityRegistryAddress: string;
  private reputationRegistryAddress: string;
  private validationRegistryAddress: string;

  // MagicBlock ER Validators
  private static readonly ER_VALIDATORS = {
    mainnet: {
      asia: new PublicKey('MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57'),
      eu: new PublicKey('MEUGGrYPxKk17hCr7wpT6s8dtNokZj5U2L57vjYMS8e'),
      us: new PublicKey('MUS3hc9TCw4cGC12vHNoYcCGzJG1txjgQLZWVoeNHNd'),
    },
    devnet: {
      asia: new PublicKey('MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57'),
      eu: new PublicKey('MEUGGrYPxKk17hCr7wpT6s8dtNokZj5U2L57vjYMS8e'),
      us: new PublicKey('MUS3hc9TCw4cGC12vHNoYcCGzJG1txjgQLZWVoeNHNd'),
      tee: new PublicKey('FnE6VJT5QNZdedZPnCoLsARgBwoE6DeJNjBs2H1gySXA'),
    },
  };

  constructor(config: {
    ethereumProvider: ethers.Provider;
    solanaConnection: Connection;
    magicBlockRouterUrl: string;
    contractAddresses: {
      identityRegistry: string;
      reputationRegistry: string;
      validationRegistry: string;
    };
  }) {
    this.ethereumProvider = config.ethereumProvider;
    this.solanaConnection = config.solanaConnection;
    this.magicBlockRouter = new Connection(config.magicBlockRouterUrl);
    
    this.identityRegistryAddress = config.contractAddresses.identityRegistry;
    this.reputationRegistryAddress = config.contractAddresses.reputationRegistry;
    this.validationRegistryAddress = config.contractAddresses.validationRegistry;
  }

  /**
   * Connect Ethereum signer
   */
  async connectEthereum(signer: ethers.Signer): Promise<void> {
    this.ethereumSigner = signer;
  }

  /**
   * Connect Solana wallet
   */
  async connectSolana(wallet: Wallet): Promise<void> {
    this.solanaWallet = wallet;
  }

  /**
   * Register a new agent across both chains
   */
  async registerAgent(agentConfig: AgentConfig): Promise<AgentRegistration> {
    if (!this.ethereumSigner) {
      throw new Error('Ethereum signer not connected');
    }

    // Register on Ethereum for governance and reputation
    const identityRegistry = new ethers.Contract(
      this.identityRegistryAddress,
      [
        'function registerShariaCompliantAgent(string memory agentURI, bytes32[] memory complianceProofs) external returns (uint256)',
        'function register(string memory agentURI, tuple(string metadataKey, bytes metadataValue)[] calldata metadata) external returns (uint256)',
      ],
      this.ethereumSigner
    );

    let ethereumTx;
    if (agentConfig.shariaCompliant) {
      // Generate mock compliance proofs (in production, these would be real ZK proofs)
      const complianceProofs = [ethers.keccak256(ethers.toUtf8Bytes('halal-compliant'))];
      ethereumTx = await identityRegistry.registerShariaCompliantAgent(
        agentConfig.uri,
        complianceProofs
      );
    } else {
      const metadata = agentConfig.endpoints.map(endpoint => ({
        metadataKey: `endpoint_${endpoint.name}`,
        metadataValue: ethers.toUtf8Bytes(JSON.stringify(endpoint)),
      }));
      ethereumTx = await identityRegistry.register(agentConfig.uri, metadata);
    }

    const receipt = await ethereumTx.wait();
    const ethereumAgentId = parseInt(receipt.logs[0].topics[1], 16);

    // Register on Solana for real-time operations (if wallet connected)
    let solanaAgentId: PublicKey | undefined;
    if (this.solanaWallet) {
      // This would integrate with the Solana programs
      // For now, we'll create a placeholder PDA
      const [agentPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('agent'), Buffer.from(ethereumAgentId.toString())],
        new PublicKey('AMANAagent1111111111111111111111111111') // Placeholder program ID
      );
      solanaAgentId = agentPda;
    }

    return {
      ethereumAgentId,
      solanaAgentId,
      crossChainLinked: !!solanaAgentId,
    };
  }

  /**
   * Execute agent operation with automatic chain selection
   */
  async executeAgentOperation(
    agentId: number,
    operation: AgentOperation
  ): Promise<OperationResult> {
    const targetChain = this.selectOptimalChain(operation);

    if (targetChain === 'solana' && operation.requiresRealTime) {
      return await this.executeOnMagicBlock(agentId, operation);
    } else {
      return await this.executeOnEthereum(agentId, operation);
    }
  }

  /**
   * Execute operation on MagicBlock Ephemeral Rollup
   */
  private async executeOnMagicBlock(
    agentId: number,
    operation: AgentOperation
  ): Promise<OperationResult> {
    if (!this.solanaWallet) {
      throw new Error('Solana wallet not connected');
    }

    try {
      switch (operation.type) {
        case 'deploy_capital':
          return await this.deployCapitalRealtime(agentId, operation.data);
        case 'update_hai':
          return await this.updateHaiRealtime(agentId, operation.data);
        default:
          throw new Error(`Unsupported operation type: ${operation.type}`);
      }
    } catch (error) {
      return {
        success: false,
        transactionHash: '',
        data: { error: error.message },
      };
    }
  }

  /**
   * Execute operation on Ethereum base layer
   */
  private async executeOnEthereum(
    agentId: number,
    operation: AgentOperation
  ): Promise<OperationResult> {
    if (!this.ethereumSigner) {
      throw new Error('Ethereum signer not connected');
    }

    try {
      switch (operation.type) {
        case 'validate':
          return await this.requestValidation(agentId, operation.data);
        default:
          throw new Error(`Unsupported operation type: ${operation.type}`);
      }
    } catch (error) {
      return {
        success: false,
        transactionHash: '',
        data: { error: error.message },
      };
    }
  }

  /**
   * Deploy capital in real-time on Ephemeral Rollup
   */
  private async deployCapitalRealtime(
    agentId: number,
    data: { activityId: string; amount: number }
  ): Promise<OperationResult> {
    // This would integrate with the actual Solana program
    // For now, return a mock result
    return {
      success: true,
      transactionHash: 'mock_solana_tx_hash',
      data: {
        activityId: data.activityId,
        amount: data.amount,
        deployedOnER: true,
      },
    };
  }

  /**
   * Update HAI score in real-time
   */
  private async updateHaiRealtime(
    agentId: number,
    data: { activityId: string; complianceDelta: number }
  ): Promise<OperationResult> {
    // This would integrate with the actual HAI program
    return {
      success: true,
      transactionHash: 'mock_hai_update_tx',
      data: {
        activityId: data.activityId,
        complianceDelta: data.complianceDelta,
        updatedOnER: true,
      },
    };
  }

  /**
   * Request validation on Ethereum
   */
  private async requestValidation(
    agentId: number,
    data: { validatorAddress: string; requestURI: string; requestHash: string }
  ): Promise<OperationResult> {
    const validationRegistry = new ethers.Contract(
      this.validationRegistryAddress,
      [
        'function validationRequest(address validatorAddress, uint256 agentId, string calldata requestURI, bytes32 requestHash) external',
      ],
      this.ethereumSigner!
    );

    const tx = await validationRegistry.validationRequest(
      data.validatorAddress,
      agentId,
      data.requestURI,
      data.requestHash
    );

    const receipt = await tx.wait();

    return {
      success: true,
      transactionHash: receipt.hash,
      data: {
        agentId,
        validatorAddress: data.validatorAddress,
        requestHash: data.requestHash,
      },
    };
  }

  /**
   * Give feedback to an agent
   */
  async giveFeedback(
    agentId: number,
    feedback: {
      value: number;
      valueDecimals: number;
      tag1: string;
      tag2: string;
      endpoint?: string;
      feedbackURI?: string;
    }
  ): Promise<OperationResult> {
    if (!this.ethereumSigner) {
      throw new Error('Ethereum signer not connected');
    }

    const reputationRegistry = new ethers.Contract(
      this.reputationRegistryAddress,
      [
        'function giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals, string calldata tag1, string calldata tag2, string calldata endpoint, string calldata feedbackURI, bytes32 feedbackHash) external',
      ],
      this.ethereumSigner
    );

    const tx = await reputationRegistry.giveFeedback(
      agentId,
      feedback.value,
      feedback.valueDecimals,
      feedback.tag1,
      feedback.tag2,
      feedback.endpoint || '',
      feedback.feedbackURI || '',
      ethers.ZeroHash
    );

    const receipt = await tx.wait();

    return {
      success: true,
      transactionHash: receipt.hash,
      data: { agentId, feedback },
    };
  }

  /**
   * Get agent reputation summary
   */
  async getAgentReputation(
    agentId: number,
    clientAddresses: string[],
    filters?: { tag1?: string; tag2?: string }
  ): Promise<{
    count: number;
    averageValue: number;
    valueDecimals: number;
  }> {
    const reputationRegistry = new ethers.Contract(
      this.reputationRegistryAddress,
      [
        'function getSummary(uint256 agentId, address[] calldata clientAddresses, string calldata tag1, string calldata tag2) external view returns (uint64 count, int128 summaryValue, uint8 summaryValueDecimals)',
      ],
      this.ethereumProvider
    );

    const [count, summaryValue, summaryValueDecimals] = await reputationRegistry.getSummary(
      agentId,
      clientAddresses,
      filters?.tag1 || '',
      filters?.tag2 || ''
    );

    return {
      count: Number(count),
      averageValue: Number(summaryValue),
      valueDecimals: summaryValueDecimals,
    };
  }

  /**
   * Select optimal chain for operation
   */
  private selectOptimalChain(operation: AgentOperation): 'ethereum' | 'solana' {
    // Real-time operations go to Solana/MagicBlock
    if (operation.requiresRealTime) {
      return 'solana';
    }

    // Governance and high-value operations go to Ethereum
    if (operation.type === 'validate' || operation.type === 'vote') {
      return 'ethereum';
    }

    // Default to Ethereum for security
    return 'ethereum';
  }

  /**
   * Get ER validator for region
   */
  static getERValidator(network: 'mainnet' | 'devnet', region: 'asia' | 'eu' | 'us' | 'tee' = 'asia'): PublicKey {
    return AgentManager.ER_VALIDATORS[network][region];
  }
}
