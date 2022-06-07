import {
  StatelessTransactButton,
  useTransact,
} from "@/components/TransactButton"
import { OrderRecordFields } from "@/generated/syrup/types"
import {
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/outline"
import { useWallet } from "@solana/wallet-adapter-react"
import { PublicKey, Transaction } from "@solana/web3.js"
import Link from "next/link"
import { useMarket } from "pages/markets/Market/hooks/marketQueries"
import {
  orderbookKeys,
  useOrderbook,
} from "pages/markets/Market/Orderbook/orderbookQueries"
import { displayBN } from "@/utils/BNutils"
import { RedeemButton } from "pages/markets/Market/Redeem"
import { queryClient } from "pages/providers"
import { tokenAccountKeys } from "pages/tokenAccountQuery"
import { PROGRAM_ID as SYRUP_ID } from "@/generated/syrup/programId"

import React from "react"
import { utf8 } from "@project-serum/anchor/dist/cjs/utils/bytes"
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { useResolutionMint } from "pages/markets/Market/Orderbook/usePlaceOrder"
import BN from "bn.js"
import { ORDERBOOK_PAGE_MAX_LENGTH } from "config"
import { useMarketsWithPosition } from "./useMarketsWithPosition"
import clsx from "clsx"
import { usePosition } from "./usePosition"
import { useSyrup } from "@/hooks/useProgram"
import { WithdrawAllButton } from "./Cleaning"

const YesBadge = () => (
  <>
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-lime-100 text-lime-800">
      <CheckCircleIcon className="h-4 w-4 -ml-1 mr-1" />
      YES
    </span>
  </>
)

const NoBadge = () => (
  <>
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
      <XCircleIcon className="h-4 w-4 -ml-1 mr-1" />
      NO
    </span>
  </>
)

const Positions = ({}) => {
  const positions = useMarketsWithPosition()

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Positions</h1>
          {/* <p className="mt-2 text-sm text-gray-700">
            A list of all the users in your account including their name, title,
            email and role.
          </p> */}
        </div>
      </div>
      <div className="mt-8 flex flex-col">
        <div className="bg-red-100 flex gap-2 mb-2">
          <div>
            <WithdrawAllButton />
          </div>

          <div>Clean</div>
        </div>
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <div className="min-w-full divide-y divide-gray-300">
                {positions?.map((position) => (
                  <Position
                    key={position.marketAddress.toString()}
                    {...position}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Positions

function Position({
  marketAddress,
  orders,
}: NonNullable<ReturnType<typeof useMarketsWithPosition>>[number]) {
  const market = useMarket(marketAddress)
  const { data: position } = usePosition(marketAddress)

  return position ? (
    <>
      <div className="bg-white whitespace-nowrap px-6 py-4 ">
        <div
          className={`
          whitespace-nowrap text-lg font-medium flex justify-between
          bg-white
          ${market.data?.resolution === 0 ? "text-gray-900" : "text-gray-500"}
        `}
        >
          <Link href={`/markets?m=${market.data?.name}`} passHref>
            <a>
              {market.data?.name}{" "}
              {market.data?.resolution === 1 && <YesBadge />}
              {market.data?.resolution === 2 && <NoBadge />}
            </a>
          </Link>
          <div className={clsx("font-med text-right")}>
            <div>
              {position.position === "yes" ? (
                <>
                  <span className="font-medium text-lime-700">
                    ${displayBN(position.size)} YES
                  </span>
                  {position.size.gt(position.available) && (
                    <> (${displayBN(position.available)} available)</>
                  )}
                </>
              ) : position.position === "no" ? (
                <>
                  <span className="font-medium text-rose-700">
                    ${displayBN(position.size)} NO
                  </span>
                  {position.size.gt(position.available) && (
                    <> (${displayBN(position.available)} available)</>
                  )}
                </>
              ) : null}
            </div>
            <div className="text-sm text-gray-500">
              {position.deposited.gt(new BN(0)) && (
                <p>
                  ${displayBN(position.deposited)} USDC deposited{" "}
                  {position.withdrawable.lt(position.deposited) && (
                    <>(${displayBN(position.withdrawable)} withdrawable)</>
                  )}
                </p>
              )}
              {position.orders.length > 0 && (
                <p>
                  {position.orders.length} order
                  {position.orders.length > 1 ? "s" : ""}{" "}
                </p>
              )}
            </div>
            {/* {yesAmount && <span className="text-lime-700">${yesAmount} YES</span>}
          {yesAmount && noAmount && <>{",  "}</>}
          {noAmount && <span className="text-rose-700">${noAmount} NO</span>} */}
          </div>
        </div>

        {market.data?.resolution !== 0 && (
          <RedeemButton
            address={marketAddress}
            className="mt-2 disabled:hidden"
          />
        )}
        <div>
          {(orders?.length ?? 0) > 0 &&
            orders?.map((order, i) => (
              <Order key={JSON.stringify(order) + i} {...order} />
            ))}
        </div>
      </div>
    </>
  ) : null
}

const Order = ({
  numApples,
  numOranges,
  offeringApples,
  market,
  memo,
}: OrderRecordFields) => {
  const isBuyOrder = memo === 0
  const offerSize = offeringApples ? numApples : numOranges
  const seekingSize = offeringApples ? numOranges : numApples

  return (
    <div className="flex items-center whitespace-nowrap py-2 pl-4 pr-3 font-medium bg-gray-100 text-sm justify-between">
      <div className="flex">
        {isBuyOrder ? (
          <div>${displayBN(offerSize)} USDC</div>
        ) : (
          <div
            className={clsx(offeringApples ? "text-lime-700" : "text-rose-700")}
          >
            ${displayBN(offerSize)} {offeringApples ? "YES" : "NO"}
          </div>
        )}
        <div className="inline-flex items-center">
          <ArrowRightIcon className="w-5 h-5 mx-2 inline-block" />
        </div>
        {isBuyOrder ? (
          <div
            className={clsx(
              !offeringApples ? "text-lime-700" : "text-rose-700"
            )}
          >
            ${displayBN(seekingSize)} {!offeringApples ? "YES" : "NO"}
          </div>
        ) : (
          <div>${displayBN(seekingSize)} USDC</div>
        )}
      </div>
      <div>
        <CancelOrderButton
          order={{ numApples, numOranges, offeringApples, market, memo }}
        />
      </div>
    </div>
  )
}

const CancelOrderButton = ({ order }: { order: OrderRecordFields }) => {
  const { callback, status } = useTransact()
  const orderbook = useOrderbook(order.market)
  const { publicKey } = useWallet()
  const program = useSyrup()

  const yesMint = useResolutionMint(order.market, "yes")
  const noMint = useResolutionMint(order.market, "no")

  const onSubmit = async () => {
    if (!publicKey || !program)
      throw new Error(
        "cancelled order without connecting wallet -- should not be possible"
      )

    // TODO maybe it should await instead somehow
    if (!orderbook.data) return

    // first we have to find the actual order if it is even there
    const found = orderbook.data.pages
      .flatMap((page, i) =>
        page.list.map((x, k) => ({ ...x, page: i, index: k }))
      )
      .find(
        (x) =>
          x.numApples.eq(order.numApples) &&
          x.numOranges.eq(order.numOranges) &&
          publicKey.equals(x.user) &&
          x.offeringApples === order.offeringApples
      )

    if (!found) {
      queryClient.invalidateQueries(orderbookKeys.book(order.market))
      queryClient.invalidateQueries(orderbookKeys.userAccount(publicKey))
      throw new Error("order not found on book")
    }
    const [orderbookInfo] = await PublicKey.findProgramAddress(
      [order.market.toBuffer(), utf8.encode("orderbook-info")],
      SYRUP_ID
    )
    const [userAccount] = await PublicKey.findProgramAddress(
      [utf8.encode("user-account"), publicKey!.toBuffer()],
      SYRUP_ID
    )
    const userAta = await getAssociatedTokenAddress(
      found.offeringApples ? yesMint : noMint,
      publicKey
    )
    const vault = await getAssociatedTokenAddress(
      found.offeringApples ? yesMint : noMint,
      orderbookInfo,
      true
    )
    const [orderPage] = await PublicKey.findProgramAddress(
      [
        order.market.toBuffer(),
        utf8.encode("page"),
        new BN(found.page).toArrayLike(Buffer, "le", 4),
      ],
      SYRUP_ID
    )

    const lastPageIndex = Math.floor(
      (orderbook.data.info.length - 1) / ORDERBOOK_PAGE_MAX_LENGTH
    )

    const [lastPage] = await PublicKey.findProgramAddress(
      [
        order.market.toBuffer(),
        utf8.encode("page"),
        new BN(lastPageIndex).toArrayLike(Buffer, "le", 4),
      ],
      SYRUP_ID
    )

    // const ix = cancelOrder(
    //   {
    //     order: found,
    //     pageNumber: found.page,
    //     index: found.index,
    //   },
    //   {
    //     user: publicKey,
    //     userAccount,
    //     userAta,
    //     vault,
    //     orderbookInfo,
    //     orderPage,
    //     tokenProgram: TOKEN_PROGRAM_ID,
    //   }
    // )

    const remainingAccounts =
      found.page == lastPageIndex
        ? []
        : [
            {
              pubkey: lastPage,
              isSigner: false,
              isWritable: true,
            },
          ]

    const ix = await program.methods
      .cancelOrder(found, found.page, found.index)
      .accounts({
        user: publicKey,
        userAccount,
        userAta,
        vault,
        orderbookInfo,
        orderPage,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .remainingAccounts(remainingAccounts)
      .signers([])
      .instruction()

    const tx = new Transaction().add(ix)
    await callback(tx)

    queryClient.invalidateQueries(orderbookKeys.book(order.market))
    queryClient.invalidateQueries(orderbookKeys.userAccount(publicKey))
    if (found.offeringApples) {
      queryClient.invalidateQueries(tokenAccountKeys.token(yesMint))
    } else {
      queryClient.invalidateQueries(tokenAccountKeys.token(noMint))
    }
  }
  return (
    <>
      <StatelessTransactButton
        status={status}
        verb={"Cancel"}
        onClick={onSubmit}
        className={"w-full text-xs py-1"}
        disabled={!orderbook.data || !publicKey}
      />
    </>
  )
}
