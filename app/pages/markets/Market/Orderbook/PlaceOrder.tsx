import {
  StatelessTransactButton,
  useTransact,
} from "@/components/TransactButton"
import { PROGRAM_ID } from "@/generated/client/programId"
import { ui2placeOrderFields } from "@/utils/orderMath"
import { getAssociatedTokenAddress } from "@solana/spl-token"
import { PublicKey, Transaction } from "@solana/web3.js"
import { BN } from "bn.js"
import clsx from "clsx"
import {
  COLLATERAL_DECIMALS,
  ORDERBOOK_PRICE_RATIO_DECIMALS,
  Resolution,
} from "config"
import { queryClient } from "pages/providers"
import { tokenAccountKeys, useTokenAccount } from "pages/tokenAccountQuery"
import React, { useCallback, useMemo, useRef, useState } from "react"
import { useMarket } from "../hooks/marketQueries"
import useMintContingentSet from "../hooks/useMintContingentSet"
import { orderbookKeys } from "./orderbookQueries"
import { PlaceExitOrder } from "./PlaceExitOrder"
import { Splitty } from "./Splitty"
import { useSellable } from "./TakeExitOrder"
import usePlaceOrderTxn, { useResolutionMint } from "./usePlaceOrder"

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

type Mode = "buy" | "sell"
// TODO cool css transitions when switching modes
// TODO display balances
export function PlaceOrderPanel({
  marketAddress,
}: {
  marketAddress: PublicKey
}) {
  const [percentOdds, setPercentOdds] = useState<number>(80)
  const [usdcInput, setUsdcInput] = useState<string>("")

  const [resolution, setResolution] = useState<Resolution>("yes")

  const yesMint = useResolutionMint(marketAddress, "yes")
  const noMint = useResolutionMint(marketAddress, "no")

  const yesAccount = useTokenAccount(yesMint)
  const noAccount = useTokenAccount(noMint)

  const mintSet = useMintContingentSet(marketAddress)
  const buy = usePlaceOrderTxn(marketAddress)

  const inputRef = useRef(null)

  const { callback, status } = useTransact()

  const onSubmit = useCallback(async () => {
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
    setUsdcInput("")
  }, [
    buy,
    callback,
    marketAddress,
    mintSet,
    percentOdds,
    resolution,
    usdcInput,
  ])

  const yesOutput = ((100 * parseFloat(usdcInput)) / percentOdds).toFixed(2)
  const noOutput = (
    (100 * parseFloat(usdcInput)) /
    (100 - percentOdds)
  ).toFixed(2)

  return (
    <>
      <div
        className={`
          px-4 py-5 sm:px-6 flex gap-2 border-b border-gray-200 content-center flex-col
        `}
      >
        <div>
          <div className="flex justify-center text-lg font-medium">
            {percentOdds}%
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
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>
        </div>

        <div className="flex gap-2">
          {/* USDC input */}

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
        <div className="flex gap-2">
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-lime-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              step="0.001"
              min="0"
              className={`
                  block w-full pl-7 pr-12 sm:text-sm border-lime-300 rounded-md bg-lime-100 text-lime-500 placeholder:text-lime-400
                  ${resolution === "yes" ? "" : "opacity-50"}
                `}
              placeholder="0.00"
              aria-describedby="price-currency"
              onSelect={() => setResolution("yes")}
              value={yesOutput}
              readOnly
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-lime-500 sm:text-sm" id="price-currency">
                YES
              </span>
            </div>
          </div>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-rose-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              step="0.001"
              min="0"
              className={`
                  block w-full pl-7 pr-12 sm:text-sm border-rose-300 rounded-md bg-rose-100 text-rose-500 placeholder:text-rose-300
                  ${resolution === "no" ? "" : "opacity-50"}
                `}
              placeholder="0.00"
              aria-describedby="price-currency"
              onSelect={() => setResolution("no")}
              value={noOutput}
              readOnly
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-rose-500 sm:text-sm" id="price-currency">
                NO
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 py-5  sm:px-6 w-full">
        <StatelessTransactButton
          status={status}
          verb={"Buy " + resolution.toUpperCase()}
          onClick={onSubmit}
          className="w-full"
          disabled={usdcInput === ""}
        />
      </div>
    </>
  )
}

const PlaceOrder = ({ marketAddress }: { marketAddress: PublicKey }) => {
  const [mode, setMode] = useState<Mode>("buy")

  const sellable = useSellable(marketAddress)

  return (
    <div className="shadow bg-white rounded-lg">
      <div className="px-4 pt-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Offer odds
        </h3>
        <nav className="-mb-px flex space-x-8 mt-3 sm:mt-4">
          {(["buy", "sell"] as const).map((tab) => (
            <a
              key={tab}
              onClick={(e) => {
                setMode(tab)
                //;(inputRef as any)?.current.focus()
              }}
              className={clsx(
                tab === mode
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                "whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm",
                !(sellable.yes || sellable.no) && tab === "sell" && "hidden"
              )}
            >
              {capitalizeFirstLetter(tab)}
            </a>
          ))}
        </nav>
      </div>
      <div className={mode === "buy" ? "" : "hidden"}>
        <PlaceOrderPanel marketAddress={marketAddress} />
      </div>
      <div className={mode === "sell" ? "" : "hidden"}>
        <PlaceExitOrder marketAddress={marketAddress} />
      </div>
    </div>
  )
}

export default PlaceOrder
