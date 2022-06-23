use anchor_lang::prelude::*;
use data::TradeLog;
use data::{Order, OrderbookInfo, OrderbookPage};
pub mod data;
use user_account::UserAccount;
pub mod user_account;
use user_account::OrderRecord;
pub mod instructions;
use instructions::transfer_tokens;

pub mod error;
use error::ErrorCode;

use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};
use solana_program::pubkey;

const PROGRAM_ID: Pubkey = pubkey!("3K1ibBw93WY4PmJ1CBfoTg4mx2yGVvr7WLCsaqAY5g1K");

declare_id!(PROGRAM_ID);

pub fn delete_order(
    index: u32,
    optional_last_page: Option<&mut Account<OrderbookPage>>,
    order_page: &mut Account<OrderbookPage>,
    user_account: &mut Account<UserAccount>,
    orderbook_length: &mut u32,
) -> std::result::Result<(), anchor_lang::error::Error> {
    let order_data = order_page.get(index);
    let orderbook_id = order_page.orderbook_id;

    // check if last_page differs from order page
    if let Some(last_page) = optional_last_page {
        if let Some(last_order) = last_page.pop() {
            order_page.set(index, last_order);
        } else {
            return err!(ErrorCode::LastPageEmpty);
        }
    } else {
        msg!("just deleting order from the last page!");
        // if the order_page is the last page and the order is the final entry we just pop
        if index + 1 == (order_page.len() as u32) {
            order_page.pop();
        } else if let Some(last_order) = order_page.pop() {
            order_page.set(index, last_order)
        } else {
            return err!(ErrorCode::LastPageEmpty);
        }
    }

    *orderbook_length -= 1;

    // Delete from user account
    if let Some(deletion_index) = user_account.find_order(order_data, orderbook_id) {
        user_account.delete(deletion_index);
    } else {
        return err!(ErrorCode::UserMissingOrder);
    };

    Ok(())
}

pub fn edit_order(
    index: u32,
    new_num_apples: u64,
    new_num_oranges: u64,
    order_page: &mut Account<OrderbookPage>,
    user_account: &mut Account<UserAccount>,
) -> std::result::Result<(), anchor_lang::error::Error> {
    let mut order_data = order_page.get(index);
    let orderbook_id = order_page.orderbook_id;

    // Modify the order in the user's orders
    if let Some(user_orders_index) = user_account.find_order(order_data, orderbook_id) {
        user_account.set(user_orders_index, new_num_apples, new_num_oranges);
    } else {
        return err!(ErrorCode::UserMissingOrder);
    };

    order_data.num_apples = new_num_apples;
    order_data.num_oranges = new_num_oranges;
    order_page.set(index, order_data);

    Ok(())
}

#[program]
pub mod syrup {

    use crate::data::TradeRecord;

    use super::*;

    #[allow(unused_variables)]
    pub fn initialize_orderbook(ctx: Context<InitializeOrderbook>, id: Pubkey) -> Result<()> {
        ctx.accounts.orderbook_info.admin = ctx.accounts.admin.key();
        ctx.accounts.orderbook_info.length = 0;
        ctx.accounts.orderbook_info.apples_mint = ctx.accounts.apples_mint.key();
        ctx.accounts.orderbook_info.oranges_mint = ctx.accounts.oranges_mint.key();
        ctx.accounts.orderbook_info.bump = *ctx.bumps.get("orderbook_info").unwrap();
        ctx.accounts.orderbook_info.id = id;

        ctx.accounts.first_page.set_orderbook_id(id);

        let clock = Clock::get()?;
        ctx.accounts.trade_log.open_time = clock.unix_timestamp;

        Ok(())
    }

    pub fn create_user_account(ctx: Context<CreateUserAccount>) -> Result<()> {
        ctx.accounts
            .user_account
            .initialize(ctx.accounts.user.key());

        Ok(())
    }

