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
    pub num_oranges: u64,      // 8
    pub memo: u8,              // 1 - 50 total.
}

#[account]
#[derive(Default)]
pub struct TradeLog {
    pub trades: Vec<TradeRecord>,
    pub open_time: i64,  // 8
    pub close_time: i64, // 8
}
impl TradeLog {
    pub const MAX_ITEMS: usize = 100;
    pub const LEN: usize = 4 // std::mem::size_of::<VecDeque<TradeRecord>>
    + (TradeRecord::LEN * TradeLog::MAX_ITEMS) + 8 + 8;
    pub fn push(&mut self, record: TradeRecord) {
        if self.trades.len() == TradeLog::MAX_ITEMS {
            // I think this can be very costly! Needs investigation!
            // Ideally would use VecDeque, but anchor's IDL no supporty...
            self.trades.remove(0);
        }
        self.trades.push(record);
    }
}

#[derive(Default, Copy, Clone, AnchorSerialize, AnchorDeserialize, PartialEq)]
pub struct TradeRecord {
    pub num_apples: u64,            // 8
    pub buy_order_for_apples: bool, // 1
    pub num_oranges: u64,           // 8
    pub time: i64,                  // 8 - 25 total
}
impl TradeRecord {
    pub const LEN: usize = 25;
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

const TRADE_QUEUE_LENGTH: u32 = 500;
#[account]
pub struct TradeQueue {
    data: Vec<TradeRecord>,
    start: u32,
}

impl Default for TradeQueue {
    fn default() -> Self {
        Self {
            start: 0,
            data: Vec::with_capacity(TRADE_QUEUE_LENGTH as usize),
        }
    }
}

impl TradeQueue {
    pub fn is_full(&self) -> bool {
        self.data.len() == TRADE_QUEUE_LENGTH as usize
    }

    pub fn push(&mut self, record: TradeRecord) {
        if self.is_full() {
            self.data[self.start as usize] = record;
            self.start = (self.start + 1).rem_euclid(TRADE_QUEUE_LENGTH as u32)
        } else {
            self.data.push(record);
        }
    }

    pub fn get(&self, index: i32) -> Option<&TradeRecord> {
        if self.data.len() == 0 {
            return None;
        }

        // let neg_one = (-1i32).rem_euclid(TRADE_QUEUE_LENGTH as i32) as u32;

        let starting_pos = if index >= 0 {
            self.start
        } else if index < 0 && self.is_full() {
            (self.start).rem_euclid(TRADE_QUEUE_LENGTH)
        } else {
            (self.data.len() as u32).rem_euclid(TRADE_QUEUE_LENGTH)
        };

        let offset = index.rem_euclid(TRADE_QUEUE_LENGTH as i32) as u32;

        let pos = (starting_pos + offset).rem_euclid(TRADE_QUEUE_LENGTH);

        self.data.get(pos as usize)
    }
}

impl OrderbookInfo {
    pub const LEN: usize = (32 * 4) + TradeRecord::LEN * TRADE_LOG_LENGTH + 32 + 4 + 1 + 1;

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
    pub const LEN: usize = 50 * MAX_SIZE + 64; // TODO: this is bigger than I feel like it needs to be

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

#[cfg(test)]
mod tests {
    use crate::data::TradeQueue;

    use super::TradeRecord;

    #[test]
    fn it_works_if_not_full() {
        let mut log = TradeQueue::default();

        for x in 0..111 {
            let record = TradeRecord {
                buy_order_for_apples: true,
                num_apples: 1,
                num_oranges: x,
                time: 0,
            };

            log.push(record);
        }

        assert_eq!(log.get(3).unwrap().num_oranges, 3);
        assert_eq!(log.get(110).unwrap().num_oranges, 110);
        assert_eq!(log.get(-111).unwrap().num_oranges, 0);
    }

    #[test]
    fn it_works_when_full() {
        let mut log = TradeQueue::default();

        for x in 0..711 {
            let record = TradeRecord {
                buy_order_for_apples: true,
                num_apples: 1,
                num_oranges: x,
                time: 0,
            };

            log.push(record);
        }

        assert_eq!(log.get(-1).unwrap().num_oranges, 710);
        assert_eq!(log.get(0).unwrap().num_oranges, 211);
        assert_eq!(log.get(100).unwrap().num_oranges, 311);
        assert_eq!(log.get(-51).unwrap().num_oranges, 660);
    }
}
