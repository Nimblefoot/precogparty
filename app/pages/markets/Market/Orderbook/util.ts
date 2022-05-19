import { BN } from "bn.js"
import { COLLATERAL_DECIMALS } from "config"

export type BN_ = InstanceType<typeof BN>

export const displayBN = (bn: BN_) =>
  (bn.toNumber() / 10 ** COLLATERAL_DECIMALS)
    .toFixed(2)
    .replace(/0+$/, "")
    .replace(/[.]$/, "")
export const timesOdds = (bn: BN_, odds: number) =>
  bn.mul(new BN(odds * 100000)).div(new BN(100000))
export const divOdds = (bn: BN_, odds: number) =>
  bn.div(new BN(odds * 100000)).mul(new BN(100000))
