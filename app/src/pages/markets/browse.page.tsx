import { ClockIcon, SearchIcon } from "@heroicons/react/outline"
import Link from "next/link"
import { useMemo, useState } from "react"
import useMarketSearch from "./hooks/useMarketSearch"
import { useMarkets } from "./Market/hooks/marketQueries"
import User from "./User"

export default function Browse() {
  const query = useMarkets()

  const [searchString, setSearchString] = useState("")
  const search = useMarketSearch()
  const searchResults = useMemo(() => {
    const x = search?.search(searchString)
    const y = x?.map((result) => result.item)
    return y
  }, [search, searchString])

  const markets = searchString !== "" ? searchResults : query.data

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
      {markets !== undefined ? (
        <ul
          role="list"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {markets.map((market) => (
            <Link
              key={market.publicKey.toString()}
              href={`/markets?m=${market.account.name}`}
            >
              <a>
                <li
                  className="col-span-1 bg-white rounded-lg shadow divide-gray-200 p-4 
                               transition ease-in-out hover:-translate-y-1 hover:shadow-lg
                              "
                >
                  <h1 className="text-2xl  text-gray-900">
                    {market.account.name}
                  </h1>
                  <div className="flex content-center flex-row gap-4 mt-2">
                    <div>
                      <User publicKey={market.account.marketAuthority} />
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
          ))}
        </ul>
      ) : null}
    </div>
  )
}
