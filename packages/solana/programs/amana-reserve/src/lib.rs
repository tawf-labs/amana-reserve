//! AMANA Reserve - Main reserve program for Solana with MagicBlock ER integration
//!
//! This program implements the core reserve functionality for the AMANA
//! Sharia-native macro reserve system on Solana with real-time capabilities.
//!
//! Features:
//! - Participant management with capital tracking
//! - Activity proposal and approval
//! - Profit/loss distribution (Mudarabah/Musharakah)
//! - Sharia-compliant operations
//! - Real-time operations via Ephemeral Rollups
//! - Zero-fee micro-transactions

use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::{delegate, commit, ephemeral};
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use ephemeral_rollups_sdk::ephem::{commit_accounts, commit_and_undelegate_accounts};

#[program]
pub mod amana_reserve {
    use super::*;

    /// Initialize the AMANA reserve system
    pub fn initialize(
        ctx: Context<Initialize>,
        min_capital_contribution: u64,
        max_participants: u64,
    ) -> Result<()> {
        let reserve = &mut ctx.accounts.reserve;
        reserve.admin = ctx.accounts.admin.key();
        reserve.min_capital_contribution = min_capital_contribution;
        reserve.max_participants = max_participants;
        reserve.total_capital = 0;
        reserve.participant_count = 0;
        reserve.is_initialized = true;
        reserve.bump = ctx.bumps.reserve;
        Ok(())
    }

