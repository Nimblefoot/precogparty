import { PublicKey, RpcResponseAndContext, TokenAmount } from "@solana/web3.js"
import { useOrderbookUserAccount } from "src/pages/markets/Market/Orderbook/orderbookQueries"
import { useTokenAccount } from "src/pages/tokenAccountQuery"
import { useMemo } from "react"
import { useResolutionMint } from "src/pages/markets/Market/Orderbook/usePlaceOrder"
import BN from "bn.js"
import { UserAccount } from "@/generated/syrup/accounts"

export const usePosition = (market: PublicKey) => {
  const yesMint = useResolutionMint(market, "yes")
  const noMint = useResolutionMint(market, "no")
  const { data: yesAccount } = useTokenAccount(yesMint)
  const { data: noAccount } = useTokenAccount(noMint)
  const { data: userOrders } = useOrderbookUserAccount()

  // doesn't include orders, i suppose it could
  const position = useMemo(() => {
    if (userOrders === undefined) return undefined
    if (!yesAccount) return undefined
    if (!noAccount) return undefined
    return computePosition(userOrders, yesAccount, noAccount, market)
  }, [market, noAccount, userOrders, yesAccount])

  return position
}

export function computePosition(
  userOrders: UserAccount | null,
  yesAccount: "no account" | { value: TokenAmount },
  noAccount: "no account" | { value: TokenAmount },
  market: PublicKey
) {
  const yesAccountFound = yesAccount !== "no account" ? yesAccount : undefined
  const noAccountFound = noAccount !== "no account" ? noAccount : undefined

  const yesHeld = new BN(yesAccountFound?.value.amount ?? 0)
  const noHeld = new BN(noAccountFound?.value.amount ?? 0)

  const relevantOrders =
    userOrders?.orders.filter((order) => order.market.equals(market)) ?? []
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
      .map((x) => x.numOranges)
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

  const escrowedForSale = {
    yes: yesOffers
      .filter((order) => order.memo === 1)
      .map((x) => x.numApples)
      .reduce((sum, x) => sum.add(x), new BN(0)),
    no: noOffers
      .filter((order) => order.memo === 1)
      .map((x) => x.numOranges)
      .reduce((sum, x) => sum.add(x), new BN(0)),
  }

  // couldnt think of a good name, just an intermediate calc
  const x = {
    yes: yesHeld.add(escrowedForSale.yes).sub(reservedForBuyOrder.yes),
    no: noHeld.add(escrowedForSale.no).sub(reservedForBuyOrder.no),
  }
  // size of position
  const size = {
    yes: x.yes.sub(x.no),
    no: x.no.sub(x.yes),
  }

  const data = {
    deposited,
    escrowed,
    withdrawable,
    orders: relevantOrders,
  }

  if (size.yes.eq(size.no)) {
    return {
      position: "neutral",
      size: undefined,
      available: undefined,
      ...data,
    } as const
  } else if (size.no.gt(size.yes)) {
    return {
      position: "no",
      size: size.no,
      available: size.no.sub(reservedForSellOrder.no).sub(escrowedForSale.no),
      ...data,
    } as const
  } else if (size.yes.gt(size.no)) {
    return {
      position: "yes",
      size: size.yes,
      available: size.yes
        .sub(reservedForSellOrder.yes)
        .sub(escrowedForSale.yes),
      ...data,
    } as const
  } else {
    throw new Error("this error should not mathematically be possible")
  }
}
