import { PlaceOrderArgs } from "@/generated/syrup/instructions"
import { OrderFields } from "@/generated/syrup/types"
import { Resolution } from "config"
import { BN } from "bn.js"
import { COLLATERAL_DECIMALS, ORDERBOOK_PRICE_RATIO_DECIMALS } from "config"

export type BN_ = InstanceType<typeof BN>

export const ODDS_MULTIPLIER = new BN(10 ** ORDERBOOK_PRICE_RATIO_DECIMALS)

const oddsFromRatio = (X: number) => X / (1 + X)

// ToDo: throw error if X doesn't represent an odds (0 < X < 1)
const ratioFromOdds = (X: number) => X / (1 - X)

export const order2ui = ({
  size: noAmount,
  price,
  offering_apples: yesForNo,
}: OrderFields): {
  collateralSize: number
  odds: number
} => {
  let collateralSize: number
  if (yesForNo) {
    const yesAmount = noAmount
      .mul(price)
      .div(new BN(10 ** ORDERBOOK_PRICE_RATIO_DECIMALS))
      .toNumber()
    collateralSize = yesAmount / 10 ** COLLATERAL_DECIMALS
  } else {
    collateralSize = noAmount.toNumber() / 10 ** COLLATERAL_DECIMALS
  }

  const odds = oddsFromRatio(
    price.toNumber() / 10 ** ORDERBOOK_PRICE_RATIO_DECIMALS
  )

  return { odds, collateralSize }
}

export interface UIOrder {
  odds: number
  collateralSize: number
  forResolution: String
}

export const ui2placeOrderFields = ({
  odds,
  collateralSize,
  forResolution,
}: UIOrder): {
  collateralSize: number
  odds: number
} => {
  if (forResolution == "yes") {
  } else {
  }
}
