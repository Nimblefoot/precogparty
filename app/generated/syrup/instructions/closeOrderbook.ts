import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@project-serum/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface CloseOrderbookAccounts {
  admin: PublicKey
  orderbookInfo: PublicKey
  tradeLog: PublicKey
}

export function closeOrderbook(accounts: CloseOrderbookAccounts) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.admin, isSigner: true, isWritable: true },
    { pubkey: accounts.orderbookInfo, isSigner: false, isWritable: true },
    { pubkey: accounts.tradeLog, isSigner: false, isWritable: true },
  ]
  const identifier = Buffer.from([195, 216, 135, 205, 50, 240, 187, 46])
  const data = identifier
  const ix = new TransactionInstruction({ keys, programId: PROGRAM_ID, data })
  return ix
}
