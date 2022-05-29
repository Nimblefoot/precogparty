import { PublicKey } from "@solana/web3.js"
import { displayBN } from "@/utils/BNutils"
import React from "react"
import BN from "bn.js"
import clsx from "clsx"
import { usePosition } from "../../positions/usePosition"
import { Disclosure, Transition } from "@headlessui/react"

export const MiniPosition = ({
  marketAddress,
}: {
  marketAddress: PublicKey
}) => {
  const position = usePosition(marketAddress)

  return position === undefined ? null : (
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
                  ) : null}
                </div>
                <div>
                  <Disclosure.Button>
                    <button
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
                    </button>
                  </Disclosure.Button>
                </div>
              </div>
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

          <div
            // TODO find a good accordion animation
            className={clsx("bg-white border-t", open ? "" : "hidden")}
          >
            <div
              className={clsx(
                "whitespace-nowrap px-3 py-4 font-med sm:px-6 scale-x collapse"
              )}
            >
              fart
            </div>
          </div>
        </div>
      )}
    </Disclosure>
  )
}

const Sell = () => {}
