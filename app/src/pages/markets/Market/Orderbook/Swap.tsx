import {
  StatelessTransactButton,
  useTransact,
} from "src/components/TransactButton"
import { PublicKey } from "@solana/web3.js"
import React, { useCallback, useState } from "react"
import usePlaceOrderTxn, { useResolutionMint } from "./usePlaceOrder"
import { useTokenAccount } from "src/pages/tokenAccountQuery"

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}
function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

const modes = ["offering_apples YES", "offering_apples NO"] as const
type Mode = typeof modes[number]
// TODO cool css transitions when switching modes
// TODO display balances
export function Swap({ marketAddress }: { marketAddress: PublicKey }) {
  const [odds, setOdds] = useState<number>(0.8)
  const [yesInput, setYesInput] = useState("")
  const [noInput, setNoInput] = useState("")

  const [mode, setMode] = useState<Mode>("offering_apples YES")

  const yesMint = useResolutionMint(marketAddress, "yes")
  const noMint = useResolutionMint(marketAddress, "no")

  const yesAccount = useTokenAccount(yesMint)
  const noAccount = useTokenAccount(noMint)

  const swap = usePlaceOrderTxn(marketAddress)

  const { callback, status } = useTransact()

  const onSubmit = useCallback(async () => {
    /* if (price === "") return

    const getTxn = resolution === "yes" ? placeYesOrder : placeNoOrder

    const txn = await getTxn({
      price: new BN(price).mul(new BN(10 ** COLLATERAL_DECIMALS)),
      offering_applesing: mode === "offering_apples",
      size: new BN(price).mul(new BN(10 ** COLLATERAL_DECIMALS)),
    })
    console.log(txn)
    await callback(txn) */
  }, [])

  const handleOddsChange = (newOdds: number) => {
    /* const initialInputBN = timesOdds(
      new BN(parseFloat(yesInput) * 10 ** COLLATERAL_DECIMALS),
      odds
    )

    const yesInputBN = divOdds(initialInputBN, newOdds)
    const noInputBN = divOdds(initialInputBN, 1 - newOdds) 

    setYesInput(yesInput !== "" ? displayBN(yesInputBN) : "")
    setNoInput(noInput !== "" ? displayBN(noInputBN) : "") */
  }

  return (
    <>
      <div className="shadow bg-white rounded-lg">
        <div className="px-4 pt-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Tokens
          </h3>
          <nav className="-mb-px flex space-x-8 mt-3 sm:mt-4">
            {modes.map((tab) => (
              <a
                key={tab}
                onClick={(e) => {
                  setMode(tab)
                  //;(inputRef as any)?.current.focus()
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
          <div className="flex flex-col gap-2">
            <div>
              <input
                type="number"
                className="border-transparent"
                min="0"
                max="1"
                step="0.01"
                value={odds}
                onChange={(e) => {
                  setOdds(parseFloat(e.target.value))
                  handleOddsChange(parseFloat(e.target.value))
                }}
              />
            </div>
            <div className="relative pt-1">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={odds}
                onChange={(e) => {
                  setOdds(parseFloat(e.target.value))
                  handleOddsChange(parseFloat(e.target.value))
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>
          </div>

          <div
            className={`
            flex gap-2 
            ${mode === "offering_apples NO" ? "flex-col" : "flex-col-reverse"}
            `}
          >
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-lime-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                pattern="^\d*(\.\d{0,2})?$"
                className={`
                  block w-full pl-7 pr-12 sm:text-sm border-lime-300 rounded-md bg-lime-100 text-lime-500 placeholder:text-lime-400
                `}
                /* onChange={(e) => {
                  const value = new BN(
                    parseFloat(e.target.value) * 10 ** COLLATERAL_DECIMALS
                  )
                  const noInput = displayBN(
                    divOdds(timesOdds(value, odds), 1 - odds)
                  )
                  setYesInput(e.target.value)
                  setNoInput(e.target.value !== "" ? noInput : "")
                }} */
                placeholder="0.00"
                aria-describedby="price-currency"
                value={yesInput}
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
                `}
                placeholder="0.00"
                aria-describedby="price-currency"
                value={noInput}
                onChange={(e) => {
                  /* const value = new BN(
                    parseFloat(e.target.value) * 10 ** COLLATERAL_DECIMALS
                  )
                  const yesInput = displayBN(
                    divOdds(timesOdds(value, 1 - odds), odds)
                  )
                  setYesInput(e.target.value !== "" ? yesInput : "")
                  setNoInput(e.target.value) */
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
            disabled={true}
          />
        </div>
      </div>
    </>
  )
}
