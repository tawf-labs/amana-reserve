// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "../contracts/AmanaReserve.sol";
import "../contracts/CapitalPool.sol";
import "../contracts/RiskSharing.sol";
import "../contracts/ActivityValidator.sol";
import "../contracts/AmanaToken.sol";
import "../contracts/AmanaDAO.sol";
import "../contracts/HalalActivityIndex.sol";
import "../contracts/CircuitBreaker.sol";

/**
 * @title DeployAmana
 * @notice Deployment script for AMANA reserve system
 */
contract DeployAmana {
    function run() external returns (
        AmanaReserve reserve,
        CapitalPool capitalPool,
        RiskSharing riskSharing,
        ActivityValidator validator,
        AmanaToken token,
        AmanaDAO dao,
        HalalActivityIndex hai,
        CircuitBreaker circuitBreaker
    ) {
        // Deploy contracts
        reserve = new AmanaReserve();
        capitalPool = new CapitalPool();
        riskSharing = new RiskSharing();
        validator = new ActivityValidator();
        token = new AmanaToken();
        hai = new HalalActivityIndex();
        circuitBreaker = new CircuitBreaker(1 days);

        // Deploy DAO with token and governance parameters
        // 1 block voting delay, 50400 blocks (1 week) voting period, 1e18 token threshold, 4% quorum
        dao = new AmanaDAO(
            IVotes(address(token)),
            uint48(1),          // votingDelay: 1 block
            uint32(50400),      // votingPeriod: ~1 week (assuming 15s blocks)
            1e18,               // proposalThreshold: 1 token
            400                 // quorumNumerator: 4%
        );

        // Initialize reserve with 0.1 ether minimum
        reserve.initialize(0.1 ether);

        return (reserve, capitalPool, riskSharing, validator, token, dao, hai, circuitBreaker);
    }
}
