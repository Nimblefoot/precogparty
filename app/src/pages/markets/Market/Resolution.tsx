import {
  StatelessTransactButton,
  useTransact,
} from "src/components/TransactButton"
import { PublicKey } from "@solana/web3.js"
import { queryClient } from "src/pages/providers"
import React, { useCallback, useState } from "react"
import { marketKeys } from "./hooks/marketQueries"
import useResolveMarketTxn from "./hooks/useResolveMarketTxn"

type Resolution = "yes" | "no"
export function Resolve({ market }: { market: PublicKey }) {
  const [resolution, setResolution] = useState<Resolution | undefined>()

  const { callback, status } = useTransact()
  const getResolveMarketTxn = useResolveMarketTxn()
  const onSubmit = useCallback(async () => {
    if (!resolution) return
    const txn = await getResolveMarketTxn({ resolution, market })
    console.log(txn)
    await callback(txn)
    queryClient.invalidateQueries(marketKeys.market(market))
  }, [callback, getResolveMarketTxn, market, resolution])

  return (
    <div className="shadow bg-white rounded-lg">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Resolve Market
        </h3>
      </div>
      <div className="px-4 py-5 sm:px-6 flex flex-col gap-2 border-b border-gray-200">
        <button
          type="button"
          className={`
            inline-flex items-center justify-center px-6 py-3 border text-base font-medium rounded-full shadow-sm 
            ${
              resolution === "yes"
                ? "bg-lime-500 hover:bg-lime-600 border-transparent text-white"
                : "border-gray-300 bg-white hover:bg-gray-50 text-gray-500"
            }
          `}
          onClick={() =>
            setResolution((prev) => (prev !== "yes" ? "yes" : undefined))
          }
        >
          Yes
        </button>
        <button
          type="button"
          className={`
            inline-flex items-center justify-center px-6 py-3 border  text-base font-medium rounded-full shadow-sm text-white 
            ${
              resolution === "no"
                ? "bg-rose-500 hover:bg-rose-600 border-transparent text-white"
                : "border-gray-300 bg-white hover:bg-gray-50 text-gray-500"
            }
          `}
          onClick={() =>
            setResolution((prev) => (prev !== "no" ? "no" : undefined))
          }
        >
          No
        </button>
      </div>
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6 w-full">
        <StatelessTransactButton
          disabled={resolution === undefined}
          status={status}
          verb="Resolve"
          onClick={onSubmit}
          className="w-full"
        />
      </div>
    </div>
  )
}
