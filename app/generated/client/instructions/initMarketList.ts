import { PublicKey, TransactionInstruction } from "@solana/web3.js"
import BN from "bn.js"
import * as borsh from "@project-serum/borsh"
import * as types from "../types"
import { PROGRAM_ID } from "../programId"

export interface InitMarketListAccounts {
  payer: PublicKey
  list: PublicKey
  systemProgram: PublicKey
  rent: PublicKey
}

export function initMarketList(accounts: InitMarketListAccounts) {
  const keys = [
    { pubkey: accounts.payer, isSigner: true, isWritable: true },
    { pubkey: accounts.list, isSigner: false, isWritable: true },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.rent, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([192, 127, 19, 112, 32, 206, 178, 255])
  const data = identifier
  const ix = new TransactionInstruction({ keys, programId: PROGRAM_ID, data })
  return ix
}
