import { PublicKey, TransactionInstruction } from "@solana/web3.js"
import BN from "bn.js"
import * as borsh from "@project-serum/borsh"
import * as types from "../types"
import { PROGRAM_ID } from "../programId"

export interface CancelOrderArgs {
  order: types.OrderFields
  pageNumber: number
  index: number
}

export interface CancelOrderAccounts {
  user: PublicKey
  userAccount: PublicKey
  userAta: PublicKey
  vault: PublicKey
  orderbookInfo: PublicKey
  orderPage: PublicKey
  lastPage: PublicKey
  tokenProgram: PublicKey
}

export const layout = borsh.struct([
  types.Order.layout("order"),
  borsh.u32("pageNumber"),
  borsh.u32("index"),
])

export function cancelOrder(
  args: CancelOrderArgs,
  accounts: CancelOrderAccounts
) {
  const keys = [
    { pubkey: accounts.user, isSigner: true, isWritable: false },
    { pubkey: accounts.userAccount, isSigner: false, isWritable: true },
    { pubkey: accounts.userAta, isSigner: false, isWritable: true },
    { pubkey: accounts.vault, isSigner: false, isWritable: true },
    { pubkey: accounts.orderbookInfo, isSigner: false, isWritable: true },
    { pubkey: accounts.orderPage, isSigner: false, isWritable: true },
    { pubkey: accounts.lastPage, isSigner: false, isWritable: true },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([95, 129, 237, 240, 8, 49, 223, 132])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      order: types.Order.toEncodable(args.order),
      pageNumber: args.pageNumber,
      index: args.index,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId: PROGRAM_ID, data })
  return ix
}