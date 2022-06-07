import { PublicKey } from "@solana/web3.js"
import { useMarkets } from "pages/markets/Market/hooks/marketQueries"
import { useOrderbookUserAccount } from "pages/markets/Market/Orderbook/orderbookQueries"
import { useAllTokenAccounts } from "pages/tokenAccountQuery"
import { useMemo } from "react"

export const useMarketsWithPosition = () => {
  const accounts = useAllTokenAccounts()
  const markets = useMarkets()
  const userOrders = useOrderbookUserAccount()

  const positions = useMemo(() => {
    if (!markets.data) return undefined
    if (!accounts.data) return undefined

    const accountsSimplified = accounts.data.value.map((account) => ({
      mint: new PublicKey(account.account.data.parsed.info.mint),
      uiAmount: account.account.data.parsed.info.tokenAmount.uiAmount,
    }))

    const nonzero = accountsSimplified.filter(({ uiAmount }) => uiAmount > 0)

    return markets.data
      .map((market) => {
        const [yesAccount] = nonzero.filter(({ mint }) =>
          mint.equals(market.account.yesMint)
        )
        const [noAccount] = nonzero.filter(({ mint }) =>
          mint.equals(market.account.noMint)
        )
        const orders = userOrders.data?.orders.filter((x) =>
          market.publicKey.equals(x.market)
        )

        if (yesAccount || noAccount || (orders?.length ?? 0) > 0)
          return { marketAddress: market.publicKey, orders } as const
      })
      .filter((x): x is typeof x & {} => x !== undefined)
  }, [accounts.data, markets.data, userOrders.data?.orders])

  return positions
}
