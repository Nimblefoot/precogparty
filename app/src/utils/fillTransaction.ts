import { Transaction, TransactionInstruction } from "@solana/web3.js"
import { SOLANA_TRANSACTION_MAX_BYTES } from "config"

// I think signatures are 64 bytes, and I'm just adding another 64 bytes for whatever else
const TX_SIZE_FUDGE = 128

const sizeIx = (ix: TransactionInstruction) =>
  ix.data.byteLength + ix.keys.length * 32

/** Return an array of instructions that can be fit into one transaction, and an array of the remaining instructions */
const fillTransaction = (
  ixs: TransactionInstruction[],
  accumulator: TransactionInstruction[] = [],
  accSize = 0
): [
  contents: TransactionInstruction[],
  remaining: TransactionInstruction[]
] => {
  console.log("SIZE", accSize)

  const [ix, ...rest] = ixs
  if (ix === undefined) return [accumulator, []]

  const ixSize = sizeIx(ix)
  if (ixSize + accSize <= SOLANA_TRANSACTION_MAX_BYTES - TX_SIZE_FUDGE) {
    return fillTransaction(rest, [...accumulator, ix], ixSize + accSize)
  } else {
    return [accumulator, ixs]
  }
}

export const bundleInstructions = (
  ixs: TransactionInstruction[],
  accumulator: TransactionInstruction[][] = []
): TransactionInstruction[][] => {
  if (ixs.length === 0) return accumulator

  const [nextBundle, remainingIxs] = fillTransaction(ixs)
  return bundleInstructions(remainingIxs, [...accumulator, nextBundle])
}
