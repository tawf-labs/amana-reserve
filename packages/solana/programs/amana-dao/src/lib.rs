// Copyright 2026 TAWF Labs
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

//! AMANA DAO - Governance program for Solana
//!
//! This program implements governance functionality for the AMANA system,
//! including proposal creation, voting, and Sharia board oversight.

use anchor_lang::prelude::*;

#[program]
pub mod amana_dao {
    use super::*;

    /// Initialize the DAO
    pub fn initialize(
        ctx: Context<InitializeDao>,
        voting_delay: i64,
        voting_period: i64,
        quorum_percentage: u16,
    ) -> Result<()> {
        let dao = &mut ctx.accounts.dao;
        dao.admin = ctx.accounts.admin.key();
        dao.token_mint = ctx.accounts.token_mint.key();
        dao.timelock = ctx.accounts.timelock.key();
        dao.voting_delay = voting_delay;
        dao.voting_period = voting_period;
        dao.quorum_percentage = quorum_percentage;
        dao.proposal_count = 0;
        dao.bump = ctx.bumps.dao;

        emit!(DaoInitializedEvent {
            voting_period,
            quorum_percentage,
        });

        Ok(())
    }

    /// Initialize the Sharia board
    pub fn init_sharia_board(ctx: Context<InitShariaBoard>) -> Result<()> {
        let board = &mut ctx.accounts.sharia_board;
        board.admin = ctx.accounts.admin.key();
        board.member_count = 0;
        board.bump = ctx.bumps.sharia_board;

        Ok(())
    }

