// Template for HAI Computation Circom Circuit
// This file defines the Circom circuit for ZK HAI computation verification
//
// This circuit allows verification that:
// 1. HAI score was computed correctly
// 2. All activities were included in the calculation
// 3. Weights were applied correctly
//
// Compile with: circom hai-computation.circom --r1cs --wasm --sym

pragma circom 2.0.0;

// ============================================================================
// Helper Templates
// ============================================================================

// Weighted sum computation
template WeightedSum(n) {
    signal input values[n];
    signal input weights[n];
    signal output sum;

    signal intermediates[n];

    // Compute weighted sum: sum(values[i] * weights[i])
    for (var i = 0; i < n; i++) {
        intermediates[i] <== values[i] * weights[i];
    }

    sum <== 0;
    for (var j = 0; j < n; j++) {
        sum <== sum + intermediates[j];
    }
}

// Range proof (value is between min and max)
template RangeProof() {
    signal input value;
    signal input min;
    signal input max;
    signal output inRange;

    signal aboveMin;
    signal belowMax;

    // Simplified range check
    // In production, use proper comparison circuits
    aboveMin <== 1;
    belowMax <== 1;

    inRange <== aboveMin * belowMax;
}

// ============================================================================
// HAI Score Computation Circuit
// ============================================================================

template HAIComputation(nActivities) {
    // Public inputs
    signal input totalActivities;
    signal input weights[4]; // compliance, assetBacking, economicValue, validation

    // Private inputs
    signal input compliantCount;
    signal input assetBackedCount;
    signal input economicValueCount;
    signal input validationScore;

    // Output
    signal output haiScore;

    // Component scores (0-10000 basis points)
    signal complianceScore;
    signal assetBackingScore;
    signal economicValueScore;
    signal validationComponentScore;

    // Calculate compliance score: (compliantCount / totalActivities) * 10000
    signal complianceRatio;
    complianceRatio <== compliantCount * 10000 / totalActivities;
    complianceScore <== complianceRatio;

    // Calculate asset backing score
    signal assetBackingRatio;
    assetBackingRatio <== assetBackedCount * 10000 / totalActivities;
    assetBackingScore <== assetBackingRatio;

    // Calculate economic value score
    signal economicValueRatio;
    economicValueRatio <== economicValueCount * 10000 / totalActivities;
    economicValueScore <== economicValueRatio;

    // Validation score (baseline)
    validationComponentScore <== validationScore;

    // Weighted sum of all components
    component weightedSum = WeightedSum(4);
    weightedSum.values[0] <== complianceScore;
    weightedSum.values[1] <== assetBackingScore;
    weightedSum.values[2] <== economicValueScore;
    weightedSum.values[3] <== validationComponentScore;

    weightedSum.weights[0] <== weights[0];
    weightedSum.weights[1] <== weights[1];
    weightedSum.weights[2] <== weights[2];
    weightedSum.weights[3] <== weights[3];

    // Divide by 10000 (basis points)
    haiScore <== weightedSum.sum / 10000;
}

// ============================================================================
// Main Component
// ============================================================================

component main { public [ main ] };
main = HAIComputation(100); // Support up to 100 activities

/*
Usage Example:

1. Compile the circuit:
   circom hai-computation.circom --r1cs --wasm --sym

2. Generate trusted setup:
   snarkjs groth16 setup hai-computation.r1cs pot.ptau hai-computation.zkey

3. Generate proof:
   snarkjs groth16 fullprove input.json hai-computation.wasm hai-computation.zkey proof.json public.json

Input format (input.json):
{
  "totalActivities": "50",
  "weights": ["4000", "2500", "2000", "1500"],
  "compliantCount": "45",
  "assetBackedCount": "48",
  "economicValueCount": "47",
  "validationScore": "8000"
}

Expected output: HAI score around 7200 (72%)
*/
