# AMANA Reserve System Examples

This document provides practical examples of how to interact with the AMANA reserve system across Ethereum and Solana.

## Table of Contents
- [Setup](#setup)
- [Basic Participation](#basic-participation)
- [Economic Activities](#economic-activities)
- [Governance Examples](#governance-examples)
- [Token Management](#token-management)
- [Circuit Breaker Operations](#circuit-breaker-operations)
- [HAI Index Integration](#hai-index-integration)
- [Capital Pooling](#capital-pooling)
- [Risk Sharing](#risk-sharing)
- [Activity Validation](#activity-validation)
- [SDK Usage Examples](#sdk-usage-examples)
- [Solana Program Examples](#solana-program-examples)
- [Zero-Knowledge Examples](#zero-knowledge-examples)
- [Cross-Chain Examples](#cross-chain-examples)
- [Multi-Contract Workflows](#multi-contract-workflows)

## Setup

### Contract Deployment
```solidity
// Deploy all contracts
AmanaReserve reserve = new AmanaReserve();
AmanaToken token = new AmanaToken();
AmanaDAO dao = new AmanaDAO(token);
CircuitBreaker circuitBreaker = new CircuitBreaker(86400); // 24h auto-unlock
HalalActivityIndex hai = new HalalActivityIndex();
CapitalPool capitalPool = new CapitalPool();
RiskSharing riskSharing = new RiskSharing();
ActivityValidator validator = new ActivityValidator();

// Initialize the reserve
reserve.initialize(0.1 ether);
```

## Basic Participation

### Join the Reserve
```solidity
// Participant joins with capital
reserve.joinReserve{value: 1 ether}();

// Check participant status
AmanaReserve.Participant memory participant = reserve.getParticipant(msg.sender);
assert(participant.isActive == true);
assert(participant.capitalContributed == 1 ether);
```

### Deposit Additional Capital
```solidity
// Add more capital to existing participation
reserve.depositCapital{value: 0.5 ether}();
```

### Withdraw Capital
```solidity
// Check withdrawable balance
uint256 withdrawable = reserve.getWithdrawableBalance(msg.sender);

// Withdraw available capital
reserve.withdrawCapital(0.3 ether);
```

### Exit the Reserve
```solidity
// Exit and withdraw all capital + profits
reserve.exitReserve();
```

## Economic Activities

### Propose an Activity
```solidity
// Create unique activity ID
bytes32 activityId = keccak256(abi.encodePacked("halal-trade-2024-001"));

// Propose a trading activity requiring 5 ETH
reserve.proposeActivity(activityId, 5 ether);

// Check activity status
AmanaReserve.Activity memory activity = reserve.getActivity(activityId);
assert(activity.status == AmanaReserve.ActivityStatus.Proposed);
```

### Approve an Activity
```solidity
// Autonomous approval (in production, use DAO or multi-sig)
reserve.approveActivity(activityId);

// Verify capital was deployed
AmanaReserve.Activity memory activity = reserve.getActivity(activityId);
assert(activity.status == AmanaReserve.ActivityStatus.Approved);
assert(activity.capitalDeployed == 5 ether);
```

### Complete Activity with Profit
```solidity
// Activity completed with 1 ETH profit
int256 profit = 1 ether;
reserve.completeActivity(activityId, profit);

// System automatically:
// 1. Returns the deployed capital (5 ETH)
// 2. Adds the profit (1 ETH)
// 3. Distributes profit proportionally among participants
```

### Complete Activity with Loss
```solidity
// Activity completed with 0.5 ETH loss
int256 loss = -0.5 ether;
reserve.completeActivity(activityId, loss);

// System automatically:
// 1. Returns remaining capital (4.5 ETH)
// 2. Distributes loss proportionally among participants
```

## Governance Examples

### Create a Standard Proposal
```solidity
// Prepare proposal data
address[] memory targets = new address[](1);
uint256[] memory values = new uint256[](1);
bytes[] memory calldatas = new bytes[](1);

targets[0] = address(reserve);
values[0] = 0;
calldatas[0] = abi.encodeWithSignature("initialize(uint256)", 0.2 ether);

// Create proposal
uint256 proposalId = dao.propose(
    targets,
    values,
    calldatas,
    "Increase minimum capital to 0.2 ETH"
);
```

### Create Proposal Affecting Sharia Principles
```solidity
// Create proposal that requires Sharia board review
uint256 proposalId = dao.proposeWithShariaReview(
    targets,
    values,
    calldatas,
    "Update core reserve parameters",
    true // affects Sharia principles
);

// This automatically initiates Sharia review process
```

### Sharia Board Review
```solidity
// Sharia board member reviews proposal
dao.shariaBoardReview(
    proposalId,
    true, // approved
    "Proposal maintains Sharia compliance and improves system stability"
);

// Check if proposal is Sharia compliant
bool compliant = dao.isShariaCompliant(proposalId);
```

### Sharia Board Veto
```solidity
// Sharia board can veto non-compliant proposals
dao.vetoPauseAction(proposalId);

// This marks the proposal as defeated
assert(dao.state(proposalId) == IGovernor.ProposalState.Defeated);
```

### Vote on Proposal
```solidity
// Vote on proposal (requires AMANA tokens)
dao.castVote(proposalId, 1); // 1 = For, 0 = Against, 2 = Abstain

// Vote with reason
dao.castVoteWithReason(
    proposalId,
    1,
    "This proposal will improve system efficiency"
);
```

## Token Management

### Mint Tokens
```solidity
// DAO mints tokens to treasury
token.mint(address(dao), 1000000 * 10**18); // 1M tokens
```

### Set Vesting
```solidity
// Set 90-day vesting for contributor
uint256 vestingEnd = block.timestamp + 90 days;
token.setVesting(contributor, vestingEnd);

// Check if address has voting power
bool canVote = token.hasVotingPower(contributor);
```

### Delegate Voting Power
```solidity
// Delegate voting power to another address
token.delegate(delegateAddress);

// Self-delegate to activate own voting power
token.delegate(msg.sender);
```

### Burn Tokens
```solidity
// Burn tokens from own balance
token.burn(1000 * 10**18); // Burn 1000 tokens
```

## Circuit Breaker Operations

### Emergency Pause
```solidity
// Pause entire system in emergency
circuitBreaker.pauseSystem("Security incident detected");

// Check if system is paused
bool paused = circuitBreaker.isPaused();
assert(paused == true);
```

### Granular Pausing
```solidity
// Pause specific contract
circuitBreaker.pauseContract(address(reserve));

// Pause specific function
bytes4 selector = bytes4(keccak256("joinReserve()"));
circuitBreaker.pauseFunction(selector);

// Check if contract can execute
bool canExecute = circuitBreaker.canExecute(address(reserve));
```

### Unpause System
```solidity
// Admin or Sharia board can unpause
circuitBreaker.unpauseSystem();

// Check remaining auto-unlock time
uint256 remaining = circuitBreaker.getRemainingAutoUnlockTime();
```

### Sharia Board Veto of Pause
```solidity
// Get pause action ID from events
uint256 actionId = 0; // From PauseAction event

// Sharia board can veto pause actions
circuitBreaker.vetoPauseAction(actionId);
```

### Lock System
```solidity
// Lock system (requires special unlock)
circuitBreaker.lockSystem("Critical security issue");

// Unlock system (requires admin + time delay)
circuitBreaker.unlockSystem(actionId);
```

## HAI Index Integration

### Track Activity
```solidity
// Track a new activity for HAI calculation
hai.trackActivity(
    activityId,
    true,  // isCompliant
    true,  // isAssetBacked
    true,  // hasRealEconomicValue
    3,     // validatorCount
    3      // positiveVotes
);
```

### Get HAI Score
```solidity
// Get current HAI score
uint256 score = hai.currentScore; // 0-10000 (basis points)
uint256 percentage = hai.getHAIPercentage(); // 0-100

// Get detailed metrics
(
    uint256 score,
    uint256 percentage,
    uint256 total,
    uint256 compliant,
    uint256 complianceRate
) = hai.getHAIMetrics();
```

### Create HAI Snapshot
```solidity
// Create snapshot of current metrics
hai.createSnapshot();

// Get latest snapshot
HalalActivityIndex.HAISnapshot memory snapshot = hai.latestSnapshot();

// Get historical snapshots
uint256[] memory timestamps = hai.getSnapshotTimestamps();
```

### Update HAI Weights
```solidity
// Update calculation weights (must sum to 10000)
hai.updateWeights(
    4000, // compliance: 40%
    2500, // asset backing: 25%
    2000, // economic value: 20%
    1500  // validator participation: 15%
);
```

## Capital Pooling

### Create a Pool
```solidity
// Create pool for specific economic purpose
bytes32 poolId = keccak256("agriculture-project-2024");
string memory purpose = "Halal organic agriculture development";
uint256 targetCapital = 100 ether;

capitalPool.createPool(poolId, purpose, targetCapital);
```

### Contribute to Pool
```solidity
// Contribute to the pool
capitalPool.contributeToPool{value: 25 ether}(poolId);

// Check pool status
CapitalPool.Pool memory pool = capitalPool.getPool(poolId);
// Pool activates automatically when target is reached
```

### Check Pool Participation
```solidity
// Get participant's share in pool
CapitalPool.PoolParticipant memory participant = 
    capitalPool.getPoolParticipant(poolId, msg.sender);
    
console.log("Your contribution:", participant.contribution);
console.log("Your share:", participant.sharePercentage / 100, "%");
```

## Risk Sharing

### Create Risk Pool
```solidity
bytes32 riskPoolId = keccak256("tech-venture-risk-2024");
riskSharing.createRiskPool(riskPoolId);
```

### Add Participants
```solidity
// Participants join with capital
riskSharing.addParticipant{value: 10 ether}(riskPoolId);

// Check exposure
RiskSharing.RiskExposure memory exposure = 
    riskSharing.getExposure(riskPoolId, msg.sender);
```

### Distribute Profit/Loss
```solidity
// When activity generates profit
uint256 totalProfit = 5 ether;
riskSharing.shareProfit(riskPoolId, totalProfit);

// When activity incurs loss
uint256 totalLoss = 2 ether;
riskSharing.shareLoss(riskPoolId, totalLoss);
```

## Activity Validation

### Submit Activity for Validation
```solidity
bytes32 activityId = keccak256("halal-manufacturing-2024");
validator.submitActivity(
    activityId,
    "Halal food manufacturing and distribution",
    "manufacturing",
    50 ether
);
```

### Validate Activity
```solidity
// Validator reviews and validates
validator.validateActivity(
    activityId,
    true,  // isValid
    true,  // isShariaCompliant
    true,  // isAssetBacked
    true,  // hasRealEconomicValue
    "Verified halal food manufacturing with proper certification"
);
```

### Check Compliance
```solidity
// Check if activity type is allowed
bool compliant = validator.isShariaCompliant("trade");

// Check overall compliance
bool meetsAllCriteria = validator.meetsShariaCompliance(activityId);
```

## SDK Usage Examples

### Initialize SDK
```typescript
import { AmanaSDK, ChainType } from '@amana/sdk';

// Initialize for Ethereum
const amanaEth = new AmanaSDK({
  chain: ChainType.Ethereum,
  ethereum: {
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY',
    privateKey: 'YOUR_PRIVATE_KEY'
  }
});

// Initialize for Solana
const amanaSol = new AmanaSDK({
  chain: ChainType.Solana,
  solana: {
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    keypair: 'YOUR_KEYPAIR'
  }
});
```

### Basic Operations via SDK
```typescript
// Join reserve on Ethereum
await amanaEth.ethereum.joinReserve({
  amount: '1.0' // 1 ETH
});

// Propose activity on Solana
await amanaSol.solana.proposeActivity({
  activityId: 'halal-trade-001',
  capitalRequired: '0.5', // 0.5 SOL
  description: 'Halal food trading operation'
});

// Get reserve stats
const stats = await amanaEth.ethereum.getReserveStats();
console.log('Total capital:', stats.totalCapital);
```

### Governance via SDK
```typescript
// Create governance proposal
const proposalId = await amanaEth.ethereum.createProposal({
  title: 'Increase minimum capital',
  description: 'Proposal to increase minimum participation',
  targets: [reserveAddress],
  values: [0],
  calldatas: [encodedCalldata],
  affectsSharia: true
});

// Vote on proposal
await amanaEth.ethereum.vote({
  proposalId,
  support: true,
  reason: 'This improves system stability'
});
```

### HAI Integration via SDK
```typescript
// Get current HAI score
const haiScore = await amanaEth.ethereum.getHAIScore();
console.log(`Current HAI: ${haiScore.percentage}%`);

// Subscribe to HAI updates
amanaEth.ethereum.onHAIUpdate((update) => {
  console.log(`HAI updated: ${update.score} (${update.percentage}%)`);
});

// Track activity for HAI
await amanaEth.ethereum.trackHAIActivity({
  activityId: 'trade-001',
  isCompliant: true,
  isAssetBacked: true,
  hasRealEconomicValue: true
});
```

### Cross-Chain Operations
```typescript
// Bridge assets from Ethereum to Solana
await amanaEth.bridge.transfer({
  to: 'solana',
  amount: '2.0',
  asset: 'AMANA',
  recipient: solanaAddress
});

// Monitor bridge status
const status = await amanaEth.bridge.getTransferStatus(transferId);
```

## Multi-Contract Workflows

### Complete Activity Lifecycle
```solidity
// 1. Submit activity for validation
validator.submitActivity(activityId, "Halal trade", "trade", 10 ether);

// 2. Validate activity
validator.validateActivity(activityId, true, true, true, true, "Approved");

// 3. Propose activity to reserve
reserve.proposeActivity(activityId, 10 ether);

// 4. Approve activity (DAO vote in production)
reserve.approveActivity(activityId);

// 5. Complete activity with outcome
reserve.completeActivity(activityId, 2 ether); // 2 ETH profit

// 6. Track for HAI
hai.trackActivity(activityId, true, true, true, 1, 1);
```

### Emergency Response Workflow
```solidity
// 1. Detect issue and pause system
circuitBreaker.pauseSystem("Security incident");

// 2. Sharia board reviews pause action
uint256 actionId = 0; // From event
// If inappropriate, board can veto
circuitBreaker.vetoPauseAction(actionId);

// 3. After resolution, unpause system
circuitBreaker.unpauseSystem();
```

### Governance Proposal Lifecycle
```solidity
// 1. Create proposal affecting Sharia principles
uint256 proposalId = dao.proposeWithShariaReview(
    targets, values, calldatas, description, true
);

// 2. Sharia board reviews
dao.shariaBoardReview(proposalId, true, "Compliant with Islamic principles");

// 3. Community votes
dao.castVote(proposalId, 1); // Vote for

// 4. Execute if passed
dao.execute(targets, values, calldatas, keccak256(bytes(description)));
```

### Capital Pool to Activity Workflow
```solidity
// 1. Create capital pool
capitalPool.createPool(poolId, "Agriculture project", 50 ether);

// 2. Contributors join pool
capitalPool.contributeToPool{value: 10 ether}(poolId);
// Pool activates when target reached

// 3. Use pooled capital for activity
reserve.proposeActivity(activityId, 50 ether);
reserve.approveActivity(activityId);

// 4. Complete and distribute results
reserve.completeActivity(activityId, 5 ether); // 5 ETH profit
// Profit automatically distributed to participants
```

## Best Practices

### For Participants
1. **Start Small**: Begin with minimum capital contribution
2. **Validate Activities**: Always check Sharia compliance before participation
3. **Monitor HAI**: Track system compliance through HAI index
4. **Diversify**: Participate in multiple activities to spread risk

### For Autonomous Agents
1. **Event-Driven**: Use events for real-time monitoring
2. **Gas Management**: Optimize transaction gas usage
3. **Error Handling**: Implement robust error handling
4. **State Verification**: Always verify state before transactions

### For Governance
1. **Sharia Review**: Mark proposals affecting Islamic principles
2. **Community Input**: Gather feedback before major changes
3. **Emergency Preparedness**: Understand circuit breaker procedures
4. **Transparency**: Provide clear reasoning for all decisions

## Error Handling Examples

### Common Error Scenarios
```solidity
// Handle insufficient capital
try reserve.joinReserve{value: 0.05 ether}() {
    // Success
} catch Error(string memory reason) {
    if (keccak256(bytes(reason)) == keccak256("Insufficient capital")) {
        // Handle insufficient capital error
    }
}

// Handle max participants reached
try reserve.joinReserve{value: 1 ether}() {
    // Success
} catch Error(string memory reason) {
    if (keccak256(bytes(reason)) == keccak256("Max participants reached")) {
        // Handle max participants error
    }
}

// Handle system paused
try reserve.proposeActivity(activityId, 5 ether) {
    // Success
} catch Error(string memory reason) {
    if (keccak256(bytes(reason)) == keccak256("System is paused")) {
        // Wait for system to be unpaused
    }
}
```

---

## Solana Program Examples

### Initialize Reserve on Solana

```typescript
import { AmanaSolanaClient } from '@amana/sdk';

const client = new AmanaSolanaClient({
  rpcUrl: 'https://api.devnet.solana.com',
  programIds: {
    amanaReserve: new PublicKey('AMANareserve...')
  }
});

await client.connect(wallet);

// Initialize reserve
const result = await client.initializeReserve(
  100_000_000, // 0.1 SOL minimum
  50           // Max participants
);
console.log('Initialize:', result.hash);
```

### Join Reserve on Solana

```typescript
// Join with 1 SOL
const joinResult = await client.joinReserve(1_000_000_000);
console.log('Joined:', joinResult.hash);

// Verify participation
const [participantPDA] = client.getParticipantPDA(wallet.publicKey);
const accountData = await client.getAccountData(participantPDA);
```

### Propose Activity on Solana

```typescript
// Generate activity ID
const activityId = crypto.randomBytes(32);

// Propose activity
const proposeResult = await client.proposeActivity(
  activityId,
  500_000_000,  // 0.5 SOL
  'Halal food trading operation'
);
console.log('Proposed:', proposeResult.hash);
```

### Track HAI on Solana

```typescript
// Track activity for HAI
const trackResult = await client.trackActivity(
  activityId,
  true,  // isCompliant
  true,  // isAssetBacked
  true,  // hasRealEconomicValue
  3,     // validatorCount
  3      // positiveVotes
);
```

### PDA Derivation Examples

```typescript
// Derive reserve PDA
const [reservePDA, reserveBump] = client.getReservePDA();
console.log('Reserve:', reservePDA.toBase58(), 'bump:', reserveBump);

// Derive participant PDA
const [participantPDA, participantBump] = client.getParticipantPDA(userPublicKey);
console.log('Participant:', participantPDA.toBase58());

// Derive HAI PDA
const [haiPDA, haiBump] = client.getHAIPDA();
console.log('HAI:', haiPDA.toBase58());
```

---

## Zero-Knowledge Examples

### Create Anonymous Identity

```typescript
import { AgentIdentity } from '@amana/zk';

// Create new identity
const identity = await AgentIdentity.create();
console.log('Commitment:', identity.getCommitment());

// Export for storage
const exported = identity.export();

// Import later
const imported = await AgentIdentity.import(exported);
```

### Generate Activity Proof

```typescript
import { ProofGenerator } from '@amana/zk';

const generator = new ProofGenerator('activity-validation');

// Generate proof for activity proposal
const proof = await generator.generateProof({
  // Public inputs
  activityHash: hashActivity(activityData),
  minCapital: 100000000000000000n,
  complianceRequirement: true,

  // Private inputs
  agentCapital: 500000000000000000n,
  isCompliant: true,
  agentPublicKey: identity.publicKey,
  activitySalt: generateSalt()
});

console.log('Proof generated:', proof);

// Verify proof
const isValid = await generator.verifyProof(
  proof,
  generator.getPublicSignals(inputs)
);
console.log('Valid:', isValid);
```

### Generate HAI Proof

```typescript
const haiGenerator = new ProofGenerator('hai-computation');

// Generate HAI proof with privacy
const haiProof = await haiGenerator.generateProof({
  // Public
  weights: [4000, 2500, 2000, 1500],
  expectedScore: 8500,

  // Private (actual scores kept confidential)
  complianceScore: 90,
  assetBackingScore: 85,
  economicValueScore: 80,
  validatorScore: 85
});
```

### Anonymous Signal Broadcast

```typescript
// Broadcast signal anonymously
const groupMembers = await getGroupMembers();
const merkleProof = await identity.generateMerkleProof(groupMembers);

const signal = await identity.broadcastSignal(
  groupMembers,
  merkleProof,
  'This activity is Sharia-compliant'
);

console.log('Signal broadcast:', signal);

// Verify signal
const isValid = await AgentIdentity.verifySignal(
  signal.message,
  signal.proof,
  merkleProof.root
);
```

---

## Cross-Chain Examples

### Bridge Tokens from Ethereum to Solana

```typescript
import { BridgeManager } from '@amana/cross-chain';

const bridge = new BridgeManager({
  ethereum: {
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY',
    wormhole: { tokenBridge: '0x...' }
  },
  solana: {
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    wormhole: { tokenBridge: 'wormholeTokenBridge...' }
  }
});

// Transfer AMANA tokens
const transfer = await bridge.transfer({
  from: 'ethereum',
  to: 'solana',
  amount: '1000000000000000000', // 1 AMANA
  asset: 'AMANA',
  recipient: 'SolanaAddress...'
});

console.log('Transfer ID:', transfer.id);
console.log('Estimated time:', transfer.estimatedTime, 'seconds');
```

### Sync HAI Across Chains

```typescript
// Broadcast HAI update from Ethereum to Solana
await bridge.syncHAI({
  score: 8500,
  timestamp: Date.now(),
  activities: 100,
  compliant: 85,
  assetBacked: 90,
  economicValue: 88
});

// Get HAI from any chain
const ethHAI = await bridge.getHAI('ethereum');
const solHAI = await bridge.getHAI('solana');
console.log('Ethereum HAI:', ethHAI.score);
console.log('Solana HAI:', solHAI.score);
```

### Fee Comparison

```typescript
// Compare bridge fees
const fees = await bridge.estimateFees({
  from: 'ethereum',
  to: 'solana',
  amount: '1000000000000000000'
});

console.log('Wormhole:', fees.wormhole);
// { amount: '5000000000000000', usd: '10.50' }

console.log('LayerZero:', fees.layerzero);
// { amount: '3000000000000000', usd: '6.30' }

// Use cheapest automatically
const transfer = await bridge.transfer({
  from: 'ethereum',
  to: 'solana',
  amount: '1000000000000000000',
  autoSelectProvider: true
});
```

### Transfer Status Tracking

```typescript
// Check transfer status
const status = await bridge.getTransferStatus(transfer.id);

switch (status.status) {
  case 'pending':
    console.log('Transfer pending...');
    break;
  case 'confirming':
    console.log('Transfer confirming on destination...');
    break;
  case 'completed':
    console.log('Transfer completed!');
    console.log('Completed at:', status.completedAt);
    break;
  case 'failed':
    console.log('Transfer failed');
    break;
}
```

---

For more information, see the main [README.md](README.md) and [API.md](API.md).