    pub fn place_order(ctx: Context<PlaceOrder>, order: Order) -> Result<()> {
        if ctx.accounts.orderbook_info.is_closed() {
            return err!(ErrorCode::OrderbookClosed);
        } else if order.user != ctx.accounts.user.key() {
            return err!(ErrorCode::IncorrectUser);
        };

        // set the id of the new page if you initialized it
        if ctx.accounts.current_page.is_orderbook_id_blank() {
            ctx.accounts
                .current_page
                .set_orderbook_id(ctx.accounts.orderbook_info.id);
        }

        let amount_transferred = if order.offering_apples {
            order.num_apples
        } else {
            order.num_oranges
        };

        transfer_tokens(
            amount_transferred,
            ctx.accounts.user_ata.to_account_info(),
            ctx.accounts.vault.to_account_info(),
            ctx.accounts.user.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            None,
        )?;

        // create and append order record
        let order_record = OrderRecord {
            market: ctx.accounts.orderbook_info.id,
            offering_apples: order.offering_apples,
            num_apples: order.num_apples,
            num_oranges: order.num_oranges,
            memo: order.memo,
        };

        // add to the lists of offers
        ctx.accounts.current_page.push(order)?;

        ctx.accounts.orderbook_info.length += 1;

        ctx.accounts.user_account.push(order_record)?;

        Ok(())
    }

