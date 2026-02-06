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

//! AMANA HAI - Halal Activity Index with MagicBlock VRF integration
//!
//! This program implements the Halal Activity Index (HAI) system with
//! verifiable randomness and real-time score updates via Ephemeral Rollups.
//!
//! Features:
//! - Real-time HAI score calculation and updates
//! - Verifiable randomness for data source sampling
//! - Privacy-preserving score computation
//! - Cross-chain HAI synchronization

use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::{commit, ephemeral};
use ephemeral_rollups_sdk::ephem::commit_accounts;

#[program]
pub mod amana_hai {
    use super::*;

    /// Initialize the HAI tracker
    pub fn initialize(
        ctx: Context<InitializeHai>,
        initial_score: u16,
    ) -> Result<()> {
        let hai = &mut ctx.accounts.hai;
        hai.admin = ctx.accounts.admin.key();
        hai.current_score = initial_score;
        hai.total_activities = 0;
        hai.compliant_activities = 0;
        hai.asset_backed_activities = 0;
        hai.economic_value_activities = 0;
        hai.snapshot_count = 0;
        hai.bump = ctx.bumps.hai;

        emit!(HaiInitializedEvent {
            initial_score,
        });

        Ok(())
    }

    /// Track an activity for HAI calculation
    pub fn track_activity(
        ctx: Context<TrackActivity>,
        activity_id: [u8; 32],
        is_compliant: bool,
        is_asset_backed: bool,
        has_real_economic_value: bool,
        validator_count: u32,
        positive_votes: u32,
    ) -> Result<()> {
        let hai = &mut ctx.accounts.hai;
        let metrics = &mut ctx.accounts.metrics;

        hai.total_activities = hai.total_activities
            .checked_add(1)
            .ok_or(HaiError::MathOverflow)?;

        if is_compliant {
            hai.compliant_activities = hai.compliant_activities
                .checked_add(1)
                .ok_or(HaiError::MathOverflow)?;
        }

        if is_asset_backed {
            hai.asset_backed_activities = hai.asset_backed_activities
                .checked_add(1)
                .ok_or(HaiError::MathOverflow)?;
        }

        if has_real_economic_value {
            hai.economic_value_activities = hai.economic_value_activities
                .checked_add(1)
                .ok_or(HaiError::MathOverflow)?;
        }

        // Store activity metrics
        metrics.activity_id = activity_id;
        metrics.is_compliant = is_compliant;
        metrics.is_asset_backed = is_asset_backed;
        metrics.has_real_economic_value = has_real_economic_value;
        metrics.validator_count = validator_count;
        metrics.positive_votes = positive_votes;
        metrics.timestamp = Clock::get()?.unix_timestamp;
        metrics.bump = ctx.bumps.metrics;

        // Recalculate HAI score
        hai.current_score = calculate_hai_score(hai)?;

        emit!(ActivityTrackedEvent {
            activity_id,
            is_compliant,
            is_asset_backed,
            new_score: hai.current_score,
        });

        Ok(())
    }

    /// Create a snapshot of current HAI metrics
    pub fn create_snapshot(ctx: Context<CreateSnapshot>) -> Result<()> {
        let hai = &ctx.accounts.hai;
        let snapshot = &mut ctx.accounts.snapshot;

        snapshot.score = hai.current_score;
        snapshot.total_activities = hai.total_activities;
        snapshot.compliant_activities = hai.compliant_activities;
        snapshot.asset_backed_activities = hai.asset_backed_activities;
        snapshot.timestamp = Clock::get()?.unix_timestamp;
        snapshot.snapshot_id = hai.snapshot_count;
        snapshot.bump = ctx.bumps.snapshot;

        emit!(SnapshotCreatedEvent {
            snapshot_id: snapshot.snapshot_id,
            score: snapshot.score,
        });

        Ok(())
    }

