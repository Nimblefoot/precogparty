import { TransactionInstruction, PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@project-serum/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface RedeemContingentCoinArgs {
  amount: BN
}

export interface RedeemContingentCoinAccounts {
  user: PublicKey
  marketAccount: PublicKey
  contingentCoinMint: PublicKey
  collateralVault: PublicKey
  userContingentCoin: PublicKey
  userCollateral: PublicKey
  tokenProgram: PublicKey
}

export const layout = borsh.struct([borsh.u64("amount")])

export function redeemContingentCoin(
  args: RedeemContingentCoinArgs,
  accounts: RedeemContingentCoinAccounts
) {
  const keys = [
    { pubkey: accounts.user, isSigner: true, isWritable: false },
    { pubkey: accounts.marketAccount, isSigner: false, isWritable: false },
    { pubkey: accounts.contingentCoinMint, isSigner: false, isWritable: true },
    { pubkey: accounts.collateralVault, isSigner: false, isWritable: true },
    { pubkey: accounts.userContingentCoin, isSigner: false, isWritable: true },
    { pubkey: accounts.userCollateral, isSigner: false, isWritable: true },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([211, 65, 155, 27, 50, 143, 98, 14])
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
