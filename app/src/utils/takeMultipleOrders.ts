import { OrderFields } from "@/generated/syrup/types"
import { PublicKey, Keypair } from "@solana/web3.js"
import BN from "bn.js"
import * as anchor from "@project-serum/anchor"

export type BN_ = InstanceType<typeof BN>

export interface takeOrderData {
  order: OrderFields
  size: BN_
  pageNumber: number
  index: number
}

export interface OrderMetadata {
  page_number: number
  index: number
  order: OrderFields
  last_page_idx: number
  order_page_idx: number
  offerer_user_account_idx: number
  offerer_receiving_ata_idx: number
  size: BN_
}

export interface RemainingAccount {
  pubkey: PublicKey
  isSigner: boolean
  isWritable: boolean
}

export const takeMultipleOrders = function (
  orderParams: Array<takeOrderData>,
  length: number,
  pageSize: number
): [Array<OrderMetadata>, Array<RemainingAccount>] {
  let orders: Array<OrderMetadata>
  let accounts: Array<RemainingAccount>
  orders = []
  accounts = []

  return [[], []]
}
