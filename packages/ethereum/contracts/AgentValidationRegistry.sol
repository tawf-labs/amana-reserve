// Copyright 2026 TAWF Labs
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import "./AgentIdentityRegistry.sol";

/**
 * @title AgentValidationRegistry
 * @dev EIP-8004 compliant validation system for agent work verification
 */
contract AgentValidationRegistry {
    struct ValidationRecord {
        address validatorAddress;
        uint256 agentId;
        uint8 response;
        bytes32 responseHash;
        string tag;
        uint256 lastUpdate;
    }

    AgentIdentityRegistry public immutable identityRegistry;
    
    // requestHash => ValidationRecord
    mapping(bytes32 => ValidationRecord) private _validations;
    
    // agentId => requestHashes[]
    mapping(uint256 => bytes32[]) private _agentValidations;
    
    // validatorAddress => requestHashes[]
    mapping(address => bytes32[]) private _validatorRequests;

    event ValidationRequest(
        address indexed validatorAddress,
        uint256 indexed agentId,
        string requestURI,
        bytes32 indexed requestHash
    );

    event ValidationResponse(
        address indexed validatorAddress,
        uint256 indexed agentId,
        bytes32 indexed requestHash,
        uint8 response,
        string responseURI,
        bytes32 responseHash,
        string tag
    );

    constructor(address _identityRegistry) {
        identityRegistry = AgentIdentityRegistry(_identityRegistry);
    }

    /**
     * @dev Get the identity registry address
     */
    function getIdentityRegistry() external view returns (address) {
        return address(identityRegistry);
    }

    /**
     * @dev Request validation of agent work
     */
    function validationRequest(
        address validatorAddress,
        uint256 agentId,
        string calldata requestURI,
        bytes32 requestHash
    ) external {
        require(identityRegistry.ownerOf(agentId) == msg.sender || 
                identityRegistry.getApproved(agentId) == msg.sender, "Not authorized");
        require(validatorAddress != address(0), "Invalid validator");
        require(requestHash != bytes32(0), "Invalid request hash");

        // Initialize validation record
        _validations[requestHash] = ValidationRecord({
            validatorAddress: validatorAddress,
            agentId: agentId,
            response: 0,
            responseHash: bytes32(0),
            tag: "",
            lastUpdate: block.timestamp
        });

        // Track for agent and validator
        _agentValidations[agentId].push(requestHash);
        _validatorRequests[validatorAddress].push(requestHash);

        emit ValidationRequest(validatorAddress, agentId, requestURI, requestHash);
    }

    /**
     * @dev Provide validation response
     */
    function validationResponse(
        bytes32 requestHash,
        uint8 response,
        string calldata responseURI,
        bytes32 responseHash,
        string calldata tag
    ) external {
        ValidationRecord storage validation = _validations[requestHash];
        require(validation.validatorAddress == msg.sender, "Not authorized validator");
        require(response <= 100, "Invalid response value");

        validation.response = response;
        validation.responseHash = responseHash;
        validation.tag = tag;
        validation.lastUpdate = block.timestamp;

        emit ValidationResponse(
            msg.sender,
            validation.agentId,
            requestHash,
            response,
            responseURI,
            responseHash,
            tag
        );
    }

    /**
     * @dev Get validation status
     */
    function getValidationStatus(bytes32 requestHash) 
        external 
        view 
        returns (
            address validatorAddress,
            uint256 agentId,
            uint8 response,
            bytes32 responseHash,
            string memory tag,
            uint256 lastUpdate
        ) 
    {
        ValidationRecord memory validation = _validations[requestHash];
        return (
            validation.validatorAddress,
            validation.agentId,
            validation.response,
            validation.responseHash,
            validation.tag,
            validation.lastUpdate
        );
    }

    /**
     * @dev Get validation summary for an agent
     */
    function getSummary(
        uint256 agentId,
        address[] calldata validatorAddresses,
        string calldata tag
    ) external view returns (uint64 count, uint8 averageResponse) {
        bytes32[] memory agentRequests = _agentValidations[agentId];
        uint256 totalResponse = 0;
        uint64 validCount = 0;

        for (uint i = 0; i < agentRequests.length; i++) {
            ValidationRecord memory validation = _validations[agentRequests[i]];
            
            // Filter by validator if provided
            if (validatorAddresses.length > 0) {
                bool validatorMatch = false;
                for (uint j = 0; j < validatorAddresses.length; j++) {
                    if (validation.validatorAddress == validatorAddresses[j]) {
                        validatorMatch = true;
                        break;
                    }
                }
                if (!validatorMatch) continue;
            }
            
            // Filter by tag if provided
            if (bytes(tag).length > 0 && 
                keccak256(bytes(validation.tag)) != keccak256(bytes(tag))) {
                continue;
            }
            
            if (validation.response > 0) {
                totalResponse += validation.response;
                validCount++;
            }
        }

        if (validCount == 0) {
            return (0, 0);
        }

        return (validCount, uint8(totalResponse / validCount));
    }

    /**
     * @dev Get all validation request hashes for an agent
     */
    function getAgentValidations(uint256 agentId) external view returns (bytes32[] memory) {
        return _agentValidations[agentId];
    }

    /**
     * @dev Get all validation request hashes for a validator
     */
    function getValidatorRequests(address validatorAddress) external view returns (bytes32[] memory) {
        return _validatorRequests[validatorAddress];
    }

    /**
     * @dev Request Sharia-compliant validation
     */
    function requestShariaValidation(
        address validatorAddress,
        uint256 agentId,
        string calldata requestURI,
        bytes32 requestHash,
        bytes32[] calldata complianceProofs
    ) external {
        require(identityRegistry.shariaCompliant(agentId), "Agent not Sharia compliant");
        require(complianceProofs.length > 0, "Compliance proofs required");
        
        validationRequest(validatorAddress, agentId, requestURI, requestHash);
    }

    /**
     * @dev Provide Sharia-compliant validation response
     */
    function provideShariaValidationResponse(
        bytes32 requestHash,
        uint8 response,
        string calldata responseURI,
        bytes32 responseHash,
        bool isHalalCompliant
    ) external {
        ValidationRecord storage validation = _validations[requestHash];
        require(identityRegistry.shariaCompliant(validation.agentId), "Agent not Sharia compliant");
        
        string memory complianceTag = isHalalCompliant ? "halal-compliant" : "non-compliant";
        validationResponse(requestHash, response, responseURI, responseHash, complianceTag);
    }
}
