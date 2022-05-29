import { PublicKey } from "@solana/web3.js"
import { displayBN } from "@/utils/BNutils"
import React from "react"
import BN from "bn.js"
import clsx from "clsx"
import { usePosition } from "../../positions/usePosition"

export const MiniPosition = ({
  marketAddress,
}: {
  marketAddress: PublicKey
}) => {
  const position = usePosition(marketAddress)

  return position === undefined ? null : (
    <div
      className={clsx(
        "shadow rounded-lg",
        position.position === "neutral" && "bg-gray-50",
        position.position === "yes" && "bg-lime-50",
        position.position === "no" && "bg-rose-50"
      )}
    >
      <div className={clsx("whitespace-nowrap px-3 py-4 font-med sm:px-6")}>
        {position.position === "yes" ? (
          <>
            You have{" "}
            <span className="font-medium text-lime-700">
              ${displayBN(position.size)} YES
            </span>
          </>
        ) : position.position === "no" ? (
          <>
            <span className="font-medium text-rose-700">
              ${displayBN(position.size)} NO
            </span>
          </>
        ) : null}
        <div className="text-sm text-gray-500">
          {position.withdrawable.gt(new BN(0)) && (
            <p>${displayBN(position.withdrawable)} USDC withdrawable</p>
          )}
          {position.orders.length > 0 && (
            <p>
              ${displayBN(position.escrowed)} escrowed across{" "}
              {position.orders.length} orders
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
