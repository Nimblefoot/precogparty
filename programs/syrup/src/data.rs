// use std::mem::size_of;

use anchor_lang::prelude::*;

const max_size: usize = 3; // max size is fixed.

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
    pub last_page: u32,
}

impl OrderbookInfo {
    pub fn get_last_page(&self) -> u32 {
        if self.length == 0u32 {
            0
        } else {
            (self.length - 1) / (max_size as u32)
        }
    }

    pub fn next_open_page(&self) -> u32 {
        (self.length) / (max_size as u32)
    }
}

#[account]
pub struct ListChunk {
    list: Vec<Order>,
}

impl Default for ListChunk {
    fn default() -> Self {
        Self {
            list: Vec::with_capacity(Self::max_size()),
        }
    }
}

pub struct ListFull;
pub struct ListEmpty;

impl ListChunk {
    pub fn max_size() -> usize {
        max_size
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

    pub fn try_push(&mut self, value: Order) {
        // if self.is_full() {
        //     return Err(ListFull);
        // }

        self.list.push(value);
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
