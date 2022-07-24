import { PublicKey, Keypair } from "@solana/web3.js"
import BN from "bn.js"
import { utf8 } from "@project-serum/anchor/dist/cjs/utils/bytes"
import * as anchor from "@project-serum/anchor"

import { PROGRAM_ID as SYRUP_ID } from "@/generated/syrup/programId"
import { useSyrup } from "src/hooks/useProgram"
import { OrderFields } from "@/generated/syrup/types"

export type BN_ = InstanceType<typeof BN>

export interface takeOrderData {
  order: OrderFields
  size: BN_
  pageNumber: number
  index: number
}

export interface OrderMetadata {
  page_number: number
  index: number
  order: OrderFields
  last_page_idx: number
  order_page_idx: number
  offerer_user_account_idx: number
  offerer_receiving_ata_idx: number
  size: BN_
}

export interface RemainingAccount {
  pubkey: PublicKey
  isSigner: boolean
  isWritable: boolean
}

export const takeMultipleOrders = async (
  orderParams: Array<takeOrderData>,
  length: number,
  pageSize: number,
  marketAddress: PublicKey,
  mint: PublicKey
): Promise<[Array<OrderMetadata>, Array<RemainingAccount>]> => {
  let orders: Array<OrderMetadata>
  let accounts: Array<RemainingAccount>
  orders = []
  accounts = []

  for (let { order, size, pageNumber, index } of orderParams) {
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

    const [takerTradeLog] = await PublicKey.findProgramAddress(
      [publicKey.toBuffer(), utf8.encode("trade-log")],
      SYRUP_ID
    )

    const [offererTradeLog] = await PublicKey.findProgramAddress(
      [order.user.toBuffer(), utf8.encode("trade-log")],
      SYRUP_ID
    )
  }

  return [[], []]
}
