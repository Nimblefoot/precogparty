import { assert } from "chai"
import { takeOrdersHelper, seeWhatHappens } from "../app/utils/takeOrdersHelper"

seeWhatHappens([13, 3, 8, 9, 10], 14)

describe("Take Order Helper", () => {
  it("spoofs an order", () => {
    let computed = takeOrdersHelper(0, 0, 1, [{ index: 0, pageNumber: 0 }])

    let intendedResult = [{ index: 1, pageNumber: 1 }]

    assert.deepEqual(computed, intendedResult)
  })
})
