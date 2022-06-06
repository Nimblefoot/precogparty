import {
  StatelessTransactButton,
  useTransact,
} from "@/components/TransactButton"
import { PublicKey } from "@solana/web3.js"
import { RESOLUTION_MAPPING_INVERSE } from "config"
import { tokenAccountKeys, useTokenAccount } from "pages/tokenAccountQuery"
import React, { useCallback } from "react"
import { useMarket } from "./hooks/marketQueries"

import useRedeemTxn from "./hooks/useRedeemTxn"
import { queryClient } from "pages/providers"

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}
function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function RedeemButton({
  address,
  className,
}: {
  address: PublicKey
  className?: string
}) {
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
      yes:
        yesAccount.data !== undefined && yesAccount.data !== "no account"
          ? yesAccount.data.value.amount
          : undefined,
      no:
        noAccount.data !== undefined && noAccount.data !== "no account"
          ? noAccount.data.value.amount
          : undefined,
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

    queryClient.invalidateQueries(tokenAccountKeys.token(contingentCoin))
  }, [callback, getTxn, market.data, redeemableAmount, resolution])

  return (
    <>
      <StatelessTransactButton
        status={status}
        verb={"Redeem"}
        onClick={onSubmit}
        className={"w-full " + className}
        disabled={redeemableAmount === undefined || redeemableAmount === "0"}
      />
    </>
  )
}
