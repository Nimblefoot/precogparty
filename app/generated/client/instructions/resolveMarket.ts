import { PublicKey, TransactionInstruction } from "@solana/web3.js"
import BN from "bn.js"
import * as borsh from "@project-serum/borsh"
import * as types from "../types"
import { PROGRAM_ID } from "../programId"

export interface ResolveMarketArgs {
  resolution: number
}

export interface ResolveMarketAccounts {
  resolutionAuthority: PublicKey
  marketAccount: PublicKey
}

export const layout = borsh.struct([borsh.u8("resolution")])

export function resolveMarket(
  args: ResolveMarketArgs,
  accounts: ResolveMarketAccounts
) {
  const keys = [
    { pubkey: accounts.resolutionAuthority, isSigner: true, isWritable: false },
    { pubkey: accounts.marketAccount, isSigner: false, isWritable: true },
  ]
  const identifier = Buffer.from([155, 23, 80, 173, 46, 74, 23, 239])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      resolution: args.resolution,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId: PROGRAM_ID, data })
  return ix
}
