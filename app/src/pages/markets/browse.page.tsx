import { PredictionMarketFields } from "@/generated/client/accounts"
import { TradeLogFields } from "@/generated/syrup/accounts"
import interpolateOddsColors from "@/utils/interpolateOddsColors"
import { getPercentOdds } from "@/utils/orderMath"
import { ClockIcon, SearchIcon } from "@heroicons/react/outline"
import clsx from "clsx"
import Link from "next/link"
import { useMemo, useState } from "react"
import useMarketSearch from "./hooks/useMarketSearch"
import { useMarkets } from "./Market/hooks/marketQueries"
import { useOrderbookLogs } from "./Market/Orderbook/orderbookQueries"
import { UserSmall } from "./User"

export default function Browse() {
  const query = useMarkets()
  const { data: tradeLogs } = useOrderbookLogs()

  const [searchString, setSearchString] = useState("")
  const search = useMarketSearch()
  const searchResults = useMemo(() => {
    const x = search?.search(searchString)
    const y = x?.map((result) => result.item)
    return y
  }, [search, searchString])

  const markets = searchString !== "" ? searchResults : query.data

  console.log("AAAAA", tradeLogs)
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
      <div className="min-w-0 flex-1">
        <div className="flex items-center py-4">
          <div className="w-full">
            <label htmlFor="search" className="sr-only">
              Search
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                <SearchIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </div>
              <input
                id="search"
                name="search"
                className="block w-full bg-white border border-gray-300 rounded-md py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:text-gray-900 focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search"
                type="text"
                autoComplete="off"
                value={searchString}
                onChange={(e) => setSearchString(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      {markets !== undefined && tradeLogs ? (
        <ul
          role="list"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {markets.map((market) => {
            const log = tradeLogs[market.publicKey.toString()]
            return (
              log && (
                <MarketPreview
                  key={market.publicKey.toString()}
                  market={market.account}
                  log={log}
                />
              )
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

function MarketPreview({
  market,
  log,
}: {
  market: PredictionMarketFields
  log: TradeLogFields
}) {
  const percentOdds =
    log.trades[log.trades.length - 1] &&
    getPercentOdds(log.trades[log.trades.length - 1])
  return (
    <Link href={`/markets?m=${market.name}`}>
      <a>
        <li
          className={clsx(
            "col-span-1 bg-white rounded-lg shadow p-4",
            "transition ease-in-out hover:-translate-y-1 hover:shadow-lg",
            market.resolution === 1 && "bg-lime-50 border-lime-500 border",
            market.resolution === 2 && "bg-rose-50 border-rose-500 border"
          )}
        >
          <div className="flex justify-between">
            <h1 className="text-lg text-gray-900 max-w-[80%] break-words">
              {market.name}
            </h1>
            <span>
              {market.resolution === 0 ? (
                percentOdds ? (
                  <div>
                    <h1
                      className="text-lg font-semibold"
                      style={{
                        color: interpolateOddsColors(percentOdds),
                      }}
                    >
                      {percentOdds.toFixed(0)}%
                    </h1>
                  </div>
                ) : (
                  <div>
                    <h1 className="text-lg font-semibold text-gray-400">~</h1>
                  </div>
                )
              ) : market.resolution === 1 ? (
                <div className="text-right">
                  <h1 className="text-lg text-lime-700 font-semibold">YES</h1>
                  {percentOdds && (
                    <div className="text-gray-500">
                      Last traded {percentOdds.toFixed(0)}%
                    </div>
                  )}
                </div>
              ) : (
                market.resolution ===
                2(
                  <div className="text-right">
                    <h1 className="text-lg text-rose-700 font-semibold">NO</h1>
                    {percentOdds && (
                      <div className="text-gray-500">
                        Last traded {percentOdds.toFixed(0)}%
                      </div>
                    )}
                  </div>
                )
              )}
            </span>
          </div>
          <div className="flex content-center flex-row gap-4 mt-2">
            <div>
              <UserSmall publicKey={market.marketAuthority} />
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
        </li>
      </a>
    </Link>
  )
}
