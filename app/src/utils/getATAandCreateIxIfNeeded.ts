import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token"
import { Connection, PublicKey } from "@solana/web3.js"

export default async function getATAandCreateIxIfNeeded(
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey
) {
  const existingTokenAccounts = await connection.getTokenAccountsByOwner(
    owner,
    {
      mint: mint,
    }
  )
  const [existingTokenAccount] = existingTokenAccounts.value

  const ATA =
    existingTokenAccount?.pubkey ??
    (await getAssociatedTokenAddress(mint, owner))

  const ix = existingTokenAccount
    ? undefined
    : createAssociatedTokenAccountInstruction(owner, ATA, owner, mint)

  return [ATA, ix] as const
}
