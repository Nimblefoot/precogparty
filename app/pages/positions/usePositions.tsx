import { PublicKey } from "@solana/web3.js"
import { useMarkets } from "pages/markets/Market/hooks/marketQueries"
import { useOrderbookUserAccount } from "pages/markets/Market/Orderbook/orderbookQueries"
import { useAllTokenAccounts } from "pages/tokenAccountQuery"
import { useMemo } from "react"

export const usePositions = () => {
  const accounts = useAllTokenAccounts()
  const markets = useMarkets()
  const userOrders = useOrderbookUserAccount()

  // TODO maybe wrap this in useQuery?
  // TODO in future we should have pointers from tokens to markets on chain
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

        if (yesAccount || noAccount)
          return {
            marketAddress: market.publicKey,
            yesMint: yesAccount?.mint,
            noMint: noAccount?.mint,
            orders,
          } as const
      })
      .filter((x): x is typeof x & {} => x !== undefined)
  }, [accounts.data, markets.data, userOrders.data?.orders])

  return positions
}
