import { PlaceOrderArgs } from "@/generated/syrup/instructions"
import { OrderFields } from "@/generated/syrup/types"
import { Resolution } from "config"
import { BN } from "bn.js"
import { COLLATERAL_DECIMALS, ORDERBOOK_PRICE_RATIO_DECIMALS } from "config"

export type BN_ = InstanceType<typeof BN>

const oddsFromRatio = (X: number) => X / (1 + X)

// ToDo: throw error if X doesn't represent an odds (0 < X < 1)
const ratioFromOdds = (X: number) => X / (1 - X)

export const order2ui = ({
  numApples: numYes,
  numOranges: numNo,
  offeringApples: offeringYes,
}: OrderFields): {
  collateralSize: number
  odds: number
} => {
  let odds = numYes.div(numYes.add(numNo)).toNumber()
  let collateralSize = offeringYes ? numYes.toNumber() : numNo.toNumber()

  return { odds, collateralSize }
}

export interface UIOrder {
  odds: number
  collateralSize: number
  forResolution: String
}

export const ui2placeOrderFields = ({
  odds, // odds of yes
  collateralSize,
  forResolution,
}: UIOrder): {
  numApples: BN_
  numOranges: BN_
  offeringApples: boolean
} => {
  let offeringYes, numNo, numYes

  if (forResolution == "yes") {
    offeringYes = false
    numNo = collateralSize
    numYes = collateralSize / ratioFromOdds(odds)
  } else {
    offeringYes = true
    numYes = collateralSize
    numNo = collateralSize * ratioFromOdds(odds)
  }

  return {
    offeringApples: offeringYes,
    numApples: new BN(numYes),
    numOranges: new BN(numNo),
  }
}
