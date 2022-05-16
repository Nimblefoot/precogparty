import { useCallback } from "react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js"
import { COLLATERAL_MINT, ORDERBOOK_PAGE_MAX_LENGTH } from "config"
import BN from "bn.js"
import { createUserAccount, placeOrder } from "@/generated/syrup/instructions"
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { utf8 } from "@project-serum/anchor/dist/cjs/utils/bytes"
import { PROGRAM_ID as SYRUP_ID } from "@/generated/syrup/programId"
import { useOrderbookForCoin } from "./orderbookQueries"
import { ASSOCIATED_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token"
import { UserAccount } from "@/generated/syrup/accounts"

const getMaybeCreateUserAccountAddress = async (
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

const usePlaceOrderTxn = (token: PublicKey) => {
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const orderbookQuery = useOrderbookForCoin(token)

  const callback = useCallback(
    async ({
      size,
      price,
      buying,
    }: {
      size: BN
      price: BN
      buying: boolean
    }) => {
      if (!publicKey) throw new Error("no publickey connected")

      // TODO [mild] - await this data
      if (!orderbookQuery.data)
        throw new Error(
          "race condition -- tried to get txn before loading orderbook data"
        )

      const [orderbookInfo] = await PublicKey.findProgramAddress(
        [token.toBuffer(), utf8.encode("orderbook-info")],
        SYRUP_ID
      )

      // the ATA is for the token we are locking up
      const userAta = await getAssociatedTokenAddress(
        buying ? COLLATERAL_MINT : token,
        publicKey
      )
      // corresponding ATA owned by program
      const vault = await getAssociatedTokenAddress(
        buying ? COLLATERAL_MINT : token,
        orderbookInfo,
        true
      )

      const currentPageIndex = Math.floor(
        orderbookQuery.data.length / ORDERBOOK_PAGE_MAX_LENGTH
      )

      const [currentPage] = await PublicKey.findProgramAddress(
        [
          token.toBuffer(),
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
            size,
            price,
            buy: buying,
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
    [connection, orderbookQuery.data, publicKey, token]
  )

  return callback
}

export default usePlaceOrderTxn
