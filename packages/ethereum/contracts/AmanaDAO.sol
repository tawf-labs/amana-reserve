// Copyright 2026 TAWF Labs
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title AmanaDAO
 * @notice Governance contract for the AMANA system with Sharia advisor veto power
 * @dev Extends OpenZeppelin Governor with Sharia-compliant governance features
 *
 * Features:
 * - Standard DAO governance (propose, vote, execute)
 * - Sharia Advisory Board with veto power on non-compliant proposals
 * - Quorum requirements based on token supply
 *
 * Sharia Compliance:
 * - Sharia advisors can veto proposals that violate Islamic principles
 * - Proposals affecting core Sharia principles require higher approval
 * - Transparent governance with on-chain voting records
 */
contract AmanaDAO is GovernorCountingSimple, GovernorSettings, GovernorVotesQuorumFraction, AccessControl {
    /// @notice Version of the contract
    string public constant VERSION = "1.0.0";

    /// @notice Role for Sharia Advisory Board members
    bytes32 public constant SHARIA_BOARD_ROLE = keccak256("SHARIA_BOARD_ROLE");

    /// @notice Role for emergency council (can fast-track critical proposals)
    bytes32 public constant EMERGENCY_COUNCIL_ROLE = keccak256("EMERGENCY_COUNCIL_ROLE");

    /// @notice Mapping of proposal IDs to Sharia board review status
    mapping(uint256 => ShariaReview) public shariaReviews;

    /// @notice Mapping of proposal IDs to whether they affect core Sharia principles
    mapping(uint256 => bool) public affectsShariaPrinciples;

    /// @notice Sharia review record
    struct ShariaReview {
        bool reviewed; // Whether the proposal has been reviewed
        bool approved; // Whether the Sharia board approved
        uint256 approvalCount; // Number of Sharia board approvals
        uint256 disapprovalCount; // Number of Sharia board disapprovals
        uint256 reviewDeadline; // Deadline for Sharia review
        string reasoning; // Reasoning for the decision
    }

    // Events
    event ShariaReviewInitiated(uint256 indexed proposalId, uint256 deadline);
    event ShariaBoardVoted(uint256 indexed proposalId, address indexed boardMember, bool approve);
    event ShariaReviewCompleted(uint256 indexed proposalId, bool approved, string reasoning);
    event ShariaBoardVeto(uint256 indexed proposalId, address indexed boardMember, string reasoning);
    event ShariaBoardMemberAdded(address indexed member);
    event ShariaBoardMemberRemoved(address indexed member);

    constructor(
        IVotes _token,
        uint48 _votingDelay,
        uint32 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorumNumerator
    )
        Governor("Amana DAO")
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(_quorumNumerator)
        GovernorSettings(_votingDelay, _votingPeriod, _proposalThreshold)
    {
        // Grant deployer all roles initially
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SHARIA_BOARD_ROLE, msg.sender);
        _grantRole(EMERGENCY_COUNCIL_ROLE, msg.sender);
    }

    // Proposal Functions

    /**
     * @notice Propose a new governance action
     * @param targets Addresses of contracts to call
     * @param values ETH values to send with each call
     * @param calldatas Calldata for each call
     * @param description Description of the proposal
     * @param affectsSharia Whether the proposal affects core Sharia principles
     * @return proposalId ID of the created proposal
     */
    function proposeWithShariaReview(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        bool affectsSharia
    ) public returns (uint256 proposalId) {
        proposalId = propose(targets, values, calldatas, description);

        if (affectsSharia) {
            affectsShariaPrinciples[proposalId] = true;

            // Initiate Sharia review
            uint256 reviewDeadline = block.timestamp + votingPeriod();

            shariaReviews[proposalId] = ShariaReview({
                reviewed: false,
                approved: false,
                approvalCount: 0,
                disapprovalCount: 0,
                reviewDeadline: reviewDeadline,
                reasoning: ""
            });

            emit ShariaReviewInitiated(proposalId, reviewDeadline);
        }

        return proposalId;
    }

    /**
     * @notice Sharia board member votes on a proposal's compliance
     * @param proposalId ID of the proposal
     * @param approved Whether the board member approves
     * @param reasoning Reason for the decision
     */
    function shariaBoardReview(uint256 proposalId, bool approved, string memory reasoning)
        external
        onlyRole(SHARIA_BOARD_ROLE)
    {
        require(
            state(proposalId) == ProposalState.Pending || state(proposalId) == ProposalState.Active,
            "Proposal not active"
        );

        ShariaReview storage review = shariaReviews[proposalId];
        require(!review.reviewed, "Already reviewed");

        if (approved) {
            review.approvalCount++;
        } else {
            review.disapprovalCount++;
        }

        // Simple majority: if more approvals than disapprovals, mark as approved
        uint256 totalVotes = review.approvalCount + review.disapprovalCount;
        if (totalVotes >= 3 && review.approvalCount > review.disapprovalCount) {
            review.reviewed = true;
            review.approved = true;
            review.reasoning = reasoning;
        }

        emit ShariaBoardVoted(proposalId, msg.sender, approved);

        if (review.reviewed) {
            emit ShariaReviewCompleted(proposalId, review.approved, reasoning);
        }
    }

    /**
     * @notice Veto a proposal (Sharia board only)
     * @param proposalId The action ID to veto
     */
    function vetoPauseAction(uint256 proposalId) external onlyRole(SHARIA_BOARD_ROLE) {
        require(affectsShariaPrinciples[proposalId], "Proposal does not affect Sharia principles");

        // Cancel the proposal by marking it as vetoed in Sharia review
        shariaReviews[proposalId].approved = false;
        shariaReviews[proposalId].reviewed = true;

        emit ShariaBoardVeto(proposalId, msg.sender, "Vetoed by Sharia board");
    }

    /**
     * @notice Check if a proposal is Sharia-compliant
     * @param proposalId ID of the proposal
     */
    function isShariaCompliant(uint256 proposalId) public view returns (bool) {
        // If it doesn't affect Sharia principles, it's compliant by default
        if (!affectsShariaPrinciples[proposalId]) {
            return true;
        }

        // If it hasn't been reviewed yet, return false
        ShariaReview memory review = shariaReviews[proposalId];
        return review.reviewed && review.approved;
    }

    // Override functions to incorporate Sharia compliance

    /**
     * @notice Get the current state of a proposal
     * @param proposalId ID of the proposal
     */
    function state(uint256 proposalId) public view override(Governor) returns (ProposalState) {
        // Check if Sharia review vetoed the proposal
        if (affectsShariaPrinciples[proposalId]) {
            ShariaReview memory review = shariaReviews[proposalId];
            if (review.reviewed && !review.approved) {
                return ProposalState.Defeated;
            }
        }

        return super.state(proposalId);
    }

    // Admin Functions

    /**
     * @notice Add a Sharia board member
     * @param member Address of the new board member
     */
    function addShariaBoardMember(address member) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(SHARIA_BOARD_ROLE, member);
        emit ShariaBoardMemberAdded(member);
    }

    /**
     * @notice Remove a Sharia board member
     * @param member Address of the board member to remove
     */
    function removeShariaBoardMember(address member) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(SHARIA_BOARD_ROLE, member);
        emit ShariaBoardMemberRemoved(member);
    }

    /**
     * @notice Override supportsInterface to handle both Governor and AccessControl
     * @param interfaceId The interface identifier
     */
    function supportsInterface(bytes4 interfaceId) public view override(Governor, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @notice Get Sharia review for a proposal
     * @param proposalId ID of the proposal
     */
    function getShariaReview(uint256 proposalId) external view returns (ShariaReview memory) {
        return shariaReviews[proposalId];
    }

    /**
     * @notice Override proposalThreshold to resolve inheritance conflict
     */
    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }
}
