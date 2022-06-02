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
    if (userOrders.data === undefined) return undefined
    if (!yesAccount.data) return undefined
    if (!noAccount.data) return undefined

    const yesAccountFound =
      yesAccount.data !== "no account" ? yesAccount.data : undefined
    const noAccountFound =
      noAccount.data !== "no account" ? noAccount.data : undefined

    const yesHeld = new BN(yesAccountFound?.value.amount ?? 0)
    const noHeld = new BN(noAccountFound?.value.amount ?? 0)

    const relevantOrders =
      userOrders.data?.orders.filter((order) => order.market.equals(market)) ??
      []
    const yesOffers = relevantOrders.filter((order) => order.offeringApples)
    const noOffers = relevantOrders.filter((order) => !order.offeringApples)

    const escrowedYes = yesOffers
      .map((x) => x.numApples)
      .reduce((sum, x) => sum.add(x), new BN(0))

    const escrowedNo = noOffers
      .map((x) => x.numOranges)
      .reduce((sum, x) => sum.add(x), new BN(0))

    const totalYes = yesHeld.add(escrowedYes)
    const totalNo = noHeld.add(escrowedNo)
    const deposited = BN.min(totalYes, totalNo)

    const escrowed = escrowedNo.add(escrowedYes)

    // if you are using USDC to buy something, then in the UX we show this as an order for USDC -> YES/NO,
    // in which case we dont want you to withdraw the other side of ur usdc thats being offered
    const reservedForBuyOrder = {
      // memo === 0 -> this is a buy order (not a sell order) (just a UX distinction, no impact, hence the field is called memo)
      no: yesOffers
        .filter((order) => order.memo === 0)
        .map((x) => x.numApples)
        .reduce((sum, x) => sum.add(x), new BN(0)),
      yes: noOffers
        .filter((order) => order.memo === 0)
        .map((x) => x.numApples)
        .reduce((sum, x) => sum.add(x), new BN(0)),
    }

    // here we reserve an amount of A equal to the amount of B we are seeking, since this order is trying to buy USDC
    const reservedForSellOrder = {
      yes: yesOffers
        .filter((order) => order.memo === 1)
        .map((x) => x.numOranges)
        .reduce((sum, x) => sum.add(x), new BN(0)),
      no: noOffers
        .filter((order) => order.memo === 1)
        .map((x) => x.numApples)
        .reduce((sum, x) => sum.add(x), new BN(0)),
    }
    const reserved = {
      yes: reservedForBuyOrder.yes.add(reservedForSellOrder.yes),
      no: reservedForBuyOrder.no.add(reservedForSellOrder.no),
    }

    const withdrawable = BN.min(
      yesHeld.sub(reserved.yes),
      noHeld.sub(reserved.no)
    )

    const data = {
      deposited,
      escrowed,
      withdrawable,
      orders: relevantOrders,
    }

    if (totalYes.eq(totalNo)) {
      return {
        position: "neutral",
        size: undefined,
        ...data,
      } as const
    } else if (totalYes.lt(totalNo)) {
      return {
        position: "no",
        size: totalNo.sub(totalYes),
        ...data,
      } as const
    } else if (totalYes.gt(totalNo)) {
      return {
        position: "yes",
        size: totalYes.sub(totalNo),
        ...data,
      } as const
    } else {
      throw new Error("this error should not mathematically be possible")
    }
  }, [market, noAccount.data, userOrders.data, yesAccount.data])

  return position
}
