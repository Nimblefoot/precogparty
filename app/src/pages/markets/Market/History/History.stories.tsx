import React from "react"
import { ComponentStory, ComponentMeta } from "@storybook/react"
import { HistoryDumb } from "./History"

const data = [
  { x: "2018-01-01", y: 7 },
  { x: "2018-01-02", y: 5 },
  { x: "2018-01-03", y: 11 },
  { x: "2018-01-04", y: 9 },
  { x: "2018-01-05", y: 12 },
  { x: "2018-01-06", y: 16 },
  { x: "2018-01-07", y: 13 },
  { x: "2018-01-08", y: 13 },
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
  <div style={{ width: 700, height: 400 }}>
    <HistoryDumb data={data} id="1" />
  </div>
)
