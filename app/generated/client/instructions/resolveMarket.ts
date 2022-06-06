import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@project-serum/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
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
  const keys: Array<AccountMeta> = [
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
