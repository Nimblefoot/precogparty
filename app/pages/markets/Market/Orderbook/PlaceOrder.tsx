import {
  StatelessTransactButton,
  useTransact,
} from "@/components/TransactButton"
import { PROGRAM_ID } from "@/generated/client/programId"
import { getAssociatedTokenAddress } from "@solana/spl-token"
import { PublicKey, Transaction } from "@solana/web3.js"
import { BN } from "bn.js"
import {
  COLLATERAL_DECIMALS,
  ORDERBOOK_PRICE_RATIO_DECIMALS,
  Resolution,
} from "config"
import { queryClient } from "pages/providers"
import { useTokenAccount } from "pages/tokenAccountQuery"
import React, { useCallback, useMemo, useRef, useState } from "react"
import { useMarket } from "../hooks/marketQueries"
import useMintContingentSet from "../hooks/useMintContingentSet"
import { orderbookKeys } from "./orderbookQueries"
import usePlaceOrderTxn, { useResolutionMint } from "./usePlaceOrder"

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}
function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

type Mode = "buy" | "trade"
// TODO cool css transitions when switching modes
// TODO display balances
export function PlaceOrderPanel({
  marketAddress,
}: {
  marketAddress: PublicKey
}) {
  const [odds, setOdds] = useState<number>(0.8)
  const [inputSize, setInputSize] = useState<number>(0)
  const [mode, setMode] = useState<Mode>("buy")
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
    if (inputSize === 0) return

    const price = new BN(
      Math.round((odds / (1 - odds)) * 10 ** ORDERBOOK_PRICE_RATIO_DECIMALS)
    )
    const size = new BN(inputSize * 10 ** COLLATERAL_DECIMALS)

    const mintTxn = await mintSet({ amount: size })

    console.log("price", price.toString(), odds / 1 - odds)

    const buyTxn = await buy({
      price: price,
      yesForNo: resolution === "yes",
      size,
    })

    const txn = new Transaction().add(
      ...mintTxn.instructions,
      ...buyTxn.instructions
    )

    console.log(txn)
    await callback(txn)
    queryClient.invalidateQueries(orderbookKeys.book(marketAddress))
  }, [buy, callback, inputSize, marketAddress, mintSet, odds, resolution])

  const yesOutput = inputSize / odds
  const noOutput = inputSize / (1 - odds)

  return (
    <>
      <div className="shadow bg-white rounded-lg">
        <div className="px-4 pt-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Offer odds
          </h3>
          <nav className="-mb-px flex space-x-8 mt-3 sm:mt-4">
            {(["buy", "trade"] as const).map((tab) => (
              <a
                key={tab}
                onClick={(e) => {
                  setMode(tab)
                  ;(inputRef as any)?.current.focus()
                }}
                className={classNames(
                  tab === mode
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                  "whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm"
                )}
              >
                {capitalizeFirstLetter(tab)}
              </a>
            ))}
          </nav>
        </div>
        <div
          className={`
          px-4 py-5 sm:px-6 flex gap-2 border-b border-gray-200 content-center flex-col
        `}
        >
          <div className="relative pt-1">
            <input
              type="range"
              min=".01"
              max=".99"
              step="0.01"
              value={odds}
              onChange={(e) => setOdds(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
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
                value={inputSize.toString()}
                onChange={(e) => {
                  const input = parseFloat(e.target.value)

                  setInputSize(input)
                }}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm" id="price-currency">
                  USDC
                </span>
              </div>
            </div>
          </div>

          {/* little splitter art :-) */}
          <div className="grid grid-cols-2 w-[50%] self-center">
            <div
              className={`border-r border-b rounded-br-md ml-2 mb-[-1px] mr-[-0.5px] h-2
                ${
                  resolution === "no" ? "border-transparent" : "border-gray-400"
                }
              `}
            />
            <div
              className={`border-l border-b rounded-bl-md mr-2 mb-[-1px] ml-[-0.5px] h-2
                ${
                  resolution === "yes"
                    ? "border-transparent"
                    : "border-gray-400"
                }

              `}
            />
            <div
              className={`border-l border-t rounded-tl-md mr-3 h-2
                ${
                  resolution === "no" ? "border-transparent" : "border-gray-400"
                }

              `}
            />
            <div
              className={`border-r border-t rounded-tr-md ml-3 h-2
                ${
                  resolution === "yes"
                    ? "border-transparent"
                    : "border-gray-400"
                }
              `}
            />
          </div>
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
                onChange={(e) => {
                  const output = parseFloat(e.target.value)
                  const input = output * (1 - odds)
                  setInputSize(input)
                }}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-rose-500 sm:text-sm" id="price-currency">
                  NO
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6 w-full">
          <StatelessTransactButton
            status={status}
            verb={capitalizeFirstLetter(mode)}
            onClick={onSubmit}
            className="w-full"
            disabled={inputSize === 0}
          />
        </div>
      </div>
    </>
  )
}
