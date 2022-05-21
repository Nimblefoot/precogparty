import { Splitty } from "./Splitty"
import { PublicKey, Transaction } from "@solana/web3.js"
import { COLLATERAL_DECIMALS, Resolution } from "config"
import React, { useMemo, useRef, useState } from "react"
import Orders from "./Orders"
import clsx from "clsx"
import { BN_, order2ui } from "@/utils/orderMath"
import { orderbookKeys, useOrderbook } from "./orderbookQueries"
import { BN } from "bn.js"
import { displayBN } from "./util"
import {
  StatelessTransactButton,
  useTransact,
} from "@/components/TransactButton"
import useTakeOrder from "./useTakeOrder"
import useMintContingentSet from "../hooks/useMintContingentSet"
import { queryClient } from "pages/providers"
import { tokenAccountKeys } from "pages/tokenAccountQuery"

const TakeOrder = ({ marketAddress }: { marketAddress: PublicKey }) => {
  const [taking, setTaking] = useState<Resolution>("yes")
  const [usdcInput, setUsdcInput] = useState<string>("")

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

  const relevantOrders = useMemo(
    () =>
      orders
        ?.filter((x) =>
          taking === "yes" ? x.offeringApples : !x.offeringApples
        )
        .sort((a, b) => (taking === "yes" ? a.odds - b.odds : b.odds - a.odds)),
    [orders, taking]
  )

  const totalOffered = useMemo(
    () =>
      relevantOrders
        ?.reduce(
          (total, x) =>
            total.add(taking === "yes" ? x.numApples : x.numOranges),
          new BN(0)
        )
        .toNumber(),
    [relevantOrders, taking]
  )

  const [positionInput, orderInteractions] = useMemo(() => {
    const value = new BN(parseFloat(usdcInput) * 10 ** COLLATERAL_DECIMALS)

    // TODO allow input
    if (!relevantOrders) return [undefined, undefined]

    const { total, spent, fundsRemaining, orderInteractions } =
      relevantOrders.reduce(
        (acc, x) => {
          const { total, fundsRemaining, spent, orderInteractions } = acc
          if (fundsRemaining.lten(0)) return acc

          const offering = x.offeringApples ? x.numApples : x.numOranges
          const cost = x.offeringApples ? x.numOranges : x.numApples
          if (cost.lte(fundsRemaining)) {
            return {
              total: total.add(offering),
              fundsRemaining: fundsRemaining.sub(cost),
              spent: spent.add(cost),
              orderInteractions: [
                ...orderInteractions,
                { order: x, amountToExchange: cost },
              ],
            }
          } else {
            const buying = fundsRemaining.mul(offering).div(cost)
            return {
              total: total.add(buying),
              fundsRemaining: new BN(0),
              spent: spent.add(fundsRemaining),
              orderInteractions: [
                ...orderInteractions,
                { order: x, amountToExchange: fundsRemaining },
              ],
            }
          }
        },
        {
          total: new BN(0),
          fundsRemaining: value,
          spent: new BN(0),
          orderInteractions: [] as {
            order: typeof relevantOrders[number]
            amountToExchange: BN_
          }[],
        }
      )
    /* 
    if (spent.lt(value)) {
      setUsdcInput(displayBN(spent))
    } else {
      setUsdcInput(e.target.value)
    } */
    return [displayBN(total), orderInteractions] as const
  }, [relevantOrders, usdcInput])

  const takeOrder = useTakeOrder(marketAddress)
  const mintSet = useMintContingentSet(marketAddress)
  const { callback, status } = useTransact()

  const onSubmit = async () => {
    if (!orderInteractions) return

    const txns = await Promise.all(
      orderInteractions.map((x) =>
        takeOrder({
          order: x.order,
          pageNumber: x.order.page,
          index: x.order.index,
          amountToExchange: x.amountToExchange,
        })
      )
    )

    const takeIxs = txns.flatMap((tx) => tx.instructions)

    const inputAmount = new BN(
      parseFloat(usdcInput) * 10 ** COLLATERAL_DECIMALS
    )
    const mintTxn = await mintSet({ amount: inputAmount })

    const txn = new Transaction().add(...mintTxn.instructions, ...takeIxs)
    await callback(txn)
    queryClient.invalidateQueries(orderbookKeys.book(marketAddress))
    // TODO invalidate the correct keys
    queryClient.invalidateQueries(tokenAccountKeys.all)
    setUsdcInput("")
  }

  console.log("total offered", totalOffered?.toString())

  return (
    <div>
      <div className="shadow bg-white rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Take odds
          </h3>
        </div>
        <div className="px-4 py-5 sm:px-6 flex flex-col gap-4 border-b border-gray-200 w-full">
          <Orders marketAddress={marketAddress} />
          <div
            className={`
              flex gap-2 content-center flex-col
            `}
          >
            <div className="flex gap-2">
              {/* USDC input */}

              <div className="mt-1 relative rounded-md shadow-sm w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  name="price"
                  id="price"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="0.00"
                  aria-describedby="price-currency"
                  value={usdcInput}
                  onChange={(e) => {
                    setUsdcInput(e.target.value)
                  }}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span
                    className="text-gray-500 sm:text-sm"
                    id="price-currency"
                  >
                    USDC
                  </span>
                </div>
              </div>
            </div>

            {/* little splitter art :-) */}
            <Splitty resolution={taking} />
            <div className="flex gap-2 w-full">
              {(["yes", "no"] as const).map((resolution) => {
                return (
                  <div
                    key={resolution}
                    className={clsx(
                      "mt-1 relative rounded-md shadow-sm border transition-all",
                      resolution === "yes"
                        ? "border-lime-300 bg-lime-100"
                        : "border-rose-300 bg-rose-100",
                      taking === resolution ? "grow" : "grow-0"
                    )}
                    onClick={() => setTaking(resolution)}
                  >
                    <div
                      className={clsx(
                        "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none",
                        taking !== resolution && "hidden"
                      )}
                    >
                      <span
                        className={clsx(
                          "sm:text-sm",
                          resolution === "yes"
                            ? "text-lime-500"
                            : "text-rose-500"
                        )}
                      >
                        $
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      //max={totalOffered?.toString()}
                      className={clsx(
                        "block w-full pl-7 pr-12 sm:text-sm border-0 rounded-md ",
                        resolution === "yes"
                          ? "bg-lime-100 text-lime-500 placeholder:text-lime-400"
                          : "bg-rose-100 text-rose-500 placeholder:text-rose-400",
                        taking === resolution ? "" : "opacity-50 hidden"
                      )}
                      placeholder="0.00"
                      aria-describedby="price-currency"
                      value={positionInput}
                      readOnly
                    />
                    <div
                      className={clsx(
                        "flex items-center pointer-events-none",
                        taking === resolution
                          ? "absolute inset-y-0 right-0 pr-3"
                          : "mx-5 h-full"
                      )}
                    >
                      <span
                        className={clsx(
                          "sm:text-sm whitespace-nowrap",
                          resolution === "yes"
                            ? "text-lime-500"
                            : "text-rose-500"
                        )}
                        id="price-currency"
                      >
                        {resolution !== taking && "Buy "}
                        {resolution.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <div className="px-4 py-5  sm:px-6 w-full">
          <StatelessTransactButton
            status={status}
            verb={"Take Order"}
            onClick={onSubmit}
            className="w-full"
            disabled={usdcInput === ""}
          />
        </div>
      </div>
    </div>
  )
}

export default TakeOrder
