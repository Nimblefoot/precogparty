import { PROGRAM_ID } from "@/generated/client/programId"
import { ClockIcon } from "@heroicons/react/outline"
import { PublicKey } from "@solana/web3.js"
import { useRouter } from "next/router"
import React, { useMemo } from "react"
import User from "../User"
import { Resolve } from "./Resolution"
import { useMarket } from "./hooks/marketQueries"
import { TokenControls } from "./TokenControls"
import PlaceOrder, { PlaceOrderPanel } from "./Orderbook/PlaceOrder"
import { Swap } from "./Orderbook/Swap"
import Orders from "./Orderbook/Orders"
import TakeOrder from "./Orderbook/TakeOrder"
import { PlaceExitOrder } from "./Orderbook/PlaceExitOrder"
import TakeExitOrder from "./Orderbook/TakeExitOrder"
import { MiniPosition } from "pages/positions/Positions"
import { useOrderbook } from "./Orderbook/orderbookQueries"
import { getPercentOdds, order2ui } from "@/utils/orderMath"
import BetPanel from "./Bet/Bet"

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
  const market = useMarket(address)
  const book = useOrderbook(address)

  return market.data ? (
    <>
      <div className="flex px-4 sm:px-6 md:px-8 max-w-7xl mx-auto gap-5">
        {/* Card */}
        <div className="flex-grow">
          <div className="py-4 shadow bg-white rounded-lg">
            <div className="">
              {/* Main body */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-2xl font-semibold text-gray-900">{name}</h1>
                {/* Metadata display */}
                <div className="flex content-center flex-row gap-4 mt-2">
                  <div>
                    <User
                      publicKey={new PublicKey(market.data.marketAuthority)}
                    />
                  </div>
                  {/* <div className="text-sm flex justify-center flex-col">
                    <div className="flex">
                      <div className="h-5 w-5 self-center mr-1">
                        <ClockIcon />
                      </div>
                      <div className="">Jan 25 2020</div>
                    </div>
                  </div> */}
                </div>
                <div className="w-full flex justify-center">
                  <div>
                    <h1 className="text-5xl">
                      {
                        { 0: "Unresolved", 1: "YES", 2: "NO" }[
                          market.data.resolution
                        ]
                      }
                    </h1>
                  </div>
                </div>
                <div className="w-full flex justify-center">
                  <div>
                    <h1 className="text-3xl">
                      {book.data?.info.tradeLog[0] &&
                        "Last traded at " +
                          getPercentOdds(book.data?.info.tradeLog[0]).toFixed(
                            0
                          )}
                      %
                    </h1>
                  </div>
                </div>

                <p className="mt-4">{market.data.description}</p>
              </div>
              <div className="px-4 py-5 sm:px-6 ">
                <Orders marketAddress={address} />
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <BetPanel marketAddress={address} />
            <TakeOrder marketAddress={address} />
            <PlaceOrder marketAddress={address} />
            <TokenControls address={address} />
          </div>
        </div>
        {/* 2nd column */}
        <div className="grow max-w-xs flex flex-col gap-4">
          <MiniPosition marketAddress={address} />
          {market.data.resolution === 0 && <Resolve market={address} />}
        </div>
      </div>
    </>
  ) : (
    <div></div>
  )
}

export default MarketRouter
