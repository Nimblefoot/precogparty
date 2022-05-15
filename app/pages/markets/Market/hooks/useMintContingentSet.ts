import { useCallback } from "react"
import { mintContingentSet } from "@/generated/client/instructions"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey, Transaction } from "@solana/web3.js"
import { BN } from "@project-serum/anchor"
import { useMarket } from "./marketQueries"
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { COLLATERAL_MINT } from "config"
import getATAandCreateIxIfNeeded from "@/utils/getATAandCreateIxIfNeeded"

const useMintContingentSet = (address: PublicKey) => {
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  // TODO we are just getting PDAs so we could just derive them
  const market = useMarket(address)

  const callback = useCallback(
    async ({ amount }: { amount: number }) => {
      if (!publicKey) throw new Error("no publickey connected")
      if (!market.data)
        throw new Error(
          "race condition - handler called before market data ready"
        )

      const { yesMint, noMint, collateralVault } = market.data

      const [userYes, initUserYesIx] = await getATAandCreateIxIfNeeded(
        connection,
        yesMint,
        publicKey
      )
      const [userNo, initUserNoIx] = await getATAandCreateIxIfNeeded(
        connection,
        noMint,
        publicKey
      )
      const userCollateral = await getAssociatedTokenAddress(
        COLLATERAL_MINT,
        publicKey
      )

      const x = mintContingentSet(
        {
          amount: new BN(amount),
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

      const init = []
      if (initUserNoIx) init.push(initUserNoIx)
      if (initUserYesIx) init.push(initUserYesIx)

      const txn = new Transaction().add(...init, x)
      return txn
    },
    [publicKey, market.data, connection, address]
  )

  return callback
}

export default useMintContingentSet
