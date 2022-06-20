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

export const search2D = function <T>(arr: Array<Array<T>>, target: T) {
  for (let x = 0; x < arr.length; x++) {
    let y = arr[x].findIndex(
      (val) => JSON.stringify(val) == JSON.stringify(target)
    )

    if (y > -1) {
      return [x, y]
    }
  }

  return [-1, -1]
}

export const seePaginationHappen = function (
  positions: Array<[number, number]>,
  length: number,
  pageSize: number
): Array<[number, number]> {
  const numFullPages = Math.floor(length / pageSize)
  let lastPageLength = length - numFullPages * pageSize
  let lastPageIdx = lastPageLength > 0 ? numFullPages : numFullPages - 1

  let lastPage =
    lastPageLength > 0 ? Array(lastPageLength).fill([-1, -1]) : null

  let fullPages = Array(numFullPages)
    .fill(null)
    .map(() => Array(pageSize).fill([-1, -1]))
  let pages = lastPage ? fullPages.concat(lastPage) : fullPages

  for (let data of positions) {
    // console.log(data)

    let x = data[0]
    let y = data[1]
    pages[x][y] = [x, y]
  }

  console.log(search2D(pages, [2, 1]))

  return [[0, 0]]
}
