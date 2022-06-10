import React from "react"
import { ComponentStory, ComponentMeta } from "@storybook/react"
import { formatTrades, HistoryDumb } from "./History"
import { TradeRecordFields } from "@/generated/syrup/types"
import BN from "bn.js"

const dummyTrades: TradeRecordFields[] = [
  {
    numApples: new BN(1000),
    numOranges: new BN(3000),
    buyOrderForApples: true,
    time: new BN(1654821900),
  },
  {
    numApples: new BN(1000),
    numOranges: new BN(3000),
    buyOrderForApples: true,
    time: new BN(1654921900),
  },
  {
    numApples: new BN(2000),
    numOranges: new BN(7000),
    buyOrderForApples: true,
    time: new BN(1654991900),
  },
  {
    numApples: new BN(2000),
    numOranges: new BN(5000),
    buyOrderForApples: true,
    time: new BN(1655321900),
  },
]

const data = formatTrades(dummyTrades)

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "History",
  component: HistoryDumb,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    backgroundColor: { control: "color" },
  },
} as ComponentMeta<typeof HistoryDumb>

export const Primary = () => (
  <div style={{ width: 700, height: 400 }}>
    <HistoryDumb data={data} />
  </div>
)
