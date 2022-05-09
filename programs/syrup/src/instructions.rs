use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Transfer};

pub fn transfer_tokens<'a>(
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
