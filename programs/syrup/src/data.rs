use crate::error::ErrorCode;
use anchor_lang::prelude::*;

#[cfg(not(feature = "orderbook-page-small-size"))]
const MAX_ORDERPAGE_SIZE: usize = 100;

#[zero_copy]
#[derive(Default, AnchorSerialize, AnchorDeserialize, PartialEq)]
pub struct Order {
    pub num_apples: u64,       // 8
    pub offering_apples: bool, // 1
    pub user: Pubkey,          // 32
    pub num_oranges: u64,      // 8 - 49 total
}

#[derive(Default, Copy, Clone, AnchorSerialize, AnchorDeserialize, PartialEq)]
pub struct TradeRecord {
    pub num_apples: u64,            // 8
    pub buy_order_for_apples: bool, // 1
    pub num_oranges: u64,           // 8 - 17 total
}

#[account]
#[derive(Default)]
pub struct OrderbookInfo {
    pub admin: Pubkey,               // 32
    pub length: u32,                 // 4
    pub apples_mint: Pubkey,         // 32
    pub oranges_mint: Pubkey,        // 32
    pub bump: u8,                    // 1
    closed: bool,                    // 1
    pub id: Pubkey,                  // 32
    pub trade_log: Vec<TradeRecord>, // 17 x MAX_SIZE = 160
}

const TRADE_LOG_LENGTH: usize = 5;

impl OrderbookInfo {
    pub const LEN: usize = (32 * 4) + 17 * TRADE_LOG_LENGTH + 32 + 4 + 1 + 1;

    pub fn get_last_page(&self) -> u32 {
        if self.length == 0u32 {
            0
        } else {
            (self.length - 1) / (MAX_ORDERPAGE_SIZE as u32)
        }
    }

    pub fn next_open_page(&self) -> u32 {
        (self.length) / (MAX_ORDERPAGE_SIZE as u32)
    }

    pub fn add_trade_to_log(&mut self, record: TradeRecord) {
        if self.trade_log.len() == TRADE_LOG_LENGTH {
            self.trade_log.remove(0);
        }
        self.trade_log.push(record);
    }

    pub fn is_closed(&self) -> bool {
        self.closed
    }

    pub fn close_orderbook(&mut self) {
        self.closed = true;
    }
}

#[account(zero_copy)]
pub struct OrderbookPage {
    list: [Order; MAX_ORDERPAGE_SIZE], // 4900
    pub orderbook_id: Pubkey,          // 32
    pub id_set: bool,                  // 1
    pub length: u32,                   // 4
}

// impl Default for OrderbookPage {
//     fn default() -> Self {
//         Self {
//             orderbook_id: Pubkey::new_unique(),
//             id_set: false,
//             list: [],
//             length: 0,
//         }
//     }
// }

impl OrderbookPage {
    pub const LEN: usize = 5640;
    // should be but IS NOT 49 * MAX_ORDERPAGE_SIZE + 64; // TODO: this is bigger than I feel like it needs to be

    pub fn max_size() -> usize {
        MAX_ORDERPAGE_SIZE
    }

    pub fn len(&self) -> usize {
        self.length as usize
    }

    pub fn is_full(&self) -> bool {
        self.len() == Self::max_size()
    }

    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }

    pub fn push(&mut self, value: Order) -> std::result::Result<(), anchor_lang::error::Error> {
        if self.is_full() {
            return err!(ErrorCode::PageFull);
        }

        let idx: usize = self.length as usize;
        self.list[idx] = value;

        self.length += 1;

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
        let idx: usize = (self.length - 1) as usize;
        let result = self.list[idx];

        self.length -= 1;
        self.list[idx] = Order::default();

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
