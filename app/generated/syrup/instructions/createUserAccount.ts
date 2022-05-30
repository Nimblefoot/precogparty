import { PublicKey, TransactionInstruction } from "@solana/web3.js"
import BN from "bn.js"
import * as borsh from "@project-serum/borsh"
import * as types from "../types"
import { PROGRAM_ID } from "../programId"

export interface CreateUserAccountAccounts {
  user: PublicKey
  userAccount: PublicKey
  systemProgram: PublicKey
}

export function createUserAccount(accounts: CreateUserAccountAccounts) {
  const keys = [
    { pubkey: accounts.user, isSigner: true, isWritable: true },
    { pubkey: accounts.userAccount, isSigner: false, isWritable: true },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([146, 68, 100, 69, 63, 46, 182, 199])
  const data = identifier
  const ix = new TransactionInstruction({ keys, programId: PROGRAM_ID, data })
  return ix
}
