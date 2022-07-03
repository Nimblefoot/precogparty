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
import { PROGRAM_ID } from "@/generated/client/programId"

const useMergeContingentSet = (address: PublicKey) => {
  const { publicKey } = useWallet()
  const { connection } = useConnection()

  const callback = useCallback(
    async ({ amount }: { amount: BN_ }) => {
      if (!publicKey) throw new Error("no publickey connected")

      const [yesMint] = await PublicKey.findProgramAddress(
        [Buffer.from(`yes_mint`), address.toBuffer()],
        PROGRAM_ID
      )
      const [noMint] = await PublicKey.findProgramAddress(
        [Buffer.from(`no_mint`), address.toBuffer()],
        PROGRAM_ID
      )
      const collateralVault = await getAssociatedTokenAddress(
        COLLATERAL_MINT,
        address,
        true
      )

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
      return [...init, x]
    },
    [publicKey, connection, address]
  )

  return callback
}

export default useMergeContingentSet
