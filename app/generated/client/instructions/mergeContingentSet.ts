import { TransactionInstruction, PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@project-serum/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface MergeContingentSetArgs {
  amount: BN
}

export interface MergeContingentSetAccounts {
  user: PublicKey
  marketAccount: PublicKey
  yesMint: PublicKey
  noMint: PublicKey
  collateralVault: PublicKey
  userYes: PublicKey
  userNo: PublicKey
  userCollateral: PublicKey
  tokenProgram: PublicKey
}

export const layout = borsh.struct([borsh.u64("amount")])

export function mergeContingentSet(
  args: MergeContingentSetArgs,
  accounts: MergeContingentSetAccounts
) {
  const keys = [
    { pubkey: accounts.user, isSigner: true, isWritable: false },
    { pubkey: accounts.marketAccount, isSigner: false, isWritable: false },
    { pubkey: accounts.yesMint, isSigner: false, isWritable: true },
    { pubkey: accounts.noMint, isSigner: false, isWritable: true },
    { pubkey: accounts.collateralVault, isSigner: false, isWritable: true },
    { pubkey: accounts.userYes, isSigner: false, isWritable: true },
    { pubkey: accounts.userNo, isSigner: false, isWritable: true },
    { pubkey: accounts.userCollateral, isSigner: false, isWritable: true },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([57, 87, 72, 54, 81, 72, 123, 132])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      amount: args.amount,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId: PROGRAM_ID, data })
  return ix
}
