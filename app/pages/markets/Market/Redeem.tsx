import {
  StatelessTransactButton,
  useTransact,
} from "@/components/TransactButton"
import BN from "bn.js"
import { PublicKey } from "@solana/web3.js"
import { COLLATERAL_DECIMALS, RESOLUTION_MAPPING_INVERSE } from "config"
import { useTokenAccount } from "pages/tokenAccountQuery"
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

// TODO display balances
export function Redeem({ address }: { address: PublicKey }) {
  const market = useMarket(address)
  const yesAccount = useTokenAccount(market.data?.yesMint)
  const noAccount = useTokenAccount(market.data?.noMint)

  const resolution =
    market.data !== undefined
      ? RESOLUTION_MAPPING_INVERSE[market.data?.resolution as 1 | 2]
      : undefined
  const redeemableAmount =
    resolution &&
    {
      yes: yesAccount.data?.value.amount,
      no: noAccount.data?.value.amount,
    }[resolution]

  const { callback, status } = useTransact()
  const getTxn = useRedeemTxn(address)
  const onSubmit = useCallback(async () => {
    // ideally this should just await the query but the UX impact is zero so whatever
    if (!market.data)
      throw new Error("submit redemption callback before loading market data")

    if (!resolution) throw new Error("market is not resolved")
    if (!redeemableAmount) throw new Error("redeemable amount not fetched")

    const contingentCoin = {
      yes: market.data.yesMint,
      no: market.data.noMint,
    }[resolution]

    const txn = await getTxn({
      amount: redeemableAmount,
      contingentCoin,
    })
    console.log(txn)
    await callback(txn)
  }, [callback, getTxn, market.data, redeemableAmount, resolution])

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
          {new BN(redeemableAmount!)
            .div(new BN(10 ** COLLATERAL_DECIMALS))
            .toString()}
        </div>
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6 w-full">
          <StatelessTransactButton
            status={status}
            verb={"Redeem"}
            onClick={onSubmit}
            className="w-full"
            disabled={
              redeemableAmount === undefined || redeemableAmount === "0"
            }
          />
        </div>
      </div>
    </>
  )
}
