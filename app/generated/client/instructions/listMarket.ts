import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@project-serum/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface ListMarketAccounts {
  list: PublicKey
  market: PublicKey
}

export function listMarket(accounts: ListMarketAccounts) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.list, isSigner: false, isWritable: true },
    { pubkey: accounts.market, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([161, 93, 3, 53, 190, 113, 67, 32])
  const data = identifier
  const ix = new TransactionInstruction({ keys, programId: PROGRAM_ID, data })
  return ix
}
