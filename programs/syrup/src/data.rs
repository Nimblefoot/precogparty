// use std::mem::size_of;

use anchor_lang::prelude::*;

#[derive(Default, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ListEntry {
    pub size: u64,
    pub buy: bool, // false for a sell order
    pub user: Pubkey,
    pub price: u64,
}

#[account]
#[derive(Default)]
pub struct ListInfo {
    pub owner: Pubkey,
    pub last_page: u32,
    pub length: u32,
}

#[account]
#[derive(Default)]
pub struct OrderbookInfo {
    pub admin: Pubkey,
    pub last_page: u32,
    pub length: u32,
    pub currency_mint: Pubkey,
    pub token_mint: Pubkey,
}

#[account]
pub struct ListChunk {
    list: Vec<ListEntry>,
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
        // (10240 - 8 - 4) / size_of::<Pubkey>()
        3
    }

    pub fn is_full(&self) -> bool {
        self.list.len() == Self::max_size()
    }

    pub fn is_empty(&self) -> bool {
        self.list.len() == 0
    }

    pub fn try_push(&mut self, value: ListEntry) {
        // if self.is_full() {
        //     return Err(ListFull);
        // }

        self.list.push(value);
    }

    pub fn set(&mut self, index: u32, data: ListEntry) {
        let idx = index as usize;
        self.list[idx] = data;
    }

    pub fn get(&mut self, index: u32) -> ListEntry {
        let idx = index as usize;
        self.list[idx]
    }

    pub fn pop(&mut self) -> Option<ListEntry> {
        if self.is_empty() {
            return None;
        }
        let result = self.list.pop().unwrap();

        Some(result)
    }
}
