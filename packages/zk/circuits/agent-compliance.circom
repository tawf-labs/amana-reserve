pragma circom 2.0.0;

/*
 * Agent Compliance Circuit
 * Proves that an agent's activities are Sharia-compliant without revealing details
 */

template AgentCompliance() {
    // Private inputs (hidden from verifier)
    signal private input activityType;      // 1=agriculture, 2=technology, etc.
    signal private input capitalAmount;     // Amount of capital deployed
    signal private input profitRate;        // Expected profit rate (basis points)
    signal private input assetBacking;      // 1 if asset-backed, 0 otherwise
    signal private input riskLevel;         // Risk level (1-10)
    
    // Public inputs (visible to verifier)
    signal input haiScoreThreshold;         // Minimum HAI score required
    signal input maxRiskLevel;              // Maximum allowed risk level
    
    // Public outputs
    signal output isCompliant;              // 1 if compliant, 0 otherwise
    signal output complianceScore;          // Compliance score (0-10000)

    // Components for compliance checks
    component halalActivityCheck = HalalActivityCheck();
    component riskAssessment = RiskAssessment();
    component assetBackingCheck = AssetBackingCheck();
    component profitSharingCheck = ProfitSharingCheck();

    // Check if activity type is halal
    halalActivityCheck.activityType <== activityType;
    
    // Assess risk level
    riskAssessment.riskLevel <== riskLevel;
    riskAssessment.maxRiskLevel <== maxRiskLevel;
    
    // Check asset backing
    assetBackingCheck.assetBacking <== assetBacking;
    assetBackingCheck.capitalAmount <== capitalAmount;
    
    // Check profit sharing compliance
    profitSharingCheck.profitRate <== profitRate;
    profitSharingCheck.capitalAmount <== capitalAmount;

    // Calculate overall compliance
    component complianceCalculator = ComplianceCalculator();
    complianceCalculator.halalCheck <== halalActivityCheck.isHalal;
    complianceCalculator.riskCheck <== riskAssessment.isAcceptable;
    complianceCalculator.assetCheck <== assetBackingCheck.isValid;
    complianceCalculator.profitCheck <== profitSharingCheck.isValid;
    
    isCompliant <== complianceCalculator.isCompliant;
    complianceScore <== complianceCalculator.score;
    
    // Ensure compliance score meets threshold
    component thresholdCheck = GreaterEqThan(16);
    thresholdCheck.in[0] <== complianceScore;
    thresholdCheck.in[1] <== haiScoreThreshold;
    
    // Final compliance must meet threshold
    isCompliant === thresholdCheck.out;
}

template HalalActivityCheck() {
    signal input activityType;
    signal output isHalal;
    
    // Define halal activities (1-5 are halal, 6-10 are haram)
    component isHalalActivity = LessEqThan(4);
    isHalalActivity.in[0] <== activityType;
    isHalalActivity.in[1] <== 5;
    
    isHalal <== isHalalActivity.out;
}

template RiskAssessment() {
    signal input riskLevel;
    signal input maxRiskLevel;
    signal output isAcceptable;
    
    component riskCheck = LessEqThan(4);
    riskCheck.in[0] <== riskLevel;
    riskCheck.in[1] <== maxRiskLevel;
    
    isAcceptable <== riskCheck.out;
}

template AssetBackingCheck() {
    signal input assetBacking;
    signal input capitalAmount;
    signal output isValid;
    
    // For Sharia compliance, activities should be asset-backed
    // or have minimal capital requirements
    component minCapitalCheck = GreaterEqThan(32);
    minCapitalCheck.in[0] <== capitalAmount;
    minCapitalCheck.in[1] <== 1000; // Minimum 1000 units
    
    component hasAssetBacking = IsEqual();
    hasAssetBacking.in[0] <== assetBacking;
    hasAssetBacking.in[1] <== 1;
    
    // Valid if asset-backed OR meets minimum capital
    isValid <== hasAssetBacking.out + minCapitalCheck.out - hasAssetBacking.out * minCapitalCheck.out;
}

template ProfitSharingCheck() {
    signal input profitRate;
    signal input capitalAmount;
    signal output isValid;
    
    // Profit rate should be reasonable (not excessive)
    component maxProfitCheck = LessEqThan(16);
    maxProfitCheck.in[0] <== profitRate;
    maxProfitCheck.in[1] <== 3000; // Max 30% profit rate
    
    component minProfitCheck = GreaterEqThan(16);
    minProfitCheck.in[0] <== profitRate;
    minProfitCheck.in[1] <== 100; // Min 1% profit rate
    
    // Valid if within reasonable profit range
    isValid <== maxProfitCheck.out * minProfitCheck.out;
}

template ComplianceCalculator() {
    signal input halalCheck;
    signal input riskCheck;
    signal input assetCheck;
    signal input profitCheck;
    
    signal output isCompliant;
    signal output score;
    
    // All checks must pass for compliance
    isCompliant <== halalCheck * riskCheck * assetCheck * profitCheck;
    
    // Calculate weighted score (out of 10000)
    score <== halalCheck * 4000 + riskCheck * 2500 + assetCheck * 2000 + profitCheck * 1500;
}

component main = AgentCompliance();
