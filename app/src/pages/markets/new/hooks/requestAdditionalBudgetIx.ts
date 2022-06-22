import { PublicKey, TransactionInstruction } from "@solana/web3.js"
import BN from "bn.js"

export const requestAdditionalBudgetIx = (budget: number) => {
  const data = Buffer.from(Uint8Array.of(0, ...new BN(budget).toArray("le", 4)))
  return new TransactionInstruction({
    keys: [],
    programId: new PublicKey("ComputeBudget111111111111111111111111111111"),
    data,
  })
}
