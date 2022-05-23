import {
  StatelessTransactButton,
  useTransact,
} from "@/components/TransactButton"
import { PublicKey } from "@solana/web3.js"
import { BN } from "bn.js"
import clsx from "clsx"
import { COLLATERAL_DECIMALS, Resolution } from "config"
import { queryClient } from "pages/providers"
import { tokenAccountKeys, useTokenAccount } from "pages/tokenAccountQuery"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { orderbookKeys } from "./orderbookQueries"
import { Splitty } from "./Splitty"
import usePlaceOrderTxn, { useResolutionMint } from "./usePlaceOrder"
import { displayBN } from "../../../../utils/BNutils"

// TODO display balances
export function PlaceExitOrder({
  marketAddress,
}: {
  marketAddress: PublicKey
}) {
  const [percentOdds, setPercentOdds] = useState<number>(80)
  const [positionInput, setPositionInput] = useState<string>("")

  const percentOddsNo = 100 - percentOdds

  const [selling, setSelling] = useState<Resolution>("yes")

  const yesMint = useResolutionMint(marketAddress, "yes")
  const noMint = useResolutionMint(marketAddress, "no")

  const yesAccount = useTokenAccount(yesMint)
  const noAccount = useTokenAccount(noMint)
  const accounts = { yes: yesAccount, no: noAccount } as const

  useEffect(() => {
    if (
      (noAccount.data?.value.uiAmount ?? 0) > 0 &&
      !((yesAccount.data?.value.uiAmount ?? 0) > 0)
    ) {
      setSelling("no")
    }
  }, [noAccount.data?.value.uiAmount, yesAccount.data?.value.uiAmount])

  const buy = usePlaceOrderTxn(marketAddress)

  const inputRef = useRef(null)

  const { callback, status } = useTransact()

  const onSubmit = useCallback(async () => {
    const startingAmount = new BN(
      parseFloat(positionInput) * 10 ** COLLATERAL_DECIMALS
    )

    const targetAmount = startingAmount
      .mul(
        new BN(
          (selling === "yes" ? percentOdds : percentOddsNo) *
            10 ** (COLLATERAL_DECIMALS - 2)
        )
      )
      .div(new BN(10 ** COLLATERAL_DECIMALS))

    const amountToSwap = startingAmount.sub(targetAmount)

    console.log(
      displayBN(startingAmount),
      "START",
      parseFloat(positionInput),
      startingAmount.toString(),
      targetAmount.toString(),
      amountToSwap.toString()
    )

    const txn = await buy({
      offeringYes: selling === "yes",
      numYes: selling === "yes" ? amountToSwap : targetAmount,
      numNo: selling === "yes" ? targetAmount : amountToSwap,
    })

    console.log(txn)
    await callback(txn)
    queryClient.invalidateQueries(orderbookKeys.book(marketAddress))
    // TODO invalidate the correct keys
    queryClient.invalidateQueries(tokenAccountKeys.all)
    setPositionInput("")
  }, [
    buy,
    callback,
    marketAddress,
    percentOdds,
    percentOddsNo,
    positionInput,
    selling,
  ])

  const usdcOutput = (
    parseFloat(positionInput) *
    (selling === "yes" ? percentOdds : 1 - percentOdds)
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
        <div className="flex gap-2 flex-col">
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
                    selling === resolution ? "grow" : "grow-0",
                    (accounts[resolution].data?.value.uiAmount ?? 0) > 0
                      ? ""
                      : "hidden"
                  )}
                  onClick={() => setSelling(resolution)}
                >
                  <div
                    className={clsx(
                      "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none",
                      selling !== resolution && "hidden"
                    )}
                  >
                    <span
                      className={clsx(
                        "sm:text-sm",
                        resolution === "yes" ? "text-lime-500" : "text-rose-500"
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
                      selling === resolution ? "" : "opacity-50 hidden"
                    )}
                    placeholder="0.00"
                    aria-describedby="price-currency"
                    value={positionInput}
                    onChange={(e) => setPositionInput(e.target.value)}
                  />
                  <div
                    className={clsx(
                      "flex items-center pointer-events-none",
                      selling === resolution
                        ? "absolute inset-y-0 right-0 pr-3"
                        : "mx-5 h-full"
                    )}
                  >
                    <span
                      className={clsx(
                        "sm:text-sm whitespace-nowrap",
                        resolution === "yes" ? "text-lime-500" : "text-rose-500"
                      )}
                      id="price-currency"
                    >
                      {resolution !== selling && "Sell "}
                      {resolution.toUpperCase()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <Splitty resolution={selling} flip />
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
              value={usdcOutput}
              readOnly
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm" id="price-currency">
                USDC
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 py-5 sm:px-6 w-full">
        <StatelessTransactButton
          status={status}
          verb={"Sell " + selling.toUpperCase()}
          onClick={onSubmit}
          className="w-full"
          disabled={positionInput === ""}
        />
      </div>
    </>
  )
}