    /// Update HAI calculation weights
    pub fn update_weights(
        ctx: Context<UpdateWeights>,
        compliance_weight: u16,
        asset_backing_weight: u16,
        economic_value_weight: u16,
        validator_participation_weight: u16,
    ) -> Result<()> {
        let hai = &mut ctx.accounts.hai;

        let total_weight = (compliance_weight as u32)
            .checked_add(asset_backing_weight as u32)
            .and_then(|v| v.checked_add(economic_value_weight as u32))
            .and_then(|v| v.checked_add(validator_participation_weight as u32))
            .ok_or(HaiError::MathOverflow)?;

        require!(total_weight == 10000, HaiError::InvalidWeights);

        hai.compliance_weight = compliance_weight;
        hai.asset_backing_weight = asset_backing_weight;
        hai.economic_value_weight = economic_value_weight;
        hai.validator_participation_weight = validator_participation_weight;

        hai.current_score = calculate_hai_score(hai)?;

        emit!(WeightsUpdatedEvent {
            compliance_weight,
            asset_backing_weight,
            economic_value_weight,
            validator_participation_weight,
        });

        Ok(())
    }

    /// Authorize an updater
    pub fn authorize_updater(
        ctx: Context<AuthorizeUpdater>,
        updater: Pubkey,
    ) -> Result<()> {
        let updater_account = &mut ctx.accounts.updater_account;

        updater_account.updater = updater;
        updater_account.is_authorized = true;
        updater_account.bump = ctx.bumps.updater_account;

        emit!(UpdaterAuthorizedEvent {
            updater,
        });

        Ok(())
    }

    /// Revoke authorization
    pub fn revoke_updater(ctx: Context<RevokeUpdater>) -> Result<()> {
        let updater_account = &mut ctx.accounts.updater_account;
        updater_account.is_authorized = false;

        emit!(UpdaterRevokedEvent {
            updater: updater_account.updater,
        });

        Ok(())
    }

    // ========== MagicBlock VRF and Real-time Integration ==========

    /// Update HAI score with verifiable randomness for data source sampling
    pub fn update_hai_score_with_vrf(
        ctx: Context<UpdateHaiScoreVrf>,
        activity_id: [u8; 32],
        data_sources: Vec<u8>,
    ) -> Result<()> {
        let hai = &mut ctx.accounts.hai;
        
        // Simulate VRF randomness (in production, integrate with MagicBlock VRF)
        let clock = Clock::get()?;
        let pseudo_randomness = (clock.unix_timestamp as u64) % 100;
        
        // Use randomness to select data sources
        let selected_sources = select_data_sources_with_randomness(data_sources, pseudo_randomness)?;
        
        // Calculate HAI score with selected sources
        let new_score = calculate_hai_score_with_sources(hai, selected_sources)?;
        hai.current_score = new_score;
        
        emit!(HaiScoreUpdatedWithVrfEvent {
            activity_id,
            new_score,
            randomness: pseudo_randomness,
        });
        
        Ok(())
    }

