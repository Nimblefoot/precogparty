import { BN } from "bn.js"
import { COLLATERAL_DECIMALS } from "../config"

export type BN_ = InstanceType<typeof BN>

export const displayBN = (bn: BN_, toPlace = 4) => {
  const integer_component = bn.div(new BN(10 ** COLLATERAL_DECIMALS))
  const decimal_component = bn.sub(
    integer_component.mul(new BN(10 ** COLLATERAL_DECIMALS))
  )
  const left_string = integer_component.toString()
  const right_string = decimal_component
    .add(new BN(10 ** COLLATERAL_DECIMALS)) // if decimals = 2, and the number is 3, we want to add 1000 to turn it into 1003
    .toString()
    .substring(1) // and then we truncate the 1 we added
  //.substring(0, toPlace) // and then we truncate decimal places beyond what we want to show
  const decimal_string = left_string + "." + right_string
  const formatted = decimal_string.replace(/0+$/, "").replace(/[.]$/, "")
  return formatted
}
