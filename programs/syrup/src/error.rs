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
    #[msg("Can't convert a offering_apples into a sell or vice versa")]
    CantConvertOrder,
    #[msg("Orberbook name does not match Order")]
    OrderbookMismatch,
    #[msg("Order too small")]
    OrderTooSmall,
    #[msg("Orders need to match")]
    WrongOrder,
    #[msg("Vaults dont match")]
    WrongVault,

    #[msg("Wrong Account Passed to Remaining Accounts.")]
    WrongRemainingAccount,
    #[msg("Last Page not passed")]
    MissingLastPage,

    #[msg("Orderbook Closed")]
    OrderbookClosed,

    #[msg("Orderbook page orderbook name already set")]
    OrderbookNameAlreadySet,

    #[msg("User already placed the maximum number of orders!")]
    MaxOrdersPlaced,

    #[msg("Order page is full")]
    PageFull,
}
