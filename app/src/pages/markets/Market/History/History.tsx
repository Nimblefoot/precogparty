import { PublicKey } from "@solana/web3.js"
import { ResponsiveLine, Serie } from "@nivo/line"
import React from "react"

const formatTrades = (trades) => {}

export function HistoryDumb({ data, id }: { data: Serie["data"]; id: string }) {
  return (
    /* @ts-ignore this errors due to some insane error with importing the wrong react types version or something insane like that */
    <ResponsiveLine
      data={[{ id, data, color: "#84cc16" }]}
      margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
      xScale={{
        type: "time",
        format: "%Y-%m-%d",
        useUTC: false,
        precision: "day",
      }}
      colors="#84cc16"
      xFormat="time:%Y-%m-%d"
      yScale={{
        type: "linear",
        min: "auto",
        max: "auto",
        stacked: true,
        reverse: false,
      }}
      yFormat=" >-.2f"
      axisTop={null}
      axisRight={null}
      axisBottom={{
        format: "%b %d",

        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: "transportation",
        legendOffset: 36,
        legendPosition: "middle",
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: "count",
        legendOffset: -40,
        legendPosition: "middle",
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
