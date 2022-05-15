use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Order has the wrong user")]
    IncorrectUser,
    #[msg("Size too large")]
    SizeTooLarge,
    #[msg("User does not have a matching order")]
    UserMissingOrder,
    #[msg("Orderbook does not have a matching order")]
    OrderbookMissingOrder,
    #[msg("Last Page of orders should not be empty")]
    LastPageEmpty,
    #[msg("Can't convert a buy into a sell or vice versa")]
    CantConvertOrder,
    #[msg("Orberbook name does not match Order")]
    OrderbookMismatch,

    #[msg("User already placed the maximum number of orders!")]
    MaxOrdersPlaced,

    #[msg("Order page is full")]
    PageFull,
}