    /// Join the reserve as a participant
    pub fn join_reserve(ctx: Context<JoinReserve>, amount: u64) -> Result<()> {
        let reserve = &mut ctx.accounts.reserve;
        let participant = &mut ctx.accounts.participant;

        // Check minimum contribution
        require!(
            amount >= reserve.min_capital_contribution,
            AmanaError::InsufficientContribution
        );

        // Check max participants
        require!(
            reserve.participant_count < reserve.max_participants,
            AmanaError::MaxParticipantsReached
        );

        // Transfer capital to reserve
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::solana_program::system_instruction::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.reserve.to_account_info(),
            },
        );
        anchor_lang::solana_program::program::invoke(
            &anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.user.key(),
                &ctx.accounts.reserve.key(),
                amount,
            ),
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.reserve.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        // Initialize participant state
        participant.agent = ctx.accounts.user.key();
        participant.capital_contributed = amount;
        participant.profit_share = 0;
        participant.loss_share = 0;
        participant.is_active = true;
        participant.joined_at = Clock::get()?.unix_timestamp;
        participant.bump = ctx.bumps.participant;

        // Update reserve state
        reserve.total_capital += amount;
        reserve.participant_count += 1;

        emit!(ParticipantJoinedEvent {
            agent: ctx.accounts.user.key(),
            capital_contributed: amount,
        });

        Ok(())
    }

    /// Propose a new economic activity
    pub fn propose_activity(
        ctx: Context<ProposeActivity>,
        activity_id: [u8; 32],
        capital_required: u64,
    ) -> Result<()> {
        let reserve = &ctx.accounts.reserve;
        let activity = &mut ctx.accounts.activity;

        require!(
            capital_required > 0 && capital_required <= reserve.total_capital,
            AmanaError::InvalidCapitalAmount
        );

        activity.activity_id = activity_id;
        activity.initiator = ctx.accounts.participant.agent;
        activity.capital_required = capital_required;
        activity.capital_deployed = 0;
        activity.status = ActivityStatus::Proposed;
        activity.created_at = Clock::get()?.unix_timestamp;
        activity.completed_at = 0;
        activity.outcome = 0;
        activity.is_validated = false;
        activity.bump = ctx.bumps.activity;

        emit!(ActivityProposedEvent {
            activity_id,
            initiator: ctx.accounts.participant.agent,
            capital_required,
        });

        Ok(())
    }

    /// Approve an activity
    pub fn approve_activity(ctx: Context<ApproveActivity>) -> Result<()> {
        let reserve = &mut ctx.accounts.reserve;
        let activity = &mut ctx.accounts.activity;

        require!(
            activity.status == ActivityStatus::Proposed,
            AmanaError::InvalidActivityStatus
        );

        activity.status = ActivityStatus::Approved;
        activity.capital_deployed = activity.capital_required;
        reserve.total_capital = reserve.total_capital
            .checked_sub(activity.capital_required)
            .ok_or(AmanaError::MathOverflow)?;

        emit!(ActivityApprovedEvent {
            activity_id: activity.activity_id,
        });

        Ok(())
    }

    /// Complete an activity with profit/loss outcome
    pub fn complete_activity(
        ctx: Context<CompleteActivity>,
        outcome: i64,
    ) -> Result<()> {
        let reserve = &mut ctx.accounts.reserve;
        let activity = &mut ctx.accounts.activity;

        require!(
            activity.status == ActivityStatus::Approved,
            AmanaError::InvalidActivityStatus
        );

        activity.status = ActivityStatus::Completed;
        activity.completed_at = Clock::get()?.unix_timestamp;
        activity.outcome = outcome;
        activity.is_validated = true;

        let returned_capital = activity.capital_deployed;

        if outcome > 0 {
            // Profit case
            reserve.total_capital = reserve.total_capital
                .checked_add(returned_capital)
                .and_then(|v| v.checked_add(outcome as u64))
                .ok_or(AmanaError::MathOverflow)?;

            // Distribute profit (simplified - in production would iterate participants)
        } else if outcome < 0 {
            // Loss case
            let loss = outcome.unsigned_abs();
            if loss < returned_capital {
                reserve.total_capital = reserve.total_capital
                    .checked_add(returned_capital)
                    .and_then(|v| v.checked_sub(loss))
                    .ok_or(AmanaError::MathOverflow)?;
            }
            // Distribute loss
        } else {
            // No profit or loss
            reserve.total_capital = reserve.total_capital
                .checked_add(returned_capital)
                .ok_or(AmanaError::MathOverflow)?;
        }

        emit!(ActivityCompletedEvent {
            activity_id: activity.activity_id,
            outcome,
        });

        Ok(())
    }

    /// Deposit additional capital
    pub fn deposit_capital(ctx: Context<DepositCapital>, amount: u64) -> Result<()> {
        require!(amount > 0, AmanaError::InvalidAmount);

        let reserve = &mut ctx.accounts.reserve;
        let participant = &mut ctx.accounts.participant;

        // Transfer SOL
        anchor_lang::solana_program::program::invoke(
            &anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.user.key(),
                &ctx.accounts.reserve.key(),
                amount,
            ),
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.reserve.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        participant.capital_contributed = participant.capital_contributed
            .checked_add(amount)
            .ok_or(AmanaError::MathOverflow)?;
        reserve.total_capital = reserve.total_capital
            .checked_add(amount)
            .ok_or(AmanaError::MathOverflow)?;

        emit!(CapitalDepositedEvent {
            agent: ctx.accounts.user.key(),
            amount,
        });

        Ok(())
    }

    /// Withdraw capital from the reserve
    pub fn withdraw_capital(ctx: Context<WithdrawCapital>, amount: u64) -> Result<()> {
        require!(amount > 0, AmanaError::InvalidAmount);

        let reserve = &mut ctx.accounts.reserve;
        let participant = &mut ctx.accounts.participant;

        require!(
            amount <= participant.capital_contributed,
            AmanaError::InsufficientBalance
        );

        // Calculate reserve SOL balance
        let reserve_balance = ctx.accounts.reserve.lamports();
        require!(amount <= reserve_balance, AmanaError::InsufficientLiquidity);

        participant.capital_contributed = participant.capital_contributed
            .checked_sub(amount)
            .ok_or(AmanaError::MathOverflow)?;
        reserve.total_capital = reserve.total_capital
            .checked_sub(amount)
            .ok_or(AmanaError::MathOverflow)?;

        // Transfer SOL back to user
        **ctx.accounts.reserve.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.user.to_account_info().try_borrow_mut_lamports()? += amount;

        emit!(CapitalWithdrawnEvent {
            agent: ctx.accounts.user.key(),
            amount,
        });

        Ok(())
    }

    // ========== MagicBlock Ephemeral Rollup Integration ==========

    /// Delegate reserve to Ephemeral Rollup for real-time operations
    pub fn delegate_reserve(ctx: Context<DelegateReserve>) -> Result<()> {
        ctx.accounts.delegate_pda(
            &ctx.accounts.payer,
            &[b"reserve"],
            DelegateConfig {
                validator: Some(pubkey!("MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57")), // Asia ER Validator
                ..Default::default()
            },
        )?;
        Ok(())
    }

    /// Deploy capital to activity in real-time on ER
    pub fn deploy_capital_realtime(
        ctx: Context<DeployCapitalRealtime>,
        activity_id: [u8; 32],
        amount: u64,
    ) -> Result<()> {
        let reserve = &mut ctx.accounts.reserve;
        let activity = &mut ctx.accounts.activity;

        require!(
            amount <= reserve.total_capital,
            AmanaError::InsufficientCapital
        );

        // Deploy capital instantly on ER
        activity.capital_deployed = amount;
        activity.status = ActivityStatus::Active;
        reserve.total_capital -= amount;

        // Auto-commit critical state changes
        commit_accounts(
            &ctx.accounts.payer,
            vec![
                &ctx.accounts.reserve.to_account_info(),
                &ctx.accounts.activity.to_account_info(),
            ],
            &ctx.accounts.magic_context,
            &ctx.accounts.magic_program,
        )?;

        emit!(CapitalDeployedRealtimeEvent {
            activity_id,
            amount,
        });

        Ok(())
    }

    /// Commit and undelegate reserve state back to base layer
    pub fn commit_and_undelegate_reserve(ctx: Context<CommitAndUndelegateReserve>) -> Result<()> {
        commit_and_undelegate_accounts(
            &ctx.accounts.payer,
            vec![&ctx.accounts.reserve.to_account_info()],
            &ctx.accounts.magic_context,
            &ctx.accounts.magic_program,
        )?;
        Ok(())
    }
}

