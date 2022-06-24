import { useCallback } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js"
import { ORDERBOOK_PAGE_MAX_LENGTH } from "config"
import BN from "bn.js"
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { utf8 } from "@project-serum/anchor/dist/cjs/utils/bytes"
import { PROGRAM_ID as SYRUP_ID } from "@/generated/syrup/programId"
import { useOrderbook } from "./orderbookQueries"
import { ASSOCIATED_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token"
import { useResolutionMint } from "./usePlaceOrder"
import { useSyrup } from "src/hooks/useProgram"
import { takeOrderData, takeOrdersHelper } from "@/utils/takeOrdersHelper"

const useTakeOrderInstructions = (marketAddress: PublicKey) => {
  const { publicKey } = useWallet()
  const program = useSyrup()
  const yesMint = useResolutionMint(marketAddress, "yes")
  const noMint = useResolutionMint(marketAddress, "no")

  const { data: orderbook } = useOrderbook(marketAddress)

  const callback = useCallback(
    async (takes: takeOrderData[]) => {
      if (!publicKey || !program) throw new Error("no publickey connected")

      // TODO [mild] - await this data
      if (!orderbook)
        throw new Error(
          "race condition -- tried to get txn before loading orderbook data"
        )

      const [orderbookInfo] = await PublicKey.findProgramAddress(
        [marketAddress.toBuffer(), utf8.encode("orderbook-info")],
        SYRUP_ID
      )

      const [takerTradeLog] = await PublicKey.findProgramAddress(
        [publicKey.toBuffer(), utf8.encode("trade-log")],
        SYRUP_ID
      )

      const batchableTakes = takeOrdersHelper(
        takes,
        orderbook.info.length,
        ORDERBOOK_PAGE_MAX_LENGTH
      )

      const ixs = await Promise.all(
        batchableTakes.map(
          async ([{ order, size, pageNumber, index }, lastPageIndex]) => {
            const { offeringApples } = order
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

            const [lastPage] = await PublicKey.findProgramAddress(
              [
                marketAddress.toBuffer(),
                utf8.encode("page"),
                new BN(lastPageIndex).toArrayLike(Buffer, "le", 4),
              ],
              SYRUP_ID
            )

            const [offererTradeLog] = await PublicKey.findProgramAddress(
              [order.user.toBuffer(), utf8.encode("trade-log")],
              SYRUP_ID
            )

            const remainingAccounts =
              pageNumber == lastPageIndex
                ? []
                : [
                    {
                      pubkey: lastPage,
                      isSigner: false,
                      isWritable: true,
                    },
                  ]

            const ix = await program.methods
              .takeOrder(order, size, pageNumber, index)
              .accounts({
                taker: publicKey,
                takerSendingAta,
                takerReceivingAta,
                offererUserAccount,
                offererReceivingAta,
                vault,
                orderbookInfo,
                orderPage,
                takerTradeLog,
                offererTradeLog,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
                rent: SYSVAR_RENT_PUBKEY,
                systemProgram: SystemProgram.programId,
              })
              .remainingAccounts(remainingAccounts)
              .instruction()

            return ix
          }
        )
      )

      return {
        ixs,
        lastPageAfterTaking: batchableTakes[batchableTakes.length - 1]?.[1],
      }
    },
    [marketAddress, noMint, orderbook, program, publicKey, yesMint]
  )

  return callback
}

export default useTakeOrderInstructions
