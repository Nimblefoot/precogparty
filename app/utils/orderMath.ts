import { PlaceOrderArgs } from "@/generated/syrup/instructions"
import { OrderFields } from "@/generated/syrup/types"
import { Resolution } from "config"
import { BN } from "bn.js"
import { COLLATERAL_DECIMALS, ORDERBOOK_PRICE_RATIO_DECIMALS } from "config"

export type BN_ = InstanceType<typeof BN>

const oddsFromRatio = (X: number) => X / (1 + X)

// ToDo: throw error if X doesn't represent an odds (0 < X < 1)
export const ratioFromOdds = (X: number) => X / (1 - X)

let decimalMultiplier = 10 ** 6

export const order2ui = ({
  numApples: unitsYes,
  numOranges: unitsNo,
  offeringApples: offeringYes,
}: OrderFields): {
  collateralSize: number
  odds: number
  forResolution: String
} => {
  let numYes = unitsYes.toNumber() / decimalMultiplier
  let numNo = unitsNo.toNumber() / decimalMultiplier

  let odds = numNo / (numNo + numYes)
  let collateralSize = offeringYes ? numYes : numNo
  let forResolution = offeringYes ? "no" : "yes"

  return { odds, collateralSize, forResolution }
}

export interface UIOrder {
  odds: number
  collateralSize: number
  forResolution: String
}

export interface OrderbookEntry {
  numApples: BN_
  numOranges: BN_
  offeringApples: boolean
}

export const ui2placeOrderFields = ({
  odds, // odds of yes
  collateralSize,
  forResolution,
}: UIOrder): OrderbookEntry => {
  let offeringYes, numNo, numYes
  let collateralUnits = collateralSize * decimalMultiplier

  if (forResolution == "yes") {
    offeringYes = false
    numNo = collateralUnits
    numYes = collateralUnits / ratioFromOdds(odds)
  } else {
    offeringYes = true
    numYes = collateralUnits
    numNo = collateralUnits * ratioFromOdds(odds)
  }

  return {
    offeringApples: offeringYes,
    numApples: new BN(numYes),
    numOranges: new BN(numNo),
  }
}
