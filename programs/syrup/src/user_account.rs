use anchor_lang::prelude::*;

use crate::data::Order;

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

    pub fn delete(&mut self, index: usize) {
        self.orders.remove(index);
    }

    pub fn find_order(&self, order: Order) -> Option<usize> {
        self.orders.iter().position(|record| {
            record.buy == order.buy && record.size == order.size && record.price == order.price
        })
    }
}