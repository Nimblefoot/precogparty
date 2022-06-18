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

  let end = data[-1]

  console.log(data)

  for (let counter = 0; counter < positions.length; counter++) {
    let idx = data.findIndex((x) => x == positions[counter])

    console.log(idx)
  }

  return [0]
}
