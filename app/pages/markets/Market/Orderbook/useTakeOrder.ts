import { useCallback } from "react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js"
import { ORDERBOOK_PAGE_MAX_LENGTH } from "config"
import BN from "bn.js"
import { takeOrder } from "@/generated/syrup/instructions"
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { utf8 } from "@project-serum/anchor/dist/cjs/utils/bytes"
import { PROGRAM_ID as SYRUP_ID } from "@/generated/syrup/programId"
import { useOrderbook } from "./orderbookQueries"
import { ASSOCIATED_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token"
import { BN_ } from "@/utils/orderMath"
import { useResolutionMint } from "./usePlaceOrder"
import { OrderFields } from "@/generated/syrup/types"

const useTakeOrder = (marketAddress: PublicKey) => {
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const yesMint = useResolutionMint(marketAddress, "yes")
  const noMint = useResolutionMint(marketAddress, "no")

  const orderbookQuery = useOrderbook(marketAddress)

  const callback = useCallback(
    async ({
      order,
      pageNumber,
      index,
      amountToExchange,
    }: {
      order: OrderFields
      pageNumber: number
      index: number
      amountToExchange: BN_
    }) => {
      if (!publicKey) throw new Error("no publickey connected")

      const { offeringApples } = order

      // TODO [mild] - await this data
      if (!orderbookQuery.data)
        throw new Error(
          "race condition -- tried to get txn before loading orderbook data"
        )

      const [orderbookInfo] = await PublicKey.findProgramAddress(
        [marketAddress.toBuffer(), utf8.encode("orderbook-info")],
        SYRUP_ID
      )

      const takerSendingAta = await getAssociatedTokenAddress(
        offeringApples ? noMint : yesMint,
        publicKey
      )

      // TODO get or create
      const takerReceivingAta = await getAssociatedTokenAddress(
        offeringApples ? yesMint : noMint,
        publicKey
      )

      const offererReceivingAta = await getAssociatedTokenAddress(
        offeringApples ? noMint : yesMint,
        order.user
      )

      const [offererUserAccount] = await PublicKey.findProgramAddress(
        [utf8.encode("user-account"), order.user.toBuffer()],
        SYRUP_ID
      )

      // corresponding ATA owned by program
      const vault = await getAssociatedTokenAddress(
        offeringApples ? yesMint : noMint,
        orderbookInfo,
        true
      )

      const [orderPage] = await PublicKey.findProgramAddress(
        [
          marketAddress.toBuffer(),
          utf8.encode("page"),
          new BN(pageNumber).toArrayLike(Buffer, "le", 4),
        ],
        SYRUP_ID
      )

      const lastPageIndex = Math.floor(
        (orderbookQuery.data.info.length - 1) / ORDERBOOK_PAGE_MAX_LENGTH
      )

      const [lastPage] = await PublicKey.findProgramAddress(
        [
          marketAddress.toBuffer(),
          utf8.encode("page"),
          new BN(lastPageIndex).toArrayLike(Buffer, "le", 4),
        ],
        SYRUP_ID
      )

      const ix = takeOrder(
        {
          order,
          pageNumber,
          index,
          amountToExchange,
        },
        {
          taker: publicKey,
          takerSendingAta,
          takerReceivingAta,
          offererUserAccount,
          offererReceivingAta,
          vault,
          orderbookInfo,
          orderPage,
          lastPage,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
        }
      )

      const txn = new Transaction().add(ix)
      return txn
    },
    [marketAddress, noMint, orderbookQuery.data, publicKey, yesMint]
  )

  return callback
}

export default useTakeOrder
