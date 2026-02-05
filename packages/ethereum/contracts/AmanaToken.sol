// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AmanaToken
 * @notice Governance token for the AMANA DAO
 * @dev ERC20 token with voting and permit functionality
 *
 * Features:
 * - Used for governance voting in the AMANA DAO
 * - Implements ERC20Votes for on-chain voting power tracking
 * - Implements ERC20Permit for gasless approvals
 * - Includes Sharia-compliant tokenomics:
 *   - No interest-bearing mechanisms
 *   - No speculative incentivization
 *   - Used solely for governance participation
 */
contract AmanaToken is ERC20, ERC20Votes, ERC20Permit, Ownable {
    /// @notice Version of the contract
    string public constant VERSION = "1.0.0";

    /// @notice Maximum supply cap (1 billion tokens)
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;

    /// @notice Minimum vesting period for governance rewards (90 days)
    uint256 public constant MIN_VESTING_PERIOD = 90 days;

    /// @notice Tracks if an address has completed initial vesting
    mapping(address => uint256) public vestingEnd;

    /// @notice List of trusted custodians (e.g., exchanges, institutional partners)
    mapping(address => bool) public trustedCustodians;

    // Events
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    event VestingSet(address indexed account, uint256 endTime);
    event CustodianAdded(address indexed custodian);
    event CustodianRemoved(address indexed custodian);

    constructor() ERC20("Amana DAO Token", "AMANA") ERC20Permit("Amana DAO Token") Ownable(msg.sender) {
        // Initial supply: 10% of max supply allocated to DAO treasury
        // This will be transferred to the DAO contract after deployment
        _mint(msg.sender, MAX_SUPPLY / 10);
    }

    /**
     * @notice Mint new tokens (only callable by DAO/owner)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");

        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @notice Burn tokens from caller's balance
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }

    /**
     * @notice Set vesting period for an address
     * @param account Address to set vesting for
     * @param endTime When the vesting period ends
     */
    function setVesting(address account, uint256 endTime) external onlyOwner {
        require(account != address(0), "Invalid address");
        require(endTime > block.timestamp, "Invalid end time");

        vestingEnd[account] = endTime;
        emit VestingSet(account, endTime);
    }

    /**
     * @notice Check if voting power is available (considering vesting)
     * @param account Address to check
     */
    function hasVotingPower(address account) external view returns (bool) {
        uint256 vestEndTime = vestingEnd[account];
        return vestEndTime == 0 || block.timestamp >= vestEndTime;
    }

    /**
     * @notice Add a trusted custodian
     * @param custodian Address of the custodian
     */
    function addCustodian(address custodian) external onlyOwner {
        require(custodian != address(0), "Invalid address");
        require(!trustedCustodians[custodian], "Already a custodian");

        trustedCustodians[custodian] = true;
        emit CustodianAdded(custodian);
    }

    /**
     * @notice Remove a trusted custodian
     * @param custodian Address of the custodian
     */
    function removeCustodian(address custodian) external onlyOwner {
        require(trustedCustodians[custodian], "Not a custodian");

        trustedCustodians[custodian] = false;
        emit CustodianRemoved(custodian);
    }

    /**
     * @notice Get the vesting end time for an address
     * @param account Address to check
     */
    function getVestingEnd(address account) external view returns (uint256) {
        return vestingEnd[account];
    }

    /**
     * @notice Check if an address is a trusted custodian
     * @param account Address to check
     */
    function isTrustedCustodian(address account) external view returns (bool) {
        return trustedCustodians[account];
    }

    // The following functions are overrides required by Solidity

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
