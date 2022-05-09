use anchor_lang::prelude::*;
use data::{OrderbookPage, Order, OrderbookInfo};
pub mod data;
use user_account::UserAccount;
pub mod user_account;
use user_account::OrderRecord;
pub mod instructions;
use instructions::transfer_tokens;

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
-- Execute MAtching Orders
*/

pub fn delete_order(index: u32, last_page: &mut Account<OrderbookPage>, order_page: &mut Account<OrderbookPage>, user_account: &mut Account<UserAccount>, orderbook_length: &mut u32) ->  std::result::Result<(), anchor_lang::error::Error> {
    let order_data = order_page.get(index).clone();

    if let Some(last_order) = last_page.pop() {
        order_page.set(index, last_order);
    } else {
        return err!(ErrorCode::LastPageEmpty);
    };

    *orderbook_length -= 1;

    /** Delete from user account */
    if let Some(deletion_index) = user_account.find_order(order_data) {
        user_account.delete(deletion_index);
    } else {
        return err!(ErrorCode::UserMissingOrder);
    };

    Ok(())
}

pub fn modify_order(index: u32, new_price: u64, new_size: u64, order_page:  &mut Account<OrderbookPage>, user_account: &mut Account<UserAccount>) {
    let mut order_data = order_page.get(index).clone();

    /** Modify the order in the user's orders */
    if let Some(user_orders_index) = user_account.find_order(order_data) {
        user_account.set(user_orders_index, new_price, new_size);
    } else {
    // ToDo: add error if we can't find the order.
    };

    order_data.price = new_price;
    order_data.size = new_size;
    order_page.set(index, order_data);

}

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
        // ToDo - Add check for if the user has space in their order vector. 

        let token_amount = if order.buy {
            order.size * order.price
        } else {
            order.size
        };
        transfer_tokens(
            token_amount, 
            ctx.accounts.user_ata.to_account_info(),
            ctx.accounts.vault.to_account_info(),
            ctx.accounts.user.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            None
        )?;

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

    pub fn take_order(ctx: Context<TakeOrder>, size: u64, page_number: u32, index: u32) -> Result<()> {
        msg!("taking an order!");

        let order_data: Order = ctx.accounts.order_page.get(index);
        if ctx.accounts.offerer_user_account.user != order_data.user {
            return err!(ErrorCode::IncorrectUser);
        };
        if size > order_data.size {
            return err!(ErrorCode::SizeTooLarge);
        };

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
        let signer_seeds = &[&seeds[..]];

        let vault_outgoing_amount = if order_data.buy { 
            size * order_data.price 
        } else { 
            size
        };

        transfer_tokens(
            vault_outgoing_amount,
            ctx.accounts.vault.to_account_info(),
            ctx.accounts.taker_receiving_ata.to_account_info(),
            orderbook_account_info,
            ctx.accounts.token_program.to_account_info(),
            Some(signer_seeds)
        )?;

        //Transfer from the taker to the offerer
        let transfer_amount = if order_data.buy { 
            size 
        } else { 
            size * order_data.price 
        };
        transfer_tokens(
            transfer_amount,
            ctx.accounts.taker_sending_ata.to_account_info(),
            ctx.accounts.offerer_receiving_ata.to_account_info(),
            ctx.accounts.taker.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            None
        )?;

        if size == order_data.size {
            delete_order(index, last_page, order_page, offerer_user_account, orderbook_length)?;
        } else {
            modify_order(index, order_data.price, order_data.size - size, order_page, offerer_user_account);
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
        let signer_seeds = &[&seeds[..]];

        let amount = if order_data.buy { 
            order_data.size * order_data.price 
        } else { 
            order_data.size
        };

        transfer_tokens(
            amount,
            ctx.accounts.vault.to_account_info(),
            ctx.accounts.user_ata.to_account_info(),
            orderbook_account_info,
            ctx.accounts.token_program.to_account_info(),
            Some(signer_seeds)
        )?;

        delete_order(index, last_page, order_page, user_account, orderbook_length);

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
#[instruction(price: u64, page_number: u32, index: u32)]
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
    #[msg("Size too large")]
    SizeTooLarge,
    #[msg("User does not have a matching order")]
    UserMissingOrder,
    #[msg("Orderbook does not have a matching order")]
    OrderbookMissingOrder,
    #[msg("Last Page of orders should not be empty")]
    LastPageEmpty
}
