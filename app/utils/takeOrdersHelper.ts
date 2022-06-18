import Orders from "pages/markets/Market/Orderbook/Orders"

export const takeOrdersHelper = function (
  lastPageIndex: number,
  lastPageLength: number,
  pageSize: number,
  orders: [
    {
      pageNumber: number
      index: number
    }
  ]
): [
  {
    pageNumber: number
    index: number
  }
] {
  return [{ pageNumber: 1, index: 1 }]
}

export const seeWhatHappens = function (
  positions: Array<number>,
  length: number
): Array<number> {
  let data = Array.from(Array(length).keys())

  let endIdx = data.length - 1

  let res = []

  for (let counter = 0; counter < positions.length; counter++) {
    let idx = data.findIndex((x) => x == positions[counter])

    let temp = data[endIdx]
    data[endIdx] = data[idx]
    data[idx] = temp

    res.push(idx)

    endIdx -= 1
  }

  console.log("positions")
  console.log(positions)
  console.log("resulting data")
  console.log(data)
  console.log("positons when we popped them off")
  console.log(res)

  return [0]
}
