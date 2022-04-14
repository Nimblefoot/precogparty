use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod engineless_orderbook {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeOrderbook {}

pub struct PlaceBuyWatermelon {}

pub struct PlaceSellWatermelon {}

pub struct MarketBuyWatermelon {}
pub struct MarketSellWatermelon {}

pub struct CancelOrder {}

pub struct ExecuteMatchingOrders {}
