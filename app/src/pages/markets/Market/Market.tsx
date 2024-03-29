import { PROGRAM_ID } from "@/generated/client/programId"
import { PublicKey } from "@solana/web3.js"
import { useRouter } from "next/router"
import React, { useMemo } from "react"
import User from "../User"
import { Resolve } from "./Resolution"
import { useMarket } from "./hooks/marketQueries"
import Orders from "./Orderbook/Orders"
import { MiniPosition } from "src/pages/markets/Market/MiniPosition"
import { useOrderbook } from "./Orderbook/orderbookQueries"
import { getPercentOdds } from "src/utils/orderMath"
import BetPanel from "./Bet/Bet"
import interpolateOddsColors from "src/utils/interpolateOddsColors"
import clsx from "clsx"
import { TokenControls } from "./TokenControls"
import { History } from "./History/History"
import { useWallet } from "@solana/wallet-adapter-react"

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
  const { publicKey } = useWallet()
  const market = useMarket(address)
  const book = useOrderbook(address)

  const percentOdds =
    book.data &&
    book.data.info.mostRecentTrade &&
    getPercentOdds(book.data.info.mostRecentTrade)

  return market.data ? (
    <>
      <div className="flex px-4 sm:px-6 md:px-8 max-w-7xl mx-auto gap-5">
        <div data-name="MAIN CARD" className="flex-grow flex gap-5 flex-col">
          <div className="shadow bg-white rounded-lg">
            <div className="">
              {/* Main body */}
              <div
                data-name="CARD HEADER"
                className={clsx(
                  "max-w-7xl mx-auto px-4 py-4 rounded-t-lg sm:px-6 lg:px-8",
                  "border-b",
                  market.data.resolution === 1 &&
                    "bg-lime-50 border-lime-500 border",
                  market.data.resolution === 2 &&
                    "bg-rose-50 border-rose-500 border"
                )}
                /* style={{
                  backgroundColor:
                    percentOdds && market.data.resolution === 0
                      ? interpolateOddsColors(percentOdds, 0.15)
                      : undefined,
                  borderColor:
                    percentOdds && market.data.resolution === 0
                      ? interpolateOddsColors(percentOdds)
                      : undefined,
                }} */
              >
                <div className="flex justify-between">
                  <div data-name="TITLE">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                      {name}
                    </h1>
                    <div>
                      <User
                        publicKey={new PublicKey(market.data.marketAuthority)}
                      />
                    </div>
                  </div>
                  {market.data.resolution === 0 ? (
                    percentOdds && (
                      <div>
                        <h1
                          className="text-3xl font-semibold"
                          style={{
                            color: interpolateOddsColors(percentOdds),
                          }}
                        >
                          {percentOdds.toFixed(0)}%
                        </h1>
                      </div>
                    )
                  ) : market.data.resolution === 1 ? (
                    <div className="text-right">
                      <h1 className="text-3xl text-lime-700 font-semibold">
                        YES
                      </h1>
                      {percentOdds && (
                        <div className="text-gray-500">
                          Last traded {percentOdds.toFixed(0)}%
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-right">
                      <h1 className="text-3xl text-rose-700 font-semibold">
                        NO
                      </h1>
                      {percentOdds && (
                        <div className="text-gray-500">
                          Last traded {percentOdds.toFixed(0)}%
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div
                className={clsx(
                  "max-w-7xl mx-auto px-4 py-4 rounded-t-lg sm:px-6 lg:px-8"
                )}
              >
                <History market={address} />
              </div>
              <div
                className={clsx(
                  "max-w-7xl mx-auto px-4 py-4 rounded-t-lg sm:px-6 lg:px-8"
                )}
              >
                {market.data.description}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg">
            <Orders marketAddress={address} />
          </div>
        </div>
        {/* 2nd column */}
        <div className="w-[25rem] flex flex-col gap-4">
          <MiniPosition marketAddress={address} />
          <BetPanel marketAddress={address} />

          {market.data.resolution === 0 &&
            publicKey !== null &&
            market.data.resolutionAuthority.equals(publicKey) && (
              <Resolve market={address} />
            )}
          <TokenControls address={address} />
        </div>
      </div>
    </>
  ) : (
    <div></div>
  )
}

export default MarketRouter
