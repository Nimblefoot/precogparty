use anchor_lang::prelude::*;

#[derive(Default, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct OrderRecord {
    market: Pubkey,
    size: u32,
    buy: bool, // false for a sell order
    chunk_number: u32,
    index: u32,
}

#[account]
pub struct UserAccount {
    orders: Vec<OrderRecord>,
    user: Pubkey,
}

impl UserAccount {
    pub fn initialize(&mut self, user: Pubkey) {
        self.user = user;
        self.orders = Vec::with_capacity(Self::max_size());
    }

    pub fn max_size() -> usize {
        // (10240 - 8 - 4) / size_of::<Pubkey>() - hardcoded for now
        200
    }
}