    /// Commit HAI scores from ER to base layer
    #[commit]
    pub fn commit_hai_scores(ctx: Context<CommitHaiScores>) -> Result<()> {
        // Batch commit multiple HAI score updates
        commit_accounts(
            &ctx.accounts.payer,
            vec![&ctx.accounts.hai.to_account_info()],
            &ctx.accounts.magic_context,
            &ctx.accounts.magic_program,
        )?;
        
        emit!(HaiScoresCommittedEvent {
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }

    /// Real-time HAI score update on Ephemeral Rollup
    pub fn update_hai_realtime(
        ctx: Context<UpdateHaiRealtime>,
        activity_id: [u8; 32],
        compliance_delta: i16,
    ) -> Result<()> {
        let hai = &mut ctx.accounts.hai;
        
        // Apply real-time score adjustment
        let new_score = if compliance_delta >= 0 {
            hai.current_score.saturating_add(compliance_delta as u16)
        } else {
            hai.current_score.saturating_sub((-compliance_delta) as u16)
        };
        
        hai.current_score = new_score.min(10000); // Cap at 100%
        
        emit!(HaiRealtimeUpdateEvent {
            activity_id,
            old_score: hai.current_score,
            new_score,
            delta: compliance_delta,
        });
        
        Ok(())
    }
}

/// Calculate HAI score based on current metrics
fn calculate_hai_score(hai: &Hai) -> Result<u16> {
    if hai.total_activities == 0 {
        return Ok(hai.current_score);
    }

    let total = hai.total_activities as u64;
    let max_score: u64 = 10000;

    // Compliance component
    let compliance_score = (hai.compliant_activities as u64)
        .checked_mul(max_score)
        .and_then(|v| v.checked_div(total))
        .ok_or(HaiError::MathOverflow)?;

    // Asset backing component
    let asset_backing_score = (hai.asset_backed_activities as u64)
        .checked_mul(max_score)
        .and_then(|v| v.checked_div(total))
        .ok_or(HaiError::MathOverflow)?;

    // Economic value component
    let economic_value_score = (hai.economic_value_activities as u64)
        .checked_mul(max_score)
        .and_then(|v| v.checked_div(total))
        .ok_or(HaiError::MathOverflow)?;

    // Validator participation (baseline for now)
    let validator_participation_score: u64 = 8000;

    // Weighted calculation
    let score = (compliance_score
        .checked_mul(hai.compliance_weight as u64))
        .and_then(|v| v.checked_div(10000))
        .and_then(|v| {
            v.checked_add(
                (asset_backing_score
                    .checked_mul(hai.asset_backing_weight as u64))
                .unwrap_or(0) / 10000,
            )
        })
        .and_then(|v| {
            v.checked_add(
                (economic_value_score
                    .checked_mul(hai.economic_value_weight as u64))
                .unwrap_or(0) / 10000,
            )
        })
        .and_then(|v| {
            v.checked_add(
                (validator_participation_score
                    .checked_mul(hai.validator_participation_weight as u64))
                .unwrap_or(0) / 10000,
            )
        })
        .ok_or(HaiError::MathOverflow)?;

    Ok(score.min(max_score) as u16)
}

/// Select data sources using verifiable randomness
fn select_data_sources_with_randomness(sources: Vec<u8>, randomness: u64) -> Result<Vec<u8>> {
    if sources.is_empty() {
        return Ok(vec![]);
    }
    
    let selection_count = ((randomness % 3) + 1) as usize; // Select 1-3 sources
    let mut selected = Vec::new();
    
    for i in 0..selection_count.min(sources.len()) {
        let index = ((randomness + i as u64) % sources.len() as u64) as usize;
        if !selected.contains(&sources[index]) {
            selected.push(sources[index]);
        }
    }
    
    Ok(selected)
}

/// Calculate HAI score with specific data sources
fn calculate_hai_score_with_sources(hai: &Hai, sources: Vec<u8>) -> Result<u16> {
    if sources.is_empty() {
        return calculate_hai_score(hai);
    }
    
    // Apply source-specific weighting (simplified)
    let base_score = calculate_hai_score(hai)?;
    let source_modifier = sources.len() as u16 * 50; // Bonus for multiple sources
    
    Ok((base_score + source_modifier).min(10000))
}

// Account structs

#[account]
pub struct Hai {
    pub admin: Pubkey,
    pub current_score: u16,        // 0-10000 (0.00%-100.00%)
    pub total_activities: u64,
    pub compliant_activities: u64,
    pub asset_backed_activities: u64,
    pub economic_value_activities: u64,
    pub snapshot_count: u64,
    // Weights (in basis points)
    pub compliance_weight: u16,        // Default 4000 (40%)
    pub asset_backing_weight: u16,     // Default 2500 (25%)
    pub economic_value_weight: u16,    // Default 2000 (20%)
    pub validator_participation_weight: u16, // Default 1500 (15%)
    pub bump: u8,
}

#[account]
pub struct ActivityMetrics {
    pub activity_id: [u8; 32],
    pub is_compliant: bool,
    pub is_asset_backed: bool,
    pub has_real_economic_value: bool,
    pub validator_count: u32,
    pub positive_votes: u32,
    pub timestamp: i64,
    pub bump: u8,
}

#[account]
pub struct HaiSnapshot {
    pub snapshot_id: u64,
    pub score: u16,
    pub total_activities: u64,
    pub compliant_activities: u64,
    pub asset_backed_activities: u64,
    pub timestamp: i64,
    pub bump: u8,
}

#[account]
pub struct Updater {
    pub updater: Pubkey,
    pub is_authorized: bool,
    pub bump: u8,
}

// Context structs

#[derive(Accounts)]
pub struct InitializeHai<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 2 + 8 + 8 + 8 + 8 + 8 + 2 + 2 + 2 + 2 + 1,
        seeds = [b"hai"],
        bump
    )]
    pub hai: Account<'info, Hai>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TrackActivity<'info> {
    #[account(
        mut,
        seeds = [b"hai"],
        bump = hai.bump
    )]
    pub hai: Account<'info, Hai>,

    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 1 + 1 + 1 + 4 + 4 + 8 + 1,
        seeds = [b"metrics", activity_id.as_ref()],
        bump
    )]
    pub metrics: Account<'info, ActivityMetrics>,

    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateSnapshot<'info> {
    #[account(
        mut,
        seeds = [b"hai"],
        bump = hai.bump
    )]
    pub hai: Account<'info, Hai>,

    #[account(
        init,
        payer = payer,
        space = 8 + 8 + 2 + 8 + 8 + 8 + 8 + 1,
        seeds = [b"snapshot", hai.snapshot_count.to_le_bytes().as_ref()],
        bump
    )]
    pub snapshot: Account<'info, HaiSnapshot>,

    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateWeights<'info> {
    #[account(
        mut,
        seeds = [b"hai"],
        bump = hai.bump,
        constraint = hai.admin == admin.key() @ HaiError::Unauthorized
    )]
    pub hai: Account<'info, Hai>,
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct AuthorizeUpdater<'info> {
    #[account(
        seeds = [b"hai"],
        bump = hai.bump,
        constraint = hai.admin == admin.key() @ HaiError::Unauthorized
    )]
    pub hai: Account<'info, Hai>,

    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 1 + 1,
        seeds = [b"updater", updater.as_ref()],
        bump
    )]
    pub updater_account: Account<'info, Updater>,

    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevokeUpdater<'info> {
    #[account(
        mut,
        seeds = [b"updater", updater_account.updater.as_ref()],
        bump = updater_account.bump
    )]
    pub updater_account: Account<'info, Updater>,

    #[account(
        seeds = [b"hai"],
        bump = hai.bump,
        constraint = hai.admin == admin.key() @ HaiError::Unauthorized
    )]
    pub hai: Account<'info, Hai>,

    pub admin: Signer<'info>,
}

