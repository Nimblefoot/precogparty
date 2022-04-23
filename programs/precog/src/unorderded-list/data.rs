use std::mem::size_of;

use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct ListInfo {
    pub owner: Pubkey,
    pub last_page: u32,
    pub length: u32,
}

pub struct ListChunk {
    list: Vec<u16>,
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

    pub fn try_push(&mut self, value: u16) -> std::result::Result<(), ListFull> {
        if self.is_full() {
            return Err(ListFull);
        }

        self.list.push(value);

        Ok(())
    }

    pub fn set(&mut self, index: u32, data: u16) {
        let idx = index as usize;
        self.list[idx] = data;
    }

    pub fn get(&mut self, index: u32) -> u16 {
        let idx = index as usize;
        self.list[idx]
    }

    pub fn pop(&mut self) -> std::result::Result<u16, ListEmpty> {
        if self.is_empty() {
            return Err(ListEmpty);
        }
        let result = self.list.pop().unwrap();

        Ok(result)
    }
}
