import {
  StatelessTransactButton,
  useTransact,
} from "@/components/TransactButton"
import { displayBN } from "@/utils/BNutils"
import interpolateOddsColors from "@/utils/interpolateOddsColors"
import {
  amountBoughtAtPercentOdds,
  BN_,
  order2ui,
  ui2placeOrderFields,
} from "@/utils/orderMath"
import { RadioGroup } from "@headlessui/react"
import { PublicKey, Transaction } from "@solana/web3.js"
import { BN } from "bn.js"
import clsx from "clsx"
import { COLLATERAL_DECIMALS, Resolution } from "config"
import { queryClient } from "pages/providers"
import { tokenAccountKeys, useTokenAccount } from "pages/tokenAccountQuery"
import React, { useCallback, useMemo, useRef, useState } from "react"
import useMintContingentSet from "../hooks/useMintContingentSet"
import { orderbookKeys, useOrderbook } from "../Orderbook/orderbookQueries"
import { PlaceExitOrder } from "../Orderbook/PlaceExitOrder"
import { Splitty } from "../Orderbook/Splitty"
import { useSellable } from "../Orderbook/TakeExitOrder"
import usePlaceOrderTxn, { useResolutionMint } from "../Orderbook/usePlaceOrder"

const useTakeBuyAccounting = (
  marketAddress: PublicKey,
  usdcInput: string,
  taking: Resolution,
  percentOdds: number
) => {
  const orderbook = useOrderbook(marketAddress)

  // TODO refactor to query
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

  const [totalSharesRecieved, totalSpend, orderInteractions] = useMemo(() => {
    const value = new BN(parseFloat(usdcInput) * 10 ** COLLATERAL_DECIMALS)

    // Odds ratio of YES:NO, times 1000
    const oddsRatioMilli = new BN(percentOdds * 1000).div(
      new BN(100 - percentOdds)
    )

    // TODO allow input
    if (!relevantOrders) return [undefined, undefined]

    const { total, spent, orderInteractions } = relevantOrders.reduce(
      (acc, x) => {
        const { total, fundsRemaining, spent, orderInteractions } = acc

        // if we have no funds left to spend, continue
        if (fundsRemaining.lten(0)) return acc

        // if the price is not right, continue
        const orderOddsRatioMilli = x.numOranges
          .mul(new BN(1000))
          .div(x.numApples)
        if (
          taking === "yes"
            ? // if we are buying yes then we want the order's odds ratio to be below ours (we only buy if the event is more likely to us than them)
              orderOddsRatioMilli.gt(oddsRatioMilli)
            : // if we are buying no then we want the order's odds ratio to be above ours
              orderOddsRatioMilli.lt(oddsRatioMilli)
        )
          return acc

        const offering = x.offeringApples ? x.numApples : x.numOranges
        const cost = x.offeringApples ? x.numOranges : x.numApples

        if (cost.lte(fundsRemaining)) {
          return {
            total: total.add(offering).add(cost),
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
            total: total.add(buying).add(fundsRemaining),
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
    return [total, spent, orderInteractions] as const
  }, [percentOdds, relevantOrders, taking, usdcInput])

  const priceCents =
    totalSharesRecieved !== undefined &&
    totalSpend !== undefined &&
    totalSharesRecieved.gt(new BN(0)) &&
    totalSpend.gt(new BN(0))
      ? totalSpend.mul(new BN(100)).divRound(totalSharesRecieved)
      : undefined

  return { priceCents, totalSharesRecieved, totalSpend, orderInteractions }
}

const useSubmitBet = ({
  marketAddress,
  usdcInput,
  percentOdds,
  resolution,
}: {
  marketAddress: PublicKey
  usdcInput: string
  percentOdds: number
  resolution: Resolution
}) => {
  const yesMint = useResolutionMint(marketAddress, "yes")
  const noMint = useResolutionMint(marketAddress, "no")

  const yesAccount = useTokenAccount(yesMint)
  const noAccount = useTokenAccount(noMint)

  const mintSet = useMintContingentSet(marketAddress)
  const buy = usePlaceOrderTxn(marketAddress)

  const { callback, status } = useTransact()

  const submit = useCallback(async () => {
    const inputAmount = new BN(
      parseFloat(usdcInput) * 10 ** COLLATERAL_DECIMALS
    )
    const mintTxn = await mintSet({ amount: inputAmount })

    const { offeringApples, numApples, numOranges } = ui2placeOrderFields({
      odds: percentOdds / 100,
      collateralSize: parseFloat(usdcInput),
      forResolution: resolution,
    })

    const buyTxn = await buy({
      offeringYes: offeringApples,
      numNo: numOranges,
      numYes: numApples,
    })

    const txn = new Transaction().add(
      ...mintTxn.instructions,
      ...buyTxn.instructions
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
    percentOdds,
    resolution,
    usdcInput,
  ])

  return { submit, status }
}

const useBetAccounting = ({
  usdcInput,
  percentOdds,
  resolution,
}: {
  usdcInput: string
  percentOdds: number
  resolution: Resolution
}) => {
  const inputAmount = new BN(parseFloat(usdcInput) * 10 ** COLLATERAL_DECIMALS)
  const positionOutput = amountBoughtAtPercentOdds({
    percentOdds: resolution === "yes" ? percentOdds : 100 - percentOdds,
    inputAmount,
  })
  return { positionOutput }
}

const RESOLUTIONS = ["yes", "no"] as const

// TODO cool css transitions when switching modes
// TODO display balances
export function Bet({ marketAddress }: { marketAddress: PublicKey }) {
  const [percentOdds, setPercentOdds] = useState<number>(80)
  const [usdcInput, setUsdcInput] = useState<string>("")
  const [resolution, setResolution] = useState<Resolution>("yes")

  const inputRef = useRef(null)

  const { submit, status } = useSubmitBet({
    percentOdds,
    usdcInput,
    resolution,
    marketAddress,
  })

  const { totalSharesRecieved, totalSpend, priceCents } = useTakeBuyAccounting(
    marketAddress,
    usdcInput,
    resolution,
    percentOdds
  )

  const { positionOutput } = useBetAccounting({
    usdcInput,
    percentOdds,
    resolution,
  })

  const step1 =
    totalSharesRecieved && priceCents
      ? `Instantly buy ${displayBN(
          totalSharesRecieved
        )} ${resolution.toUpperCase()} shares at ${priceCents.toString()}c`
      : undefined

  const placeToBuyAmount = positionOutput.sub(totalSharesRecieved ?? new BN(0))
  const step2 = placeToBuyAmount.gt(new BN(0))
    ? `Place a limit order to buy ${displayBN(
        placeToBuyAmount
      )} ${resolution.toUpperCase()} shares at ${
        resolution === "yes" ? percentOdds : 100 - percentOdds
      }c`
    : undefined

  return (
    <>
      <div
        data-name="INPUTS"
        className={`
          px-4 py-5 sm:px-6 flex gap-2 border-b border-gray-200 content-center flex-col
        `}
      >
        <div data-name="PROBABILITY SLIDER">
          <div className="flex justify-between">
            <div className="flex flex-col justify-end">
              <label className="block text-sm font-medium text-gray-700">
                Odds of YES
              </label>
            </div>
            <div className="flex justify-center text-lg font-medium">
              {percentOdds}%
            </div>
          </div>
          <div className="relative pt-1">
            <input
              type="range"
              min="1"
              max="99"
              step="1"
              value={percentOdds}
              onChange={(e) =>
                setPercentOdds(Math.round(parseFloat(e.target.value)))
              }
              className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700`}
              /* style={{
                accentColor: interpolateOddsColors(percentOdds),
              }} */
            />
          </div>
        </div>
        <div data-name={"WAGER AMOUNT INPUT"} className="w-full">
          <div className="flex justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Your wager
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
              <span className="text-gray-500 sm:text-sm" id="price-currency">
                USDC
              </span>
            </div>
          </div>
        </div>
        <Splitty resolution={resolution} />
        <div data-name={"YES/NO SELECTION"}>
          <RadioGroup value={resolution} onChange={setResolution}>
            <div className="bg-white rounded-md -space-x-px flex">
              {RESOLUTIONS.map((r, index) => {
                return (
                  <RadioGroup.Option
                    key={r}
                    value={r}
                    className={({ checked }) =>
                      clsx(
                        index === 0 && "rounded-tl-md rounded-bl-md",
                        index === RESOLUTIONS.length - 1 &&
                          "rounded-tr-md rounded-br-md",
                        checked
                          ? r === "yes"
                            ? "bg-lime-50 border-lime-200 z-10"
                            : "bg-rose-50 border-rose-200 z-10"
                          : "border-gray-200",
                        "relative border p-2 flex flex-col cursor-pointer md:pl-4 md:pr-6 flex-1 focus:outline-none"
                      )
                    }
                  >
                    {({ active, checked }) => (
                      <>
                        <span className="flex items-center text-sm">
                          <span
                            className={clsx(
                              checked
                                ? r === "yes"
                                  ? "bg-lime-600 border-transparent"
                                  : "bg-rose-600 border-transparent"
                                : "bg-white border-gray-300",
                              active
                                ? r === "yes"
                                  ? `ring-2 ring-offset-2 ring-lime-500`
                                  : `ring-2 ring-offset-2 ring-rose-500`
                                : "",
                              "h-4 w-4 rounded-full border flex items-center justify-center"
                            )}
                            aria-hidden="true"
                          >
                            <span className="rounded-full bg-white w-1.5 h-1.5" />
                          </span>
                          <RadioGroup.Label
                            as="span"
                            className={clsx(
                              checked
                                ? r === "yes"
                                  ? "text-lime-900"
                                  : "text-rose-900"
                                : "text-gray-900",
                              "ml-3 font-medium"
                            )}
                          >
                            Bet {r.toUpperCase()}
                          </RadioGroup.Label>
                        </span>
                      </>
                    )}
                  </RadioGroup.Option>
                )
              })}
            </div>
          </RadioGroup>
        </div>
      </div>
      <div
        data-name="EXPLAIN TRANSACTION"
        className={`
          px-4 py-5 sm:px-6 flex gap-2 border-b border-gray-200 content-center flex-col text-sm
        `}
      >
        <p>This transaction will:</p>
        <ol>
          <li>{step1}</li>
          <li>{step2}</li>
        </ol>
      </div>
      <div className="px-4 py-5  sm:px-6 w-full">
        <StatelessTransactButton
          status={status}
          verb={"Buy " + resolution.toUpperCase()}
          onClick={async () => {
            try {
              await submit()
              setUsdcInput("")
            } catch {}
          }}
          className="w-full"
          disabled={usdcInput === ""}
        />
      </div>
    </>
  )
}

const BetPanel = ({ marketAddress }: { marketAddress: PublicKey }) => {
  const sellable = useSellable(marketAddress)

  return (
    <div className="shadow bg-white rounded-lg">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Place your bet
        </h3>
      </div>
      <div>
        <Bet marketAddress={marketAddress} />
      </div>
    </div>
  )
}

export default BetPanel
