// Copyright 2026 TAWF Labs
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CircuitBreaker
 * @notice Emergency stop mechanism for the AMANA system
 * @dev Implements a circuit breaker pattern with role-based access control
 *
 * Features:
 * - Emergency pause/unpause functionality
 * - Role-based access (ADMIN, PAUSER, SHARIA_BOARD)
 * - Time-based auto-unlock option
 * - Granular control per contract function
 * - Audit trail of all circuit breaker actions
 *
 * Security:
 * - Requires multi-sig or DAO approval for critical actions
 * - Sharia advisor board can veto emergency pauses
 * - Time-locked reactivation to prevent rash decisions
 */
contract CircuitBreaker is AccessControl, ReentrancyGuard {
    /// @notice Version of the contract
    string public constant VERSION = "1.0.0";

    /// @notice Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant SHARIA_BOARD_ROLE = keccak256("SHARIA_BOARD_ROLE");

    /// @notice Status of the circuit breaker
    enum CircuitBreakerStatus {
        Normal, // All operations normal
        Paused, // System paused (emergency stop)
        Locked // System locked (requires special unlock)
    }

    /// @notice Current system status
    CircuitBreakerStatus public status;

    /// @notice Timestamp when the pause was triggered
    uint256 public pauseTimestamp;

    /// @notice Duration for auto-unlock (0 = manual unlock required)
    uint256 public autoUnlockDuration;

    /// @notice Mapping of contract addresses to their pause state
    mapping(address => bool) public contractPaused;

    /// @notice Mapping of function selectors to their pause state
    mapping(bytes4 => bool) public functionPaused;

    /// @notice Mapping of pausing actions for audit trail
    mapping(uint256 => PauseAction) public pauseActions;

    /// @notice Counter for pause action IDs
    uint256 public pauseActionCounter;

    /// @notice Pause action record
    struct PauseAction {
        address initiator; // Who initiated the pause
        address targetContract; // Contract affected (address(0) for global)
        bytes4 functionSelector; // Function affected (bytes4(0) for all)
        bool isPause; // true = pause, false = unpause
        CircuitBreakerStatus previousStatus; // Previous status
        uint256 timestamp; // When the action occurred
        string reason; // Reason for the action
    }

    // Events
    event SystemPaused(address indexed initiator, string reason);
    event SystemUnpaused(address indexed initiator);
    event SystemLocked(address indexed initiator, string reason);
    event ContractPaused(address indexed initiator, address indexed targetContract);
    event ContractUnpaused(address indexed initiator, address indexed targetContract);
    event FunctionPaused(address indexed initiator, bytes4 indexed functionSelector);
    event FunctionUnpaused(address indexed initiator, bytes4 indexed functionSelector);
    event AutoUnlockDurationUpdated(uint256 newDuration);
    event PauserRoleGranted(address indexed pauser);
    event ShariaBoardVeto(uint256 indexed actionId, address indexed boardMember);

    constructor(uint256 _autoUnlockDuration) {
        // Grant deployer all roles initially
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(SHARIA_BOARD_ROLE, msg.sender);

        status = CircuitBreakerStatus.Normal;
        autoUnlockDuration = _autoUnlockDuration;
    }

    // Modifiers

    /**
     * @notice Check if the system is not paused
     */
    modifier whenNotPaused() {
        require(status == CircuitBreakerStatus.Normal, "System is paused");
        _;
    }

    /**
     * @notice Check if a specific contract is not paused
     * @param contractAddress Address of the contract to check
     */
    modifier whenContractNotPaused(address contractAddress) {
        require(!contractPaused[contractAddress], "Contract is paused");
        _;
    }

    /**
     * @notice Check if a specific function is not paused
     * @param functionSelector Function selector to check
     */
    modifier whenFunctionNotPaused(bytes4 functionSelector) {
        require(!functionPaused[functionSelector], "Function is paused");
        _;
    }

    // Admin Functions

    /**
     * @notice Pause the entire system (emergency stop)
     * @param reason Reason for the pause
     */
    function pauseSystem(string calldata reason) external onlyRole(PAUSER_ROLE) nonReentrant {
        require(status == CircuitBreakerStatus.Normal, "System already paused");

        CircuitBreakerStatus previousStatus = status;
        status = CircuitBreakerStatus.Paused;
        pauseTimestamp = block.timestamp;

        // Record action
        _recordPauseAction(msg.sender, address(0), bytes4(0), true, previousStatus, reason);

        emit SystemPaused(msg.sender, reason);
    }

    /**
     * @notice Unpause the system
     */
    function unpauseSystem() external nonReentrant {
        require(status == CircuitBreakerStatus.Paused, "System not paused");

        // Check if caller has permission
        require(hasRole(ADMIN_ROLE, msg.sender) || hasRole(SHARIA_BOARD_ROLE, msg.sender), "Not authorized to unpause");

        // Check auto-unlock duration
        if (autoUnlockDuration > 0) {
            require(block.timestamp >= pauseTimestamp + autoUnlockDuration, "Auto-unlock period not elapsed");
        }

        CircuitBreakerStatus previousStatus = status;
        status = CircuitBreakerStatus.Normal;
        pauseTimestamp = 0;

        // Record action
        _recordPauseAction(msg.sender, address(0), bytes4(0), false, previousStatus, "System unpause");

        emit SystemUnpaused(msg.sender);
    }

    /**
     * @notice Lock the system (requires special unlock procedure)
     * @param reason Reason for the lock
     */
    function lockSystem(string calldata reason) external onlyRole(ADMIN_ROLE) nonReentrant {
        CircuitBreakerStatus previousStatus = status;
        status = CircuitBreakerStatus.Locked;
        pauseTimestamp = block.timestamp;

        // Record action
        _recordPauseAction(msg.sender, address(0), bytes4(0), true, previousStatus, reason);

        emit SystemLocked(msg.sender, reason);
    }

    /**
     * @notice Unlock the system (requires admin + Sharia board approval)
     * @param actionId The pause action ID to unlock from
     */
    function unlockSystem(uint256 actionId) external onlyRole(ADMIN_ROLE) nonReentrant {
        require(status == CircuitBreakerStatus.Locked, "System not locked");
        require(actionId < pauseActionCounter, "Invalid action ID");

        PauseAction storage action = pauseActions[actionId];
        require(action.isPause, "Not a pause action");

        status = CircuitBreakerStatus.Normal;
        pauseTimestamp = 0;

        // Record action
        _recordPauseAction(msg.sender, address(0), bytes4(0), false, CircuitBreakerStatus.Locked, "System unlock");

        emit SystemUnpaused(msg.sender);
    }

    /**
     * @notice Veto a pause/unpause action (Sharia board only)
     * @param actionId The action ID to veto
     */
    function vetoPauseAction(uint256 actionId) external onlyRole(SHARIA_BOARD_ROLE) {
        require(actionId < pauseActionCounter, "Invalid action ID");

        PauseAction storage action = pauseActions[actionId];
        require(action.isPause, "Cannot veto unpause");

        // Revert the pause if it was a global pause
        if (action.targetContract == address(0) && action.functionSelector == bytes4(0)) {
            status = action.previousStatus;
        } else if (action.targetContract != address(0)) {
            contractPaused[action.targetContract] = false;
        } else if (action.functionSelector != bytes4(0)) {
            functionPaused[action.functionSelector] = false;
        }

        emit ShariaBoardVeto(actionId, msg.sender);
    }

    // Granular Control Functions

    /**
     * @notice Pause a specific contract
     * @param targetContract Address of the contract to pause
     */
    function pauseContract(address targetContract) external onlyRole(PAUSER_ROLE) {
        require(targetContract != address(0), "Invalid contract address");
        require(!contractPaused[targetContract], "Contract already paused");

        contractPaused[targetContract] = true;

        emit ContractPaused(msg.sender, targetContract);
    }

    /**
     * @notice Unpause a specific contract
     * @param targetContract Address of the contract to unpause
     */
    function unpauseContract(address targetContract) external onlyRole(ADMIN_ROLE) {
        require(contractPaused[targetContract], "Contract not paused");

        contractPaused[targetContract] = false;

        emit ContractUnpaused(msg.sender, targetContract);
    }

    /**
     * @notice Pause a specific function across all contracts
     * @param functionSelector Function selector to pause
     */
    function pauseFunction(bytes4 functionSelector) external onlyRole(PAUSER_ROLE) {
        require(functionSelector != bytes4(0), "Invalid function selector");
        require(!functionPaused[functionSelector], "Function already paused");

        functionPaused[functionSelector] = true;

        emit FunctionPaused(msg.sender, functionSelector);
    }

    /**
     * @notice Unpause a specific function
     * @param functionSelector Function selector to unpause
     */
    function unpauseFunction(bytes4 functionSelector) external onlyRole(ADMIN_ROLE) {
        require(functionPaused[functionSelector], "Function not paused");

        functionPaused[functionSelector] = false;

        emit FunctionUnpaused(msg.sender, functionSelector);
    }

    // Configuration Functions

    /**
     * @notice Update the auto-unlock duration
     * @param newDuration New duration in seconds (0 for manual only)
     */
    function setAutoUnlockDuration(uint256 newDuration) external onlyRole(ADMIN_ROLE) {
        autoUnlockDuration = newDuration;
        emit AutoUnlockDurationUpdated(newDuration);
    }

    /**
     * @notice Grant pauser role to an address
     * @param pauser Address to grant pauser role to
     */
    function grantPauserRole(address pauser) external onlyRole(ADMIN_ROLE) {
        grantRole(PAUSER_ROLE, pauser);
        emit PauserRoleGranted(pauser);
    }

    // View Functions

    /**
     * @notice Check if the system is currently paused
     */
    function isPaused() external view returns (bool) {
        return status != CircuitBreakerStatus.Normal;
    }

    /**
     * @notice Check if a contract can execute
     * @param contractAddress Address to check
     */
    function canExecute(address contractAddress) external view returns (bool) {
        return status == CircuitBreakerStatus.Normal && !contractPaused[contractAddress];
    }

    /**
     * @notice Check if a function can execute
     * @param functionSelector Function selector to check
     */
    function canExecuteFunction(bytes4 functionSelector) external view returns (bool) {
        return status == CircuitBreakerStatus.Normal && !functionPaused[functionSelector];
    }

    /**
     * @notice Get the remaining time until auto-unlock
     */
    function getRemainingAutoUnlockTime() external view returns (uint256) {
        if (status != CircuitBreakerStatus.Paused || autoUnlockDuration == 0) {
            return 0;
        }

        uint256 unlockTime = pauseTimestamp + autoUnlockDuration;
        if (block.timestamp >= unlockTime) {
            return 0;
        }

        return unlockTime - block.timestamp;
    }

    /**
     * @notice Get pause action details
     * @param actionId ID of the pause action
     */
    function getPauseAction(uint256 actionId) external view returns (PauseAction memory) {
        require(actionId < pauseActionCounter, "Invalid action ID");
        return pauseActions[actionId];
    }

    // Internal Functions

    /**
     * @notice Record a pause action for audit trail
     */
    function _recordPauseAction(
        address initiator,
        address targetContract,
        bytes4 functionSelector,
        bool isPause,
        CircuitBreakerStatus previousStatus,
        string memory reason
    ) internal {
        uint256 actionId = pauseActionCounter++;

        pauseActions[actionId] = PauseAction({
            initiator: initiator,
            targetContract: targetContract,
            functionSelector: functionSelector,
            isPause: isPause,
            previousStatus: previousStatus,
            timestamp: block.timestamp,
            reason: reason
        });
    }
}
