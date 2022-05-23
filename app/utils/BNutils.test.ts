import { assert } from "chai"
import { BN } from "@project-serum/anchor"
import { COLLATERAL_DECIMALS } from "../config"
import { displayBN } from "./BNutils"

describe("bn utils", () => {
  const numbers = [123, 1, 12.3, 0.034]

  numbers.forEach((x) =>
    it("works", () => {
      const bn1 = new BN(x * 10 ** COLLATERAL_DECIMALS)
      assert.equal(displayBN(bn1), x.toString())
    })
  )
})
