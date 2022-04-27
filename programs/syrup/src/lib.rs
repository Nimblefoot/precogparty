use anchor_lang::prelude::*;
use data::{ListChunk, ListEntry, ListInfo};
pub mod data;
use user_account::UserAccount;
pub mod user_account;

use anchor_spl::{
    associated_token::{self, AssociatedToken},
    mint,
    token::{self, Burn, Mint, MintTo, Token, TokenAccount, Transfer},
};

declare_id!("7v8HDDmpuZ3oLMHEN2PmKrMAGTLLUnfRdZtFt5R2F3gK");

#[program]
pub mod syrup {
    use super::*;

    #[allow(unused_variables)]
    pub fn create_list(ctx: Context<CreateList>, name: String) -> Result<()> {
        ctx.accounts.list_info.owner = ctx.accounts.payer.key();
        ctx.accounts.list_info.last_page = 0;
        ctx.accounts.list_info.length = 0;

        msg!(
            "created list: #{}",
            ctx.accounts.list.to_account_info().key()
        );

        Ok(())
    }

    #[allow(unused_variables)]
    pub fn append(ctx: Context<Append>, name: String, item: ListEntry) -> Result<()> {
        ctx.accounts.list.try_push(item);

        if ctx.accounts.list.is_full() {
            msg!("Full");
            ctx.accounts.list_info.last_page += 1;
        }

        ctx.accounts.list_info.length += 1;
        Ok(())
    }

    #[allow(unused_variables)]
    pub fn pop(ctx: Context<Pop>, name: String) -> Result<Option<ListEntry>> {
        let list: &mut Account<'_, ListChunk> = &mut ctx.accounts.list;
        let result = list.pop();

        if list.is_empty() && ctx.accounts.list_info.last_page > 0 {
            ctx.accounts.list_info.last_page -= 1;
        }

        if ctx.accounts.list_info.length > 0 {
            ctx.accounts.list_info.length -= 1;
        }

        Ok(result)
    }

    #[allow(unused_variables)]
    pub fn delete(
        ctx: Context<Delete>,
        name: String,
        deletion_index: u32,
        chunk_number: u32,
    ) -> Result<()> {
        let list: &mut Account<'_, ListChunk> = &mut ctx.accounts.list;
        let last_page: &mut Account<'_, ListChunk> = &mut ctx.accounts.last_page;
        let list_info: &mut Account<'_, ListInfo> = &mut ctx.accounts.list_info;

        if let Some(key) = last_page.pop() {
            list.set(deletion_index, key);
        }

        Ok(())
    }

    pub fn create_user_account(ctx: Context<CreateUserAccount>) -> Result<()> {
        ctx.accounts
            .user_account
            .initialize(ctx.accounts.user.key());

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateList<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(init, payer=payer, seeds=["list".as_ref(), name.as_ref(), "info".as_ref()], space=1000, bump)]
    pub list_info: Account<'info, ListInfo>,
    #[account(init, payer=payer, space = 2000, seeds=["list".as_ref(), name.as_ref(), list_info.last_page.to_le_bytes().as_ref()], bump)]
    pub list: Account<'info, ListChunk>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name: String, item: ListEntry)]
pub struct Append<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, seeds=["list".as_ref(), name.as_ref(), "info".as_ref()], bump)]
    pub list_info: Account<'info, ListInfo>,
    #[account(init_if_needed, payer=payer, space = 2000, seeds=["list".as_ref(), name.as_ref(), list_info.last_page.to_le_bytes().as_ref()], bump)]
    pub list: Account<'info, ListChunk>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct Pop<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, seeds=["list".as_ref(), name.as_ref(), "info".as_ref()], bump)]
    pub list_info: Account<'info, ListInfo>,
    #[account(mut, seeds=["list".as_ref(), name.as_ref(), list_info.last_page.to_le_bytes().as_ref()], bump)]
    pub list: Account<'info, ListChunk>,
}

#[derive(Accounts)]
#[instruction(name: String, chunk_number: u32, last_chunk: u32)]
pub struct Delete<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, seeds=["list".as_ref(), name.as_ref(), "info".as_ref()], bump)]
    pub list_info: Account<'info, ListInfo>,
    #[account(mut)]
    pub list: Account<'info, ListChunk>,
    #[account(mut, seeds=["list".as_ref(), name.as_ref(), list_info.last_page.to_le_bytes().as_ref()], bump)]
    pub last_page: Account<'info, ListChunk>,
}

#[derive(Accounts)]
pub struct CreateUserAccount<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(init, payer=user, seeds=["user-account".as_ref(), user.to_account_info().key().as_ref()], space=1000, bump)]
    pub user_account: Box<Account<'info, UserAccount>>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeOrderbook<'info> {
    pub currency_denomination_mint: Box<Account<'info, Mint>>,
    pub currency_vault: Box<Account<'info, TokenAccount>>,
    pub token_mint: Box<Account<'info, Mint>>,
    pub token_vault: Box<Account<'info, Mint>>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(order: ListEntry, name: String)]
pub struct PlaceOrder<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub user_account: Box<Account<'info, UserAccount>>,
    pub vault: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    #[account(mut, seeds=["list".as_ref(), name.as_ref(), "info".as_ref()], bump)]
    pub list_info: Account<'info, ListInfo>,
    #[account(init_if_needed, payer=user, space = 2000, seeds=["list".as_ref(), name.as_ref(), list_info.last_page.to_le_bytes().as_ref()], bump)]
    pub list_chunk: Account<'info, ListChunk>,
}

pub struct TakeOrder {}

pub struct CancelOrder {}

pub struct ExecuteMatchingOrders {}
