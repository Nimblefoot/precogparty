import { order2ui } from "src/utils/orderMath"
import { PublicKey } from "@solana/web3.js"
import { Resolution } from "config"
import { useMemo } from "react"
import { useOrderbook } from "../Orderbook/orderbookQueries"

export const useRelevantOrders = (
  marketAddress: PublicKey,
  taking: Resolution
) => {
  const orderbook = useOrderbook(marketAddress)

  // TODO refactor to query
  const orders = useMemo(
    () =>
      orderbook.data?.pages
        .flatMap((page, i) =>
          page.list.map((x, k) => ({ ...x, page: i, index: k }))
        )
        .map((x) => ({ ...x, odds: order2ui(x).odds }))
        .sort((a, b) => b.odds - a.odds),
    [orderbook.data?.pages]
  )

  const relevantOrders = useMemo(
    () =>
      orders
        ?.filter((x) =>
          taking === "yes" ? x.offeringApples : !x.offeringApples
        )
        .sort((a, b) => (taking === "yes" ? a.odds - b.odds : b.odds - a.odds)),
    [orders, taking]
  )

  return relevantOrders
}
