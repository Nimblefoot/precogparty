import { PublicKey } from "@solana/web3.js"
import { Serie } from "@nivo/line"
import React from "react"
import { useOrderbookLog } from "../Orderbook/orderbookQueries"
import { HistoryDumb } from "./HistoryDumb"

export function History({ market }: { market: PublicKey }) {
  const { data: tradeLog } = useOrderbookLog(market)

  return (
    <div style={{ height: 300 }}>
      {tradeLog && <HistoryDumb {...tradeLog} />}
    </div>
  )
}
