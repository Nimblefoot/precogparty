import { PublicKey } from "@solana/web3.js"

export const COLLATERAL_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112"
)

export const COLLATERAL_DECIMALS = 9

export const RESOLUTION_MAPPING = {
  yes: 1,
  no: 2,
} as const
export const RESOLUTION_MAPPING_INVERSE = {
  1: "yes",
  2: "no",
} as const
export type Resolution = keyof typeof RESOLUTION_MAPPING

export const ORDERBOOK_PAGE_MAX_LENGTH = 100

export const ORDERBOOK_PRICE_RATIO_DECIMALS = 9

export const TAKE_ORDER_COST = 65000
export const MINT_SET_COST = 65000
// not tested but whatever
export const PLACE_ORDER_COST = 65000

export const DEFAULT_COMPUTE_MAX = 200000

export const MARKET_DESCRIPTION_CHARLIMIT = 512
