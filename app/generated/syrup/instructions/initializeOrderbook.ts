import { PublicKey, TransactionInstruction } from "@solana/web3.js"
import BN from "bn.js"
import * as borsh from "@project-serum/borsh"
import * as types from "../types"
import { PROGRAM_ID } from "../programId"

export interface InitializeOrderbookArgs {
  id: PublicKey
}

export interface InitializeOrderbookAccounts {
  admin: PublicKey
  orderbookInfo: PublicKey
  firstPage: PublicKey
  applesMint: PublicKey
  applesVault: PublicKey
  orangesMint: PublicKey
  orangesVault: PublicKey
  tokenProgram: PublicKey
  associatedTokenProgram: PublicKey
  rent: PublicKey
  systemProgram: PublicKey
}

export const layout = borsh.struct([borsh.publicKey("id")])

export function initializeOrderbook(
  args: InitializeOrderbookArgs,
  accounts: InitializeOrderbookAccounts
) {
  const keys = [
    { pubkey: accounts.admin, isSigner: true, isWritable: true },
    { pubkey: accounts.orderbookInfo, isSigner: false, isWritable: true },
    { pubkey: accounts.firstPage, isSigner: false, isWritable: true },
    { pubkey: accounts.applesMint, isSigner: false, isWritable: false },
    { pubkey: accounts.applesVault, isSigner: false, isWritable: true },
    { pubkey: accounts.orangesMint, isSigner: false, isWritable: false },
    { pubkey: accounts.orangesVault, isSigner: false, isWritable: true },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
    {
      pubkey: accounts.associatedTokenProgram,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: accounts.rent, isSigner: false, isWritable: false },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([195, 173, 118, 241, 60, 86, 168, 41])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      id: args.id,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId: PROGRAM_ID, data })
  return ix
}
