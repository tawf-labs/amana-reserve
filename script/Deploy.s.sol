// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "../src/AmanaReserve.sol";
import "../src/CapitalPool.sol";
import "../src/RiskSharing.sol";
import "../src/ActivityValidator.sol";

/**
 * @title DeployAmana
 * @notice Deployment script for AMANA reserve system
 */
contract DeployAmana {
    function run() external returns (
        AmanaReserve reserve,
        CapitalPool capitalPool,
        RiskSharing riskSharing,
        ActivityValidator validator
    ) {
        // Deploy contracts
        reserve = new AmanaReserve();
        capitalPool = new CapitalPool();
        riskSharing = new RiskSharing();
        validator = new ActivityValidator();
        
        // Initialize reserve with 0.1 ether minimum
        reserve.initialize(0.1 ether);
        
        return (reserve, capitalPool, riskSharing, validator);
    }
}
