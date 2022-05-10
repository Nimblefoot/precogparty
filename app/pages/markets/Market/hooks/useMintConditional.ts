import { useCallback } from "react"
import {
  mintContingentSet,
  resolveMarket,
} from "@/generated/client/instructions"
import { useWallet } from "@solana/wallet-adapter-react"
import { PublicKey, Transaction } from "@solana/web3.js"
import { BN } from "@project-serum/anchor"

const useMintConditional = () => {
  const { publicKey } = useWallet()

  const callback = useCallback(
    async ({ market, amount }: { market: PublicKey; amount: number }) => {
      if (!publicKey) throw new Error("no publickey connected")

      const x = mintContingentSet(
        {
          amount: new BN(amount),
        },
        {
          marketAccount: market,
          user: publicKey,
        }
      )

      const txn = new Transaction().add(x)
      return txn
    },
    [publicKey]
  )

  return callback
}

export default useMintConditional
