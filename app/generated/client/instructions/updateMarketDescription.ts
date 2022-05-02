import { TransactionInstruction, PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@project-serum/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface UpdateMarketDescriptionArgs {
  marketDescriptionUri: string
}

export interface UpdateMarketDescriptionAccounts {
  descriptionAuthority: PublicKey
  marketAccount: PublicKey
}

export const layout = borsh.struct([borsh.str("marketDescriptionUri")])

export function updateMarketDescription(
  args: UpdateMarketDescriptionArgs,
  accounts: UpdateMarketDescriptionAccounts
) {
  const keys = [
    {
      pubkey: accounts.descriptionAuthority,
      isSigner: true,
      isWritable: false,
    },
    { pubkey: accounts.marketAccount, isSigner: false, isWritable: true },
  ]
  const identifier = Buffer.from([136, 153, 19, 87, 240, 226, 100, 102])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      marketDescriptionUri: args.marketDescriptionUri,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId: PROGRAM_ID, data })
  return ix
}
