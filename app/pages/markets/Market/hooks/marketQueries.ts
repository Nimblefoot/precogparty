import {
  PredictionMarket,
  PredictionMarketJSON,
} from "@/generated/client/accounts"
import { useConnection } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { useCallback, useEffect, useState } from "react"
import { useQuery } from "react-query"

import useWalletlessProgram from "../../../../hooks/useProgram"

export const marketKeys = {
  all: ["markets"],
  market: (address: PublicKey) => [...marketKeys.all, address.toString()],
} as const

export const useMarket = (address: PublicKey) => {
  const { connection } = useConnection()

  const fetchData = useCallback(
    () => PredictionMarket.fetch(connection, address),
    [address, connection]
  )

  const query = useQuery(marketKeys.market(address), fetchData)

  return query
}

// TODO make useMarket use data from useMarkets in the way you would want
export const useMarkets = () => {
  const program = useWalletlessProgram()
  const fetchData = useCallback(
    () => program.account.predictionMarket.all(),
    [program]
  )

  const query = useQuery(marketKeys.all, fetchData)

  return query
}
