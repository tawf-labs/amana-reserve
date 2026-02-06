// Copyright 2026 TAWF Labs
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title AgentIdentityRegistry
 * @dev EIP-8004 compliant agent identity registry with Sharia compliance features
 */
contract AgentIdentityRegistry is ERC721URIStorage, AccessControl, EIP712 {
    using ECDSA for bytes32;

    bytes32 public constant SHARIA_BOARD_ROLE = keccak256("SHARIA_BOARD_ROLE");

    struct MetadataEntry {
        string metadataKey;
        bytes metadataValue;
    }

    // Agent metadata storage
    mapping(uint256 => mapping(string => bytes)) private _metadata;
    mapping(uint256 => address) private _agentWallets;
    mapping(uint256 => bool) public shariaCompliant;

    uint256 private _nextAgentId = 1;

    // EIP-712 type hash for agent wallet verification
    bytes32 private constant AGENT_WALLET_TYPEHASH =
        keccak256("SetAgentWallet(uint256 agentId,address newWallet,uint256 deadline)");

    event Registered(uint256 indexed agentId, string agentURI, address indexed owner);
    event MetadataSet(
        uint256 indexed agentId, string indexed indexedMetadataKey, string metadataKey, bytes metadataValue
    );
    event URIUpdated(uint256 indexed agentId, string newURI, address indexed updatedBy);
    event ShariaCompliantAgentRegistered(uint256 indexed agentId, address indexed owner);
    event ComplianceFlagged(uint256 indexed agentId);

    constructor() ERC721("AMANA Agent Identity", "AMANA-AGENT") EIP712("AgentIdentityRegistry", "1") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Register a new agent with optional metadata
     */
    function register(string memory agentURI, MetadataEntry[] calldata metadata) external returns (uint256 agentId) {
        agentId = _nextAgentId++;
        _mint(msg.sender, agentId);

        if (bytes(agentURI).length > 0) {
            _setTokenURI(agentId, agentURI);
        }

        // Set agent wallet to owner by default
        _metadata[agentId]["agentWallet"] = abi.encode(msg.sender);
        _agentWallets[agentId] = msg.sender;

        emit MetadataSet(agentId, "agentWallet", "agentWallet", abi.encode(msg.sender));

        // Set additional metadata
        for (uint256 i = 0; i < metadata.length; i++) {
            require(
                keccak256(bytes(metadata[i].metadataKey)) != keccak256(bytes("agentWallet")),
                "Cannot set agentWallet via metadata"
            );
            _metadata[agentId][metadata[i].metadataKey] = metadata[i].metadataValue;
            emit MetadataSet(agentId, metadata[i].metadataKey, metadata[i].metadataKey, metadata[i].metadataValue);
        }

        emit Registered(agentId, agentURI, msg.sender);
        return agentId;
    }

    /**
     * @dev Register a Sharia-compliant agent
     */
    function registerShariaCompliantAgent(string memory agentURI, bytes32[] memory complianceProofs)
        external
        returns (uint256 agentId)
    {
        agentId = register(agentURI, new MetadataEntry[](0));

        // Verify Sharia compliance (simplified - in production would verify proofs)
        require(complianceProofs.length > 0, "Compliance proofs required");
        shariaCompliant[agentId] = true;

        emit ShariaCompliantAgentRegistered(agentId, msg.sender);
        return agentId;
    }

    /**
     * @dev Set agent wallet with signature verification
     */
    function setAgentWallet(uint256 agentId, address newWallet, uint256 deadline, bytes calldata signature) external {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        require(block.timestamp <= deadline, "Signature expired");

        bytes32 structHash = keccak256(abi.encode(AGENT_WALLET_TYPEHASH, agentId, newWallet, deadline));
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);

        require(signer == newWallet, "Invalid signature");

        _agentWallets[agentId] = newWallet;
        _metadata[agentId]["agentWallet"] = abi.encode(newWallet);

        emit MetadataSet(agentId, "agentWallet", "agentWallet", abi.encode(newWallet));
    }

    /**
     * @dev Get agent wallet address
     */
    function getAgentWallet(uint256 agentId) external view returns (address) {
        return _agentWallets[agentId];
    }

    /**
     * @dev Unset agent wallet (reset to zero address)
     */
    function unsetAgentWallet(uint256 agentId) external {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        _agentWallets[agentId] = address(0);
        _metadata[agentId]["agentWallet"] = abi.encode(address(0));

        emit MetadataSet(agentId, "agentWallet", "agentWallet", abi.encode(address(0)));
    }

    /**
     * @dev Set metadata for an agent
     */
    function setMetadata(uint256 agentId, string memory metadataKey, bytes memory metadataValue) external {
        require(ownerOf(agentId) == msg.sender || getApproved(agentId) == msg.sender, "Not authorized");
        require(keccak256(bytes(metadataKey)) != keccak256(bytes("agentWallet")), "Use setAgentWallet");

        _metadata[agentId][metadataKey] = metadataValue;
        emit MetadataSet(agentId, metadataKey, metadataKey, metadataValue);
    }

    /**
     * @dev Get metadata for an agent
     */
    function getMetadata(uint256 agentId, string memory metadataKey) external view returns (bytes memory) {
        return _metadata[agentId][metadataKey];
    }

    /**
     * @dev Update agent URI
     */
    function setAgentURI(uint256 agentId, string calldata newURI) external {
        require(ownerOf(agentId) == msg.sender || getApproved(agentId) == msg.sender, "Not authorized");
        _setTokenURI(agentId, newURI);
        emit URIUpdated(agentId, newURI, msg.sender);
    }

    /**
     * @dev Flag agent as non-compliant (Sharia Board only)
     */
    function flagNonCompliant(uint256 agentId) external onlyRole(SHARIA_BOARD_ROLE) {
        shariaCompliant[agentId] = false;
        emit ComplianceFlagged(agentId);
    }

    /**
     * @dev Override transfer to clear agent wallet
     */
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);

        if (from != address(0) && to != address(0)) {
            // Clear agent wallet on transfer
            _agentWallets[tokenId] = address(0);
            _metadata[tokenId]["agentWallet"] = abi.encode(address(0));
        }
    }

    /**
     * @dev See {IERC165-supportsInterface}
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
