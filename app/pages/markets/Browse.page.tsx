import { PredictionMarket } from "@/generated/client/accounts"
import { useConnection } from "@solana/wallet-adapter-react"
import { useCallback } from "react"
import { useQuery } from "react-query"
import useWalletlessProgram from "./new/hooks/useWalletlessProgram"

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
            <li
              key={market.publicKey.toString()}
              className="col-span-1 bg-white rounded-lg shadow divide-y divide-gray-200"
            >
              {JSON.stringify(market.account)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
