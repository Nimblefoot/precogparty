import { useCallback, useMemo } from "react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js"
import { COLLATERAL_MINT, ORDERBOOK_PAGE_MAX_LENGTH, Resolution } from "config"
import BN from "bn.js"
import { createUserAccount, placeOrder } from "@/generated/syrup/instructions"
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { utf8 } from "@project-serum/anchor/dist/cjs/utils/bytes"
import { PROGRAM_ID as SYRUP_ID } from "@/generated/syrup/programId"
import { useOrderbook } from "./orderbookQueries"
import { ASSOCIATED_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token"
import { UserAccount } from "@/generated/syrup/accounts"
import { PROGRAM_ID } from "@/generated/client/programId"

export const getMaybeCreateUserAccountAddress = async (
  connection: Connection,
  user: PublicKey
) => {
  const [userAccountAddress] = await PublicKey.findProgramAddress(
    [utf8.encode("user-account"), user.toBuffer()],
    SYRUP_ID
  )

  const account = await UserAccount.fetch(connection, userAccountAddress)
  if (account !== null) return [userAccountAddress, undefined] as const

  const ix = createUserAccount({
    user,
    userAccount: userAccountAddress,
    systemProgram: SystemProgram.programId,
  })

  return [userAccountAddress, ix] as const
}

export const useResolutionMint = (
  marketAddress: PublicKey,
  resolution: Resolution
) => {
  const [x] = useMemo(
    () =>
      PublicKey.findProgramAddressSync(
        [Buffer.from(`${resolution}_mint`), marketAddress.toBuffer()],
        PROGRAM_ID
      ),
    [marketAddress, resolution]
  )
  return x
}

const usePlaceOrderTxn = (marketAddress: PublicKey) => {
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const yesMint = useResolutionMint(marketAddress, "yes")
  const noMint = useResolutionMint(marketAddress, "no")

  const orderbookQuery = useOrderbook(marketAddress)

  const callback = useCallback(
    async ({
      offeringYes,
      numYes,
      numNo,
      uiSelling,
      lastPageIndex,
    }: {
      offeringYes: boolean
      numYes: BN
      numNo: BN
      uiSelling: boolean
      // sometimes you want to manually override the last page
      lastPageIndex?: number
    }) => {
      console.log(offeringYes, numYes.toString(), numNo.toString())
      if (!publicKey) throw new Error("no publickey connected")

      // TODO [mild] - await this data
      if (!orderbookQuery.data)
        throw new Error(
          "race condition -- tried to get txn before loading orderbook data"
        )

      const [orderbookInfo] = await PublicKey.findProgramAddress(
        [marketAddress.toBuffer(), utf8.encode("orderbook-info")],
        SYRUP_ID
      )

      // the ATA is for the token we are locking up
      const userAta = await getAssociatedTokenAddress(
        offeringYes ? yesMint : noMint,
        publicKey
      )
      // corresponding ATA owned by program
      const vault = await getAssociatedTokenAddress(
        offeringYes ? yesMint : noMint,
        orderbookInfo,
        true
      )

      const currentPageIndex =
        lastPageIndex ??
        Math.floor(orderbookQuery.data.info.length / ORDERBOOK_PAGE_MAX_LENGTH)

      const [currentPage] = await PublicKey.findProgramAddress(
        [
          marketAddress.toBuffer(),
          utf8.encode("page"),
          new BN(currentPageIndex).toArrayLike(Buffer, "le", 4),
        ],
        SYRUP_ID
      )

      const [userAccount, setupUserIx] = await getMaybeCreateUserAccountAddress(
        connection,
        publicKey
      )

      const ix = placeOrder(
        {
          order: {
            user: publicKey,
            numOranges: numNo,
            numApples: numYes,
            offeringApples: offeringYes,
            memo: uiSelling ? 1 : 0,
          },
        },
        {
          user: publicKey,
          userAta,
          vault,
          orderbookInfo,
          currentPage,
          userAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
        }
      )

      const txn = setupUserIx
        ? new Transaction().add(setupUserIx, ix)
        : new Transaction().add(ix)
      return txn
    },
    [connection, marketAddress, noMint, orderbookQuery.data, publicKey, yesMint]
  )

  return callback
}

export default usePlaceOrderTxn
