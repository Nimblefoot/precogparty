import { assert } from "chai"
import { takeOrdersHelper } from "../app/utils/takeOrdersHelper"

describe("Take Order Helper", () => {
  it("spoofs an order", () => {
    let computed = takeOrdersHelper(0, 0, 1, [{ index: 0, pageNumber: 0 }])

    let intendedResult = [{ index: 1, pageNumber: 1 }]

    assert.deepEqual(computed, intendedResult)
  })
})
