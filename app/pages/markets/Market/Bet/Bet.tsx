import {
  StatelessTransactButton,
  useTransact,
} from "@/components/TransactButton"
import interpolateOddsColors from "@/utils/interpolateOddsColors"
import { ui2placeOrderFields } from "@/utils/orderMath"
import { RadioGroup } from "@headlessui/react"
import { PublicKey, Transaction } from "@solana/web3.js"
import { BN } from "bn.js"
import clsx from "clsx"
import { COLLATERAL_DECIMALS, Resolution } from "config"
import { queryClient } from "pages/providers"
import { tokenAccountKeys, useTokenAccount } from "pages/tokenAccountQuery"
import React, { useCallback, useRef, useState } from "react"
import useMintContingentSet from "../hooks/useMintContingentSet"
import { orderbookKeys } from "../Orderbook/orderbookQueries"
import { PlaceExitOrder } from "../Orderbook/PlaceExitOrder"
import { Splitty } from "../Orderbook/Splitty"
import { useSellable } from "../Orderbook/TakeExitOrder"
import usePlaceOrderTxn, { useResolutionMint } from "../Orderbook/usePlaceOrder"

const RESOLUTIONS = ["yes", "no"] as const

// TODO cool css transitions when switching modes
// TODO display balances
export function Bet({ marketAddress }: { marketAddress: PublicKey }) {
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
        <div className="flex gap-2">
          {/* USDC input */}

          <div className="w-full">
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
        </div>

        <Splitty resolution={resolution} />
        <div>
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
                        "relative border p-4 flex flex-col cursor-pointer md:pl-4 md:pr-6 flex-1 focus:outline-none"
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
