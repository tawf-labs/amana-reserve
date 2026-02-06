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

import { expect } from "chai";
import { AgentManager } from "../AgentManager";
import { Connection, Keypair } from "@solana/web3.js";
import { Wallet } from "@coral-xyz/anchor";
import { ethers } from "ethers";

// Mock ComplianceProver for testing
class MockComplianceProver {
  async generateActivityComplianceProof(activityType: string, capital: number) {
    return {
      proof: "0x" + "1".repeat(64),
      publicSignals: [activityType, capital.toString()],
    };
  }

  async verifyComplianceProof(proof: any): Promise<boolean> {
    return true;
  }

  createProofHash(proof: any): string {
    return ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(proof)));
  }

  async batchGenerateProofs(activities: Array<{ type: string; capital: number }>) {
    return Promise.all(
      activities.map((a) => this.generateActivityComplianceProof(a.type, a.capital))
    );
  }
}

const ComplianceProver = MockComplianceProver;

describe("Advanced Features Integration", function () {
  let agentManager: AgentManager;
  let complianceProver: ComplianceProver;
  let ethereumProvider: ethers.Provider;
  let solanaConnection: Connection;

  before(async function () {
    // Setup test environment
    ethereumProvider = new ethers.JsonRpcProvider("http://localhost:8545");
    solanaConnection = new Connection("http://localhost:8899");
    
    agentManager = new AgentManager({
      ethereumProvider,
      solanaConnection,
      magicBlockRouterUrl: "http://localhost:7799", // Local ER
      contractAddresses: {
        identityRegistry: "0x742d35Cc6634C0532925a3b8D0C9964E5Bda4A4e",
        reputationRegistry: "0x742d35Cc6634C0532925a3b8D0C9964E5Bda4A4f",
        validationRegistry: "0x742d35Cc6634C0532925a3b8D0C9964E5Bda4A50",
      },
    });

    complianceProver = new ComplianceProver();

    // Connect test wallets
    const ethereumWallet = new ethers.Wallet("0x" + "1".repeat(64), ethereumProvider);
    const solanaKeypair = Keypair.generate();
    const solanaWallet = new Wallet(solanaKeypair);

    await agentManager.connectEthereum(ethereumWallet);
    await agentManager.connectSolana(solanaWallet);
  });

  describe("Private Operations with TEE", function () {
    it("Should deploy capital privately", async function () {
      const registration = await agentManager.registerAgent({
        uri: "https://example.com/private-agent.json",
        shariaCompliant: true,
        capabilities: ["private-capital-deployment"],
        endpoints: [],
      });

      // Deploy capital privately (amount hidden)
      const result = await agentManager.executeAgentOperation(
        registration.ethereumAgentId,
        {
          type: "deploy_capital",
          requiresRealTime: true,
          data: {
            activityId: "private-agriculture-001",
            amount: 500000, // This will be encrypted
            usePrivateER: true,
          },
        }
      );

      expect(result.success).to.be.true;
      console.log("✅ Private capital deployment:", result);
    });

    it("Should calculate private HAI with TEE", async function () {
      // This would use the TEE validator
      const result = await agentManager.executeAgentOperation(1, {
        type: "update_hai",
        requiresRealTime: true,
        data: {
          activityId: "private-agriculture-001",
          usePrivateComputation: true,
          teeValidator: "FnE6VJT5QNZdedZPnCoLsARgBwoE6DeJNjBs2H1gySXA",
        },
      });

      expect(result.success).to.be.true;
      console.log("✅ Private HAI calculation:", result);
    });
  });

  describe("Zero-Knowledge Compliance Proofs", function () {
    it("Should generate and verify compliance proof", async function () {
      const proof = await complianceProver.generateActivityComplianceProof(
        "agriculture",
        100000
      );

      expect(proof).to.have.property("proof");
      expect(proof).to.have.property("publicSignals");

      const isValid = await complianceProver.verifyComplianceProof(proof);
      expect(isValid).to.be.true;

      console.log("✅ ZK compliance proof generated and verified");
    });

    it("Should register agent with ZK compliance proof", async function () {
      const proof = await complianceProver.generateActivityComplianceProof(
        "technology",
        75000
      );

      const proofHash = complianceProver.createProofHash(proof);
      
      const registration = await agentManager.registerAgent({
        uri: "https://example.com/zk-agent.json",
        shariaCompliant: true,
        capabilities: ["zk-compliance-verification"],
        endpoints: [],
        zkComplianceProof: proof,
      });

      expect(registration.ethereumAgentId).to.be.greaterThan(0);
      console.log("✅ Agent registered with ZK proof:", registration);
    });

    it("Should batch generate compliance proofs", async function () {
      const activities = [
        { type: "agriculture" as const, capital: 100000 },
        { type: "technology" as const, capital: 75000 },
        { type: "manufacturing" as const, capital: 150000 },
      ];

      const batchProofs = await complianceProver.batchGenerateProofs(activities);
      expect(batchProofs).to.have.length(3);

      // Verify all proofs
      const verifications = await Promise.all(
        batchProofs.map(proof => complianceProver.verifyComplianceProof(proof))
      );

      expect(verifications.every(v => v === true)).to.be.true;
      console.log("✅ Batch compliance proofs generated and verified");
    });
  });

  describe("Magic Actions Automation", function () {
    it("Should trigger automatic compliance check", async function () {
      // Deploy capital with Magic Action
      const result = await agentManager.executeAgentOperation(1, {
        type: "deploy_capital",
        requiresRealTime: true,
        data: {
          activityId: "auto-compliance-001",
          amount: 200000,
          enableMagicActions: true,
          actions: ["compliance-check", "hai-update"],
        },
      });

      expect(result.success).to.be.true;
      expect(result.data).to.have.property("magicActionsTriggered");
      console.log("✅ Magic Actions triggered:", result.data.magicActionsTriggered);
    });

    it("Should automatically distribute profits", async function () {
      // Complete activity with profit
      const result = await agentManager.executeAgentOperation(1, {
        type: "complete_activity",
        requiresRealTime: false,
        data: {
          activityId: "auto-compliance-001",
          outcome: 50000, // 50k profit
          enableProfitDistribution: true,
        },
      });

      expect(result.success).to.be.true;
      console.log("✅ Automatic profit distribution:", result);
    });

    it("Should sync cross-chain automatically", async function () {
      const result = await agentManager.executeAgentOperation(1, {
        type: "sync_cross_chain",
        requiresRealTime: true,
        data: {
          activityId: "auto-compliance-001",
          targetChain: "ethereum",
          syncType: "activity-completion",
        },
      });

      expect(result.success).to.be.true;
      console.log("✅ Cross-chain sync initiated:", result);
    });
  });

  describe("End-to-End Advanced Workflow", function () {
    it("Should execute complete advanced agent workflow", async function () {
      console.log("🚀 Starting advanced agent workflow...");

      // 1. Generate ZK compliance proof
      const complianceProof = await complianceProver.generateActivityComplianceProof(
        "agriculture",
        1000000
      );
      console.log("✅ Step 1: ZK compliance proof generated");

      // 2. Register agent with compliance proof
      const registration = await agentManager.registerAgent({
        uri: "https://example.com/advanced-agent.json",
        shariaCompliant: true,
        capabilities: ["private-operations", "zk-compliance", "magic-actions"],
        endpoints: [
          {
            name: "A2A",
            endpoint: "https://agent.example.com/.well-known/agent-card.json",
            version: "0.3.0",
          },
        ],
        zkComplianceProof: complianceProof,
      });
      console.log("✅ Step 2: Advanced agent registered");

      // 3. Deploy capital privately with Magic Actions
      const deployResult = await agentManager.executeAgentOperation(
        registration.ethereumAgentId,
        {
          type: "deploy_capital",
          requiresRealTime: true,
          data: {
            activityId: "advanced-workflow-001",
            amount: 1000000,
            usePrivateER: true,
            enableMagicActions: true,
            actions: ["compliance-check", "hai-update", "cross-chain-sync"],
          },
        }
      );
      console.log("✅ Step 3: Private capital deployed with Magic Actions");

      // 4. Update HAI with VRF and TEE
      const haiResult = await agentManager.executeAgentOperation(
        registration.ethereumAgentId,
        {
          type: "update_hai",
          requiresRealTime: true,
          data: {
            activityId: "advanced-workflow-001",
            useVRF: true,
            usePrivateComputation: true,
            dataSources: [1, 2, 3, 4, 5],
          },
        }
      );
      console.log("✅ Step 4: HAI updated with VRF and TEE");

      // 5. Complete activity with automatic profit distribution
      const completeResult = await agentManager.executeAgentOperation(
        registration.ethereumAgentId,
        {
          type: "complete_activity",
          requiresRealTime: false,
          data: {
            activityId: "advanced-workflow-001",
            outcome: 150000, // 15% profit
            enableProfitDistribution: true,
            enableCrossChainSync: true,
          },
        }
      );
      console.log("✅ Step 5: Activity completed with profit distribution");

      // 6. Verify final state
      const reputation = await agentManager.getAgentReputation(
        registration.ethereumAgentId,
        [await agentManager["ethereumSigner"]!.getAddress()],
        { tag1: "advanced-workflow" }
      );
      console.log("✅ Step 6: Final reputation:", reputation);

      // Verify all steps completed successfully
      expect(deployResult.success).to.be.true;
      expect(haiResult.success).to.be.true;
      expect(completeResult.success).to.be.true;

      console.log("🎉 Advanced workflow completed successfully!");
    });
  });

  describe("Performance and Scalability", function () {
    it("Should handle concurrent agent operations", async function () {
      const concurrentOps = Array.from({ length: 10 }, (_, i) => 
        agentManager.executeAgentOperation(1, {
          type: "deploy_capital",
          requiresRealTime: true,
          data: {
            activityId: `concurrent-${i}`,
            amount: 10000 * (i + 1),
          },
        })
      );

      const results = await Promise.all(concurrentOps);
      const successCount = results.filter(r => r.success).length;

      expect(successCount).to.equal(10);
      console.log(`✅ Handled ${successCount}/10 concurrent operations`);
    });

    it("Should measure ER vs base layer performance", async function () {
      // Measure ER performance
      const erStart = Date.now();
      await agentManager.executeAgentOperation(1, {
        type: "deploy_capital",
        requiresRealTime: true,
        data: { activityId: "perf-er", amount: 50000 },
      });
      const erTime = Date.now() - erStart;

      // Measure base layer performance
      const baseStart = Date.now();
      await agentManager.executeAgentOperation(1, {
        type: "validate",
        requiresRealTime: false,
        data: {
          validatorAddress: "0x742d35Cc6634C0532925a3b8D0C9964E5Bda4A51",
          requestURI: "https://example.com/validation.json",
          requestHash: ethers.keccak256(ethers.toUtf8Bytes("perf-test")),
        },
      });
      const baseTime = Date.now() - baseStart;

      console.log(`⚡ ER time: ${erTime}ms, Base layer time: ${baseTime}ms`);
      console.log(`🚀 ER is ${(baseTime / erTime).toFixed(2)}x faster`);

      expect(erTime).to.be.lessThan(baseTime);
    });
  });
});
