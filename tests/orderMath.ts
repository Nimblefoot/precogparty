import {
  order2ui,
  OrderbookEntry,
  ui2placeOrderFields,
  UIOrder,
  ratioFromOdds,
} from "../app/utils/orderMath"
import { assert } from "chai"
import { BN } from "@project-serum/anchor"

const floatingPointTolerance = 10 ** -6
const integerTolerance = 2

function uiOrderEquality(u1: UIOrder, u2: UIOrder) {
  if (u1.forResolution !== u2.forResolution) {
    console.log("for resolutions dont match")
    return false
  }
  if (
    Math.abs(u1.collateralSize - u2.collateralSize) > floatingPointTolerance
  ) {
    console.log("collateral sizes dont match")
    // console.log(u1.collateralSize)
    // console.log(u2.collateralSize)
    return false
  }
  if (Math.abs(u1.odds - u2.odds) > floatingPointTolerance) {
    console.log("odds dont match")
    return false
  }

  return true
}

function orderEquality(o1: OrderbookEntry, o2: OrderbookEntry) {
  if (o1.offeringApples != o2.offeringApples) {
    console.log("offeringApples field doesn't match")
    return false
  }

  if (
    Math.abs(o1.numApples.toNumber() - o2.numApples.toNumber()) >
    integerTolerance
  ) {
    console.log("numApples field doesn't match")
    return false
  }

  if (
    Math.abs(o1.numOranges.toNumber() - o2.numOranges.toNumber()) >
    integerTolerance
  ) {
    console.log("numOranges field doesn't match")
    return false
  }

  return true
}

describe("order math", () => {
  // almost passes!
  it("reverses", () => {
    const uiOrder1: UIOrder = {
      odds: 0.8,
      collateralSize: 10.5,
      forResolution: "yes",
    }
    const order1 = ui2placeOrderFields(uiOrder1)
    const uiOrder2 = order2ui(order1)
    assert(
      uiOrderEquality(uiOrder1, uiOrder2),
      "ui -> order -> ui: should give same result"
    )
  })

  it("computes a [USDC -> YES order] from UI inputs", () => {
    const uiOrder: UIOrder = {
      odds: 0.8,
      collateralSize: 10.5,
      forResolution: "yes",
    }
    // 6 decimals
    const expectedResult: OrderbookEntry = {
      offeringApples: false,
      numApples: new BN(1.05e7 / 4),
      numOranges: new BN(1.05e7),
    }
    const computedResult = ui2placeOrderFields(uiOrder)

    assert(
      orderEquality(computedResult, expectedResult),
      "expected result for yes order"
    )
  })

  it("computes a [USDC -> NO order] from UI inputs", () => {
    const uiOrder: UIOrder = {
      odds: 0.75,
      collateralSize: 21.334,
      forResolution: "no",
    }
    // 6 decimals
    const expectedResult: OrderbookEntry = {
      offeringApples: true,
      numApples: new BN(2.1334e7),
      numOranges: new BN(2.1334e7 * 3),
    }
    const computedResult = ui2placeOrderFields(uiOrder)

    assert(
      orderEquality(computedResult, expectedResult),
      "expected result for 'no' order.."
    )
  })
  it("computes UI display from [USDC -> YES order", () => {
    const orderBookEntry: OrderbookEntry = {
      numApples: new BN(9e6),
      numOranges: new BN(1e6),
      offeringApples: false,
    }

    const expectedResult: UIOrder = {
      odds: 0.1,
      collateralSize: 1,
      forResolution: "yes",
    }
    const computedResult = order2ui(orderBookEntry)

    assert(
      uiOrderEquality(computedResult, expectedResult),
      "should correctly compute ui display from yes order"
    )
  })
})
