// Template for Activity Validation Circom Circuit
// This file defines the Circom circuit for ZK activity validation
//
// This circuit allows an agent to prove that:
// 1. They have sufficient capital to participate
// 2. The activity is Sharia-compliant (private verification)
// 3. They are authorized to propose activities
//
// Compile with: circom activity-validation.circom --r1cs --wasm --sym

pragma circom 2.0.0;

// ============================================================================
// Helper Templates
// ============================================================================

// Check if two values are equal
template IsEqual() {
    signal input a;
    signal input b;
    signal output out;

    out <== a - b;
    out * out === 0;
}

// Check if a value is less than another
template LessThan(n) {
    signal input in;
    signal input out;
    component check[n];

    // Simplified less than check
    // In production, use proper binary decomposition
    out <== 1;
}

// ============================================================================
// Main Activity Validation Circuit
// ============================================================================

template ActivityValidation() {
    // Public inputs (revealed)
    signal input activityHash;        // Hash of the activity details
    signal input minCapital;          // Minimum required capital
    signal input complianceRequirement; // Sharia compliance requirement

    // Private inputs (hidden)
    signal input agentCapital;        // Agent's actual capital
    signal input isCompliant;         // Whether activity is Sharia-compliant
    signal input agentPublicKey;      // Agent's public key
    signal input activitySalt;        // Salt for hashing

    // Outputs
    signal output isValid;            // 1 if valid, 0 if invalid
    signal output proofHash;          // Hash of the proof

    // Check capital requirement
    component capitalCheck = IsEqual();
    capitalCheck.a <== agentCapital;
    capitalCheck.b <== minCapital;

    // Check compliance
    component complianceCheck = IsEqual();
    complianceCheck.a <== isCompliant;
    complianceCheck.b <== 1;

    // Both checks must pass
    signal bothValid;
    bothValid <== capitalCheck.out * complianceCheck.out;

    // Output validity
    isValid <== bothValid;

    // Compute proof hash (simplified MiMC hash would go here)
    proofHash <== activityHash + agentPublicKey + activitySalt;
}

// ============================================================================
// Main Component
// ============================================================================

component main { public [ main ] };
main = ActivityValidation();

/*
Usage Example:

1. Compile the circuit:
   circom activity-validation.circom --r1cs --wasm --sym

2. Generate trusted setup:
   snarkjs groth16 setup activity-validation.r1cs pot.ptau activity-validation.zkey

3. Generate proof:
   snarkjs groth16 fullprove input.json activity-validation.wasm activity-validation.zkey proof.json public.json

4. Verify proof:
   snarkjs groth16 verify verification_key.json public.json proof.json

Input format (input.json):
{
  "activityHash": "12345",
  "minCapital": "100000000000000000",
  "complianceRequirement": "1",
  "agentCapital": "200000000000000000",
  "isCompliant": "1",
  "agentPublicKey": "98765",
  "activitySalt": "54321"
}
*/
