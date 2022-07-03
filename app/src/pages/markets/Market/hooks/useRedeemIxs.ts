import { useCallback } from "react"
import { redeemContingentCoin } from "@/generated/client/instructions"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey, Transaction } from "@solana/web3.js"
import { BN } from "@project-serum/anchor"
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { COLLATERAL_MINT } from "config"
import getATAandCreateIxIfNeeded from "src/utils/getATAandCreateIxIfNeeded"

const useRedeemIxs = (marketAddress: PublicKey) => {
  const { publicKey } = useWallet()
  const { connection } = useConnection()

  const callback = useCallback(
    async ({
      amount,
      contingentCoin,
    }: {
      amount: string
      contingentCoin: PublicKey
    }) => {
      if (!publicKey) throw new Error("no publickey connected")

      const userContingentCoin = await getAssociatedTokenAddress(
        contingentCoin,
        publicKey
      )
      const [userCollateral, initUserCollateralIx] =
        await getATAandCreateIxIfNeeded(connection, COLLATERAL_MINT, publicKey)

      const collateralVault = await getAssociatedTokenAddress(
        COLLATERAL_MINT,
        marketAddress,
        true
      )

      const x = redeemContingentCoin(
        {
          amount: new BN(amount),
        },
        {
          user: publicKey,
          marketAccount: marketAddress,
          contingentCoinMint: contingentCoin,
          userContingentCoin,
          userCollateral,
          collateralVault,
          tokenProgram: TOKEN_PROGRAM_ID,
        }
      )

      const init = initUserCollateralIx ? [initUserCollateralIx] : []
      return [...init, x]
    },
    [connection, marketAddress, publicKey]
  )

  return callback
}

export default useRedeemIxs
