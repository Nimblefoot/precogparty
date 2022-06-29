import { PublicKey } from "@solana/web3.js"

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

export const CLUSTER = (
  {
    "https://api.mainnet-beta.solana.com": "mainnet",
    "https://api.devnet.solana.com": "devnet",
  } as const
)[process.env.NEXT_PUBLIC_RPC as string]

const WSOL_MINT = new PublicKey("So11111111111111111111111111111111111111112")

const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")

export const COLLATERAL_DECIMALS = CLUSTER === "mainnet" ? 6 : 9

export const COLLATERAL_MINT = CLUSTER === "mainnet" ? USDC_MINT : WSOL_MINT