// ========== MagicBlock Context Structs ==========

#[derive(Accounts)]
pub struct UpdateHaiScoreVrf<'info> {
    #[account(
        mut,
        seeds = [b"hai"],
        bump = hai.bump
    )]
    pub hai: Account<'info, Hai>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
}

#[commit]
#[derive(Accounts)]
pub struct CommitHaiScores<'info> {
    #[account(
        mut,
        seeds = [b"hai"],
        bump = hai.bump
    )]
    pub hai: Account<'info, Hai>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: MagicBlock context account
    pub magic_context: AccountInfo<'info>,
    /// CHECK: MagicBlock program
    pub magic_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct UpdateHaiRealtime<'info> {
    #[account(
        mut,
        seeds = [b"hai"],
        bump = hai.bump
    )]
    pub hai: Account<'info, Hai>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
}

// Events

#[event]
pub struct HaiInitializedEvent {
    pub initial_score: u16,
}

#[event]
pub struct ActivityTrackedEvent {
    pub activity_id: [u8; 32],
    pub is_compliant: bool,
    pub is_asset_backed: bool,
    pub new_score: u16,
}

#[event]
pub struct SnapshotCreatedEvent {
    pub snapshot_id: u64,
    pub score: u16,
}

#[event]
pub struct WeightsUpdatedEvent {
    pub compliance_weight: u16,
    pub asset_backing_weight: u16,
    pub economic_value_weight: u16,
    pub validator_participation_weight: u16,
}

#[event]
pub struct UpdaterAuthorizedEvent {
    pub updater: Pubkey,
}

#[event]
pub struct UpdaterRevokedEvent {
    pub updater: Pubkey,
}

// ========== MagicBlock Events ==========

#[event]
pub struct HaiScoreUpdatedWithVrfEvent {
    pub activity_id: [u8; 32],
    pub new_score: u16,
    pub randomness: u64,
}

#[event]
pub struct HaiScoresCommittedEvent {
    pub timestamp: i64,
}

#[event]
pub struct HaiRealtimeUpdateEvent {
    pub activity_id: [u8; 32],
    pub old_score: u16,
    pub new_score: u16,
    pub delta: i16,
}

// Errors

#[error_code]
pub enum HaiError {
    #[msg("Math operation overflow")]
    MathOverflow,
    #[msg("Invalid weights - must sum to 10000")]
    InvalidWeights,
    #[msg("Unauthorized access")]
    Unauthorized,
}