// Account structs

#[account]
pub struct Reserve {
    pub admin: Pubkey,
    pub min_capital_contribution: u64,
    pub max_participants: u64,
    pub total_capital: u64,
    pub participant_count: u64,
    pub is_initialized: bool,
    pub bump: u8,
}

#[account]
pub struct Participant {
    pub agent: Pubkey,
    pub capital_contributed: u64,
    pub profit_share: u64,
    pub loss_share: u64,
    pub is_active: bool,
    pub joined_at: i64,
    pub bump: u8,
}

#[account]
pub struct Activity {
    pub activity_id: [u8; 32],
    pub initiator: Pubkey,
    pub capital_required: u64,
    pub capital_deployed: u64,
    pub status: ActivityStatus,
    pub created_at: i64,
    pub completed_at: i64,
    pub outcome: i64,
    pub is_validated: bool,
    pub bump: u8,
}

// Context structs

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 8 + 8 + 8 + 8 + 1 + 1,
        seeds = [b"reserve"],
        bump
    )]
    pub reserve: Account<'info, Reserve>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinReserve<'info> {
    #[account(
        mut,
        seeds = [b"reserve"],
        bump = reserve.bump
    )]
    pub reserve: Account<'info, Reserve>,

    #[account(
        init,
        payer = user,
        space = 8 + 32 + 8 + 8 + 8 + 1 + 8 + 1,
        seeds = [b"participant", user.key().as_ref()],
        bump
    )]
    pub participant: Account<'info, Participant>,

    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ProposeActivity<'info> {
    #[account(
        seeds = [b"reserve"],
        bump = reserve.bump
    )]
    pub reserve: Account<'info, Reserve>,

    #[account(
        seeds = [b"participant", participant.agent.as_ref()],
        bump = participant.bump,
        constraint = participant.is_active @ AmanaError::InactiveParticipant,
        constraint = participant.agent == user.key() @ AmanaError::Unauthorized
    )]
    pub participant: Account<'info, Participant>,

    #[account(
        init,
        payer = user,
        space = 8 + 32 + 32 + 8 + 8 + 1 + 8 + 8 + 8 + 1 + 1,
        seeds = [b"activity", activity_id.as_ref()],
        bump
    )]
    pub activity: Account<'info, Activity>,

    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ApproveActivity<'info> {
    #[account(
        mut,
        seeds = [b"reserve"],
        bump = reserve.bump
    )]
    pub reserve: Account<'info, Reserve>,

    #[account(
        mut,
        seeds = [b"activity", activity.activity_id.as_ref()],
        bump = activity.bump
    )]
    pub activity: Account<'info, Activity>,
}

