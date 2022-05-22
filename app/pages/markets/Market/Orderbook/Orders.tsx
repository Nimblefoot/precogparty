import { OrderFields } from "@/generated/syrup/types"
import { PublicKey } from "@solana/web3.js"
import { BN } from "bn.js"
import {
  COLLATERAL_DECIMALS,
  ORDERBOOK_PRICE_RATIO_DECIMALS,
  Resolution,
} from "config"
import React, { useMemo } from "react"
import { useOrderbook } from "./orderbookQueries"
import clsx from "clsx"
import { order2ui } from "@/utils/orderMath"
import { displayBN } from "./util"

const Orders = ({ marketAddress }: { marketAddress: PublicKey }) => {
  const orderbook = useOrderbook(marketAddress)
  const orders = useMemo(
    () =>
      orderbook.data?.pages
        .flatMap((page, i) =>
          page.list.map((x, k) => ({ ...x, page: i, index: k }))
        )
        .map((x) => ({ ...x, odds: order2ui(x).odds }))
        .sort((a, b) => b.odds - a.odds),
    [orderbook.data?.pages]
  )
  const yesOffers = useMemo(
    () =>
      orders?.filter((x) => x.offeringApples).sort((a, b) => a.odds - b.odds),
    [orders]
  )
  const noOffers = useMemo(
    () => orders?.filter((x) => !x.offeringApples),
    [orders]
  )

  return (
    <>
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg w-full">
        <div className="grid grid-cols-2">
          <YesOrderColumn orders={noOffers} />
          <NoOrderColumn orders={yesOffers} />
        </div>
      </div>
    </>
  )
}

const YesOrderColumn = ({
  orders,
}: {
  orders?: (OrderFields & { page: number; index: number })[]
}) => {
  return (
    <div className="flex flex-col text-right border-r border-gray-300">
      <div className="inline-block min-w-full align-middle">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b border-gray-300">
            <tr>
              <th
                scope="col"
                className="whitespace-nowrap py-3.5 px-2 text-sm font-semibold text-lime-900 "
              >
                Offer
              </th>
              <th
                scope="col"
                className="whitespace-nowrap px-2 py-3.5 text-sm font-semibold text-lime-900"
              ></th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {orders?.map((order) => {
              const { odds, collateralSize } = order2ui(order)

              return (
                <tr
                  key={JSON.stringify(order)}
                  className="border-b border-gray-200"
                >
                  <td className="whitespace-nowrap py-2 px-2 text-sm text-gray-500">
                    anon offers {displayBN(order.numOranges)} NO for{" "}
                    {displayBN(order.numApples)} YES
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-sm font-medium text-gray-900">
                    {(100 * odds).toFixed(0)}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
const NoOrderColumn = ({ orders }: { orders?: OrderFields[] }) => {
  return (
    <div className="flex flex-col">
      <div className="inline-block min-w-full align-middle">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b border-gray-300">
            <tr>
              <th
                scope="col"
                className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-rose-900"
              ></th>
              <th
                scope="col"
                className="whitespace-nowrap py-3.5 px-2 text-left text-sm font-semibold text-rose-900"
              >
                Offer
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {orders?.map((order) => {
              const { odds, collateralSize } = order2ui(order)

              return (
                <tr
                  key={JSON.stringify(order)}
                  className="border-b border-gray-200"
                >
                  <td className="whitespace-nowrap px-2 py-2 text-sm font-medium text-gray-900">
                    {(100 * odds).toFixed(0)}%
                  </td>
                  <td className="whitespace-nowrap py-2 px-2 text-sm text-gray-500">
                    anon offers {displayBN(order.numApples)} YES for{" "}
                    {displayBN(order.numOranges)} NO
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
export default Orders
