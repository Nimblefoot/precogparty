use std::convert::{TryFrom, TryInto};

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token, mint,
    token::{self, Mint, Token, TokenAccount},
};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

fn slice_to_fixed_16(slice: &[u8]) -> &[u8; 16] {
    slice.try_into().expect("slice with incorrect length")
}
fn slice_to_fixed_32(slice: &[u8]) -> &[u8; 32] {
    slice.try_into().expect("slice with incorrect length")
}

const USDC_MINT: &str = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

const TOKEN_DECIMALS: u8 = 6;
#[program]
pub mod a {
    use super::*;

    pub fn create_market<'info>(
        ctx: Context<CreateMarket>,
        market_name: String,
        market_description_uri: String,
    ) -> Result<()> {
        // initialize market_account
        *ctx.accounts.market_account = PredictionMarket {
            name: *slice_to_fixed_16(market_name.as_bytes()),
            description_uri: *slice_to_fixed_32(market_description_uri.as_bytes()),
            yes_mint: ctx.accounts.yes_mint.key(),
            yes_market: ctx.accounts.yes_market.key(),
            no_mint: ctx.accounts.no_mint.key(),
            no_market: ctx.accounts.no_market.key(),
            market_authority: ctx.accounts.market_authority.key(),
            resolution_authority: ctx.accounts.resolution_authority.key(),
            description_authority: ctx.accounts.description_authority.key(),
            resolution: 0,
        };

        let key = ctx.accounts.market_account.key().as_ref();

        Ok(())
    }

    pub fn mint_contingent_set<'info>(ctx: Context<MintContingentSet>, amount: u64) -> Result<()> {
        Ok(())
    }
}
#[account]
#[derive(Default)]
pub struct PredictionMarket {
    name: [u8; 16],            // 1 * 16
    description_uri: [u8; 32], // 1 * 32

    yes_mint: Pubkey,   // 8
    yes_market: Pubkey, // 8
    no_mint: Pubkey,    // 8
    no_market: Pubkey,  // 8

    market_authority: Pubkey,      // 8
    resolution_authority: Pubkey,  // 8
    description_authority: Pubkey, // 8

    resolution: u8, // 1 (bools are also 1 byte)
}

#[account]
#[derive(Default)]
pub struct Orderbook {}

#[derive(Accounts)]
#[instruction(market_name: String, market_description_uri: String)]
pub struct CreateMarket<'info> {
    #[account(mut)]
    pub market_authority: Signer<'info>,
    #[account(
        init,
        seeds = [b"market", market_name.as_bytes()],
        bump,
        payer = market_authority,
        space = 4 + 16 + 32 + (8 * 7) + 1
    )]
    pub market_account: Account<'info, PredictionMarket>,
    #[account(
        init,
        payer = market_authority,
        seeds = [b"yes_mint", market_account.key().as_ref()],
        bump,
        mint::decimals = TOKEN_DECIMALS,
        mint::authority = market_account,
        mint::freeze_authority = market_account
    )]
    pub yes_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = market_authority,
        seeds = [b"no_mint", market_account.key().as_ref()],
        bump,
        mint::decimals = TOKEN_DECIMALS,
        mint::authority = market_account,
        mint::freeze_authority = market_account
    )]
    pub no_mint: Account<'info, Mint>,

    pub yes_market: Account<'info, Orderbook>,
    pub no_market: Account<'info, Orderbook>,

    pub resolution_authority: SystemAccount<'info>,
    pub description_authority: SystemAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct MintContingentSet<'info> {
    pub user: Signer<'info>,

    #[account(
        seeds = [b"market", &market_account.name],
        bump,
    )]
    pub market_account: Account<'info, PredictionMarket>,
    #[account(
        address = market_account.yes_mint
    )]
    pub yes_mint: Account<'info, Mint>,
    #[account(
        address = market_account.no_mint
    )]
    pub no_mint: Account<'info, Mint>,

    #[account(mut, associated_token::authority = user, associated_token::mint = market_account.yes_mint )]
    pub user_yes: Account<'info, TokenAccount>,
    #[account(mut, associated_token::authority = user, associated_token::mint = market_account.no_mint )]
    pub user_no: Account<'info, TokenAccount>,
    #[account(mut, associated_token::authority = user, associated_token::mint = mint::USDC)]
    pub user_usdc: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub struct MintContingentSetTogether {}

pub struct MergeContingentSet {}

pub struct RedeemContingentCoin {}

pub struct ResolveMarket {}

pub struct UpdateAdminAuthority {}
pub struct UpdateResolutionAuthority {}

pub struct UpdateDescriptionAuthority {}

pub struct UpdateMarketDescription {}