    #[allow(unused_variables)]
    pub fn take_order(
        ctx: Context<TakeOrder>,
        order: Order,
        amount_to_exchange: u64,
        page_number: u32,
        index: u32,
    ) -> Result<()> {
        if ctx.accounts.orderbook_info.is_closed() {
            return err!(ErrorCode::OrderbookClosed);
        }

        let order_data: Order = ctx.accounts.order_page.get(index);

        // set new num_apples and new_num_oranges and determine vault outgoing
        let vault_outgoing_amount: u64;
        let new_num_apples: u64;
        let new_num_oranges: u64;
        let vault_mint: Pubkey;

        let maximum_taker_payment = if order.offering_apples {
            order_data.num_oranges
        } else {
            order_data.num_apples
        };

        if order_data.offering_apples {
            vault_outgoing_amount = ((amount_to_exchange as u128) * (order.num_apples as u128)
                / (maximum_taker_payment as u128)) as u64;
            new_num_apples = order.num_apples - vault_outgoing_amount;
            new_num_oranges = order.num_oranges - amount_to_exchange;
            vault_mint = ctx.accounts.orderbook_info.apples_mint;
        } else {
            vault_outgoing_amount =
                (amount_to_exchange * order.num_oranges) / maximum_taker_payment;
            new_num_apples = order.num_apples - amount_to_exchange;
            new_num_oranges = order.num_oranges - vault_outgoing_amount;
            vault_mint = ctx.accounts.orderbook_info.oranges_mint;
        }

        // checks
        if order_data != order {
            return err!(ErrorCode::IncorrectUser);
        } else if ctx.accounts.offerer_user_account.user != order_data.user {
            return err!(ErrorCode::IncorrectUser);
        } else if amount_to_exchange > maximum_taker_payment {
            return err!(ErrorCode::SizeTooLarge);
        } else if vault_mint != ctx.accounts.vault.mint {
            return err!(ErrorCode::WrongVault);
        } else if amount_to_exchange < 1 {
            return err!(ErrorCode::OrderTooSmall);
        }

        let order_page = &mut ctx.accounts.order_page;
        let offerer_user_account = &mut ctx.accounts.offerer_user_account;

        // need to split up variables to avoid borrower check errors
        let orderbook_id = ctx.accounts.orderbook_info.id;
        let orderbook_id_bytes = orderbook_id.to_bytes();
        let orderbook_bump = ctx.accounts.orderbook_info.bump;
        let orderbook_account_info = ctx.accounts.orderbook_info.to_account_info();
        let last_page_number = ctx.accounts.orderbook_info.get_last_page();
        let last_page_bytes = last_page_number.to_le_bytes();
        let orderbook_length = &mut ctx.accounts.orderbook_info.length;

        // Transfer from the vault to the taker
        let seeds = &[
            &orderbook_id.to_bytes(),
            "orderbook-info".as_bytes(),
            &[orderbook_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        transfer_tokens(
            vault_outgoing_amount,
            ctx.accounts.vault.to_account_info(),
            ctx.accounts.taker_receiving_ata.to_account_info(),
            orderbook_account_info,
            ctx.accounts.token_program.to_account_info(),
            Some(signer_seeds),
        )?;

        transfer_tokens(
            amount_to_exchange,
            ctx.accounts.taker_sending_ata.to_account_info(),
            ctx.accounts.offerer_receiving_ata.to_account_info(),
            ctx.accounts.taker.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            None,
        )?;

        if amount_to_exchange == maximum_taker_payment {
            if page_number == last_page_number {
                delete_order(
                    index,
                    None,
                    order_page,
                    offerer_user_account,
                    orderbook_length,
                )?;
            } else if let Some(acc) = ctx.remaining_accounts.get(0) {
                let last_page = &mut Account::<OrderbookPage>::try_from(acc)?;

                let pda_seeds = [
                    orderbook_id_bytes.as_ref(),
                    b"page".as_ref(),
                    last_page_bytes.as_ref(),
                ];
                let (pda, _) = Pubkey::find_program_address(&pda_seeds[..], ctx.program_id);

                if pda == *acc.key {
                    delete_order(
                        index,
                        Some(last_page),
                        order_page,
                        offerer_user_account,
                        orderbook_length,
                    )?;

                    last_page.exit(&PROGRAM_ID)?;
                } else {
                    return err!(ErrorCode::WrongRemainingAccount);
                }
            } else {
                return err!(ErrorCode::MissingLastPage);
            }
        } else {
            edit_order(
                index,
                new_num_apples,
                new_num_oranges,
                order_page,
                offerer_user_account,
            )?;
        }

        let clock = Clock::get()?;

        // add to trade record
        let trade_record: TradeRecord = if order.offering_apples {
            TradeRecord {
                buy_order_for_apples: true,
                num_apples: amount_to_exchange,
                num_oranges: vault_outgoing_amount,
                time: clock.unix_timestamp,
            }
        } else {
            TradeRecord {
                buy_order_for_apples: false,
                num_apples: vault_outgoing_amount,
                num_oranges: amount_to_exchange,
                time: clock.unix_timestamp,
            }
        };
        ctx.accounts
            .orderbook_info
            .update_most_recent_trade(trade_record);
        ctx.accounts.trade_log.push(trade_record);

        Ok(())
    }

    #[allow(unused_variables)]
    pub fn cancel_order(
        ctx: Context<CancelOrder>,
        order: Order,
        page_number: u32,
        index: u32,
    ) -> Result<()> {
        let order_data: Order = ctx.accounts.order_page.get(index);
        if order_data != order {
            return err!(ErrorCode::WrongOrder);
        }
        // if orderbook is closed you can cancel other people's orders
        else if !ctx.accounts.orderbook_info.is_closed()
            && ctx.accounts.user.key() != order_data.user
        {
            return err!(ErrorCode::IncorrectUser);
        };

        let order_page = &mut ctx.accounts.order_page;
        let user_account = &mut ctx.accounts.user_account;

        // need to split up variables to avoid borrower check errors
        let orderbook_id = ctx.accounts.orderbook_info.id;
        let orderbook_id_bytes = orderbook_id.to_bytes();
        let orderbook_bump = ctx.accounts.orderbook_info.bump;
        let orderbook_account_info = ctx.accounts.orderbook_info.to_account_info();
        let last_page_number = ctx.accounts.orderbook_info.get_last_page();
        let last_page_bytes = last_page_number.to_le_bytes();
        let orderbook_length = &mut ctx.accounts.orderbook_info.length;

        // Refund order
        let seeds = &[
            &orderbook_id.to_bytes(),
            "orderbook-info".as_bytes(),
            &[orderbook_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let amount = if order_data.offering_apples {
            order.num_apples
        } else {
            order.num_oranges
        };

        transfer_tokens(
            amount,
            ctx.accounts.vault.to_account_info(),
            ctx.accounts.user_ata.to_account_info(),
            orderbook_account_info,
            ctx.accounts.token_program.to_account_info(),
            Some(signer_seeds),
        )?;

        // if we aren't on the last page we need to load it from remaining accounts
        if page_number == last_page_number {
            delete_order(index, None, order_page, user_account, orderbook_length)?;
        } else if let Some(acc) = ctx.remaining_accounts.get(0) {
            let last_page = &mut Account::<OrderbookPage>::try_from(acc)?;

            let pda_seeds = [
                orderbook_id_bytes.as_ref(),
                b"page".as_ref(),
                last_page_bytes.as_ref(),
            ];
            let (pda, _) = Pubkey::find_program_address(&pda_seeds[..], ctx.program_id);

            if pda == *acc.key {
                msg!("about to delete an order not on the last page!");
                delete_order(
                    index,
                    Some(last_page),
                    order_page,
                    user_account,
                    orderbook_length,
                )?;

                // acc.exit(&PROGRAM_ID)?;
                last_page.exit(&PROGRAM_ID)?;
            } else {
                return err!(ErrorCode::WrongRemainingAccount);
            }
        } else {
            return err!(ErrorCode::MissingLastPage);
        }

        Ok(())
    }

    pub fn close_orderbook(ctx: Context<CloseOrderbook>) -> Result<()> {
        if ctx.accounts.orderbook_info.is_closed() {
            return err!(ErrorCode::OrderbookClosed);
        }

        ctx.accounts.orderbook_info.close_orderbook();

        let clock = Clock::get()?;
        ctx.accounts.trade_log.close_time = clock.unix_timestamp;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateUserAccount<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        payer = user,
        seeds = ["user-account".as_ref(), user.key().as_ref()],
        space = 8 + UserAccount::LEN,
        bump
    )]
    pub user_account: Box<Account<'info, UserAccount>>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(id: Pubkey)]
pub struct InitializeOrderbook<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        payer = admin,
        seeds = [id.to_bytes().as_ref(), "orderbook-info".as_ref()],
        space = 8 + OrderbookInfo::LEN,
        bump
    )]
    pub orderbook_info: Account<'info, OrderbookInfo>,
    #[account(
        init,
        payer=admin,
        seeds=[id.to_bytes().as_ref(), "page".as_ref(), orderbook_info.next_open_page().to_le_bytes().as_ref()],
        space = 8 + OrderbookPage::LEN,
        bump
    )]
    pub first_page: Account<'info, OrderbookPage>,
    pub apples_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = admin,
        associated_token::mint = apples_mint,
        associated_token::authority = orderbook_info
    )]
    pub apples_vault: Box<Account<'info, TokenAccount>>,
    pub oranges_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = admin,
        associated_token::mint = oranges_mint,
        associated_token::authority = orderbook_info
    )]
    pub oranges_vault: Box<Account<'info, TokenAccount>>,
    #[account(
        init,
        payer = admin,
        seeds = [id.to_bytes().as_ref(), "trades".as_ref()],
        space = 8 + TradeLog::LEN,
        bump
    )]
    pub trade_log: Account<'info, TradeLog>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(order: Order)]
