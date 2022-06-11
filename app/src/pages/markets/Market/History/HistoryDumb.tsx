import { ResponsiveLine } from "@nivo/line"
import React from "react"
import { TradeRecordFields } from "@/generated/syrup/types"
import { getPercentOdds } from "@/utils/orderMath"
import dayjs from "dayjs"
import { TradeLogFields } from "@/generated/syrup/accounts"
import { BN } from "bn.js"

// This is only a separate file because importing stuff from the generated client made storybook angry

const formatTrades = (trades: TradeRecordFields[]) =>
  trades.map((trade) => {
    const time = new Date(trade.time.toNumber() * 1000)
    const price = getPercentOdds({ ...trade })
    return { x: time, y: price }
  })
function arrayMin(arr: number[]) {
  return arr.reduce((p, v) => {
    return p < v ? p : v
  })
}

export function HistoryDumb({
  trades,
  openTime,
  closeTime,
}: Omit<TradeLogFields, "start">) {
  const data = formatTrades(trades)

  // If time of closing is nonzero, market is closed, so use that
  const latestTime = closeTime.eq(new BN(0))
    ? new Date()
    : new Date(closeTime.toNumber() * 1000)

  // all time axis stuff ripped from Manifold. Not necessarily convinced it is ideal.
  const openTimeAsDate = new Date(openTime.toNumber() * 1000)

  const hoursAgo = dayjs(latestTime).subtract(5, "hours")
  const startDate = dayjs(openTimeAsDate).isBefore(hoursAgo)
    ? openTimeAsDate
    : hoursAgo.toDate()

  const lessThanAWeek = dayjs(startDate).add(1, "week").isAfter(latestTime)

  return (
    /* @ts-ignore this errors due to some insane error with importing the wrong react types version or something insane like that */
    <ResponsiveLine
      data={[{ id: "YES", data, color: "#84cc16" }]}
      margin={{ top: 5, right: 20, bottom: 25, left: 40 }}
      xScale={{
        type: "time",
        useUTC: false,
        min: startDate,
        max: latestTime,
      }}
      colors="#84cc16"
      xFormat={(d) => formatTime(+d.valueOf(), lessThanAWeek)}
      yScale={{
        type: "linear",
        min: 0,
        max: 100,
      }}
      yFormat={(n) => (n as number).toFixed(2) + "%"}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickValues: 5,
        format: (time) => formatTime(+time, lessThanAWeek),
        tickSize: 5,
        tickPadding: 5,
      }}
      axisLeft={{
        tickValues: [0, 25, 50, 75, 100],
        format: (x) => x + "%",
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
// Ripped from Manifold, though likely non final
function formatTime(time: number, includeTime: boolean) {
  const d = dayjs(time)

  if (d.isSame(Date.now(), "day")) return d.format("ha")

  if (includeTime) return dayjs(time).format("MMM D, ha")

  return dayjs(time).format("MMM D")
}
