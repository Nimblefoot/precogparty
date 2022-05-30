use anchor_lang::prelude::*;

use crate::data::Order;
use crate::error::ErrorCode;

#[derive(Default, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct OrderRecord {
    pub market: Pubkey,        // 32
    pub num_apples: u64,       // 8
    pub offering_apples: bool, // 1
    pub num_oranges: u64,      // 8
    pub memo: u8,              // 1
}

#[account]
pub struct UserAccount {
    pub orders: Vec<OrderRecord>, // 49 * 200
    pub user: Pubkey,             // 32
}

impl UserAccount {
    pub const LEN: usize = 32 + (59 * 140) + 32;

    pub fn initialize(&mut self, user: Pubkey) {
        self.user = user;
        self.orders = Vec::with_capacity(Self::max_size());
    }

    pub fn max_size() -> usize {
        // (10240 - 8 - 4) / size_of::<Pubkey>() - hardcoded for now
        140
    }

    pub fn delete(&mut self, index: usize) {
        self.orders.remove(index);
    }

    pub fn find_order(&self, order: Order, orderbook_id: Pubkey) -> Option<usize> {
        self.orders.iter().position(|record| {
            record.offering_apples == order.offering_apples
                && record.num_apples == order.num_apples
                && record.num_oranges == order.num_oranges
                && record.memo == order.memo
                && record.market == orderbook_id
        })
    }

    pub fn set(&mut self, index: usize, num_apples: u64, num_oranges: u64) {
        self.orders[index].num_apples = num_apples;
        self.orders[index].num_oranges = num_oranges;
    }

    pub fn push(
        &mut self,
        order: OrderRecord,
    ) -> std::result::Result<(), anchor_lang::error::Error> {
        if self.orders.len() == Self::max_size() {
            return err!(ErrorCode::MaxOrdersPlaced);
        } else {
            self.orders.push(order)
        }

        Ok(())
    }
}
