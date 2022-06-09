import {
  StatelessTransactButton,
  useTransact,
} from "@/components/TransactButton"
import { mergeContingentSet } from "@/generated/client/instructions"
import { PROGRAM_ID } from "@/generated/client/programId"
import getATAandCreateIxIfNeeded from "@/utils/getATAandCreateIxIfNeeded"
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey, Transaction } from "@solana/web3.js"
import { COLLATERAL_MINT } from "config"
import useMergeContingentSet from "pages/markets/Market/hooks/useMergeContingentSet"
import { queryClient } from "pages/providers"
import { tokenAccountKeys } from "pages/tokenAccountQuery"
import { useQueries } from "react-query"
import { useMarketsWithPosition, usePositions } from "./useMarketsWithPosition"

export const WithdrawAllButton = () => {
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const positions = usePositions()
  const { callback, status } = useTransact()

  const withdrawAll = async () => {
    if (publicKey === null) return undefined
    if (positions === undefined) return undefined

    const [userCollateral, initUserCollateralIx] =
      await getATAandCreateIxIfNeeded(connection, COLLATERAL_MINT, publicKey)

    const ixs = await Promise.all(
      positions.map(async ([market, position]) => {
        const amount = position.withdrawable

        const [yesMint] = await PublicKey.findProgramAddress(
          [Buffer.from(`yes_mint`), market.toBuffer()],
          PROGRAM_ID
        )
        const [noMint] = await PublicKey.findProgramAddress(
          [Buffer.from(`no_mint`), market.toBuffer()],
          PROGRAM_ID
        )
        const collateralVault = await getAssociatedTokenAddress(
          COLLATERAL_MINT,
          market,
          true
        )
        const userYes = await getAssociatedTokenAddress(yesMint, publicKey)
        const userNo = await getAssociatedTokenAddress(noMint, publicKey)

        return mergeContingentSet(
          {
            amount,
          },
          {
            user: publicKey,
            marketAccount: market,
            yesMint,
            noMint,
            collateralVault,
            userCollateral,
            userNo,
            userYes,
            tokenProgram: TOKEN_PROGRAM_ID,
          }
        )
      })
    )

    const init = initUserCollateralIx ? [initUserCollateralIx] : []
    const txn = new Transaction().add(...init, ...ixs)

    // TODO transaction limits enforcement
    await callback(txn, {
      onSuccess: () => {
        queryClient.invalidateQueries(tokenAccountKeys.all)
      },
    })
  }

  return (
    <>
      <StatelessTransactButton
        onClick={withdrawAll}
        status={status}
        verb="Withdraw All"
      />
    </>
  )
}
