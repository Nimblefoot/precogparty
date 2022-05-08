import { PROGRAM_ID } from "@/generated/client/programId"
import { ClockIcon } from "@heroicons/react/outline"
import { PublicKey } from "@solana/web3.js"
import { useRouter } from "next/router"
import React, { useMemo } from "react"
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