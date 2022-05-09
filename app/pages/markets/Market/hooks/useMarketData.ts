import {
  PredictionMarket,
  PredictionMarketJSON,
} from "@/generated/client/accounts"
import { useConnection } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { useCallback, useEffect, useState } from "react"

export const useMarketData = (address: PublicKey) => {
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
