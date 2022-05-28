import { PublicKey, TransactionInstruction } from "@solana/web3.js"
import BN from "bn.js"
import * as borsh from "@project-serum/borsh"
import * as types from "../types"
import { PROGRAM_ID } from "../programId"

export interface TakeOrderOnLastPageArgs {
  order: types.OrderFields
  amountToExchange: BN
  index: number
}

export interface TakeOrderOnLastPageAccounts {
  taker: PublicKey
  takerSendingAta: PublicKey
  takerReceivingAta: PublicKey
  offererUserAccount: PublicKey
  offererReceivingAta: PublicKey
  vault: PublicKey
  orderbookInfo: PublicKey
  lastPage: PublicKey
  tokenProgram: PublicKey
  associatedTokenProgram: PublicKey
  rent: PublicKey
  systemProgram: PublicKey
}

export const layout = borsh.struct([
  types.Order.layout("order"),
  borsh.u64("amountToExchange"),
  borsh.u32("index"),
])

export function takeOrderOnLastPage(
  args: TakeOrderOnLastPageArgs,
  accounts: TakeOrderOnLastPageAccounts
) {
  const keys = [
    { pubkey: accounts.taker, isSigner: true, isWritable: true },
    { pubkey: accounts.takerSendingAta, isSigner: false, isWritable: true },
    { pubkey: accounts.takerReceivingAta, isSigner: false, isWritable: true },
    { pubkey: accounts.offererUserAccount, isSigner: false, isWritable: true },
    { pubkey: accounts.offererReceivingAta, isSigner: false, isWritable: true },
    { pubkey: accounts.vault, isSigner: false, isWritable: true },
    { pubkey: accounts.orderbookInfo, isSigner: false, isWritable: true },
    { pubkey: accounts.lastPage, isSigner: false, isWritable: true },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
    {
      pubkey: accounts.associatedTokenProgram,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: accounts.rent, isSigner: false, isWritable: false },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([139, 31, 240, 228, 108, 243, 219, 111])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      order: types.Order.toEncodable(args.order),
      amountToExchange: args.amountToExchange,
      index: args.index,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId: PROGRAM_ID, data })
  return ix
}
