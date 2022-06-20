import { assert } from "chai"
import {
  takeOrdersHelper,
  seeWhatHappens,
  seePaginationHappen,
} from "../app/utils/takeOrdersHelper"

// seeWhatHappens([13, 3, 8, 9, 10], 14)

// seeWhatHappens([0, 1, 2], 3)

// seeWhatHappens([3, 2, 1], 4)

seePaginationHappen(
  [
    [2, 1],
    [0, 0],
  ],
  11,
  2
)

describe("Take Order Helper", () => {
  it("spoofs an order", () => {
    let computed = takeOrdersHelper(0, 0, 1, [{ index: 0, pageNumber: 0 }])

    let intendedResult = [{ index: 1, pageNumber: 1 }]

    assert.deepEqual(computed, intendedResult)
  })
})
