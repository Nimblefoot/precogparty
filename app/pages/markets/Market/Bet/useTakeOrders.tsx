import { BN_ } from "@/utils/orderMath"
import { PublicKey } from "@solana/web3.js"
import { BN } from "bn.js"
import { Resolution } from "config"
import { useMemo } from "react"
import { useRelevantOrders } from "./useRelevantOrders"

export const useTakeOrders = (
  marketAddress: PublicKey,
  inputAmount: BN_,
  buying: Resolution,
  percentOdds: number
) => {
  const relevantOrders = useRelevantOrders(marketAddress, buying)

  const [totalBought, totalSpend, orderInteractions] = useMemo(() => {
    // Odds ratio of YES:NO, times 1000
    const oddsRatioMilli = new BN(percentOdds * 1000).div(
      new BN(100 - percentOdds)
    )

    // TODO allow input
    if (!relevantOrders) return [undefined, undefined]

    const { total, spent, orderInteractions } = relevantOrders.reduce(
      (acc, x) => {
        const { total, fundsRemaining, spent, orderInteractions } = acc

        // if we have no funds left to spend, continue
        if (fundsRemaining.lten(0)) return acc

        // if the price is not right, continue
        const orderOddsRatioMilli = x.numOranges
          .mul(new BN(1000))
          .div(x.numApples)
        if (
          buying === "yes"
            ? // if we are buying yes then we want the order's odds ratio to be below ours (we only buy if the event is more likely to us than them)
              orderOddsRatioMilli.gt(oddsRatioMilli)
            : // if we are buying no then we want the order's odds ratio to be above ours
              orderOddsRatioMilli.lt(oddsRatioMilli)
        )
          return acc

        const offering = x.offeringApples ? x.numApples : x.numOranges
        const cost = x.offeringApples ? x.numOranges : x.numApples

        if (cost.lte(fundsRemaining)) {
          return {
            total: total.add(offering),
            fundsRemaining: fundsRemaining.sub(cost),
            spent: spent.add(cost),
            orderInteractions: [
              ...orderInteractions,
              { order: x, amountToExchange: cost },
            ],
          }
        } else {
          const buying = fundsRemaining.mul(offering).div(cost)
          return {
            total: total.add(buying),
            fundsRemaining: new BN(0),
            spent: spent.add(fundsRemaining),
            orderInteractions: [
              ...orderInteractions,
              { order: x, amountToExchange: fundsRemaining },
            ],
          }
        }
      },
      {
        total: new BN(0),
        fundsRemaining: inputAmount,
        spent: new BN(0),
        orderInteractions: [] as {
          order: typeof relevantOrders[number]
          amountToExchange: BN_
        }[],
      }
    )
    return [total, spent, orderInteractions] as const
  }, [inputAmount, percentOdds, relevantOrders, buying])

  return { totalBought, totalSpend, orderInteractions }
}