pub struct PlaceOrder<'info> {
    #[account(
        mut,
        address = order.user
    )]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds=["user-account".as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_account: Box<Account<'info, UserAccount>>,
    #[account(
        mut,
        associated_token::authority = user,
        associated_token::mint = if order.offering_apples { orderbook_info.apples_mint } else { orderbook_info.oranges_mint }
    )]
    pub user_ata: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        associated_token::authority = orderbook_info,
        associated_token::mint = if order.offering_apples { orderbook_info.apples_mint } else { orderbook_info.oranges_mint }
    )]
    pub vault: Box<Account<'info, TokenAccount>>,
    #[account(mut, seeds=[orderbook_info.id.to_bytes().as_ref(), "orderbook-info".as_ref()], bump)]
    pub orderbook_info: Account<'info, OrderbookInfo>,
    #[account(
        init_if_needed,
        payer=user,
        seeds=[orderbook_info.id.to_bytes().as_ref(), "page".as_ref(), orderbook_info.next_open_page().to_le_bytes().as_ref()],
        space = 8 + OrderbookPage::LEN,
        bump
    )]
    pub current_page: Box<Account<'info, OrderbookPage>>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(order: Order, amount_to_exchange: u64, page_number: u32, index: u32)]
pub struct TakeOrder<'info> {
    #[account(mut)]
    pub taker: Signer<'info>,
    #[account(
        init_if_needed,
        payer=taker,
        seeds=[taker.key().as_ref(), "trade-log".as_ref()],
        space = 8 +TradeLog::LEN,
        bump
    )]
    pub taker_trade_log: Box<Account<'info, TradeLog>>,
    #[account(
        mut,
        associated_token::authority = taker,
        associated_token::mint = if order.offering_apples { orderbook_info.oranges_mint } else { orderbook_info.apples_mint }
    )]
    pub taker_sending_ata: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        associated_token::authority = taker,
        associated_token::mint = if order.offering_apples { orderbook_info.apples_mint } else { orderbook_info.oranges_mint }
    )]
    pub taker_receiving_ata: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        seeds = ["user-account".as_ref(), order.user.key().as_ref()],
        bump
    )]
    pub offerer_user_account: Box<Account<'info, UserAccount>>,
    #[account(
        init_if_needed,
        payer=taker,
        seeds=[order.user.key().as_ref(), "trade-log".as_ref()],
        space = 8 +TradeLog::LEN,
        bump
    )]
    pub offerer_trade_log: Box<Account<'info, TradeLog>>,
    #[account(
        mut,
        associated_token::authority = order.user,
        associated_token::mint = if order.offering_apples { orderbook_info.oranges_mint } else { orderbook_info.apples_mint }
    )]
    pub offerer_receiving_ata: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        associated_token::authority = orderbook_info,
        associated_token::mint = if order.offering_apples { orderbook_info.apples_mint } else { orderbook_info.oranges_mint }
    )]
    pub vault: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        seeds=[orderbook_info.id.to_bytes().as_ref(), "orderbook-info".as_ref()],
        bump
    )]
    pub orderbook_info: Account<'info, OrderbookInfo>,
    #[account(
        mut,
        seeds=[orderbook_info.id.to_bytes().as_ref(), "page".as_ref(), page_number.to_le_bytes().as_ref()],
        bump
    )]
    pub order_page: Account<'info, OrderbookPage>,
    #[account(
        mut,
        seeds=[orderbook_info.id.to_bytes().as_ref(), "trades".as_ref()],
        bump
    )]
    pub trade_log: Account<'info, TradeLog>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(order: Order, page_number: u32, index: u32)]
