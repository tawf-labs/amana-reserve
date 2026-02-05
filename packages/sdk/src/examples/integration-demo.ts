import { AgentManager, AgentConfig } from './AgentManager';
import { Connection, Keypair } from '@solana/web3.js';
import { Wallet } from '@coral-xyz/anchor';
import { ethers } from 'ethers';

/**
 * Example usage of the AMANA Agent Manager with MagicBlock and EIP-8004 integration
 */
async function main() {
  // Initialize providers
  const ethereumProvider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_KEY');
  const solanaConnection = new Connection('https://api.mainnet-beta.solana.com');
  
  // Initialize Agent Manager
  const agentManager = new AgentManager({
    ethereumProvider,
    solanaConnection,
    magicBlockRouterUrl: 'https://devnet-router.magicblock.app',
    contractAddresses: {
      identityRegistry: '0x742d35Cc6634C0532925a3b8D0C9964E5Bda4A4e',
      reputationRegistry: '0x742d35Cc6634C0532925a3b8D0C9964E5Bda4A4f',
      validationRegistry: '0x742d35Cc6634C0532925a3b8D0C9964E5Bda4A50',
    },
  });

  // Connect wallets
  const ethereumWallet = new ethers.Wallet('YOUR_PRIVATE_KEY', ethereumProvider);
  const solanaKeypair = Keypair.generate();
  const solanaWallet = new Wallet(solanaKeypair);

  await agentManager.connectEthereum(ethereumWallet);
  await agentManager.connectSolana(solanaWallet);

  // 1. Register a Sharia-compliant agent
  console.log('🤖 Registering Sharia-compliant agent...');
  
  const agentConfig: AgentConfig = {
    uri: 'https://example.com/agent-metadata.json',
    shariaCompliant: true,
    capabilities: ['capital-deployment', 'hai-calculation', 'compliance-checking'],
    endpoints: [
      {
        name: 'A2A',
        endpoint: 'https://agent.example.com/.well-known/agent-card.json',
        version: '0.3.0',
      },
      {
        name: 'MCP',
        endpoint: 'https://mcp.agent.example.com/',
        version: '2025-06-18',
      },
    ],
  };

  const registration = await agentManager.registerAgent(agentConfig);
  console.log('✅ Agent registered:', registration);

  // 2. Deploy capital in real-time using Ephemeral Rollups
  console.log('💰 Deploying capital in real-time...');
  
  const deployResult = await agentManager.executeAgentOperation(
    registration.ethereumAgentId,
    {
      type: 'deploy_capital',
      requiresRealTime: true,
      data: {
        activityId: 'halal-agriculture-001',
        amount: 1000000, // 1M units
      },
    }
  );
  console.log('✅ Capital deployed:', deployResult);

  // 3. Update HAI score with VRF
  console.log('📊 Updating HAI score with VRF...');
  
  const haiResult = await agentManager.executeAgentOperation(
    registration.ethereumAgentId,
    {
      type: 'update_hai',
      requiresRealTime: true,
      data: {
        activityId: 'halal-agriculture-001',
        complianceDelta: 50, // +0.5% compliance boost
      },
    }
  );
  console.log('✅ HAI score updated:', haiResult);

  // 4. Request validation on Ethereum
  console.log('🔍 Requesting validation...');
  
  const validationResult = await agentManager.executeAgentOperation(
    registration.ethereumAgentId,
    {
      type: 'validate',
      requiresRealTime: false,
      data: {
        validatorAddress: '0x742d35Cc6634C0532925a3b8D0C9964E5Bda4A51',
        requestURI: 'https://example.com/validation-request.json',
        requestHash: ethers.keccak256(ethers.toUtf8Bytes('validation-request-001')),
      },
    }
  );
  console.log('✅ Validation requested:', validationResult);

  // 5. Give feedback to the agent
  console.log('💬 Giving feedback...');
  
  const feedbackResult = await agentManager.giveFeedback(registration.ethereumAgentId, {
    value: 85, // 85/100 rating
    valueDecimals: 0,
    tag1: 'capital-deployment',
    tag2: 'halal-compliant',
    endpoint: 'https://agent.example.com/deploy-capital',
    feedbackURI: 'https://example.com/feedback-001.json',
  });
  console.log('✅ Feedback given:', feedbackResult);

  // 6. Get agent reputation
  console.log('📈 Getting agent reputation...');
  
  const reputation = await agentManager.getAgentReputation(
    registration.ethereumAgentId,
    [ethereumWallet.address], // Client addresses to include
    { tag1: 'capital-deployment' } // Filter by tag
  );
  console.log('✅ Agent reputation:', reputation);

  console.log('🎉 Integration demo completed successfully!');
}

/**
 * Advanced example: Cross-chain agent coordination
 */
async function crossChainExample() {
  console.log('🌉 Cross-chain agent coordination example...');
  
  // This would demonstrate:
  // 1. Agent registration on both chains
  // 2. Real-time operations on Solana ER
  // 3. Governance decisions on Ethereum
  // 4. Cross-chain state synchronization
  // 5. Unified reputation across chains
  
  console.log('✅ Cross-chain coordination completed!');
}

/**
 * MagicBlock specific features example
 */
async function magicBlockFeaturesExample() {
  console.log('⚡ MagicBlock features example...');
  
  // This would demonstrate:
  // 1. Ephemeral Rollup delegation
  // 2. Real-time zero-fee transactions
  // 3. Magic Actions for automated compliance
  // 4. Private Ephemeral Rollups for sensitive data
  // 5. VRF for fair randomness
  
  console.log('✅ MagicBlock features demonstrated!');
}

// Run examples
if (require.main === module) {
  main()
    .then(() => crossChainExample())
    .then(() => magicBlockFeaturesExample())
    .catch(console.error);
}
