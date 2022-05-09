import { TransactionInstruction, PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@project-serum/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface MintContingentSetArgs {
  amount: BN
}

export interface MintContingentSetAccounts {
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

export function mintContingentSet(
  args: MintContingentSetArgs,
  accounts: MintContingentSetAccounts
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
  const identifier = Buffer.from([83, 220, 173, 151, 79, 202, 217, 227])
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
