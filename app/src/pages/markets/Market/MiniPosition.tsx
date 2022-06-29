import { PublicKey } from "@solana/web3.js"
import { displayBN } from "src/utils/BNutils"
import React from "react"
import BN from "bn.js"
import clsx from "clsx"
import { usePosition } from "../../positions/usePosition"
import { Disclosure, Transition } from "@headlessui/react"
import { Sell } from "./Bet/Sell"
import { Resolution } from "config"

export const MiniPosition = ({
  marketAddress,
}: {
  marketAddress: PublicKey
}) => {
  const position = usePosition(marketAddress)

  const hasPosition =
    position !== undefined &&
    (position.deposited.gt(new BN(0)) || position.escrowed.gt(new BN(0)))

  return !hasPosition ? null : (
    <Disclosure>
      {({ open }) => (
        <div className="rounded-lg shadow overflow-hidden">
          <div
            data-name="POSITION INFO"
            className={clsx(
              "z-10 relative",
              position.position === "neutral" && "bg-gray-50",
              position.position === "yes" && "bg-lime-50",
              position.position === "no" && "bg-rose-50"
            )}
          >
            <div
              className={clsx("whitespace-nowrap px-3 py-4 font-med sm:px-6")}
            >
              {position.position !== "neutral" && (
                <div className="flex justify-between items-center">
                  <div>
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
                    ) : null}{" "}
                    <span className="text-gray-500">
                      {position.size.gt(position.available) && (
                        <> (${displayBN(position.available)} available)</>
                      )}
                    </span>
                  </div>
                  <div>
                    <Disclosure.Button
                      data-name="SELL BUTTON"
                      type="button"
                      className={clsx(
                        "inline-flex items-center px-2.5 py-0.5 border border-transparent text-xs font-medium rounded",
                        position.position === "yes"
                          ? "text-lime-700 hover:bg-lime-200 border border-lime-700"
                          : "text-rose-700 hover:bg-rose-200 border border-rose-700"
                      )}
                    >
                      SELL
                    </Disclosure.Button>
                  </div>
                </div>
              )}
              <div className="text-sm text-gray-500">
                {position.deposited.gt(new BN(0)) && (
                  <p>${displayBN(position.deposited)} USDC deposited</p>
                )}
                {position.orders.length > 0 && (
                  <p>
                    {position.orders.length} order
                    {position.orders.length > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div
            // TODO find a good accordion animation
            className={clsx("bg-white border-t", open ? "" : "hidden")}
          >
            <Sell
              marketAddress={marketAddress}
              selling={position.position as Resolution}
            />
          </div>
        </div>
      )}
    </Disclosure>
  )
}