#[derive(Accounts)]
pub struct CompleteActivity<'info> {
    #[account(
        mut,
        seeds = [b"reserve"],
        bump = reserve.bump
    )]
    pub reserve: Account<'info, Reserve>,

    #[account(
        mut,
        seeds = [b"activity", activity.activity_id.as_ref()],
        bump = activity.bump
    )]
    pub activity: Account<'info, Activity>,
}

#[derive(Accounts)]
pub struct DepositCapital<'info> {
    #[account(
        mut,
        seeds = [b"reserve"],
        bump = reserve.bump
    )]
    pub reserve: Account<'info, Reserve>,

    #[account(
        mut,
        seeds = [b"participant", participant.agent.as_ref()],
        bump = participant.bump,
        constraint = participant.is_active @ AmanaError::InactiveParticipant,
        constraint = participant.agent == user.key() @ AmanaError::Unauthorized
    )]
    pub participant: Account<'info, Participant>,

    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawCapital<'info> {
    #[account(
        mut,
        seeds = [b"reserve"],
        bump = reserve.bump
    )]
    pub reserve: Account<'info, Reserve>,

    #[account(
        mut,
        seeds = [b"participant", participant.agent.as_ref()],
        bump = participant.bump,
        constraint = participant.is_active @ AmanaError::InactiveParticipant,
        constraint = participant.agent == user.key() @ AmanaError::Unauthorized
    )]
    pub participant: Account<'info, Participant>,

    #[account(mut)]
    pub user: Signer<'info>,
}

// ========== MagicBlock Context Structs ==========

#[delegate]
#[derive(Accounts)]
pub struct DelegateReserve<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Checked by the delegate program
    pub validator: Option<AccountInfo<'info>>,
    /// CHECK: The reserve PDA to delegate
    #[account(mut, del)]
    pub reserve: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct DeployCapitalRealtime<'info> {
    #[account(
        mut,
        seeds = [b"reserve"],
        bump = reserve.bump
    )]
    pub reserve: Account<'info, Reserve>,

    #[account(
        mut,
        seeds = [b"activity", activity.activity_id.as_ref()],
        bump = activity.bump
    )]
    pub activity: Account<'info, Activity>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: MagicBlock context account
    pub magic_context: AccountInfo<'info>,
    /// CHECK: MagicBlock program
    pub magic_program: AccountInfo<'info>,
}

#[commit]
#[derive(Accounts)]
pub struct CommitAndUndelegateReserve<'info> {
    #[account(
        mut,
        seeds = [b"reserve"],
        bump = reserve.bump
    )]
    pub reserve: Account<'info, Reserve>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: MagicBlock context account
    pub magic_context: AccountInfo<'info>,
    /// CHECK: MagicBlock program
    pub magic_program: AccountInfo<'info>,
}

// Enums

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ActivityStatus {
    Proposed,
    Approved,
    Active,
    Completed,
    Rejected,
}

// Events

#[event]
pub struct ParticipantJoinedEvent {
    pub agent: Pubkey,
    pub capital_contributed: u64,
}

#[event]
pub struct ActivityProposedEvent {
    pub activity_id: [u8; 32],
    pub initiator: Pubkey,
    pub capital_required: u64,
}

#[event]
pub struct ActivityApprovedEvent {
    pub activity_id: [u8; 32],
}

#[event]
pub struct ActivityCompletedEvent {
    pub activity_id: [u8; 32],
    pub outcome: i64,
}

#[event]
pub struct CapitalDepositedEvent {
    pub agent: Pubkey,
    pub amount: u64,
}

#[event]
pub struct CapitalWithdrawnEvent {
    pub agent: Pubkey,
    pub amount: u64,
}

// ========== MagicBlock Events ==========

#[event]
pub struct CapitalDeployedRealtimeEvent {
    pub activity_id: [u8; 32],
    pub amount: u64,
}

// Errors

#[error_code]
pub enum AmanaError {
    #[msg("Insufficient capital contribution")]
    InsufficientContribution,
    #[msg("Maximum participants reached")]
    MaxParticipantsReached,
    #[msg("Invalid capital amount")]
    InvalidCapitalAmount,
    #[msg("Invalid activity status")]
    InvalidActivityStatus,
    #[msg("Math operation overflow")]
    MathOverflow,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,
    #[msg("Inactive participant")]
    InactiveParticipant,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Insufficient capital")]
    InsufficientCapital,
}
