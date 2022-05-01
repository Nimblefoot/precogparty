use anchor_lang::prelude::*;
use data::{ListChunk, ListEntry, ListInfo, OrderbookInfo};
pub mod data;
use user_account::UserAccount;
pub mod user_account;
use user_account::OrderRecord;

pub mod transfer;
use transfer::transfer_tokens;

use anchor_spl::{
    associated_token::{self, AssociatedToken},
    mint,
    token::{self, Burn, Mint, MintTo, Token, TokenAccount, Transfer},
};

declare_id!("7v8HDDmpuZ3oLMHEN2PmKrMAGTLLUnfRdZtFt5R2F3gK");

#[program]
pub mod syrup {
    use super::*;

    #[allow(unused_variables)] // already replaced with initialize - delete eventually
    pub fn create_list(ctx: Context<CreateList>, name: String) -> Result<()> {
        ctx.accounts.list_info.owner = ctx.accounts.payer.key();
        ctx.accounts.list_info.last_page = 0;
        ctx.accounts.list_info.length = 0;

        Ok(())
    }

    #[allow(unused_variables)]
    pub fn initialize_orderbook(ctx: Context<InitializeOrderbook>, name: String) -> Result<()> {
        // ToDo - insist names are unique and max 16 characters

        ctx.accounts.orderbook_info.admin = ctx.accounts.admin.key();
        ctx.accounts.orderbook_info.last_page = 0;
        ctx.accounts.orderbook_info.length = 0;
        ctx.accounts.orderbook_info.currency_mint = ctx.accounts.currency_mint.key();
        ctx.accounts.orderbook_info.token_mint = ctx.accounts.token_mint.key();

        Ok(())
    }

    #[allow(unused_variables)] // replace eventually with place_order
    pub fn append(ctx: Context<Append>, name: String, item: ListEntry) -> Result<()> {
        ctx.accounts.list.try_push(item);

        if ctx.accounts.list.is_full() {
            msg!("Full");
            ctx.accounts.list_info.last_page += 1;
        }

        ctx.accounts.list_info.length += 1;
        Ok(())
    }

    #[allow(unused_variables)] // delete eventually
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

    pub fn place_order(ctx: Context<PlaceOrder>, name: String, order: ListEntry) -> Result<()> {
        // ToDo - Add check for if the user has space in their order vector

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let accounts = Transfer {
            from: ctx.accounts.user_ata.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, accounts);
        token::transfer(cpi_ctx, order.size)?;

        // create and append order record
        let name_bytes = name.as_bytes();
        let mut name_data = [b' '; 16];
        name_data[..name_bytes.len()].copy_from_slice(name_bytes);

        let order_record = OrderRecord {
            market: name_data,
            buy: order.buy,
            size: order.size,
            price: order.price,
            page_number: ctx.accounts.orderbook_info.last_page,
            index: ctx.accounts.current_page.len() as u32,
        };

        // add to the list of offers
        ctx.accounts.current_page.try_push(order);
        if ctx.accounts.current_page.is_full() {
            msg!("Full");
            ctx.accounts.orderbook_info.last_page += 1;
        };

        ctx.accounts.orderbook_info.length += 1;

        ctx.accounts.user_account.orders.push(order_record);

        Ok(())
    }
}

// const TOKEN_DECIMALS: u8 = 6;

#[derive(Accounts)] // Replaced with initializeOrderbook - delete eventually
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

#[derive(Accounts)] // Will get replaced by PlaceOrder
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

#[derive(Accounts)] // delete eventually. Just for testing
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
    #[account(init, payer=user, seeds=["user-account".as_ref(), user.key().as_ref()], space=1000, bump)]
    pub user_account: Box<Account<'info, UserAccount>>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct InitializeOrderbook<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(init, payer=admin, seeds=[name.as_ref(), "orderbook-info".as_ref()], space=1000, bump)]
    pub orderbook_info: Account<'info, OrderbookInfo>,
    #[account(init, payer=admin, seeds=[name.as_ref(), "page".as_ref(), orderbook_info.last_page.to_le_bytes().as_ref()], space=500, bump)]
    pub first_page: Account<'info, ListChunk>,
    pub currency_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = admin,
        associated_token::mint = currency_mint,
        associated_token::authority = orderbook_info
    )]
    pub currency_vault: Box<Account<'info, TokenAccount>>,
    pub token_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = admin,
        associated_token::mint = token_mint,
        associated_token::authority = orderbook_info
    )]
    pub token_vault: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name: String, order: ListEntry)]
pub struct PlaceOrder<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut, seeds=["user-account".as_ref(), user.key().as_ref()], bump)]
    pub user_account: Box<Account<'info, UserAccount>>,
    #[account(mut)]
    pub user_ata: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub vault: Box<Account<'info, TokenAccount>>,
    #[account(mut, seeds=[name.as_ref(), "orderbook-info".as_ref()], bump)]
    pub orderbook_info: Account<'info, OrderbookInfo>,
    #[account(init_if_needed, payer=user, seeds=[name.as_ref(), "page".as_ref(), orderbook_info.last_page.to_le_bytes().as_ref()], space=500, bump)]
    pub current_page: Account<'info, ListChunk>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

pub struct TakeOrder {}

pub struct CancelOrder {}

pub struct ExecuteMatchingOrders {}
