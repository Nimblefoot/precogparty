import {
  StatelessTransactButton,
  useTransact,
} from "@/components/TransactButton"
import { cancelOrder } from "@/generated/syrup/instructions"
import { OrderRecordFields } from "@/generated/syrup/types"
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/outline"
import { useWallet } from "@solana/wallet-adapter-react"
import { PublicKey, Transaction } from "@solana/web3.js"
import Link from "next/link"
import { useMarket, useMarkets } from "pages/markets/Market/hooks/marketQueries"
import {
  orderbookKeys,
  useOrderbook,
  useOrderbookUserAccount,
} from "pages/markets/Market/Orderbook/orderbookQueries"
import { displayBN } from "pages/markets/Market/Orderbook/util"
import { RedeemButton } from "pages/markets/Market/Redeem"
import { queryClient } from "pages/providers"
import { useAllTokenAccounts, useTokenAccount } from "pages/tokenAccountQuery"
import { PROGRAM_ID as SYRUP_ID } from "@/generated/syrup/programId"

import React, { useMemo } from "react"
import { utf8 } from "@project-serum/anchor/dist/cjs/utils/bytes"
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { useResolutionMint } from "pages/markets/Market/Orderbook/usePlaceOrder"
import BN from "bn.js"
import { ORDERBOOK_PAGE_MAX_LENGTH } from "config"

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

const usePositions = () => {
  const accounts = useAllTokenAccounts()
  const markets = useMarkets()
  const userOrders = useOrderbookUserAccount()

  // TODO maybe wrap this in useQuery?
  // TODO in future we should have pointers from tokens to markets on chain
  const positions = useMemo(() => {
    if (!markets.data) return undefined
    if (!accounts.data) return undefined

    const accountsSimplified = accounts.data.value.map((account) => ({
      mint: new PublicKey(account.account.data.parsed.info.mint),
      uiAmount: account.account.data.parsed.info.tokenAmount.uiAmount,
    }))

    const nonzero = accountsSimplified.filter(({ uiAmount }) => uiAmount > 0)

    return markets.data
      .map((market) => {
        const [yesAccount] = nonzero.filter(({ mint }) =>
          mint.equals(market.account.yesMint)
        )
        const [noAccount] = nonzero.filter(({ mint }) =>
          mint.equals(market.account.noMint)
        )
        const orders = userOrders.data?.orders.filter((x) =>
          market.publicKey.equals(x.market)
        )

        if (yesAccount || noAccount)
          return {
            marketAddress: market.publicKey,
            yesMint: yesAccount?.mint,
            noMint: noAccount?.mint,
            orders,
          } as const
      })
      .filter((x): x is typeof x & {} => x !== undefined)
  }, [accounts.data, markets.data, userOrders.data?.orders])

  return positions
}

const Positions = ({}) => {
  const positions = usePositions()
  const userOrders = useOrderbookUserAccount()

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Tokens</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all the users in your account including their name, title,
            email and role.
          </p>
        </div>
      </div>
      <div>{JSON.stringify(userOrders.data)}</div>
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Market
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Balance
                    </th>

                    <th
                      scope="col"
                      className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                    >
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {positions?.map((position) => (
                    <Position
                      key={position.marketAddress.toString()}
                      {...position}
                    />
                  ))}
                </tbody>
              </table>
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
  yesMint,
  noMint,
  orders,
}: NonNullable<ReturnType<typeof usePositions>>[number]) {
  const market = useMarket(marketAddress)
  const yesAccount = useTokenAccount(yesMint)
  const noAccount = useTokenAccount(noMint)

  const yesAmount =
    yesAccount.data?.value &&
    yesAccount.data.value.uiAmount !== null &&
    yesAccount.data.value.uiAmount > 0 &&
    yesAccount.data.value.uiAmount
  const noAmount =
    noAccount.data?.value &&
    noAccount.data.value.uiAmount !== null &&
    noAccount.data.value.uiAmount > 0 &&
    noAccount.data.value.uiAmount

  return (
    <>
      <tr>
        <td
          className={`
          whitespace-nowrap py-4 pl-4 pr-3 text-lg font-medium sm:pl-6
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
        </td>
        <td
          className={`
        whitespace-nowrap px-3 py-4 font-med
      `}
        >
          {yesAmount && <span className="text-lime-700">${yesAmount} YES</span>}
          {yesAmount && noAmount && <>{",  "}</>}
          {noAmount && <span className="text-rose-700">${noAmount} NO</span>}
        </td>

        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
          {market.data?.resolution !== 0 && (
            <RedeemButton address={marketAddress} className="disabled:hidden" />
          )}
        </td>
      </tr>
      {(orders?.length ?? 0) > 0 &&
        orders?.map((order, i) => (
          <Order key={JSON.stringify(order) + i} {...order} />
        ))}
    </>
  )
}

const Order = ({
  numApples,
  numOranges,
  offeringApples,
  market,
}: OrderRecordFields) => {
  return (
    <>
      <tr>
        <td
          className="whitespace-nowrap py-3 pl-4 pr-3 font-medium sm:pl-6 bg-gray-100"
          colSpan={2}
        >
          <div className="flex items-center">
            <div className="h-0 w-6 border border-black mr-2" />
            {/* TODO check if offering apples */}
            <div>
              You&apos;re offering{" "}
              <span className="text-lime-700">${displayBN(numApples)} YES</span>{" "}
              for{" "}
              <span className="text-rose-700">${displayBN(numOranges)} NO</span>
            </div>
          </div>
        </td>
        <td className="bg-gray-100 relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
          <CancelOrderButton
            order={{ numApples, numOranges, offeringApples, market }}
          />
        </td>{" "}
      </tr>
    </>
  )
}

const CancelOrderButton = ({ order }: { order: OrderRecordFields }) => {
  const { callback, status } = useTransact()
  const orderbook = useOrderbook(order.market)
  const { publicKey } = useWallet()

  const yesMint = useResolutionMint(order.market, "yes")
  const noMint = useResolutionMint(order.market, "no")

  const onSubmit = async () => {
    if (!publicKey)
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

    const ix = cancelOrder(
      {
        order: found,
        pageNumber: found.page,
        index: found.index,
      },
      {
        user: publicKey,
        userAccount,
        userAta,
        vault,
        orderbookInfo,
        orderPage,
        lastPage,
        tokenProgram: TOKEN_PROGRAM_ID,
      }
    )
    const tx = new Transaction().add(ix)
    await callback(tx)

    queryClient.invalidateQueries(orderbookKeys.book(order.market))
    queryClient.invalidateQueries(orderbookKeys.userAccount(publicKey))
  }
  return (
    <>
      <StatelessTransactButton
        status={status}
        verb={"Cancel"}
        onClick={onSubmit}
        className={"w-full"}
        disabled={!orderbook.data || !publicKey}
      />
    </>
  )
}
