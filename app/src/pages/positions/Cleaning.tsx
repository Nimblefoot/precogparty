import {
  StatelessTransactButton,
  useTransact,
} from "src/components/TransactButton"
import { mergeContingentSet } from "@/generated/client/instructions"
import { PROGRAM_ID } from "@/generated/client/programId"
import getATAandCreateIxIfNeeded from "src/utils/getATAandCreateIxIfNeeded"
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey, Transaction } from "@solana/web3.js"
import { COLLATERAL_MINT } from "config"
import { queryClient } from "src/pages/providers"
import { tokenAccountKeys } from "src/pages/tokenAccountQuery"
import { usePositions } from "./useMarketsWithPosition"
import BN from "bn.js"

export const WithdrawAllButton = () => {
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const positions = usePositions()
  const { callback, status } = useTransact()

  const totalWithdrawable = positions?.reduce(
    (acc, [_, position]) => acc.add(position.withdrawable),
    new BN(0)
  )

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

        console.log("AMOUNT TO WITHDRAW", amount.toNumber())

        return mergeContingentSet(
          {
            amount: amount,
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
    const allIxs = [...init, ...ixs]

    // TODO transaction limits enforcement
    await callback(allIxs, {
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
        disabled={
          totalWithdrawable === undefined || totalWithdrawable.eq(new BN(0))
        }
      />
    </>
  )
}
