import { PublicKey, TransactionInstruction } from "@solana/web3.js"
import BN from "bn.js"
import * as borsh from "@project-serum/borsh"
import * as types from "../types"
import { PROGRAM_ID } from "../programId"

export interface CancelOrderOnLastPageArgs {
  order: types.OrderFields
  index: number
}

export interface CancelOrderOnLastPageAccounts {
  user: PublicKey
  userAccount: PublicKey
  userAta: PublicKey
  vault: PublicKey
  orderbookInfo: PublicKey
  lastPage: PublicKey
  tokenProgram: PublicKey
}

export const layout = borsh.struct([
  types.Order.layout("order"),
  borsh.u32("index"),
])

export function cancelOrderOnLastPage(
  args: CancelOrderOnLastPageArgs,
  accounts: CancelOrderOnLastPageAccounts
) {
  const keys = [
    { pubkey: accounts.user, isSigner: true, isWritable: true },
    { pubkey: accounts.userAccount, isSigner: false, isWritable: true },
    { pubkey: accounts.userAta, isSigner: false, isWritable: true },
    { pubkey: accounts.vault, isSigner: false, isWritable: true },
    { pubkey: accounts.orderbookInfo, isSigner: false, isWritable: true },
    { pubkey: accounts.lastPage, isSigner: false, isWritable: true },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([144, 37, 120, 213, 166, 97, 110, 205])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      order: types.Order.toEncodable(args.order),
      index: args.index,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId: PROGRAM_ID, data })
  return ix
}
