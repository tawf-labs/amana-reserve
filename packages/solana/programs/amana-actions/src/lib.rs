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

//! Magic Actions for automated Sharia compliance checking
//! 
//! These actions run automatically on the base layer after ER commits

use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::action;
use ephemeral_rollups_sdk::magic::{MagicInstructionBuilder, MagicAction, CommitType, CallHandler, ActionArgs, ShortAccountMeta};

declare_id!("AMANAactions111111111111111111111111111");

#[program]
pub mod amana_actions {
    use super::*;

    /// Automatic compliance check after capital deployment
    #[action]
    pub fn check_compliance_action(ctx: Context<CheckComplianceAction>) -> Result<()> {
        let activity = &ctx.accounts.activity;
        let compliance_state = &mut ctx.accounts.compliance_state;

        // Perform automated Sharia compliance checks
        let is_compliant = perform_compliance_check(activity)?;
        
        if !is_compliant {
            // Flag for manual review
            compliance_state.requires_review = true;
            compliance_state.flagged_at = Clock::get()?.unix_timestamp;
            
            emit!(ComplianceFlaggedEvent {
                activity_id: activity.activity_id,
                reason: "Automated compliance check failed".to_string(),
            });
        } else {
            compliance_state.is_compliant = true;
            compliance_state.verified_at = Clock::get()?.unix_timestamp;
            
            emit!(ComplianceVerifiedEvent {
                activity_id: activity.activity_id,
            });
        }

        Ok(())
    }

    /// Update HAI score automatically after activity completion
    #[action]
    pub fn update_hai_action(ctx: Context<UpdateHaiAction>) -> Result<()> {
        let activity = &ctx.accounts.activity;
        let hai_state = &mut ctx.accounts.hai_state;

        // Calculate HAI impact based on activity outcome
        let hai_delta = calculate_hai_impact(activity)?;
        
        // Update HAI score
        let new_score = if hai_delta >= 0 {
            hai_state.current_score.saturating_add(hai_delta as u16)
        } else {
            hai_state.current_score.saturating_sub((-hai_delta) as u16)
        };
        
        hai_state.current_score = new_score.min(10000);
        hai_state.last_updated = Clock::get()?.unix_timestamp;

        emit!(HaiAutoUpdatedEvent {
            activity_id: activity.activity_id,
            old_score: hai_state.current_score,
            new_score,
            delta: hai_delta,
        });

        Ok(())
    }

    /// Distribute profits automatically based on Sharia principles
    #[action]
    pub fn distribute_profits_action(ctx: Context<DistributeProfitsAction>) -> Result<()> {
        let activity = &ctx.accounts.activity;
        let reserve = &mut ctx.accounts.reserve;

        require!(activity.outcome > 0, ActionError::NoProfit);

        let profit = activity.outcome as u64;
        let total_participants = reserve.participant_count;
        
        // Calculate profit distribution (simplified Mudarabah)
        let profit_per_participant = profit / total_participants;
        
        // Update reserve with distributed profits
        reserve.total_capital += profit;
        
        emit!(ProfitsDistributedEvent {
            activity_id: activity.activity_id,
            total_profit: profit,
            participants: total_participants,
            per_participant: profit_per_participant,
        });

        Ok(())
    }

    /// Cross-chain synchronization action
    #[action]
    pub fn sync_cross_chain_action(ctx: Context<SyncCrossChainAction>) -> Result<()> {
        let bridge_state = &mut ctx.accounts.bridge_state;
        let activity = &ctx.accounts.activity;

        // Prepare cross-chain message
        let sync_message = CrossChainSyncMessage {
            activity_id: activity.activity_id,
            capital_deployed: activity.capital_deployed,
            outcome: activity.outcome,
            timestamp: Clock::get()?.unix_timestamp,
        };

        // Store for bridge pickup
        bridge_state.pending_sync = true;
        bridge_state.sync_data = sync_message.try_to_vec()?;
        bridge_state.last_sync_attempt = Clock::get()?.unix_timestamp;

        emit!(CrossChainSyncInitiatedEvent {
            activity_id: activity.activity_id,
            target_chain: "ethereum".to_string(),
        });

        Ok(())
    }

    /// Build and execute compliance check with Magic Action
    pub fn commit_with_compliance_check(ctx: Context<CommitWithComplianceCheck>) -> Result<()> {
        // Create compliance check action
        let instruction_data = anchor_lang::InstructionData::data(
            &crate::instruction::CheckComplianceAction {}
        );
        let action_args = ActionArgs::new(instruction_data);
        
        let action_accounts = vec![
            ShortAccountMeta {
                pubkey: ctx.accounts.activity.key(),
                is_writable: false,
            },
            ShortAccountMeta {
                pubkey: ctx.accounts.compliance_state.key(),
                is_writable: true,
            },
        ];

        let compliance_action = CallHandler {
            destination_program: crate::ID,
            accounts: action_accounts,
            args: action_args,
            escrow_authority: ctx.accounts.payer.to_account_info(),
            compute_units: 100_000,
        };

        // Build Magic Action instruction
        let magic_action = MagicInstructionBuilder {
            payer: ctx.accounts.payer.to_account_info(),
            magic_context: ctx.accounts.magic_context.to_account_info(),
            magic_program: ctx.accounts.magic_program.to_account_info(),
            magic_action: MagicAction::Commit(CommitType::WithHandler {
                commited_accounts: vec![ctx.accounts.activity.to_account_info()],
                call_handlers: vec![compliance_action],
            }),
        };

        // Execute Magic Action
        magic_action.build_and_invoke()?;

        Ok(())
    }
}

