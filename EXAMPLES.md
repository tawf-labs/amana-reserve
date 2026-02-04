# AMANA Reserve System Examples

This document provides practical examples of how to interact with the AMANA reserve system.

## Table of Contents
- [Setup](#setup)
- [Basic Participation](#basic-participation)
- [Economic Activities](#economic-activities)
- [Capital Pooling](#capital-pooling)
- [Risk Sharing](#risk-sharing)
- [Activity Validation](#activity-validation)
- [Integration for Autonomous Agents](#integration-for-autonomous-agents)

## Setup

### Deployment
```solidity
// Deploy all contracts
AmanaReserve reserve = new AmanaReserve();
CapitalPool capitalPool = new CapitalPool();
RiskSharing riskSharing = new RiskSharing();
ActivityValidator validator = new ActivityValidator();

// Initialize the reserve with minimum contribution
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
// Withdraw available capital
reserve.withdrawCapital(0.3 ether);
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

// System will:
// 1. Return the deployed capital (5 ETH)
// 2. Add the profit (1 ETH)
// 3. Distribute profit among participants
```

### Complete Activity with Loss
```solidity
// Activity completed with 0.5 ETH loss
int256 loss = -0.5 ether;
reserve.completeActivity(activityId, loss);

// System will:
// 1. Return remaining capital (4.5 ETH)
// 2. Distribute loss among participants proportionally
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

### Check Participation
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

### Add Participants to Risk Pool
```solidity
// Participants join with capital
riskSharing.addParticipant{value: 10 ether}(riskPoolId);

// Check exposure
RiskSharing.RiskExposure memory exposure = 
    riskSharing.getExposure(riskPoolId, msg.sender);
```

### Distribute Profit
```solidity
// When activity generates profit
uint256 totalProfit = 5 ether;
riskSharing.shareProfit(riskPoolId, totalProfit);

// Profit distributed proportionally to capital contribution
```

### Share Loss
```solidity
// When activity incurs loss
uint256 totalLoss = 2 ether;
riskSharing.shareLoss(riskPoolId, totalLoss);

// Loss shared proportionally among participants
```

## Activity Validation

### Submit Activity for Validation
```solidity
bytes32 activityId = keccak256("halal-manufacturing-2024");
string memory description = "Halal food manufacturing and distribution";
string memory activityType = "manufacturing";
uint256 capitalRequired = 50 ether;

validator.submitActivity(
    activityId,
    description,
    activityType,
    capitalRequired
);
```

### Validate Activity (Sharia Compliance)
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
assert(compliant == true);

// Check prohibited activities
bool prohibited = validator.isShariaCompliant("alcohol");
assert(prohibited == false);

// Check overall compliance
bool meetsAllCriteria = validator.meetsShariaCompliance(activityId);
```

### Add Prohibited Activity
```solidity
// Add new prohibited activity type
validator.addProhibitedActivity("derivatives-trading");
```

## Integration for Autonomous Agents

### Listening to Events
```solidity
// Listen for new participants
event ParticipantJoined(address indexed agent, uint256 capitalContributed);

// Listen for activities
event ActivityProposed(bytes32 indexed activityId, address indexed initiator, uint256 capitalRequired);
event ActivityCompleted(bytes32 indexed activityId, int256 outcome);

// Listen for distributions
event ProfitDistributed(uint256 totalProfit, uint256 participantCount);
event LossDistributed(uint256 totalLoss, uint256 participantCount);
```

### Agent Workflow Example
```javascript
// Example agent workflow in JavaScript/TypeScript

class AmanaAgent {
    async joinReserve(contribution) {
        const tx = await reserve.joinReserve({ value: contribution });
        await tx.wait();
        console.log("Joined reserve with", contribution);
    }
    
    async proposeActivity(activityId, capital, description) {
        // Submit for validation first
        await validator.submitActivity(
            activityId,
            description,
            "trade",
            capital
        );
        
        // Propose to reserve
        const tx = await reserve.proposeActivity(activityId, capital);
        await tx.wait();
        console.log("Proposed activity:", activityId);
    }
    
    async monitorActivities() {
        // Listen for activity completions
        reserve.on("ActivityCompleted", (activityId, outcome) => {
            if (outcome > 0) {
                console.log("Activity profitable:", outcome.toString());
            } else {
                console.log("Activity loss:", outcome.toString());
            }
        });
    }
}
```

### Python Agent Example
```python
# Example autonomous agent in Python using Web3.py

from web3 import Web3
from eth_account import Account

class AmanaAutonomousAgent:
    def __init__(self, web3, reserve_address, private_key):
        self.w3 = web3
        self.reserve = self.w3.eth.contract(
            address=reserve_address,
            abi=RESERVE_ABI
        )
        self.account = Account.from_key(private_key)
    
    def join_reserve(self, capital_eth):
        """Join the reserve with capital contribution"""
        capital_wei = self.w3.to_wei(capital_eth, 'ether')
        
        tx = self.reserve.functions.joinReserve().build_transaction({
            'from': self.account.address,
            'value': capital_wei,
            'gas': 200000,
            'nonce': self.w3.eth.get_transaction_count(self.account.address)
        })
        
        signed_tx = self.account.sign_transaction(tx)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        
        return receipt
    
    def propose_economic_activity(self, activity_name, capital_eth):
        """Propose a new economic activity"""
        activity_id = self.w3.keccak(text=activity_name)
        capital_wei = self.w3.to_wei(capital_eth, 'ether')
        
        tx = self.reserve.functions.proposeActivity(
            activity_id,
            capital_wei
        ).build_transaction({
            'from': self.account.address,
            'gas': 150000,
            'nonce': self.w3.eth.get_transaction_count(self.account.address)
        })
        
        signed_tx = self.account.sign_transaction(tx)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        
        return self.w3.eth.wait_for_transaction_receipt(tx_hash)
    
    def monitor_events(self):
        """Monitor reserve events for decision making"""
        # Monitor profit distributions
        profit_filter = self.reserve.events.ProfitDistributed.create_filter(
            from_block='latest'
        )
        
        while True:
            for event in profit_filter.get_new_entries():
                self.on_profit_distributed(event)
            time.sleep(10)
    
    def on_profit_distributed(self, event):
        """React to profit distribution"""
        total_profit = event['args']['totalProfit']
        print(f"Profit distributed: {self.w3.from_wei(total_profit, 'ether')} ETH")
```

## Best Practices

### For Participants
1. **Start Small**: Begin with minimum capital contribution
2. **Validate Activities**: Always check Sharia compliance before participation
3. **Monitor Performance**: Track activity outcomes regularly
4. **Diversify**: Participate in multiple activities to spread risk

### For Autonomous Agents
1. **Event-Driven**: Use events for real-time monitoring
2. **Gas Management**: Optimize transaction gas usage
3. **Error Handling**: Implement robust error handling
4. **State Verification**: Always verify state before transactions

### For Economic Activities
1. **Asset-Backed**: Ensure all activities are tied to real assets
2. **Sharia Compliance**: Validate through ActivityValidator
3. **Risk Assessment**: Understand and communicate risks
4. **Transparency**: Provide clear activity descriptions

## Advanced Examples

### Multi-Agent Coordination
```solidity
// Multiple agents coordinating on a single activity
bytes32 sharedActivityId = keccak256("multi-agent-trade-2024");

// Agent 1 proposes
agent1.proposeActivity(sharedActivityId, 10 ether);

// Agent 2 validates
agent2.approveActivity(sharedActivityId);

// Agent 3 monitors
agent3.watchActivity(sharedActivityId);
```

### Profit/Loss Scenarios

#### Scenario 1: Profitable Trade
```solidity
// Initial: 100 ETH pool, 10 participants (10 ETH each)
// Activity: 50 ETH deployed
// Outcome: 10 ETH profit

// Result:
// - Pool: 110 ETH total
// - Each participant: 11 ETH (10% return)
```

#### Scenario 2: Loss Scenario
```solidity
// Initial: 100 ETH pool, 10 participants (10 ETH each)
// Activity: 50 ETH deployed
// Outcome: 5 ETH loss

// Result:
// - Pool: 95 ETH total
// - Each participant: 9.5 ETH (5% loss shared)
```

## Security Considerations

1. **Validate Before Approve**: Always validate activities before approval
2. **Monitor Capital**: Track capital deployment and returns
3. **Check Compliance**: Ensure Sharia compliance at all stages
4. **Audit Regularly**: Review participant activities and outcomes
5. **Limit Exposure**: Don't deploy all capital in single activity

---

For more information, see the main [README.md](README.md).
