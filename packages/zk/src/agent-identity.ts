/**
 * ZK Agent Identity Management
 *
 * This module provides ZK identity management for agents using Semaphore,
 * enabling anonymous participation in the AMANA system.
 */

import { Identity } from '@semaphore-protocol/identity';
import { Group } from '@semaphore-protocol/group';

// ============================================================================
// Types
// ============================================================================

export interface AgentIdentity {
  commitment: string;
  nullifier: string;
  trapdoor: string;
}

export interface AnonymousProof {
  merkleProof: {
    root: string;
    pathElements: string[];
    pathIndices: number[];
  };
  nullifierHash: string;
}

// ============================================================================
// Agent Identity Manager
// ============================================================================

export class AgentIdentityManager {
  private identity: Identity | null = null;

  /**
   * Create a new ZK identity for an agent
   */
  createIdentity(): AgentIdentity {
    this.identity = new Identity();

    return {
      commitment: this.identity.commitment.toString(),
      nullifier: this.identity.nullifier.toString(),
      trapdoor: this.identity.getTrapdoor().toString(),
    };
  }

  /**
   * Load an existing identity from components
   */
  loadIdentity(trapdoor: string, nullifier: string): AgentIdentity {
    this.identity = new Identity(trapdoor, nullifier);

    return {
      commitment: this.identity.commitment.toString(),
      nullifier: this.identity.nullifier.toString(),
      trapdoor: this.identity.getTrapdoor().toString(),
    };
  }

  /**
   * Generate anonymous proof for participation
   */
  async generateAnonymousProof(
    merkleRoot: string,
    merkleProof: {
      pathElements: string[];
      pathIndices: number[];
    },
    externalNullifier: string,
    signal: string
  ): Promise<AnonymousProof> {
    if (!this.identity) {
      throw new Error('No identity loaded');
    }

    // In production, use Semaphore.generateProof
    // This is a simplified structure
    return {
      merkleProof: {
        root: merkleRoot,
        pathElements: merkleProof.pathElements,
        pathIndices: merkleProof.pathIndices,
      },
      nullifierHash: this.identity.nullifier.toString(),
    };
  }

  /**
   * Verify anonymous proof
   */
  async verifyAnonymousProof(
    proof: AnonymousProof,
    merkleRoot: string,
    externalNullifier: string,
    signal: string
  ): Promise<boolean> {
    // In production, use Semaphore.verifyProof
    // Simplified verification
    return proof.merkleProof.root === merkleRoot;
  }

  /**
   * Get the current identity commitment
   */
  getCommitment(): string | null {
    return this.identity?.commitment.toString() ?? null;
  }

  /**
   * Export identity for storage
   */
  exportIdentity(): string | null {
    if (!this.identity) return null;

    return JSON.stringify({
      trapdoor: this.identity.getTrapdoor().toString(),
      nullifier: this.identity.nullifier.toString(),
      commitment: this.identity.commitment.toString(),
    });
  }

  /**
   * Import identity from storage
   */
  importIdentity(json: string): AgentIdentity | null {
    try {
      const data = JSON.parse(json);
      return this.loadIdentity(data.trapdoor, data.nullifier);
    } catch (error) {
      console.error('Failed to import identity:', error);
      return null;
    }
  }
}

// ============================================================================
// Identity Group Manager
// ============================================================================

export class IdentityGroupManager {
  private groups: Map<string, Group> = new Map();

  /**
   * Create a new identity group
   */
  createGroup(groupId: string, treeDepth = 20): Group {
    const group = new Group(treeDepth);
    this.groups.set(groupId, group);
    return group;
  }

  /**
   * Add member to a group
   */
  addMember(groupId: string, commitment: string): void {
    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error(`Group ${groupId} not found`);
    }

    group.addMember(BigInt(commitment));
  }

  /**
   * Remove member from a group
   */
  removeMember(groupId: string, commitment: string): void {
    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error(`Group ${groupId} not found`);
    }

    group.removeMember(BigInt(commitment));
  }

  /**
   * Get group root
   */
  getGroupRoot(groupId: string): string {
    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error(`Group ${groupId} not found`);
    }

    return group.root.toString();
  }

  /**
   * Generate Merkle proof for a member
   */
  generateMerkleProof(
    groupId: string,
    commitment: string
  ): { pathElements: string[]; pathIndices: number[] } {
    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error(`Group ${groupId} not found`);
    }

    const index = group.indexOf(BigInt(commitment));
    if (index === -1) {
      throw new Error('Member not found in group');
    }

    const proof = group.generateMerkleProof(index);

    return {
      pathElements: proof.pathElements.map((e) => e.toString()),
      pathIndices: proof.pathIndices,
    };
  }

  /**
   * Get group size
   */
  getGroupSize(groupId: string): number {
    const group = this.groups.get(groupId);
    return group ? group.size : 0;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create an agent identity manager
 */
export function createAgentIdentityManager(): AgentIdentityManager {
  return new AgentIdentityManager();
}

/**
 * Create an identity group manager
 */
export function createIdentityGroupManager(): IdentityGroupManager {
  return new IdentityGroupManager();
}

/**
 * Generate a random external nullifier for operations
 */
export function generateExternalNullifier(operation: string): string {
  const data = `${operation}-${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString();
}
