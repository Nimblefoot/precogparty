import React from "react"
import { ComponentStory, ComponentMeta } from "@storybook/react"
import { HistoryDumb } from "./HistoryDumb"
import { TradeRecordFields } from "@/generated/syrup/types"
import BN from "bn.js"

const dummyTrades: TradeRecordFields[] = [
  {
    numApples: new BN(1000),
    numOranges: new BN(4000),
    buyOrderForApples: true,
    time: new BN(1654421900),
  },
  {
    numApples: new BN(2100),
    numOranges: new BN(4000),
    buyOrderForApples: true,
    time: new BN(1654521900),
  },
  {
    numApples: new BN(1000),
    numOranges: new BN(4000),
    buyOrderForApples: true,
    time: new BN(1654721900),
  },
  {
    numApples: new BN(1000),
    numOranges: new BN(3000),
    buyOrderForApples: true,
    time: new BN(1654821900),
  },
  {
    numApples: new BN(1000),
    numOranges: new BN(30000),
    buyOrderForApples: true,
    time: new BN(1654871900),
  },
]

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
  <div className="p-5" style={{ width: 700, height: 400 }}>
    <HistoryDumb
      openTime={new BN(1654321900)}
      trades={dummyTrades}
      closeTime={new BN(0)}
    />
  </div>
)
