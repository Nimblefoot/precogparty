import dayjs from "dayjs"
import React from "react"
import TimeAgo from "react-timeago"

const HumanTime = ({ date }: { date: Date }) => {
  return dayjs(date).isBefore(dayjs(new Date()).subtract(1, "day")) ? (
    <>{dayjs(date).format("MMM D")}</>
  ) : (
    <TimeAgo date={date} />
  )
}

export default HumanTime
