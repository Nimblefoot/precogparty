import { Splitty } from "./Splitty"
import { PublicKey } from "@solana/web3.js"
import { Resolution } from "config"
import React, { useState } from "react"
import Orders from "./Orders"

const TakeOrder = ({ marketAddress }: { marketAddress: PublicKey }) => {
  const [resolution, setResolution] = useState<Resolution>("yes")

  return (
    <div>
      <div className="shadow bg-white rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Take odds
          </h3>
        </div>
        <div className="px-4 py-5 sm:px-6 flex flex-col gap-2 border-b border-gray-200 w-full">
          <Orders marketAddress={marketAddress} />
          <div
            className={`
          px-4 py-5 sm:px-6 flex gap-2 border-b border-gray-200 content-center flex-col
        `}
          >
            <div className="flex gap-2">
              {/* USDC input */}

              <div className="mt-1 relative rounded-md shadow-sm w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  name="price"
                  id="price"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="0.00"
                  aria-describedby="price-currency"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span
                    className="text-gray-500 sm:text-sm"
                    id="price-currency"
                  >
                    USDC
                  </span>
                </div>
              </div>
            </div>

            {/* little splitter art :-) */}
            <Splitty resolution={resolution} />
            <div className="flex gap-2">
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-lime-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  className={`
                  block w-full pl-7 pr-12 sm:text-sm border-lime-300 rounded-md bg-lime-100 text-lime-500 placeholder:text-lime-400
                  ${resolution === "yes" ? "" : "opacity-50"}
                `}
                  placeholder="0.00"
                  aria-describedby="price-currency"
                  onClick={() => setResolution("yes")}
                  readOnly
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span
                    className="text-lime-500 sm:text-sm"
                    id="price-currency"
                  >
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
                  ${resolution === "no" ? "" : "opacity-50"}
                `}
                  placeholder="0.00"
                  aria-describedby="price-currency"
                  onClick={() => setResolution("no")}
                  readOnly
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span
                    className="text-rose-500 sm:text-sm"
                    id="price-currency"
                  >
                    NO
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TakeOrder
