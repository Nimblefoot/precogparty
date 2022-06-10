import { PublicKey } from "@solana/web3.js"
import { ResponsiveLine, Serie } from "@nivo/line"
import React from "react"
import { TradeRecordFields } from "@/generated/syrup/types"
import { getPercentOdds } from "@/utils/orderMath"
import { BN } from "bn.js"

export const formatTrades = (trades: TradeRecordFields[]) =>
  trades.map((trade) => {
    const time = new Date(trade.time.toNumber() * 1000)
    const price = getPercentOdds({ ...trade })
    return { x: time, y: price }
  })

export function HistoryDumb({ data }: { data: Serie["data"] }) {
  return (
    /* @ts-ignore this errors due to some insane error with importing the wrong react types version or something insane like that */
    <ResponsiveLine
      data={[{ id: "YES", data, color: "#84cc16" }]}
      margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
      xScale={{
        type: "time",
        useUTC: false,
      }}
      colors="#84cc16"
      xFormat={(d) => d.toLocaleString()}
      yScale={{
        type: "linear",
        min: 0,
        max: 100,
      }}
      yFormat=" >-.2f"
      axisTop={null}
      axisRight={null}
      axisBottom={{
        format: (d) => d.toLocaleString(),

        tickSize: 5,
        tickPadding: 5,
        tickRotation: 45,
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
      }}
      pointSize={10}
      pointColor={{ theme: "background" }}
      pointBorderWidth={2}
      pointBorderColor={{ from: "serieColor" }}
      pointLabelYOffset={-12}
      useMesh={true}
    />
  )
}
