import { PublicKey } from "@solana/web3.js"
import { useOrderbookUserAccount } from "pages/markets/Market/Orderbook/orderbookQueries"
import { useTokenAccount } from "pages/tokenAccountQuery"
import { useMemo } from "react"
import { useResolutionMint } from "pages/markets/Market/Orderbook/usePlaceOrder"
import BN from "bn.js"

export const usePosition = (market: PublicKey) => {
  const yesMint = useResolutionMint(market, "yes")
  const noMint = useResolutionMint(market, "no")
  const yesAccount = useTokenAccount(yesMint)
  const noAccount = useTokenAccount(noMint)
  const userOrders = useOrderbookUserAccount()

  // doesn't include orders, i suppose it could
  const position = useMemo(() => {
    if (!userOrders.data) return undefined
    if (!yesAccount.data) return undefined
    if (!noAccount.data) return undefined

    const yesHeld = new BN(yesAccount.data.value.amount)
    const noHeld = new BN(noAccount.data.value.amount)

    const relevantOrders = userOrders.data.orders.filter((order) =>
      order.market.equals(market)
    )
    const escrowedYes = relevantOrders
      .filter((order) => order.offeringApples)
      .map((x) => x.numApples)
      .reduce((sum, x) => sum.add(x), new BN(0))

    const escrowedNo = relevantOrders
      .filter((order) => !order.offeringApples)
      .map((x) => x.numOranges)
      .reduce((sum, x) => sum.add(x), new BN(0))

    const totalYes = yesHeld.add(escrowedYes)
    const totalNo = noHeld.add(escrowedNo)

    const withdrawable = BN.min(yesHeld, noHeld)
    console.log("yesHeld", yesHeld.toString())
    console.log("noHeld", noHeld.toString())
    console.log("with", withdrawable.toString())

    if (totalYes.eq(totalNo)) {
      return {
        position: "neutral",
        deposited: totalYes,
        size: undefined,
        orders: relevantOrders,
        escrowed: escrowedNo.add(escrowedYes),
        withdrawable,
      } as const
    } else if (totalYes.lt(totalNo)) {
      return {
        position: "no",
        deposited: totalYes,
        size: totalNo.sub(totalYes),
        orders: relevantOrders,
        escrowed: escrowedNo.add(escrowedYes),
        withdrawable,
      } as const
    } else if (totalYes.gt(totalNo)) {
      return {
        position: "yes",
        deposited: totalNo,
        size: totalYes.sub(totalNo),
        orders: relevantOrders,
        escrowed: escrowedNo.add(escrowedYes),
        withdrawable,
      } as const
    } else {
      throw new Error("this error should not mathematically be possible")
    }
  }, [market, noAccount.data, userOrders.data, yesAccount.data])

  return position
}