pub struct CancelOrder<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = ["user-account".as_ref(), order.user.as_ref()],
        bump
    )]
    pub user_account: Box<Account<'info, UserAccount>>,
    #[account(
        mut,
        associated_token::authority = order.user,
        associated_token::mint = if order.offering_apples { orderbook_info.apples_mint } else { orderbook_info.oranges_mint }
    )]
    pub user_ata: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        associated_token::authority = orderbook_info,
        associated_token::mint = if order.offering_apples { orderbook_info.apples_mint } else { orderbook_info.oranges_mint }
    )]
    pub vault: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        seeds=[orderbook_info.id.to_bytes().as_ref(), "orderbook-info".as_ref()],
        bump
    )]
    pub orderbook_info: Account<'info, OrderbookInfo>,
    #[account(
        mut,
        seeds=[orderbook_info.id.to_bytes().as_ref(), "page".as_ref(), page_number.to_le_bytes().as_ref()],
        bump
    )]
    pub order_page: Account<'info, OrderbookPage>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CloseOrderbook<'info> {
    #[account(
        mut,
        address = orderbook_info.admin
    )]
    pub admin: Signer<'info>,
    #[account(
        mut,
        seeds = [orderbook_info.id.to_bytes().as_ref(), "orderbook-info".as_ref()],
        bump
    )]
    pub orderbook_info: Account<'info, OrderbookInfo>,
    #[account(
        mut,
        seeds=[orderbook_info.id.to_bytes().as_ref(), "trades".as_ref()],
        bump
    )]
    pub trade_log: Account<'info, TradeLog>,
}
