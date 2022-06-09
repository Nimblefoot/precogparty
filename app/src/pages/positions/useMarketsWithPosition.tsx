import { PublicKey, TokenAmount } from "@solana/web3.js"
import { useMarkets } from "src/pages/markets/Market/hooks/marketQueries"
import { useOrderbookUserAccount } from "src/pages/markets/Market/Orderbook/orderbookQueries"
import { useAllTokenAccounts } from "src/pages/tokenAccountQuery"
import { useMemo } from "react"
import { computePosition } from "./usePosition"

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

export const usePositions = () => {
  const { data: accounts } = useAllTokenAccounts()
  const markets = useMarkets()
  const { data: userOrders } = useOrderbookUserAccount()

  const positions = useMemo(() => {
    if (!markets.data) return undefined
    if (!accounts) return undefined
    if (userOrders === undefined) return undefined

    const nonzero = accounts?.value.filter(
      ({ account }) => account.data.parsed.info.tokenAmount.amount > 0
    )

    return markets.data
      .map((market) => {
        const [yesAccount] = nonzero.filter(({ account }) =>
          new PublicKey(account.data.parsed.info.mint).equals(
            market.account.yesMint
          )
        )
        const [noAccount] = nonzero.filter(({ account }) =>
          new PublicKey(account.data.parsed.info.mint).equals(
            market.account.noMint
          )
        )
        const orders = userOrders?.orders.filter((x) =>
          market.publicKey.equals(x.market)
        )
        if (yesAccount || noAccount || (orders?.length ?? 0) > 0)
          return [
            market.publicKey,
            computePosition(
              userOrders,
              yesAccount
                ? {
                    value: yesAccount.account.data.parsed.info
                      .tokenAmount as TokenAmount,
                  }
                : "no account",
              noAccount
                ? {
                    value: noAccount.account.data.parsed.info
                      .tokenAmount as TokenAmount,
                  }
                : "no account",
              market.publicKey
            ),
          ] as const
      })
      .filter((x): x is typeof x & {} => x !== undefined)
  }, [accounts, markets.data, userOrders])

  return positions
}
