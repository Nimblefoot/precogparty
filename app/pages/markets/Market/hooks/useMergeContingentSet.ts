import { useCallback } from "react"
import { mergeContingentSet } from "@/generated/client/instructions"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey, Transaction } from "@solana/web3.js"
import { BN } from "@project-serum/anchor"
import { useMarket } from "./marketQueries"
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { COLLATERAL_MINT } from "config"
import getATAandCreateIxIfNeeded from "@/utils/getATAandCreateIxIfNeeded"
import { BN_ } from "../../../../utils/BNutils"

const useMergeContingentSet = (address: PublicKey) => {
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  // TODO we are just getting PDAs so we could just derive them
  const market = useMarket(address)

  const callback = useCallback(
    async ({ amount }: { amount: BN_ }) => {
      if (!publicKey) throw new Error("no publickey connected")
      if (!market.data)
        throw new Error(
          "race condition - handler called before market data ready"
        )

      const { yesMint, noMint, collateralVault } = market.data

      const userYes = await getAssociatedTokenAddress(yesMint, publicKey)
      const userNo = await getAssociatedTokenAddress(noMint, publicKey)
      const [userCollateral, initUserCollateralIx] =
        await getATAandCreateIxIfNeeded(connection, COLLATERAL_MINT, publicKey)

      const x = mergeContingentSet(
        {
          amount,
        },
        {
          user: publicKey,
          marketAccount: address,
          yesMint,
          noMint,
          collateralVault,
          userCollateral,
          userNo,
          userYes,
          tokenProgram: TOKEN_PROGRAM_ID,
        }
      )

      const init = initUserCollateralIx ? [initUserCollateralIx] : []

      const txn = new Transaction().add(...init, x)
      return txn
    },
    [publicKey, market.data, connection, address]
  )

  return callback
}

export default useMergeContingentSet
