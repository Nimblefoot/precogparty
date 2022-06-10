import { OrderFields } from "@/generated/syrup/types"
import { PublicKey } from "@solana/web3.js"
import React, { useMemo } from "react"
import { useOrderbook } from "./orderbookQueries"
import { order2ui } from "src/utils/orderMath"
import { displayBN } from "src/utils/BNutils"
import { Resolution } from "config"
import clsx from "clsx"
import { UserSmall } from "src/pages/markets/User"

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
        <div className="grid grid-cols-2 divide-x divide-gray-300">
          <OrderColumn orders={yesOffers} resolution="yes" />

          <OrderColumn orders={noOffers} resolution="no" />
        </div>
      </div>
    </>
  )
}

const OrderColumn = ({
  orders,
  resolution,
}: {
  orders?: OrderFields[]
  resolution: Resolution
}) => {
  const headers = useMemo(
    () => [
      <th
        key="user"
        scope="col"
        className={clsx(
          "whitespace-nowrap px-2 py-3.5 text-sm",
          resolution === "yes" ? "pl-6 text-left" : "pr-6 text-right"
        )}
      >
        Offerer
      </th>,
      <th
        key="offer"
        scope="col"
        className="whitespace-nowrap px-2 py-3.5 text-sm"
      >
        Size ({resolution.toUpperCase()})
      </th>,
      <th
        key="price"
        scope="col"
        className="whitespace-nowrap px-2 py-3.5 text-sm"
      >
        Price
      </th>,
    ],
    [resolution]
  )

  return (
    <div
      className={clsx(
        "flex flex-col -mb-[1px]",
        resolution === "yes" ? "text-right" : "text-left"
      )}
    >
      <div className="inline-block min-w-full align-middle">
        <table className="min-w-full">
          <thead
            className={clsx(
              "border-b ",
              resolution === "yes"
                ? "bg-gray-50 border-lime-300"
                : "bg-gray-50 border-rose-300"
            )}
          >
            <tr
              className={clsx(
                "font-semibold",
                resolution === "yes" ? "text-lime-900" : "text-rose-900"
              )}
            >
              {resolution === "yes" ? headers : [...headers].reverse()}
            </tr>
          </thead>
          <tbody className="bg-white">
            {orders?.map((order) => {
              const { odds } = order2ui(order)

              const price =
                (resolution === "yes"
                  ? (100 * odds).toFixed(0)
                  : (100 - 100 * odds).toFixed(0)) + "¢"

              const size = displayBN(order.numApples.add(order.numOranges))

              return (
                <tr
                  key={JSON.stringify(order)}
                  className="border-b border-gray-200 text-sm"
                >
                  <td
                    className={clsx(
                      "p-2 font-medium text-gray-900",
                      resolution === "yes" && "pl-6 flex"
                    )}
                  >
                    {resolution === "yes" ? (
                      <UserSmall publicKey={order.user} />
                    ) : (
                      price
                    )}
                  </td>
                  <td
                    className={clsx(
                      "whitespace-nowrap px-2 py-2",
                      "text-gray-500"
                    )}
                  >
                    {size}
                  </td>
                  <td
                    className={clsx(
                      "p-2 font-medium text-gray-900",
                      resolution === "no" && "justify-end pr-6 flex"
                    )}
                  >
                    {resolution === "no" ? (
                      <UserSmall publicKey={order.user} />
                    ) : (
                      price
                    )}
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
