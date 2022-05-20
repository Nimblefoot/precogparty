import { order2ui, ui2placeOrderFields, UIOrder } from "app/utils/orderMath"
import { assert } from "chai"

describe("order math", () => {
  it("reverses", () => {
    const uiOrder1: UIOrder = {
      odds: 0.8,
      collateralSize: 10.5,
      forResolution: "yes",
    }
    const order1 = ui2placeOrderFields(uiOrder1)
    assert.deepEqual(uiOrder1, order2ui(order1))
  })
  it("computes a [USDC -> NO order] from UI inputs", () => {})
  it("computes UI display from [USDC -> YES order]", () => {})
  it("computes UI display from [USDC -> NO order", () => {})
})
