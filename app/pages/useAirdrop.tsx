import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { COLLATERAL_MINT } from "config"
import { LAMPORTS_PER_SOL, SystemProgram, Transaction } from "@solana/web3.js"
import getATAandCreateIxIfNeeded from "@/utils/getATAandCreateIxIfNeeded"
import { createSyncNativeInstruction } from "@solana/spl-token"

const useAirdrop = () => {
  const { connection } = useConnection()
  const { publicKey } = useWallet()

  const airdrop = async () => {
    if (!publicKey) return
    const amount = 2 * LAMPORTS_PER_SOL
    const airdrop = await connection.requestAirdrop(publicKey, amount)

    const [ata, ataIx] = await getATAandCreateIxIfNeeded(
      connection,
      COLLATERAL_MINT,
      publicKey
    )
    const tx = new Transaction().add(
      ...(ataIx ? [ataIx] : []),
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: ata,
        lamports: amount,
      }),
      createSyncNativeInstruction(ata)
    )
  }
}