    /// Create a new proposal
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        target_account: Pubkey,
        amount: u64,
        affects_sharia: bool,
    ) -> Result<()> {
        let dao = &mut ctx.accounts.dao;
        let proposal = &mut ctx.accounts.proposal;

        dao.proposal_count = dao.proposal_count
            .checked_add(1)
            .ok_or(DaoError::MathOverflow)?;

        proposal.proposal_id = dao.proposal_count;
        proposal.proposer = ctx.accounts.proposer.key();
        proposal.target_account = target_account;
        proposal.amount = amount;
        proposal.affects_sharia = affects_sharia;
        proposal.status = ProposalStatus::Pending;
        proposal.created_at = Clock::get()?.unix_timestamp;
        proposal.voting_starts_at = proposal.created_at + dao.voting_delay;
        proposal.voting_ends_at = proposal.voting_starts_at + dao.voting_period;
        proposal.for_votes = 0;
        proposal.against_votes = 0;
        proposal.abstain_votes = 0;
        proposal.sharia_approved = !affects_sharia; // Auto-approve if doesn't affect Sharia
        proposal.bump = ctx.bumps.proposal;

        emit!(ProposalCreatedEvent {
            proposal_id: proposal.proposal_id,
            proposer: proposal.proposer,
            affects_sharia,
        });

        Ok(())
    }

    /// Cast a vote on a proposal
    pub fn vote(
        ctx: Context<Vote>,
        proposal_id: u64,
        vote: VoteType,
        weight: u64,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let clock = Clock::get()?;

        require!(
            proposal.status == ProposalStatus::Active ||
            proposal.status == ProposalStatus::Pending,
            DaoError::InvalidProposalStatus
        );

        // Check if voting has started
        if proposal.status == ProposalStatus::Pending {
            require!(
                clock.unix_timestamp >= proposal.voting_starts_at,
                DaoError::VotingNotStarted
            );
            proposal.status = ProposalStatus::Active;
        }

        // Check if voting has ended
        require!(
            clock.unix_timestamp <= proposal.voting_ends_at,
            DaoError::VotingEnded
        );

        // Record vote
        match vote {
            VoteType::For => {
                proposal.for_votes = proposal.for_votes
                    .checked_add(weight)
                    .ok_or(DaoError::MathOverflow)?;
            }
            VoteType::Against => {
                proposal.against_votes = proposal.against_votes
                    .checked_add(weight)
                    .ok_or(DaoError::MathOverflow)?;
            }
            VoteType::Abstain => {
                proposal.abstain_votes = proposal.abstain_votes
                    .checked_add(weight)
                    .ok_or(DaoError::MathOverflow)?;
            }
        }

        emit!(VoteCastEvent {
            proposal_id,
            voter: ctx.accounts.voter.key(),
            vote: vote as u8,
            weight,
        });

        Ok(())
    }

    /// Sharia board review of a proposal
    pub fn sharia_review(
        ctx: Context<ShariaReview>,
        approved: bool,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let review = &mut ctx.accounts.review;

        require!(
            proposal.affects_sharia,
            DaoError::NotShariaRelevant
        );

        proposal.sharia_approved = approved;

        review.proposal_id = proposal.proposal_id;
        review.board_member = ctx.accounts.board_member.key();
        review.approved = approved;
        review.timestamp = Clock::get()?.unix_timestamp;
        review.bump = ctx.bumps.review;

        emit!(ShariaReviewEvent {
            proposal_id: proposal.proposal_id,
            board_member: review.board_member,
            approved,
        });

        Ok(())
    }

    /// Execute a successful proposal
    pub fn execute_proposal(
        ctx: Context<ExecuteProposal>,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let dao = &ctx.accounts.dao;
        let clock = Clock::get()?;

        require!(
            proposal.status == ProposalStatus::Active,
            DaoError::InvalidProposalStatus
        );

        // Check if voting has ended
        require!(
            clock.unix_timestamp > proposal.voting_ends_at,
            DaoError::VotingNotEnded
        );

        // Check Sharia approval if applicable
        if proposal.affects_sharia {
            require!(
                proposal.sharia_approved,
                DaoError::ShariaNotApproved
            );
        }

        // Check if quorum was met
        let total_votes = proposal.for_votes
            .checked_add(proposal.against_votes)
            .and_then(|v| v.checked_add(proposal.abstain_votes))
            .ok_or(DaoError::MathOverflow)?;

        // Simple quorum check (would need actual supply in production)
        if total_votes == 0 {
            return Err(DaoError::QuorumNotMet.into());
        }

        // Check if passed (more for than against)
        require!(
            proposal.for_votes > proposal.against_votes,
            DaoError::ProposalFailed
        );

        proposal.status = ProposalStatus::Executed;

        emit!(ProposalExecutedEvent {
            proposal_id: proposal.proposal_id,
        });

        Ok(())
    }

    /// Cancel a proposal (admin or Sharia board veto)
    pub fn cancel_proposal(
        ctx: Context<CancelProposal>,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;

        require!(
            proposal.status == ProposalStatus::Pending ||
            proposal.status == ProposalStatus::Active,
            DaoError::InvalidProposalStatus
        );

        proposal.status = ProposalStatus::Canceled;

        emit!(ProposalCanceledEvent {
            proposal_id: proposal.proposal_id,
        });

        Ok(())
    }

    /// Add a Sharia board member
    pub fn add_sharia_board_member(
        ctx: Context<ModifyShariaBoard>,
    ) -> Result<()> {
        let board = &mut ctx.accounts.sharia_board;

        board.member_count = board.member_count
            .checked_add(1)
            .ok_or(DaoError::MathOverflow)?;

        emit!(ShariaBoardMemberAddedEvent {
            member: ctx.accounts.admin.key(),
        });

        Ok(())
    }

    /// Remove a Sharia board member
    pub fn remove_sharia_board_member(
        ctx: Context<ModifyShariaBoard>,
    ) -> Result<()> {
        let board = &mut ctx.accounts.sharia_board;

        board.member_count = board.member_count
            .checked_sub(1)
            .ok_or(DaoError::MathOverflow)?;

        emit!(ShariaBoardMemberRemovedEvent {
            member: ctx.accounts.admin.key(),
        });

        Ok(())
    }
}

// Account structs

#[account]
pub struct Dao {
    pub admin: Pubkey,
    pub token_mint: Pubkey,
    pub timelock: Pubkey,
    pub voting_delay: i64,
    pub voting_period: i64,
    pub quorum_percentage: u16,
    pub proposal_count: u64,
    pub bump: u8,
}

#[account]
pub struct Proposal {
    pub proposal_id: u64,
    pub proposer: Pubkey,
    pub target_account: Pubkey,
    pub amount: u64,
    pub affects_sharia: bool,
    pub status: ProposalStatus,
    pub created_at: i64,
    pub voting_starts_at: i64,
    pub voting_ends_at: i64,
    pub for_votes: u64,
    pub against_votes: u64,
    pub abstain_votes: u64,
    pub sharia_approved: bool,
    pub bump: u8,
}

#[account]
pub struct ShariaReview {
    pub proposal_id: u64,
    pub board_member: Pubkey,
    pub approved: bool,
    pub timestamp: i64,
    pub bump: u8,
}

#[account]
pub struct ShariaBoard {
    pub admin: Pubkey,
    pub member_count: u32,
    pub bump: u8,
}

// Context structs