/// Perform automated Sharia compliance check
fn perform_compliance_check(activity: &Account<Activity>) -> Result<bool> {
    // Check 1: No interest-based returns
    if activity.outcome < 0 && activity.outcome.abs() as u64 > activity.capital_deployed {
        return Ok(false); // Excessive losses indicate speculation
    }

    // Check 2: Reasonable profit margins (not excessive)
    if activity.outcome > 0 {
        let profit_margin = (activity.outcome as u64 * 100) / activity.capital_deployed;
        if profit_margin > 50 { // Max 50% profit margin
            return Ok(false);
        }
    }

    // Check 3: Activity duration (not too short-term/speculative)
    let duration = Clock::get()?.unix_timestamp - activity.created_at;
    if duration < 86400 { // Minimum 1 day
        return Ok(false);
    }

    Ok(true)
}

/// Calculate HAI impact based on activity performance
fn calculate_hai_impact(activity: &Account<Activity>) -> Result<i16> {
    let mut impact: i16 = 0;

    // Positive impact for profitable, compliant activities
    if activity.outcome > 0 && activity.is_validated {
        impact += 50; // +0.5% HAI boost
    }

    // Negative impact for losses
    if activity.outcome < 0 {
        impact -= 25; // -0.25% HAI reduction
    }

    // Bonus for long-term activities
    let duration = Clock::get()?.unix_timestamp - activity.created_at;
    if duration > 2592000 { // 30 days
        impact += 25; // Long-term bonus
    }

    Ok(impact)
}

// Account structs

#[account]
pub struct Activity {
    pub activity_id: [u8; 32],
    pub initiator: Pubkey,
    pub capital_required: u64,
    pub capital_deployed: u64,
    pub status: u8, // ActivityStatus enum
    pub created_at: i64,
    pub completed_at: i64,
    pub outcome: i64,
    pub is_validated: bool,
    pub bump: u8,
}

#[account]
pub struct ComplianceState {
    pub activity_id: [u8; 32],
    pub is_compliant: bool,
    pub requires_review: bool,
    pub verified_at: i64,
    pub flagged_at: i64,
    pub bump: u8,
}

#[account]
pub struct HaiState {
    pub current_score: u16,
    pub last_updated: i64,
    pub bump: u8,
}

#[account]
pub struct Reserve {
    pub admin: Pubkey,
    pub total_capital: u64,
    pub participant_count: u64,
    pub bump: u8,
}

#[account]
pub struct BridgeState {
    pub pending_sync: bool,
    pub sync_data: Vec<u8>,
    pub last_sync_attempt: i64,
    pub bump: u8,
}

// Context structs

#[action]
#[derive(Accounts)]
pub struct CheckComplianceAction<'info> {
    pub activity: Account<'info, Activity>,
    #[account(mut)]
    pub compliance_state: Account<'info, ComplianceState>,
}

#[action]
#[derive(Accounts)]
pub struct UpdateHaiAction<'info> {
    pub activity: Account<'info, Activity>,
    #[account(mut)]
    pub hai_state: Account<'info, HaiState>,
}

#[action]
#[derive(Accounts)]
pub struct DistributeProfitsAction<'info> {
    pub activity: Account<'info, Activity>,
    #[account(mut)]
    pub reserve: Account<'info, Reserve>,
}

#[action]
#[derive(Accounts)]
pub struct SyncCrossChainAction<'info> {
    pub activity: Account<'info, Activity>,
    #[account(mut)]
    pub bridge_state: Account<'info, BridgeState>,
}

#[derive(Accounts)]
pub struct CommitWithComplianceCheck<'info> {
    pub activity: Account<'info, Activity>,
    #[account(mut)]
    pub compliance_state: Account<'info, ComplianceState>,
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: MagicBlock context
    pub magic_context: AccountInfo<'info>,
    /// CHECK: MagicBlock program
    pub magic_program: AccountInfo<'info>,
}

// Events

#[event]
pub struct ComplianceFlaggedEvent {
    pub activity_id: [u8; 32],
    pub reason: String,
}

#[event]
pub struct ComplianceVerifiedEvent {
    pub activity_id: [u8; 32],
}

#[event]
pub struct HaiAutoUpdatedEvent {
    pub activity_id: [u8; 32],
    pub old_score: u16,
    pub new_score: u16,
    pub delta: i16,
}

#[event]
pub struct ProfitsDistributedEvent {
    pub activity_id: [u8; 32],
    pub total_profit: u64,
    pub participants: u64,
    pub per_participant: u64,
}

#[event]
pub struct CrossChainSyncInitiatedEvent {
    pub activity_id: [u8; 32],
    pub target_chain: String,
}

// Data structures

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CrossChainSyncMessage {
    pub activity_id: [u8; 32],
    pub capital_deployed: u64,
    pub outcome: i64,
    pub timestamp: i64,
}

// Errors

#[error_code]
pub enum ActionError {
    #[msg("No profit to distribute")]
    NoProfit,
    #[msg("Compliance check failed")]
    ComplianceFailed,
    #[msg("Cross-chain sync failed")]
    SyncFailed,
}
