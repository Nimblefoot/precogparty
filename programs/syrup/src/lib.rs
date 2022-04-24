use anchor_lang::prelude::*;
use data::{ListChunk, ListEntry, ListInfo};
pub mod data;

declare_id!("7v8HDDmpuZ3oLMHEN2PmKrMAGTLLUnfRdZtFt5R2F3gK");

#[program]
pub mod syrup {
    use super::*;

    #[allow(unused_variables)]
    // name variable is used as a seed in #[account...] instruction
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
    // name variable is used as a seed in #[account...] instruction
    pub fn append(ctx: Context<Append>, name: String, item: ListEntry) -> Result<()> {
        ctx.accounts.list.try_push(item);

        if ctx.accounts.list.is_full() {
            msg!("Full");
            ctx.accounts.list_info.last_page += 1;
        }

        ctx.accounts.list_info.length += 1;
        Ok(())
    }

    #[allow(unused_variables)] // #[instructions]
    pub fn pop(ctx: Context<Pop>, name: String) -> Result<Option<ListEntry>> {
        msg!(
            "popping off list #{}",
            ctx.accounts.list.to_account_info().key()
        );

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

    #[allow(unused_variables)] // #[instructions]
    pub fn delete(
        ctx: Context<Delete>,
        name: String,
        chunk_number: u32,
        deletion_index: u32,
        final_index: u32,
    ) -> Result<()> {
        let list: &mut Account<'_, ListChunk> = &mut ctx.accounts.list;
        let last_page: &mut Account<'_, ListChunk> = &mut ctx.accounts.last_page;
        let list_info: &mut Account<'_, ListInfo> = &mut ctx.accounts.list_info;

        if let Some(key) = last_page.pop() {
            list.set(deletion_index, key);
        }

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
#[instruction(name: String, chunk_number: u32)]
pub struct Delete<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, seeds=["list".as_ref(), name.as_ref(), "info".as_ref()], bump)]
    pub list_info: Account<'info, ListInfo>,
    #[account(mut, seeds=["list".as_ref(), name.as_ref(), chunk_number.to_le_bytes().as_ref()], bump)]
    pub list: Account<'info, ListChunk>,
    #[account(mut, seeds=["list".as_ref(), name.as_ref(), list_info.last_page.to_le_bytes().as_ref()], bump)]
    pub last_page: Account<'info, ListChunk>,
}
