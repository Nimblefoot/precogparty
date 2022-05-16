import {
  StatelessTransactButton,
  useTransact,
} from "@/components/TransactButton"
import { PublicKey } from "@solana/web3.js"
import { COLLATERAL_DECIMALS } from "config"
import React, { useCallback, useRef, useState } from "react"

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}
function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}
type Mode = "split" | "merge"
// TODO cool css transitions when switching modes
// TODO display balances
export function TokenControls({ address }: { address: PublicKey }) {
  const [amount, setAmount] = useState<string>("")
  const [mode, setMode] = useState<Mode>("split")

  const inputRef = useRef(null)

  const { callback, status } = useTransact()
  const getMintTxn = useMintContingentSet(address)
  const getMergeTxn = useMergeContingentSet(address)
  const onSubmit = useCallback(async () => {
    if (amount === "") return

    const getTxn = mode === "split" ? getMintTxn : getMergeTxn

    const txn = await getTxn({
      amount: parseFloat(amount) * 10 ** COLLATERAL_DECIMALS,
    })
    console.log(txn)
    await callback(txn)
  }, [amount, callback, getMergeTxn, getMintTxn, mode])

  return (
    <>
      <div className="shadow bg-white rounded-lg">
        <div className="px-4 pt-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Tokens
          </h3>
          <nav className="-mb-px flex space-x-8 mt-3 sm:mt-4">
            {(["split", "merge"] as const).map((tab) => (
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
          px-4 py-5 sm:px-6 flex gap-2 border-b border-gray-200 content-center
          ${mode === "split" ? "flex-col" : "flex-col-reverse"}
        `}
        >
          {/* USDC input */}
          {/* TODO remove stupid number arrows */}
          <div>
            <div className="mt-1 relative rounded-md shadow-sm">
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
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm" id="price-currency">
                  USDC
                </span>
              </div>
            </div>
          </div>

          {/* little splitter art :-) */}
          <div
            className="grid grid-cols-2 w-[50%] self-center"
            style={{
              transform: mode === "split" ? "" : "rotateX(-180deg)",
            }}
          >
            <div className="border-r border-b rounded-br-md ml-2 mb-[-1px] mr-[-0.5px] border-gray-400 h-2" />
            <div className="border-l border-b rounded-bl-md mr-2 mb-[-1px] ml-[-0.5px] border-gray-400 h-2" />
            <div className="border-l border-t rounded-tl-md mr-3  border-gray-400 h-2" />
            <div className="border-r border-t rounded-tr-md ml-3 border-gray-400 h-2" />
          </div>
          <div className="flex gap-2">
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-lime-500 sm:text-sm">$</span>
              </div>
              <input
                type="text"
                className="block w-full pl-7 pr-12 sm:text-sm border-lime-300 rounded-md bg-lime-100 text-lime-500 placeholder:text-lime-400"
                placeholder="0.00"
                aria-describedby="price-currency"
                value={amount}
                disabled
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
                type="text"
                className="block w-full pl-7 pr-12 sm:text-sm border-rose-300 rounded-md bg-rose-100 text-rose-500 placeholder:text-rose-300"
                placeholder="0.00"
                aria-describedby="price-currency"
                value={amount}
                disabled
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
            disabled={!amount}
          />
        </div>
      </div>
    </>
  )
}
