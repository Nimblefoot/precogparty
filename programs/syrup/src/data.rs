// use std::mem::size_of;

use crate::error::ErrorCode;
use anchor_lang::prelude::*;

#[cfg(feature = "orderbook-page-small-size")]
const MAX_SIZE: usize = 3;

#[cfg(not(feature = "orderbook-page-small-size"))]
const MAX_SIZE: usize = 100;

#[derive(Default, Copy, Clone, AnchorSerialize, AnchorDeserialize, PartialEq)]
pub struct Order {
    pub num_apples: u64,       // 8
    pub offering_apples: bool, // 1
    pub user: Pubkey,          // 32
    pub num_oranges: u64,      // 8 - 49 total
}

#[account]
#[derive(Default)]
pub struct OrderbookInfo {
    pub admin: Pubkey,        // 32
    pub length: u32,          // 4
    pub apples_mint: Pubkey,  // 32
    pub oranges_mint: Pubkey, // 32
    pub bump: u8,             // 1
    pub id: Pubkey,           // 32
}

impl OrderbookInfo {
    pub const LEN: usize = (32 * 4) + 4 + 1;

    pub fn get_last_page(&self) -> u32 {
        if self.length == 0u32 {
            0
        } else {
            (self.length - 1) / (MAX_SIZE as u32)
        }
    }

    pub fn next_open_page(&self) -> u32 {
        (self.length) / (MAX_SIZE as u32)
    }
}

#[account]
pub struct OrderbookPage {
    pub list: Vec<Order>,
    pub orderbook_id: Pubkey,
    pub id_set: bool,
}

impl Default for OrderbookPage {
    fn default() -> Self {
        Self {
            orderbook_id: Pubkey::new_unique(),
            id_set: false,
            list: Vec::with_capacity(MAX_SIZE),
        }
    }
}

impl OrderbookPage {
    pub const LEN: usize = 49 * MAX_SIZE + 64; // TODO: this is bigger than I feel like it needs to be

    pub fn max_size() -> usize {
        MAX_SIZE
    }

    pub fn len(&self) -> usize {
        self.list.len()
    }

    pub fn is_full(&self) -> bool {
        self.list.len() == Self::max_size()
    }

    pub fn is_empty(&self) -> bool {
        self.list.len() == 0
    }

    pub fn push(&mut self, value: Order) -> std::result::Result<(), anchor_lang::error::Error> {
        if self.is_full() {
            return err!(ErrorCode::PageFull);
        }

        self.list.push(value);

        Ok(())
    }

    pub fn set(&mut self, index: u32, data: Order) {
        let idx = index as usize;
        self.list[idx] = data;
    }

    pub fn get(&mut self, index: u32) -> Order {
        let idx = index as usize;
        self.list[idx]
    }

    pub fn pop(&mut self) -> Option<Order> {
        if self.is_empty() {
            return None;
        }
        let result = self.list.pop().unwrap();

        Some(result)
    }

    pub fn set_orderbook_id(&mut self, id: Pubkey) {
        // TODO: add error in case id is already set
        self.orderbook_id = id;
        self.id_set = true
    }

    pub fn is_orderbook_id_blank(&self) -> bool {
        !self.id_set
    }
}
