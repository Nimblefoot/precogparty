import {
  StatelessTransactButton,
  useTransact,
} from "@/components/TransactButton"
import { BN_, displayBN } from "@/utils/BNutils"
import { amountBoughtAtPercentOdds } from "@/utils/orderMath"
import { RadioGroup } from "@headlessui/react"
import { PublicKey, Transaction } from "@solana/web3.js"
import { BN } from "bn.js"
import clsx from "clsx"
import {
  COLLATERAL_DECIMALS,
  MINT_SET_COST,
  PLACE_ORDER_COST,
  Resolution,
  TAKE_ORDER_COST,
} from "config"
import { queryClient } from "pages/providers"
import { tokenAccountKeys } from "pages/tokenAccountQuery"
import React, { useCallback, useMemo, useRef, useState } from "react"
import useMintContingentSet from "../hooks/useMintContingentSet"
import { orderbookKeys } from "../Orderbook/orderbookQueries"
import usePlaceOrderTxn from "../Orderbook/usePlaceOrder"
import useTakeOrder from "../Orderbook/useTakeOrder"
import { useRelevantOrders } from "./useRelevantOrders"
import { useTakeOrders } from "./useTakeOrders"

const useSellAccounting = (
  marketAddress: PublicKey,
  selling: Resolution,
  amountInput: string,
  price: number
) => {
  const inputAmount = useMemo(
    () => new BN(parseFloat(amountInput) * 10 ** COLLATERAL_DECIMALS),
    [amountInput]
  )

  const relevantOrders = useRelevantOrders(
    marketAddress,
    selling === "yes" ? "no" : "yes"
  )

  const [usdcMade, tokenSpent, orderInteractions] = useMemo(() => {
    const priceRatioMilli = new BN(price * 1000).div(new BN(100 - price))

    // TODO allow input
    if (!relevantOrders) return [undefined, undefined]

    const { total, spent, orderInteractions } = relevantOrders.reduce(
      (acc, x) => {
        const { total, fundsRemaining, spent, orderInteractions } = acc

        // if we have no funds left to spend, continue
        if (fundsRemaining.lten(0)) return acc

        const offering = x.offeringApples ? x.numApples : x.numOranges
        const cost = x.offeringApples ? x.numOranges : x.numApples

        // keep = X / (R + 1)

        // this is how much conditional token gets spent on conversion to usdc;
        // if we are buying X No with Y yes, we spent Y Yes but we also need X Yes to match the No
        const spending = offering.add(cost)

        const offerPrice = offering.mul(new BN(100)).divRound(spending)
        // if the price is not right, continue
        if (offerPrice.lt(new BN(price))) return acc

        if (spending.lte(fundsRemaining)) {
          return {
            total: total.add(offering),
            fundsRemaining: fundsRemaining.sub(spending),
            spent: spent.add(spending),
            orderInteractions: [
              ...orderInteractions,
              { order: x, amountToExchange: cost },
            ],
          }
        } else {
          const buying = fundsRemaining.mul(offering).div(spending)
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
        fundsRemaining: inputAmount,
        spent: new BN(0),
        orderInteractions: [] as {
          order: typeof relevantOrders[number]
          amountToExchange: BN_
        }[],
      }
    )
    return [total, spent, orderInteractions] as const
  }, [inputAmount, price, relevantOrders])

  /* 
  const { totalBought, totalSpend, orderInteractions } = useTakeOrders(
    marketAddress,
    inputAmount,
    resolution,
    resolution === "yes" ? price : 100 - price
  )*/

  const takePrice =
    usdcMade !== undefined &&
    tokenSpent !== undefined &&
    usdcMade.gt(new BN(0)) &&
    tokenSpent.gt(new BN(0))
      ? usdcMade.mul(new BN(100)).divRound(tokenSpent)
      : undefined

  // TODO this is wrong i think
  // should be orderSpendAmount / priceImpliedByOdds, cause we want to spend all the money

  const orderSpendAmount = inputAmount.sub(tokenSpent ?? new BN(0))
  const orderUsdcToMake = orderSpendAmount.mul(new BN(price)).div(new BN(100))

  return {
    taking: {
      orderInteractions,
      usdcMade,
      tokenSpent,
      takePrice,
    },
    orderUsdcToMake,
    orderSpendAmount,
    inputAmount,
  }
}
/* 
const useSubmitSell = ({
  marketAddress,
  amountInput,
  percentOdds,
  resolution,
}: {
  marketAddress: PublicKey
  amountInput: string
  percentOdds: number
  resolution: Resolution
}) => {
  const { orderBuyAmount, orderSpendAmount, taking } = useSellAccounting({
    amountInput,
    percentOdds,
    resolution,
    marketAddress,
  })

  const mintSet = useMintContingentSet(marketAddress)
  const buy = usePlaceOrderTxn(marketAddress)
  const takeOrder = useTakeOrder(marketAddress)

  const { callback, status } = useTransact()

  const submit = useCallback(async () => {
    const mintTxn = await mintSet({
      amount: orderSpendAmount.add(taking.totalSpend ?? new BN(0)),
    })

    const placeTxn = orderSpendAmount.gt(new BN(0))
      ? await buy({
          offeringYes: resolution === "no",
          numNo:
            resolution === "yes"
              ? orderSpendAmount
              : orderBuyAmount.sub(orderSpendAmount),
          numYes:
            resolution === "yes"
              ? orderBuyAmount.sub(orderSpendAmount)
              : orderSpendAmount,
        })
      : undefined
    const placeIxs = placeTxn ? placeTxn.instructions : []

    const takeTxns =
      taking.orderInteractions &&
      (await Promise.all(
        taking.orderInteractions.map((x) =>
          takeOrder({
            order: x.order,
            pageNumber: x.order.page,
            index: x.order.index,
            amountToExchange: x.amountToExchange,
          })
        )
      ))

    const takeIxs = takeTxns ? takeTxns.flatMap((tx) => tx.instructions) : []

    const computeCost =
      MINT_SET_COST +
      takeIxs.length * TAKE_ORDER_COST +
      (placeTxn ? PLACE_ORDER_COST : 0)

    const txn = new Transaction().add(
      ...mintTxn.instructions,
      ...placeIxs,
      ...takeIxs
    )

    console.log(txn)
    await callback(txn)
    queryClient.invalidateQueries(orderbookKeys.book(marketAddress))
    // TODO invalidate the correct keys
    queryClient.invalidateQueries(tokenAccountKeys.all)
  }, [
    buy,
    callback,
    marketAddress,
    mintSet,
    orderBuyAmount,
    orderSpendAmount,
    resolution,
    takeOrder,
    taking.orderInteractions,
    taking.totalSpend,
  ])

  return { submit, status }
} */

// TODO display balances
export function Sell({
  marketAddress,
  selling,
}: {
  marketAddress: PublicKey
  selling: Resolution
}) {
  const [price, setPrice] = useState<number>(80)
  const [amountInput, setAmountInput] = useState<string>("")
  const [resolution, setResolution] = useState<Resolution>("yes")

  const inputRef = useRef(null)
  /* 
  const { submit, status } = useSubmitSell({
    percentOdds: price,
    amountInput,
    resolution,
    marketAddress,
  }) */

  const {
    taking: { tokenSpent, takePrice, usdcMade },
    orderSpendAmount,
  } = useSellAccounting(marketAddress, selling, amountInput, price)

  const ready = amountInput !== ""

  return (
    <>
      <div
        data-name="INPUTS"
        className={`
          px-4 py-5 sm:px-6 flex gap-2 border-b border-gray-200 content-center flex-col
        `}
      >
        <div className="flex justify-between gap-4">
          <div data-name={"SELL PRICE INPUT"} className="w-full">
            <div className="flex justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Minimum price
              </label>
            </div>
            <div className="mt-1 relative rounded-md shadow-sm w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">¢</span>
              </div>
              <input
                ref={inputRef}
                type="number"
                step="1"
                min="1"
                max="99"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                placeholder="0.00"
                aria-describedby="price-currency"
                value={price ?? ""}
                onChange={(e) => {
                  setPrice(parseInt(e.target.value) || 1)
                }}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm" id="price-currency">
                  USDC
                </span>
              </div>
            </div>
          </div>
          <div data-name={"SELL AMOUNT INPUT"} className="w-full">
            <div className="flex justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Amount
              </label>
            </div>
            <div className="mt-1 relative rounded-md shadow-sm w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                ref={inputRef}
                type="number"
                step="0.001"
                min="0"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                placeholder="0.00"
                aria-describedby="price-currency"
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(e.target.value)
                }}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm" id="price-currency">
                  {selling.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        data-name="EXPLAIN TRANSACTION"
        className={`
          px-4 py-5 sm:px-6 flex border-b border-gray-200 content-center flex-col text-sm text-gray-700
          ${ready ? "" : "hidden"}
        `}
      >
        <p>This transaction will:</p>
        <ol>
          {tokenSpent && takePrice && usdcMade ? (
            <li>
              - Instantly sell{" "}
              <span
                className={clsx(
                  "font-medium",
                  resolution === "yes" ? "text-lime-700" : "text-rose-700"
                )}
              >
                ${displayBN(tokenSpent)} {resolution.toUpperCase()}
              </span>{" "}
              at {takePrice.toString()}¢ for {displayBN(usdcMade)} USDC
            </li>
          ) : undefined}
          {orderSpendAmount.gt(new BN(0)) ? (
            <li>
              - Place a limit order to sell{" "}
              <span
                className={clsx(
                  "font-medium",
                  resolution === "yes" ? "text-lime-700" : "text-rose-700"
                )}
              >
                ${displayBN(orderSpendAmount)} {resolution.toUpperCase()}
              </span>{" "}
              at {price}¢{" "}
            </li>
          ) : undefined}
        </ol>
      </div>
      <div className="px-4 py-5  sm:px-6 w-full">
        <StatelessTransactButton
          status={"done"}
          verb={"Sell " + resolution.toUpperCase()}
          onClick={async () => {
            try {
              // await submit()
              setAmountInput("")
            } catch {}
          }}
          className="w-full"
          disabled={!ready}
        />
      </div>
    </>
  )
}