use anchor_lang::prelude::*;

use crate::data::ListFull;

#[error_code]
pub enum ListError {
    #[msg("List segment is full")]
    ListFull,
}

impl From<ListFull> for ListError {
    fn from(_: ListFull) -> Self {
        ListError::ListFull
    }
}
