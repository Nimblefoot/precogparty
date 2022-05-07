import {
  StatelessTransactButton,
  useTransact,
} from "@/components/TransactButton"
import {
  PredictionMarket,
  PredictionMarketJSON,
} from "@/generated/client/accounts"
import { PROGRAM_ID } from "@/generated/client/programId"
import { ClockIcon } from "@heroicons/react/outline"
import { useConnection } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { useRouter } from "next/router"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import useResolveMarketTxn from "./hooks/useResolveMarketTxn"
import User from "./User"

const useMarketData = (address: PublicKey) => {
  const { connection } = useConnection()
  const [data, setData] = useState<PredictionMarketJSON | undefined>()

  const getMarketData = useCallback(async () => {
    if (name === undefined) return undefined

    const market = await PredictionMarket.fetch(connection, address)
    return market ? market.toJSON() : undefined
  }, [address, connection])

  useEffect(() => {
    ;(async () => {
      setData(await getMarketData())
    })()
  }, [getMarketData, data])

  return data
}

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

  return market ? <Market address={market} /> : <></>
}

const Market = ({ address }: { address: PublicKey }) => {
  const router = useRouter()
  const marketName = router.query.m

  const market = useMarketData(address)

  return market ? (
    <>
      <div className="flex px-4 sm:px-6 md:px-8 max-w-7xl mx-auto gap-5">
        {/* Main body */}
        <div className="flex-grow">
          <div className="py-4 shadow bg-white rounded-lg h-96">
            <div className="">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {marketName}
                </h1>
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
        <div className="grow max-w-xs">
          <Resolve market={address} />
        </div>
      </div>
    </>
  ) : (
    <div>market does not exist</div>
  )
}

export default MarketRouter

type Resolution = "yes" | "no"
function Resolve({ market }: { market: PublicKey }) {
  const [resolution, setResolution] = useState<Resolution | undefined>()

  const { callback, status } = useTransact()
  const getResolveMarketTxn = useResolveMarketTxn()
  const onSubmit = useCallback(async () => {
    if (!resolution) return
    const txn = await getResolveMarketTxn({ resolution, market })
    console.log(txn)
    await callback(txn)
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
                ? "bg-green-500 hover:bg-green-600 border-transparent text-white"
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
                ? "bg-red-500 hover:bg-red-600 border-transparent text-white"
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
