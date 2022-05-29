import { PublicKey } from "@solana/web3.js"
import { useTokenAccount } from "pages/tokenAccountQuery"
import { useMemo } from "react"
import { useResolutionMint } from "../Orderbook/usePlaceOrder"

export const useSellable = (marketAddress: PublicKey) => {
  const yesMint = useResolutionMint(marketAddress, "yes")
  const noMint = useResolutionMint(marketAddress, "no")

  const yesAccount = useTokenAccount(yesMint)
  const noAccount = useTokenAccount(noMint)

  const sellable = useMemo(
    () => ({
      yes: (yesAccount.data?.value.uiAmount ?? 0) > 0,
      no: (noAccount.data?.value.uiAmount ?? 0) > 0,
    }),
    [noAccount.data?.value.uiAmount, yesAccount.data?.value.uiAmount]
  )

  return sellable
}
