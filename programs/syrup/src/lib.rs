use anchor_lang::prelude::*;
use data::{OrderbookPage, Order, OrderbookInfo};
pub mod data;
use user_account::UserAccount;
pub mod user_account;
use user_account::OrderRecord;

use anchor_spl::{
    associated_token::{self, AssociatedToken},
    mint,
    token::{self, Burn, Mint, MintTo, Token, TokenAccount, Transfer},
};

/* 
Todos:
-- Actually compute space
-- Better checks/constraints [requires parsing the market names from byte arrays, maybe refactor some checks into a function?]
-- Error codes (for example on try push)
-- Take Order
-- Execute MAtching Orders
*/


declare_id!("7v8HDDmpuZ3oLMHEN2PmKrMAGTLLUnfRdZtFt5R2F3gK");

#[program]
pub mod syrup {
    use super::*;

    #[allow(unused_variables)]
    pub fn initialize_orderbook(ctx: Context<InitializeOrderbook>, name: String) -> Result<()> {
        // ToDo - insist names are unique and max 16 characters

        ctx.accounts.orderbook_info.admin = ctx.accounts.admin.key();
        ctx.accounts.orderbook_info.length = 0;
        ctx.accounts.orderbook_info.currency_mint = ctx.accounts.currency_mint.key();
        ctx.accounts.orderbook_info.token_mint = ctx.accounts.token_mint.key();
        ctx.accounts.orderbook_info.bump = *ctx.bumps.get("orderbook_info").unwrap();
        ctx.accounts.orderbook_info.name = name;

        Ok(())
    }

    pub fn create_user_account(ctx: Context<CreateUserAccount>) -> Result<()> {
        ctx.accounts
            .user_account
            .initialize(ctx.accounts.user.key());

        Ok(())
    }

    pub fn place_order(ctx: Context<PlaceOrder>, order: Order) -> Result<()> {
        // ToDo - Add check for if the user has space in their order vector. Maybe just have a length? Actually cleaner?

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let accounts = Transfer {
            from: ctx.accounts.user_ata.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, accounts);
        token::transfer(cpi_ctx, order.size)?;

        // create and append order record
        let name_bytes = ctx.accounts.orderbook_info.name.as_bytes();
        let mut name_data = [b' '; 16];
        name_data[..name_bytes.len()].copy_from_slice(name_bytes);

        let order_record = OrderRecord {
            market: name_data,
            buy: order.buy,
            size: order.size,
            price: order.price,
        };

        // add to the lists of offers
        ctx.accounts.current_page.try_push(order);

        ctx.accounts.orderbook_info.length += 1;

        ctx.accounts.user_account.orders.push(order_record);

        Ok(())
    }

    pub fn take_order(ctx: Context<TakeOrder>, order: Order, page_number: u32, index: u32) -> Result<()> {
        msg!("taking an order!");

        let order_data: Order = ctx.accounts.order_page.get(index);
        if ctx.accounts.offerer_user_account.user != order_data.user {
            return err!(ErrorCode::IncorrectUser);
        };
        msg!(&order_data.size.to_string()[..]);
        msg!(&order_data.price.to_string()[..]);

        let order_page = &mut ctx.accounts.order_page;
        let last_page = &mut ctx.accounts.last_page;
        let offerer_user_account = &mut ctx.accounts.offerer_user_account;

        // need to split up variables to avoid borrower check errors
        let orderbook_name = ctx.accounts.orderbook_info.name.clone();
        let orderbook_bump = ctx.accounts.orderbook_info.bump;
        let orderbook_account_info = ctx.accounts.orderbook_info.to_account_info();
        let orderbook_length = &mut ctx.accounts.orderbook_info.length;

        // Transfer from the vault to the taker
        let seeds = &[
            orderbook_name.as_bytes(),
            "orderbook-info".as_bytes(),
            &[orderbook_bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let accounts = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.taker_receiving_ata.to_account_info(),
            authority: orderbook_account_info,
        };
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, accounts, signer);
        token::transfer(cpi_ctx, order_data.size)?;

        //Transfer from the taker to the offerer
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let accounts = Transfer {
            from: ctx.accounts.taker_sending_ata.to_account_info(),
            to: ctx.accounts.offerer_receiving_ata.to_account_info(),
            authority: ctx.accounts.taker.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, accounts);

        let amount = order.size * order.price;
        token::transfer(cpi_ctx, amount)?; 

        // Delete from the orderbook
        // overwrite the cancelled order with the last order on the book
        if let Some(last_order) = last_page.pop() {
            order_page.set(index, last_order);
        } else {
            // TODO: throw some error cause last page should not be empty
        }

        *orderbook_length -= 1;

        /** Delete from user account */
        if let Some(deletion_index) = offerer_user_account.find_order(order) {
            offerer_user_account.delete(deletion_index);
        }
        else {
        // ToDo: add error if we can't find the order.
        }
        Ok(())
    }

