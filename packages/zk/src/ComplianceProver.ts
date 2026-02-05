import { groth16 } from "snarkjs";
import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

export interface ComplianceInputs {
  activityType: number;
  capitalAmount: number;
  profitRate: number;
  assetBacking: number;
  riskLevel: number;
  haiScoreThreshold: number;
  maxRiskLevel: number;
}

export interface ComplianceProof {
  proof: {
    pi_a: [string, string];
    pi_b: [[string, string], [string, string]];
    pi_c: [string, string];
  };
  publicSignals: string[];
}

/**
 * Zero-Knowledge Compliance Prover for AMANA agents
 */
export class ComplianceProver {
  private wasmPath: string;
  private zkeyPath: string;

  constructor(circuitName: string = "agent-compliance") {
    this.wasmPath = path.join(__dirname, `../circuits/${circuitName}.wasm`);
    this.zkeyPath = path.join(__dirname, `../circuits/${circuitName}_final.zkey`);
  }

  /**
   * Generate a zero-knowledge proof of Sharia compliance
   */
  async generateComplianceProof(inputs: ComplianceInputs): Promise<ComplianceProof> {
    try {
      const { proof, publicSignals } = await groth16.fullProve(
        {
          // Private inputs (hidden)
          activityType: inputs.activityType,
          capitalAmount: inputs.capitalAmount,
          profitRate: inputs.profitRate,
          assetBacking: inputs.assetBacking,
          riskLevel: inputs.riskLevel,
          // Public inputs (visible)
          haiScoreThreshold: inputs.haiScoreThreshold,
          maxRiskLevel: inputs.maxRiskLevel,
        },
        this.wasmPath,
        this.zkeyPath
      );

      return {
        proof: {
          pi_a: [proof.pi_a[0], proof.pi_a[1]],
          pi_b: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
          pi_c: [proof.pi_c[0], proof.pi_c[1]],
        },
        publicSignals,
      };
    } catch (error) {
      throw new Error(`Failed to generate compliance proof: ${error.message}`);
    }
  }

  /**
   * Verify a compliance proof
   */
  async verifyComplianceProof(proof: ComplianceProof): Promise<boolean> {
    try {
      const vkeyPath = path.join(__dirname, "../circuits/verification_key.json");
      const vKey = JSON.parse(fs.readFileSync(vkeyPath, "utf8"));

      const isValid = await groth16.verify(vKey, proof.publicSignals, proof.proof);
      return isValid;
    } catch (error) {
      console.error("Proof verification failed:", error);
      return false;
    }
  }

  /**
   * Format proof for Ethereum smart contract
   */
  formatProofForContract(proof: ComplianceProof): {
    a: [string, string];
    b: [[string, string], [string, string]];
    c: [string, string];
    publicInputs: string[];
  } {
    return {
      a: proof.proof.pi_a,
      b: proof.proof.pi_b,
      c: proof.proof.pi_c,
      publicInputs: proof.publicSignals,
    };
  }

  /**
   * Generate compliance proof for specific activity types
   */
  async generateActivityComplianceProof(activityType: 'agriculture' | 'technology' | 'manufacturing' | 'services', 
                                       capitalAmount: number): Promise<ComplianceProof> {
    const activityTypeMap = {
      agriculture: 1,
      technology: 2,
      manufacturing: 3,
      services: 4,
    };

    const inputs: ComplianceInputs = {
      activityType: activityTypeMap[activityType],
      capitalAmount,
      profitRate: 1500, // 15% expected profit
      assetBacking: 1,   // Asset-backed
      riskLevel: 3,      // Medium risk
      haiScoreThreshold: 8000, // 80% HAI threshold
      maxRiskLevel: 5,   // Max medium-high risk
    };

    return await this.generateComplianceProof(inputs);
  }

  /**
   * Batch generate proofs for multiple activities
   */
  async batchGenerateProofs(activities: Array<{
    type: 'agriculture' | 'technology' | 'manufacturing' | 'services';
    capital: number;
  }>): Promise<ComplianceProof[]> {
    const proofs = await Promise.all(
      activities.map(activity => 
        this.generateActivityComplianceProof(activity.type, activity.capital)
      )
    );

    return proofs;
  }

  /**
   * Create compliance proof hash for on-chain storage
   */
  createProofHash(proof: ComplianceProof): string {
    const proofData = JSON.stringify(proof);
    return ethers.keccak256(ethers.toUtf8Bytes(proofData));
  }
}

/**
 * Example usage and testing
 */
export async function demonstrateComplianceProofs() {
  console.log("🔐 Generating zero-knowledge compliance proofs...");
  
  const prover = new ComplianceProver();

  // Generate proof for halal agriculture activity
  const agricultureProof = await prover.generateActivityComplianceProof('agriculture', 50000);
  console.log("✅ Agriculture compliance proof generated");

  // Verify the proof
  const isValid = await prover.verifyComplianceProof(agricultureProof);
  console.log("✅ Proof verification:", isValid ? "VALID" : "INVALID");

  // Format for smart contract
  const contractProof = prover.formatProofForContract(agricultureProof);
  console.log("✅ Proof formatted for contract deployment");

  // Generate batch proofs
  const batchProofs = await prover.batchGenerateProofs([
    { type: 'agriculture', capital: 100000 },
    { type: 'technology', capital: 75000 },
    { type: 'manufacturing', capital: 150000 },
  ]);
  console.log(`✅ Generated ${batchProofs.length} batch compliance proofs`);

  return {
    agricultureProof,
    contractProof,
    batchProofs,
    isValid,
  };
}

// Export for use in other modules
export default ComplianceProver;
