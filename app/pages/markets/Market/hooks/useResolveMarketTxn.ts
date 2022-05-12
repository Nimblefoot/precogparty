import { useCallback } from "react"
import { resolveMarket } from "@/generated/client/instructions"
import { useWallet } from "@solana/wallet-adapter-react"
import { PublicKey, Transaction } from "@solana/web3.js"
import { Resolution, RESOLUTION_MAPPING } from "config"

const useResolveMarketTxn = () => {
  const { publicKey } = useWallet()

  const callback = useCallback(
    async ({
      resolution,
      market,
    }: {
      resolution: Resolution
      market: PublicKey
    }) => {
      if (!publicKey) throw new Error("no publickey connected")

      const x = resolveMarket(
        {
          resolution: RESOLUTION_MAPPING[resolution],
        },
        {
          marketAccount: market,
          resolutionAuthority: publicKey,
        }
      )

      const txn = new Transaction().add(x)
      return txn
    },
    [publicKey]
  )

  return callback
}

export default useResolveMarketTxn
