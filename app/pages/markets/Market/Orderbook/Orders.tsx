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
import { BN_, displayBN, displayOddsBN, order2ui } from "./util"
import clsx from "clsx"

const Orders = ({ marketAddress }: { marketAddress: PublicKey }) => {
  const orderbook = useOrderbook(marketAddress)
  const orders = useMemo(
    () =>
      orderbook.data?.pages
        .flatMap((page) => page.list)
        .sort((a, b) => a.price.toNumber() - b.price.toNumber()),
    [orderbook.data?.pages]
  )
  const yesOrders = useMemo(() => orders?.filter((x) => x.buy), [orders])
  const noOrders = useMemo(() => orders?.filter((x) => !x.buy), [orders])

  return (
    <>
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg w-full">
        <div className="grid grid-cols-2">
          <YesOrderColumn orders={yesOrders} />
          <NoOrderColumn orders={noOrders} />
        </div>
      </div>
    </>
  )
}

const DECIMAL_MULTIPLIER = new BN(10 ** ORDERBOOK_PRICE_RATIO_DECIMALS)
const AMOUNT_MULTIPLIER = new BN(10 ** COLLATERAL_DECIMALS)

const YesOrderColumn = ({ orders }: { orders?: OrderFields[] }) => {
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
                Buying
              </th>
              <th
                scope="col"
                className="whitespace-nowrap px-2 py-3.5 text-sm font-semibold text-lime-900"
              >
                YES %
              </th>
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
                    {collateralSize}
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
              >
                NO %
              </th>
              <th
                scope="col"
                className="whitespace-nowrap py-3.5 px-2 text-left text-sm font-semibold text-rose-900"
              >
                Buying
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
                    {collateralSize}
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
