use anchor_lang::prelude::*;

#[derive(Default, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct OrderRecord {
    pub market: [u8; 16],
    pub size: u64,
    pub buy: bool, // false for a sell order
    pub price: u64,
}

#[account]
pub struct UserAccount {
    pub orders: Vec<OrderRecord>,
    pub user: Pubkey,
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
