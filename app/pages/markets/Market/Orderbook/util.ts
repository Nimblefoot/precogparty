import { OrderFields } from "@/generated/syrup/types"
import { BN } from "bn.js"
import { COLLATERAL_DECIMALS, ORDERBOOK_PRICE_RATIO_DECIMALS } from "config"

export type BN_ = InstanceType<typeof BN>

export const ODDS_MULTIPLIER = new BN(10 ** ORDERBOOK_PRICE_RATIO_DECIMALS)

export const displayBN = (bn: BN_) =>
  (bn.toNumber() / 10 ** COLLATERAL_DECIMALS)
    .toFixed(2)
    .replace(/0+$/, "")
    .replace(/[.]$/, "")
export const timesOdds = (bn: BN_, odds: number) =>
  bn.mul(new BN(odds * 100000)).div(new BN(100000))
export const divOdds = (bn: BN_, odds: number) =>
  bn.div(new BN(odds * 100000)).mul(new BN(100000))

export const displayOddsBN = (bn: BN_) =>
  (bn.toNumber() / 10 ** ORDERBOOK_PRICE_RATIO_DECIMALS)
    .toFixed(2)
    .replace(/0+$/, "")
    .replace(/[.]$/, "")

const oddsFromRatio = (X: number) => X / (1 + X)

export const order2ui = ({
  size: noAmount,
  price,
  buy: yesForNo,
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
