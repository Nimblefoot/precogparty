import {
  ComputeBudgetProgram,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js"
import BN from "bn.js"

export const requestAdditionalBudgetIx = (budget: number) => {
  return ComputeBudgetProgram.requestUnits({
    units: budget,
    additionalFee: 2,
  })
}
