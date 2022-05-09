import { PredictionMarket } from "@/generated/client/accounts"
import { ClockIcon } from "@heroicons/react/outline"
import { useConnection } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import Link from "next/link"
import { useCallback } from "react"
import { useQuery } from "react-query"
import useWalletlessProgram from "./new/hooks/useWalletlessProgram"
import User from "./User"

const useMarketsQuery = () => {
  const program = useWalletlessProgram()
  const fetchData = useCallback(
    () => program.account.predictionMarket.all(),
    [program]
  )

  const query = useQuery("markets", fetchData)

  return query
}

export default function Browse() {
  const query = useMarketsQuery()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
      {query.data !== undefined ? (
        <ul
          role="list"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {query.data.map((market) => (
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
                    <div className="text-sm flex justify-center flex-col">
                      <div className="flex">
                        <div className="h-5 w-5 self-center mr-1">
                          <ClockIcon />
                        </div>
                        <div className="">Jan 25 2020</div>
                      </div>
                    </div>
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
