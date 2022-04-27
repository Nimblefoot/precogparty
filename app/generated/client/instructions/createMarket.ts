import { TransactionInstruction, PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@project-serum/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface CreateMarketArgs {
  marketName: string
  marketDescriptionUri: string
}

export interface CreateMarketAccounts {
  marketAuthority: PublicKey
  marketAccount: PublicKey
  yesMint: PublicKey
  noMint: PublicKey
  usdcVault: PublicKey
  usdcMint: PublicKey
  yesMarket: PublicKey
  noMarket: PublicKey
  resolutionAuthority: PublicKey
  descriptionAuthority: PublicKey
  tokenProgram: PublicKey
  associatedTokenProgram: PublicKey
  systemProgram: PublicKey
  rent: PublicKey
}

export const layout = borsh.struct([
  borsh.str("marketName"),
  borsh.str("marketDescriptionUri"),
])

export function createMarket(
  args: CreateMarketArgs,
  accounts: CreateMarketAccounts
) {
  const keys = [
    { pubkey: accounts.marketAuthority, isSigner: true, isWritable: true },
    { pubkey: accounts.marketAccount, isSigner: false, isWritable: true },
    { pubkey: accounts.yesMint, isSigner: false, isWritable: true },
    { pubkey: accounts.noMint, isSigner: false, isWritable: true },
    { pubkey: accounts.usdcVault, isSigner: false, isWritable: true },
    { pubkey: accounts.usdcMint, isSigner: false, isWritable: false },
    { pubkey: accounts.yesMarket, isSigner: false, isWritable: false },
    { pubkey: accounts.noMarket, isSigner: false, isWritable: false },
    {
      pubkey: accounts.resolutionAuthority,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: accounts.descriptionAuthority,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
    {
      pubkey: accounts.associatedTokenProgram,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.rent, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([103, 226, 97, 235, 200, 188, 251, 254])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      marketName: args.marketName,
      marketDescriptionUri: args.marketDescriptionUri,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId: PROGRAM_ID, data })
  return ix
}
