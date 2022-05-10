import { PROGRAM_ID } from "@/generated/client/programId"
import { ClockIcon } from "@heroicons/react/outline"
import { PublicKey } from "@solana/web3.js"
import { useRouter } from "next/router"
import React, { useMemo, useState } from "react"
import User from "../User"
import { Resolve } from "./Resolution"
import { useMarketData } from "./hooks/useMarketData"

const MarketRouter = () => {
  const router = useRouter()
  const marketNameQ = router.query.m
  const name = typeof marketNameQ === "string" ? marketNameQ : undefined

  const market = useMemo(
    () =>
      name &&
      PublicKey.findProgramAddressSync(
        [Buffer.from("market_account"), Buffer.from(name)],
        PROGRAM_ID
      )[0],
    [name]
  )

  return market && name ? <Market address={market} name={name} /> : <></>
}

const Market = ({ address, name }: { address: PublicKey; name: string }) => {
  const market = useMarketData(address)

  return market ? (
    <>
      <div className="flex px-4 sm:px-6 md:px-8 max-w-7xl mx-auto gap-5">
        {/* Main body */}
        <div className="flex-grow">
          <div className="py-4 shadow bg-white rounded-lg h-96">
            <div className="">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-2xl font-semibold text-gray-900">{name}</h1>
                <div className="flex content-center flex-row gap-4 mt-2">
                  <div>
                    <User publicKey={new PublicKey(market.marketAuthority)} />
                  </div>
                  <div className="text-sm flex justify-center flex-col">
                    <div className="flex">
                      <div className="h-5 w-5 self-center mr-1">
                        <ClockIcon />
                      </div>
                      <div className="">Jan 25 2020</div>
                    </div>
                  </div>
                </div>
                <p className="mt-4">{market.description}</p>
              </div>
            </div>
          </div>
        </div>
        {/* 2nd column */}
        <div className="grow max-w-xs flex flex-col gap-4">
          <Resolve market={address} />
          <TokenControls address={address} />
        </div>
      </div>
    </>
  ) : (
    <div>market does not exist</div>
  )
}

export default MarketRouter

function TokenControls({ address }: { address: PublicKey }) {
  const [amount, setAmount] = useState<string | undefined>()

  return (
    <>
      <div className="shadow bg-white rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Tokens
          </h3>
        </div>
        <div className="px-4 py-5 sm:px-6 flex flex-col gap-2 border-b border-gray-200 content-center">
          {/* USDC input */}
          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-gray-700"
            >
              Split
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
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
          <div className="grid grid-cols-2 w-[50%] self-center">
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
          {/* <StatelessTransactButton
          status={status}
          verb="Resolve"
          onClick={onSubmit}
          className="w-full"
        /> */}
        </div>
      </div>
    </>
  )
}
