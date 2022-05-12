import {
  StatelessTransactButton,
  useTransact,
} from "@/components/TransactButton"
import { PublicKey } from "@solana/web3.js"
import { COLLATERAL_DECIMALS, RESOLUTION_MAPPING_INVERSE } from "config"
import React, { useCallback, useRef, useState } from "react"
import { useMarket } from "./hooks/marketQueries"
import useMergeContingentSet from "./hooks/useMergeContingentSet"
import useMintContingentSet from "./hooks/useMintContingentSet"
import useRedeemTxn from "./hooks/useRedeemTxn"

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}
function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

const useTokenBalanceQuery = (mint: PublicKey) => {}

// TODO display balances
export function Redeem({ address }: { address: PublicKey }) {
  const [amount, setAmount] = useState<string>("")
  const market = useMarket(address)

  const inputRef = useRef(null)

  const { callback, status } = useTransact()
  const getTxn = useRedeemTxn(address)
  const onSubmit = useCallback(async () => {
    // ideally this should just await the query but the UX impact is zero so whatever
    if (!market.data)
      throw new Error("submit redemption callback before loading market data")
    if (market.data.resolution === 0) throw new Error("market is not resolved")
    if (market.data.resolution !== 1 && market.data.resolution !== 2)
      throw new Error("market resolution is not understood")
    if (amount === "") return

    const resolution = RESOLUTION_MAPPING_INVERSE[market.data.resolution]
    const contingentCoin = {
      yes: market.data.yesMint,
      no: market.data.noMint,
    }[resolution]

    const txn = await getTxn({
      amount: parseFloat(amount) * 10 ** COLLATERAL_DECIMALS,
      contingentCoin,
    })
    console.log(txn)
    await callback(txn)
  }, [amount, callback, getTxn, market.data])

  return (
    <>
      <div className="shadow bg-white rounded-lg">
        <div className="px-4 pt-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Redeem
          </h3>
        </div>

        <div
          className={`
          px-4 py-5 sm:px-6 flex gap-2 border-b border-gray-200 content-center
          flex-col
        `}
        >
          cum
        </div>
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6 w-full">
          <StatelessTransactButton
            status={status}
            verb={"Redeem"}
            onClick={onSubmit}
            className="w-full"
            disabled={!amount}
          />
        </div>
      </div>
    </>
  )
}
