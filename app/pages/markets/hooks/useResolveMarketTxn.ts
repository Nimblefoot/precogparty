import { useCallback } from "react"
import { resolveMarket } from "@/generated/client/instructions"
import { useWallet } from "@solana/wallet-adapter-react"
import { PublicKey, Transaction } from "@solana/web3.js"

const MAPPING = {
  yes: 1,
  no: 2,
} as const

type Resolution = "yes" | "no"

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
          resolution: MAPPING[resolution],
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