    pub fn cancel_order(ctx: Context<CancelOrder>, order: Order, page_number: u32, index: u32) -> Result<()> {
        msg!("cancelling an order!");

        let order_data: Order = ctx.accounts.order_page.get(index);
        if ctx.accounts.user.key() != order_data.user {
            return err!(ErrorCode::IncorrectUser);
        };

        let order_page = &mut ctx.accounts.order_page;
        let last_page = &mut ctx.accounts.last_page;
        let user_account = &mut ctx.accounts.user_account;

        // need to split up variables to avoid borrower check errors
        let orderbook_name = ctx.accounts.orderbook_info.name.clone();
        let orderbook_bump = ctx.accounts.orderbook_info.bump;
        let orderbook_account_info = ctx.accounts.orderbook_info.to_account_info();
        let orderbook_length = &mut ctx.accounts.orderbook_info.length;

        // Refund order
        let seeds = &[
            orderbook_name.as_bytes(),
            "orderbook-info".as_bytes(),
            &[orderbook_bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let accounts = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.user_ata.to_account_info(),
            authority: orderbook_account_info,
        };
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, accounts, signer);
        token::transfer(cpi_ctx, order.size)?;

        // Delete from the orderbook
        // overwrite the cancelled order with the last order on the book
        if let Some(last_order) = last_page.pop() {
            order_page.set(index, last_order);
        } else {
            // TODO: throw some error cause last page should not be empty
        }

        *orderbook_length -= 1;

        /** Delete from user account */
        if let Some(deletion_index) = user_account.find_order(order) {
            user_account.delete(deletion_index);
        }
        else {
        // ToDo: add error if we can't find the order.
        }

        Ok(())
    }
}

// const TOKEN_DECIMALS: u8 = 6;

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
    #[account(init, payer=admin, seeds=[name.as_ref(), "page".as_ref(), orderbook_info.next_open_page().to_le_bytes().as_ref()], space=500, bump)]
    pub first_page: Account<'info, OrderbookPage>,
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
#[instruction(order: Order)]
pub struct PlaceOrder<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut, 
        seeds=["user-account".as_ref(), user.key().as_ref()], 
        bump
    )]
    pub user_account: Box<Account<'info, UserAccount>>,
    #[account(mut)]
    pub user_ata: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub vault: Box<Account<'info, TokenAccount>>,
    #[account(mut, seeds=[orderbook_info.name.as_ref(), "orderbook-info".as_ref()], bump)]
    pub orderbook_info: Account<'info, OrderbookInfo>,
    #[account(
        init_if_needed, 
        payer=user, 
        seeds=[orderbook_info.name.as_ref(), "page".as_ref(), orderbook_info.next_open_page().to_le_bytes().as_ref()], 
        space=500, 
        bump
    )]
    pub current_page: Account<'info, OrderbookPage>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(order: Order, page_number: u32, index: u32)]
pub struct TakeOrder<'info> {
    #[account(mut)]
    pub taker: Signer<'info>,
    #[account(mut)]
    pub taker_sending_ata: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub taker_receiving_ata: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub offerer_user_account: Box<Account<'info, UserAccount>>,
    #[account(mut)]
    pub offerer_receiving_ata: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub vault: Box<Account<'info, TokenAccount>>,
    #[account(
        mut, 
        seeds=[orderbook_info.name.as_ref(), "orderbook-info".as_ref()], 
        bump
    )]
    pub orderbook_info: Account<'info, OrderbookInfo>,
    #[account(
        mut, 
        seeds=[orderbook_info.name.as_ref(), "page".as_ref(), page_number.to_le_bytes().as_ref()], 
        bump
    )]
    pub order_page: Account<'info, OrderbookPage>,
    #[account(
        mut, 
        seeds=[orderbook_info.name.as_ref(), "page".as_ref(), orderbook_info.get_last_page().to_le_bytes().as_ref()], 
        bump
    )]
    pub last_page: Account<'info, OrderbookPage>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(order: Order, page_number: u32, index: u32)]
pub struct CancelOrder<'info> {
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = ["user-account".as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_account: Box<Account<'info, UserAccount>>,
    #[account(mut)]
    pub user_ata: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub vault: Box<Account<'info, TokenAccount>>,
    #[account(
        mut, 
        seeds=[orderbook_info.name.as_ref(), "orderbook-info".as_ref()], 
        bump
    )]
    pub orderbook_info: Account<'info, OrderbookInfo>,
    #[account(
        mut, 
        seeds=[orderbook_info.name.as_ref(), "page".as_ref(), page_number.to_le_bytes().as_ref()], 
        bump
    )]
    pub order_page: Account<'info, OrderbookPage>,
    #[account(
        mut, 
        seeds=[orderbook_info.name.as_ref(), "page".as_ref(), orderbook_info.get_last_page().to_le_bytes().as_ref()], 
        bump
    )]
    pub last_page: Account<'info, OrderbookPage>,
    pub token_program: Program<'info, Token>,
}

pub struct ExecuteMatchingOrders {}

#[error_code]
pub enum ErrorCode {
    #[msg("User on the order must match the user invoking the cancel method")]
    IncorrectUser,
}
