import { PublicKey, TransactionInstruction } from "@solana/web3.js"
import BN from "bn.js"
import * as borsh from "@project-serum/borsh"
import * as types from "../types"
import { PROGRAM_ID } from "../programId"

export interface ListMarketAccounts {
  list: PublicKey
  market: PublicKey
}

export function listMarket(accounts: ListMarketAccounts) {
  const keys = [
    { pubkey: accounts.list, isSigner: false, isWritable: true },
    { pubkey: accounts.market, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([161, 93, 3, 53, 190, 113, 67, 32])
  const data = identifier
  const ix = new TransactionInstruction({ keys, programId: PROGRAM_ID, data })
  return ix
}
