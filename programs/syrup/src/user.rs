use anchor_lang::prelude::*;

#[derive(Default, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct UserOrder {
    market: Pubkey,
    size: u32,
    buy: bool, // false for a sell order
    chunk_number: u32,
    index: u32,
}

#[account]
pub struct User {
    orders: Vec<OrderRecord>,
    user: Pubkey,
}

impl Default for User {
    fn default() -> Self {
        Self {
            list: Vec::with_capacity(Self::max_size()),
        }
    }
}

impl User {
    pub fn max_size() -> usize {
        // (10240 - 8 - 4) / size_of::<Pubkey>() - hardcoded for now
        200
    }
}
