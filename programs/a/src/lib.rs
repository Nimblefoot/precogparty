use std::convert::{TryFrom, TryInto};

use std::ops::Deref;

use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::{self, AssociatedToken},
    mint,
    token::{self, Burn, Mint, MintTo, Token, TokenAccount, Transfer},
};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

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

        let name_bytes = market_name.as_bytes();
        let mut name_data = [b' '; 16];
        name_data[..name_bytes.len()].copy_from_slice(name_bytes);

        let desc_bytes = market_description_uri.as_bytes();
        let mut desc_data = [b' '; 32];
        desc_data[..desc_bytes.len()].copy_from_slice(desc_bytes);

        **ctx.accounts.market_account = PredictionMarket {
            name: name_data,
            bump: *ctx.bumps.get("market_account").unwrap(),
            description_uri: desc_data,
            yes_mint: ctx.accounts.yes_mint.key(),
            yes_market: ctx.accounts.yes_market.key(),
            no_mint: ctx.accounts.no_mint.key(),
            no_market: ctx.accounts.no_market.key(),
            market_authority: ctx.accounts.market_authority.key(),
            resolution_authority: ctx.accounts.resolution_authority.key(),
            description_authority: ctx.accounts.description_authority.key(),
            usdc_vault: ctx.accounts.usdc_vault.key(),
            resolution: 0,
        };

        Ok(())
    }

    pub fn mint_contingent_set<'info>(ctx: Context<MintContingentSet>, amount: u64) -> Result<()> {
        let market_name = ctx.accounts.market_account.name.as_ref();
        let seeds = &[
            "market_account".as_bytes(),
            market_name.trim_ascii_whitespace(),
            &[ctx.accounts.market_account.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let accounts = Transfer {
            from: ctx.accounts.user_usdc.to_account_info(),
            to: ctx.accounts.usdc_vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, accounts);
        token::transfer(cpi_ctx, amount)?;

        for [mint, to] in [
            [
                ctx.accounts.yes_mint.to_account_info(),
                ctx.accounts.user_yes.to_account_info(),
            ],
            [
                ctx.accounts.no_mint.to_account_info(),
                ctx.accounts.user_no.to_account_info(),
            ],
        ] {
            let accounts = MintTo {
                mint,
                authority: ctx.accounts.market_account.to_account_info(),
                to,
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, accounts, signer);
            token::mint_to(cpi_ctx, amount)?;
        }
        Ok(())
    }

    pub fn merge_contingent_set<'info>(ctx: Context<MintContingentSet>, amount: u64) -> Result<()> {
        let market_name = ctx.accounts.market_account.name.as_ref();
        let seeds = &[
            "market_account".as_bytes(),
            market_name.trim_ascii_whitespace(),
            &[ctx.accounts.market_account.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let accounts = Transfer {
            from: ctx.accounts.usdc_vault.to_account_info(),
            to: ctx.accounts.user_usdc.to_account_info(),
            authority: ctx.accounts.market_account.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, accounts, signer);
        token::transfer(cpi_ctx, amount)?;

        for [mint, from] in [
            [
                ctx.accounts.yes_mint.to_account_info(),
                ctx.accounts.user_yes.to_account_info(),
            ],
            [
                ctx.accounts.no_mint.to_account_info(),
                ctx.accounts.user_no.to_account_info(),
            ],
        ] {
            let accounts = Burn {
                mint,
                authority: ctx.accounts.user.to_account_info(),
                from,
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, accounts);
            token::burn(cpi_ctx, amount)?;
        }
        Ok(())
    }
}
#[account]
#[derive(Default)]
pub struct PredictionMarket {
    name: [u8; 16],                // 16
    description_uri: [u8; 32],     // 32
    bump: u8,                      // 1
    yes_mint: Pubkey,              // 32
    no_mint: Pubkey,               // 32
    yes_market: Pubkey,            // 32
    no_market: Pubkey,             // 32
    usdc_vault: Pubkey,            // 32
    market_authority: Pubkey,      // 32
    resolution_authority: Pubkey,  // 32
    description_authority: Pubkey, // 32
    resolution: u8,                // 1 (bools are also 1 byte)
}

impl PredictionMarket {
    pub const LEN: usize = 16 + 32 + 1 + (32 * 8) + 1;
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
        seeds = ["market_account".as_bytes(), market_name.as_bytes()],
        bump,
        payer = market_authority,
        space = 8 + PredictionMarket::LEN
    )]
    pub market_account: Box<Account<'info, PredictionMarket>>,

    #[account(
        init,
        payer = market_authority,
        seeds = ["yes_mint".as_bytes(), market_account.key().as_ref()],
        bump,
        mint::decimals = TOKEN_DECIMALS,
        mint::authority = market_account,
        mint::freeze_authority = market_account
    )]
    pub yes_mint: Box<Account<'info, Mint>>,
    #[account(
        init,
        payer = market_authority,
        seeds = ["no_mint".as_bytes(), market_account.key().as_ref()],
        bump,
        mint::decimals = TOKEN_DECIMALS,
        mint::authority = market_account,
        mint::freeze_authority = market_account
    )]
    pub no_mint: Box<Account<'info, Mint>>,
    #[account(
        init,
        payer = market_authority,
        associated_token::mint = usdc_mint,
        associated_token::authority = market_account,
    )]
    pub usdc_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        // address = mint::USDC
    )]
    pub usdc_mint: Account<'info, Mint>,

    pub yes_market: SystemAccount<'info>, //Account<'info, Orderbook>,
    pub no_market: SystemAccount<'info>,  // Account<'info, Orderbook>,

    pub resolution_authority: SystemAccount<'info>,
    pub description_authority: SystemAccount<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct MintContingentSet<'info> {
    pub user: Signer<'info>,

    #[account(
        seeds = ["market_account".as_bytes(), market_account.name.as_ref().trim_ascii_whitespace()],
        bump,
    )]
    pub market_account: Account<'info, PredictionMarket>,
    #[account(
        mut,
        address = market_account.yes_mint
    )]
    pub yes_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        address = market_account.no_mint
    )]
    pub no_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        address = market_account.usdc_vault
    )]
    pub usdc_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::authority = user,
        associated_token::mint = market_account.yes_mint
    )]
    pub user_yes: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::authority = user,
        associated_token::mint = market_account.no_mint)]
    pub user_no: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::authority = user,
        associated_token::mint = usdc_vault.mint,
    )]
    pub user_usdc: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct MergeContingentSet<'info> {
    pub user: Signer<'info>,

    #[account(
        seeds = ["market_account".as_bytes(), market_account.name.as_ref().trim_ascii_whitespace()],
        bump,
    )]
    pub market_account: Account<'info, PredictionMarket>,
    #[account(
        address = market_account.yes_mint
    )]
    pub yes_mint: Box<Account<'info, Mint>>,
    #[account(
        address = market_account.no_mint
    )]
    pub no_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        address = market_account.usdc_vault
    )]
    pub usdc_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::authority = user,
        associated_token::mint = market_account.yes_mint
    )]
    pub user_yes: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::authority = user,
        associated_token::mint = market_account.no_mint)]
    pub user_no: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::authority = user,
        associated_token::mint = usdc_vault.mint,
    )]
    pub user_usdc: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub struct MintContingentSetTogether {}

pub struct RedeemContingentCoin {}

pub struct ResolveMarket {}

pub struct UpdateAdminAuthority {}
pub struct UpdateResolutionAuthority {}

pub struct UpdateDescriptionAuthority {}

pub struct UpdateMarketDescription {}

/// Trait to allow trimming ascii whitespace from a &[u8].
pub trait TrimAsciiWhitespace {
    /// Trim ascii whitespace (based on `is_ascii_whitespace()`) from the
    /// start and end of a slice.
    fn trim_ascii_whitespace(&self) -> &[u8];
}
impl<T: Deref<Target = [u8]>> TrimAsciiWhitespace for T {
    fn trim_ascii_whitespace(&self) -> &[u8] {
        let from = match self.iter().position(|x| !x.is_ascii_whitespace()) {
            Some(i) => i,
            None => return &self[0..0],
        };
        let to = self.iter().rposition(|x| !x.is_ascii_whitespace()).unwrap();
        &self[from..=to]
    }
}
