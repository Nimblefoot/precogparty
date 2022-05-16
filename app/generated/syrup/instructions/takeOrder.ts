import { PublicKey, TransactionInstruction } from "@solana/web3.js"
import BN from "bn.js"
import * as borsh from "@project-serum/borsh"
import * as types from "../types"
import { PROGRAM_ID } from "../programId"

export interface TakeOrderArgs {
  size: BN
  pageNumber: number
  index: number
}

export interface TakeOrderAccounts {
  taker: PublicKey
  takerSendingAta: PublicKey
  takerReceivingAta: PublicKey
  offererUserAccount: PublicKey
  offererReceivingAta: PublicKey
  vault: PublicKey
  orderbookInfo: PublicKey
  orderPage: PublicKey
  lastPage: PublicKey
  tokenProgram: PublicKey
  associatedTokenProgram: PublicKey
  rent: PublicKey
  systemProgram: PublicKey
}

export const layout = borsh.struct([
  borsh.u64("size"),
  borsh.u32("pageNumber"),
  borsh.u32("index"),
])

export function takeOrder(args: TakeOrderArgs, accounts: TakeOrderAccounts) {
  const keys = [
    { pubkey: accounts.taker, isSigner: true, isWritable: true },
    { pubkey: accounts.takerSendingAta, isSigner: false, isWritable: true },
    { pubkey: accounts.takerReceivingAta, isSigner: false, isWritable: true },
    { pubkey: accounts.offererUserAccount, isSigner: false, isWritable: true },
    { pubkey: accounts.offererReceivingAta, isSigner: false, isWritable: true },
    { pubkey: accounts.vault, isSigner: false, isWritable: true },
    { pubkey: accounts.orderbookInfo, isSigner: false, isWritable: true },
    { pubkey: accounts.orderPage, isSigner: false, isWritable: true },
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
  const identifier = Buffer.from([163, 208, 20, 172, 223, 65, 255, 228])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      size: args.size,
      pageNumber: args.pageNumber,
      index: args.index,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId: PROGRAM_ID, data })
  return ix
}
