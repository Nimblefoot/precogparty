import { useMemo } from "react"
import { useMarkets } from "../Market/hooks/marketQueries"
import Fuse from "fuse.js"

const useMarketSearch = () => {
  const markets = useMarkets()
  const fuse = useMemo(() => {
    if (!markets.data) return undefined
    return new Fuse(markets.data, { keys: ["account.name"] })
  }, [markets.data])

  return fuse
}

export default useMarketSearch
