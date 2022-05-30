import { PublicKey, TransactionInstruction } from "@solana/web3.js"
import BN from "bn.js"
import * as borsh from "@project-serum/borsh"
import * as types from "../types"
import { PROGRAM_ID } from "../programId"

export interface CloseOrderbookAccounts {
  admin: PublicKey
  orderbookInfo: PublicKey
}

export function closeOrderbook(accounts: CloseOrderbookAccounts) {
  const keys = [
    { pubkey: accounts.admin, isSigner: true, isWritable: true },
    { pubkey: accounts.orderbookInfo, isSigner: false, isWritable: true },
  ]
  const identifier = Buffer.from([195, 216, 135, 205, 50, 240, 187, 46])
  const data = identifier
  const ix = new TransactionInstruction({ keys, programId: PROGRAM_ID, data })
  return ix
}
