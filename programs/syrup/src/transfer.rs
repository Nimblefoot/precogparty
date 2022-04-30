pub mod accept;
pub mod foreclose;
pub mod register;
pub mod repay;
pub mod stake;
pub mod take;
pub mod unstake;

use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Transfer};

fn transfer_tokens<'a>(
    amount: u64,
    from: AccountInfo<'a>,
    to: AccountInfo<'a>,
    authority: AccountInfo<'a>,
    token_program: AccountInfo<'a>,
    maybe_seeds: Option<&[&[&[u8]]; 1]>,
) -> Result<()> {
    let cpi_accounts = Transfer {
        from,
        to,
        authority,
    };

    let cpi_ctx = match maybe_seeds {
        Some(seeds) => CpiContext::new_with_signer(token_program, cpi_accounts, seeds),
        None => CpiContext::new(token_program, cpi_accounts),
    };
    transfer(cpi_ctx, amount)
}

fn transfer_tokens_from_escrow<'a>(
    amount: u64,
    collection: String,
    offerer: Pubkey,
    nonce: u32,
    bump: u8,
    from: AccountInfo<'a>,
    to: AccountInfo<'a>,
    authority: AccountInfo<'a>,
    token_program: AccountInfo<'a>,
) -> Result<()> {
    let seeds = [
        b"offer".as_ref(),
        collection.as_ref(),
        offerer.as_ref(),
        &nonce.to_le_bytes(),
        &[bump],
    ];
    let signer_seeds = &[&seeds[..]];
    transfer_tokens(
        amount,
        from,
        to,
        authority,
        token_program,
        Some(signer_seeds),
    )
}
