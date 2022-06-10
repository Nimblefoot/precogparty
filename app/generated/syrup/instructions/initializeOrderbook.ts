import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@project-serum/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
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
  tradeLog: PublicKey
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
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.admin, isSigner: true, isWritable: true },
    { pubkey: accounts.orderbookInfo, isSigner: false, isWritable: true },
    { pubkey: accounts.firstPage, isSigner: false, isWritable: true },
    { pubkey: accounts.applesMint, isSigner: false, isWritable: false },
    { pubkey: accounts.applesVault, isSigner: false, isWritable: true },
    { pubkey: accounts.orangesMint, isSigner: false, isWritable: false },
    { pubkey: accounts.orangesVault, isSigner: false, isWritable: true },
    { pubkey: accounts.tradeLog, isSigner: false, isWritable: true },
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
