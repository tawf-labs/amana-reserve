/**
 * ZK Proof Generator - Utilities for generating and verifying zero-knowledge proofs
 *
 * This module provides functions for generating ZK proofs using snarkjs
 * for privacy-preserving operations in the AMANA system.
 */

import { groth16 } from 'snarkjs';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// ============================================================================
// Types
// ============================================================================

export interface ProofInput {
  // Public inputs
  [key: string]: string;
}

export interface ProofOutput {
  proof: groth16.Proof;
  publicSignals: string[];
}

export interface VerificationKey {
  vk_alpha_1: string[];
  vk_beta_1: string[];
  vk_beta_2: string[][];
  vk_gamma_1: string[];
  vk_delta_1: string[];
  vk_gamma_2: string[][];
  vk_delta_2: string[][];
  IC: string[][];
}

// ============================================================================
// Proof Generator
// ============================================================================

export class ProofGenerator {
  private wasmPath: string;
  private zkeyPath: string;

  constructor(circuitName: string, baseDir = './circuits') {
    this.wasmPath = join(baseDir, `${circuitName}.wasm`);
    this.zkeyPath = join(baseDir, `${circuitName}.zkey`);
  }

  /**
   * Generate a Groth16 proof
   */
  async generateProof(input: ProofInput): Promise<ProofOutput> {
    try {
      const { proof, publicSignals } = await groth16.fullProve(
        input,
        this.wasmPath,
        this.zkeyPath
      );

      return { proof, publicSignals };
    } catch (error) {
      throw new Error(`Failed to generate proof: ${error}`);
    }
  }

  /**
   * Verify a Groth16 proof
   */
  async verifyProof(
    verificationKey: VerificationKey,
    publicSignals: string[],
    proof: groth16.Proof
  ): Promise<boolean> {
    try {
      const res = await groth16.verifyProof(
        verificationKey,
        publicSignals,
        proof
      );
      return res;
    } catch (error) {
      throw new Error(`Failed to verify proof: ${error}`);
    }
  }

  /**
   * Export proof to JSON
   */
  exportProof(proof: groth16.Proof, publicSignals: string[]): string {
    return JSON.stringify({ proof, publicSignals }, null, 2);
  }

  /**
   * Export verification key
   */
  async exportVerificationKey(vKeyPath: string): Promise<VerificationKey> {
    try {
      const vKey = await groth16.exportVerificationKey(vKeyPath);
      return vKey as unknown as VerificationKey;
    } catch (error) {
      throw new Error(`Failed to export verification key: ${error}`);
    }
  }

  /**
   * Calculate public signal hash
   */
  hashPublicSignals(publicSignals: string[]): string {
    // Simple hash function - in production use keccak256 or similar
    return publicSignals.join(',');
  }
}

// ============================================================================
// Specialized Proof Generators
// ============================================================================

export class ActivityValidationProofGenerator extends ProofGenerator {
  constructor(baseDir = './circuits') {
    super('activity-validation', baseDir);
  }

  /**
   * Generate proof for activity validation
   */
  async generateActivityValidationProof(input: {
    activityHash: string;
    minCapital: string;
    complianceRequirement: string;
    agentCapital: string;
    isCompliant: string;
    agentPublicKey: string;
    activitySalt: string;
  }): Promise<ProofOutput> {
    return this.generateProof(input);
  }
}

export class HAIComputationProofGenerator extends ProofGenerator {
  constructor(baseDir = './circuits') {
    super('hai-computation', baseDir);
  }

  /**
   * Generate proof for HAI computation
   */
  async generateHAIComputationProof(input: {
    totalActivities: string;
    weights: [string, string, string, string];
    compliantCount: string;
    assetBackedCount: string;
    economicValueCount: string;
    validationScore: string;
  }): Promise<ProofOutput> {
    return this.generateProof(input);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create an activity validation proof generator
 */
export function createActivityValidationProofGenerator(baseDir?: string) {
  return new ActivityValidationProofGenerator(baseDir);
}

/**
 * Create an HAI computation proof generator
 */
export function createHAIComputationProofGenerator(baseDir?: string) {
  return new HAIComputationProofGenerator(baseDir);
}

/**
 * Generate a random salt for ZK operations
 */
export function generateSalt(): string {
  return Math.floor(Math.random() * 2 ** 64).toString();
}

/**
 * Hash an activity for ZK proof generation
 */
export function hashActivity(data: {
  activityId: string;
  capital: string;
  type: string;
}): string {
  // Simple hash - in production use proper hash function
  const str = `${data.activityId}-${data.capital}-${data.type}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString();
}
