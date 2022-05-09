// use std::mem::size_of;

use crate::error::ErrorCode;
use anchor_lang::prelude::*;

#[cfg(feature = "orderbook-page-small-size")]
const MAX_SIZE: usize = 3;

#[cfg(not(feature = "orderbook-page-small-size"))]
const MAX_SIZE: usize = 200;

#[derive(Default, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct Order {
    pub size: u64,
    pub buy: bool, // false for a sell order
    pub user: Pubkey,
    pub price: u64,
}

#[account]
#[derive(Default)]
pub struct OrderbookInfo {
    pub admin: Pubkey,
    pub length: u32,
    pub currency_mint: Pubkey,
    pub token_mint: Pubkey,
    pub bump: u8,
    pub name: String,
}

impl OrderbookInfo {
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
    list: Vec<Order>,
}

impl Default for OrderbookPage {
    fn default() -> Self {
        Self {
            list: Vec::with_capacity(Self::max_size()),
        }
    }
}

impl OrderbookPage {
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
}
