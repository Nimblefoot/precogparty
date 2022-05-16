import { PublicKey, TransactionInstruction } from "@solana/web3.js"
import BN from "bn.js"
import * as borsh from "@project-serum/borsh"
import * as types from "../types"
import { PROGRAM_ID } from "../programId"

export interface ModifyOrderArgs {
  newOrder: types.OrderFields
  pageNumber: number
  index: number
}

export interface ModifyOrderAccounts {
  user: PublicKey
  userAccount: PublicKey
  userAta: PublicKey
  vault: PublicKey
  orderbookInfo: PublicKey
  orderPage: PublicKey
  tokenProgram: PublicKey
}

export const layout = borsh.struct([
  types.Order.layout("newOrder"),
  borsh.u32("pageNumber"),
  borsh.u32("index"),
])

export function modifyOrder(
  args: ModifyOrderArgs,
  accounts: ModifyOrderAccounts
) {
  const keys = [
    { pubkey: accounts.user, isSigner: true, isWritable: false },
    { pubkey: accounts.userAccount, isSigner: false, isWritable: true },
    { pubkey: accounts.userAta, isSigner: false, isWritable: true },
    { pubkey: accounts.vault, isSigner: false, isWritable: true },
    { pubkey: accounts.orderbookInfo, isSigner: false, isWritable: true },
    { pubkey: accounts.orderPage, isSigner: false, isWritable: true },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([47, 124, 117, 255, 201, 197, 130, 94])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      newOrder: types.Order.toEncodable(args.newOrder),
      pageNumber: args.pageNumber,
      index: args.index,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId: PROGRAM_ID, data })
  return ix
}