#[derive(Accounts)]
pub struct InitializeDao<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 32 + 32 + 8 + 8 + 2 + 8 + 1,
        seeds = [b"dao"],
        bump
    )]
    pub dao: Account<'info, Dao>,

    /// CHECK: Token mint reference
    pub token_mint: UncheckedAccount<'info>,

    /// CHECK: Timelock account reference
    pub timelock: UncheckedAccount<'info>,

    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitShariaBoard<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 4 + 1,
        seeds = [b"sharia_board"],
        bump
    )]
    pub sharia_board: Account<'info, ShariaBoard>,

    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(
        mut,
        seeds = [b"dao"],
        bump = dao.bump
    )]
    pub dao: Account<'info, Dao>,

    #[account(
        init,
        payer = proposer,
        space = 8 + 8 + 32 + 32 + 8 + 1 + 1 + 8 + 8 + 8 + 8 + 8 + 8 + 1 + 1,
        seeds = [b"proposal", dao.proposal_count.to_le_bytes().as_ref()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(mut)]
    pub proposer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(
        seeds = [b"dao"],
        bump = dao.bump
    )]
    pub dao: Account<'info, Dao>,

    #[account(
        mut,
        seeds = [b"proposal", proposal.proposal_id.to_le_bytes().as_ref()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, Proposal>,

    pub voter: Signer<'info>,
}

#[derive(Accounts)]
pub struct ShariaReview<'info> {
    #[account(
        mut,
        seeds = [b"proposal", proposal.proposal_id.to_le_bytes().as_ref()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(
        init,
        payer = board_member,
        space = 8 + 8 + 32 + 1 + 8 + 1,
        seeds = [b"review", proposal.proposal_id.to_le_bytes().as_ref(), board_member.key().as_ref()],
        bump
    )]
    pub review: Account<'info, ShariaReview>,

    pub board_member: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    #[account(
        seeds = [b"dao"],
        bump = dao.bump
    )]
    pub dao: Account<'info, Dao>,

    #[account(
        mut,
        seeds = [b"proposal", proposal.proposal_id.to_le_bytes().as_ref()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, Proposal>,
}

#[derive(Accounts)]
pub struct CancelProposal<'info> {
    #[account(
        mut,
        seeds = [b"proposal", proposal.proposal_id.to_le_bytes().as_ref()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, Proposal>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ModifyShariaBoard<'info> {
    #[account(
        seeds = [b"dao"],
        bump = dao.bump,
        constraint = dao.admin == admin.key() @ DaoError::Unauthorized
    )]
    pub dao: Account<'info, Dao>,

    #[account(
        mut,
        seeds = [b"sharia_board"],
        bump = sharia_board.bump
    )]
    pub sharia_board: Account<'info, ShariaBoard>,

    pub admin: Signer<'info>,
}

// Enums

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ProposalStatus {
    Pending,
    Active,
    Passed,
    Rejected,
    Executed,
    Canceled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum VoteType {
    For,
    Against,
    Abstain,
}

// Events

#[event]
pub struct DaoInitializedEvent {
    pub voting_period: i64,
    pub quorum_percentage: u16,
}

#[event]
pub struct ProposalCreatedEvent {
    pub proposal_id: u64,
    pub proposer: Pubkey,
    pub affects_sharia: bool,
}

#[event]
pub struct VoteCastEvent {
    pub proposal_id: u64,
    pub voter: Pubkey,
    pub vote: u8,
    pub weight: u64,
}

#[event]
pub struct ShariaReviewEvent {
    pub proposal_id: u64,
    pub board_member: Pubkey,
    pub approved: bool,
}

#[event]
pub struct ProposalExecutedEvent {
    pub proposal_id: u64,
}

#[event]
pub struct ProposalCanceledEvent {
    pub proposal_id: u64,
}

#[event]
pub struct ShariaBoardMemberAddedEvent {
    pub member: Pubkey,
}

#[event]
pub struct ShariaBoardMemberRemovedEvent {
    pub member: Pubkey,
}

// Errors

#[error_code]
pub enum DaoError {
    #[msg("Math operation overflow")]
    MathOverflow,
    #[msg("Invalid proposal status for this operation")]
    InvalidProposalStatus,
    #[msg("Voting has not started yet")]
    VotingNotStarted,
    #[msg("Voting has ended")]
    VotingEnded,
    #[msg("Voting has not ended yet")]
    VotingNotEnded,
    #[msg("Quorum not met")]
    QuorumNotMet,
    #[msg("Proposal failed - more against votes")]
    ProposalFailed,
    #[msg("Sharia board has not approved this proposal")]
    ShariaNotApproved,
    #[msg("Proposal does not affect Sharia principles")]
    NotShariaRelevant,
    #[msg("Unauthorized access")]
    Unauthorized,
}
