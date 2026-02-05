// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./AgentIdentityRegistry.sol";

/**
 * @title AgentReputationRegistry
 * @dev EIP-8004 compliant reputation system with Sharia compliance features
 */
contract AgentReputationRegistry {
    struct Feedback {
        int128 value;
        uint8 valueDecimals;
        string tag1;
        string tag2;
        bool isRevoked;
    }

    AgentIdentityRegistry public immutable identityRegistry;
    
    // agentId => clientAddress => feedbackIndex => Feedback
    mapping(uint256 => mapping(address => mapping(uint64 => Feedback))) private _feedback;
    
    // agentId => clientAddress => lastFeedbackIndex
    mapping(uint256 => mapping(address => uint64)) private _lastIndex;
    
    // agentId => list of client addresses
    mapping(uint256 => address[]) private _clients;
    mapping(uint256 => mapping(address => bool)) private _isClient;
    
    // Response tracking: requestHash => responder => responseCount
    mapping(uint256 => mapping(address => mapping(uint64 => mapping(address => uint64)))) private _responseCount;

    event NewFeedback(
        uint256 indexed agentId,
        address indexed clientAddress,
        uint64 feedbackIndex,
        int128 value,
        uint8 valueDecimals,
        string indexed indexedTag1,
        string tag1,
        string tag2,
        string endpoint,
        string feedbackURI,
        bytes32 feedbackHash
    );

    event FeedbackRevoked(
        uint256 indexed agentId,
        address indexed clientAddress,
        uint64 indexed feedbackIndex
    );

    event ResponseAppended(
        uint256 indexed agentId,
        address indexed clientAddress,
        uint64 feedbackIndex,
        address indexed responder,
        string responseURI,
        bytes32 responseHash
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
     * @dev Give feedback to an agent
     */
    function giveFeedback(
        uint256 agentId,
        int128 value,
        uint8 valueDecimals,
        string calldata tag1,
        string calldata tag2,
        string calldata endpoint,
        string calldata feedbackURI,
        bytes32 feedbackHash
    ) external {
        require(identityRegistry.ownerOf(agentId) != address(0), "Agent does not exist");
        require(valueDecimals <= 18, "Invalid decimals");
        require(identityRegistry.ownerOf(agentId) != msg.sender, "Cannot give feedback to own agent");
        require(identityRegistry.getApproved(agentId) != msg.sender, "Cannot give feedback as operator");

        uint64 feedbackIndex = ++_lastIndex[agentId][msg.sender];
        
        _feedback[agentId][msg.sender][feedbackIndex] = Feedback({
            value: value,
            valueDecimals: valueDecimals,
            tag1: tag1,
            tag2: tag2,
            isRevoked: false
        });

        // Add client to list if first feedback
        if (!_isClient[agentId][msg.sender]) {
            _clients[agentId].push(msg.sender);
            _isClient[agentId][msg.sender] = true;
        }

        emit NewFeedback(
            agentId,
            msg.sender,
            feedbackIndex,
            value,
            valueDecimals,
            tag1,
            tag1,
            tag2,
            endpoint,
            feedbackURI,
            feedbackHash
        );
    }

    /**
     * @dev Give Sharia-compliant feedback with HAI integration
     */
    function giveShariaCompliantFeedback(
        uint256 agentId,
        int128 value,
        uint8 valueDecimals,
        string calldata activityType,
        string calldata complianceLevel,
        bytes32 haiScoreHash
    ) external {
        require(identityRegistry.shariaCompliant(agentId), "Agent not Sharia compliant");
        
        // In production, verify HAI score hash with HAI contract
        require(haiScoreHash != bytes32(0), "Invalid HAI score");
        
        giveFeedback(agentId, value, valueDecimals, activityType, complianceLevel, "", "", bytes32(0));
    }

    /**
     * @dev Revoke feedback
     */
    function revokeFeedback(uint256 agentId, uint64 feedbackIndex) external {
        require(_feedback[agentId][msg.sender][feedbackIndex].value != 0 || 
                _lastIndex[agentId][msg.sender] >= feedbackIndex, "Feedback does not exist");
        
        _feedback[agentId][msg.sender][feedbackIndex].isRevoked = true;
        
        emit FeedbackRevoked(agentId, msg.sender, feedbackIndex);
    }

    /**
     * @dev Append response to feedback
     */
    function appendResponse(
        uint256 agentId,
        address clientAddress,
        uint64 feedbackIndex,
        string calldata responseURI,
        bytes32 responseHash
    ) external {
        require(_feedback[agentId][clientAddress][feedbackIndex].value != 0 || 
                _lastIndex[agentId][clientAddress] >= feedbackIndex, "Feedback does not exist");
        
        _responseCount[agentId][clientAddress][feedbackIndex][msg.sender]++;
        
        emit ResponseAppended(agentId, clientAddress, feedbackIndex, msg.sender, responseURI, responseHash);
    }

    /**
     * @dev Get summary of feedback for an agent
     */
    function getSummary(
        uint256 agentId,
        address[] calldata clientAddresses,
        string calldata tag1,
        string calldata tag2
    ) external view returns (uint64 count, int128 summaryValue, uint8 summaryValueDecimals) {
        require(clientAddresses.length > 0, "Client addresses required");
        
        int256 totalValue = 0;
        uint64 validCount = 0;
        uint8 maxDecimals = 0;
        
        for (uint i = 0; i < clientAddresses.length; i++) {
            address client = clientAddresses[i];
            uint64 lastIndex = _lastIndex[agentId][client];
            
            for (uint64 j = 1; j <= lastIndex; j++) {
                Feedback memory feedback = _feedback[agentId][client][j];
                
                if (feedback.isRevoked) continue;
                
                // Filter by tags if provided
                if (bytes(tag1).length > 0 && keccak256(bytes(feedback.tag1)) != keccak256(bytes(tag1))) continue;
                if (bytes(tag2).length > 0 && keccak256(bytes(feedback.tag2)) != keccak256(bytes(tag2))) continue;
                
                totalValue += int256(feedback.value);
                validCount++;
                if (feedback.valueDecimals > maxDecimals) {
                    maxDecimals = feedback.valueDecimals;
                }
            }
        }
        
        if (validCount == 0) {
            return (0, 0, 0);
        }
        
        return (validCount, int128(totalValue / int256(uint256(validCount))), maxDecimals);
    }

    /**
     * @dev Read specific feedback
     */
    function readFeedback(
        uint256 agentId,
        address clientAddress,
        uint64 feedbackIndex
    ) external view returns (
        int128 value,
        uint8 valueDecimals,
        string memory tag1,
        string memory tag2,
        bool isRevoked
    ) {
        Feedback memory feedback = _feedback[agentId][clientAddress][feedbackIndex];
        return (feedback.value, feedback.valueDecimals, feedback.tag1, feedback.tag2, feedback.isRevoked);
    }

    /**
     * @dev Get all clients for an agent
     */
    function getClients(uint256 agentId) external view returns (address[] memory) {
        return _clients[agentId];
    }

    /**
     * @dev Get last feedback index for a client
     */
    function getLastIndex(uint256 agentId, address clientAddress) external view returns (uint64) {
        return _lastIndex[agentId][clientAddress];
    }

    /**
     * @dev Get response count
     */
    function getResponseCount(
        uint256 agentId,
        address clientAddress,
        uint64 feedbackIndex,
        address[] calldata responders
    ) external view returns (uint64 count) {
        if (responders.length == 0) {
            // Return total responses (simplified - would need to track all responders)
            return 1;
        }
        
        for (uint i = 0; i < responders.length; i++) {
            count += _responseCount[agentId][clientAddress][feedbackIndex][responders[i]];
        }
        
        return count;
    }
}
