import {
  PredictionMarket,
  PredictionMarketJSON,
} from "@/generated/client/accounts"
import { useConnection } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { useCallback, useEffect, useState } from "react"
import { useQuery } from "react-query"

// TODO lets use react-query, its sick
export const useMarketData = (address: PublicKey) => {
  const { connection } = useConnection()

  const fetchData = useCallback(
    () => PredictionMarket.fetch(connection, address),
    [address, connection]
  )

  const query = useQuery(`market-${address.toString()}`, fetchData)

  return query
}
