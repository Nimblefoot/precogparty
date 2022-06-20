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
  let results: Array<[number, number]>
  results = []

  const numFullPages = Math.floor(length / pageSize)
  let lastPageLength = length - numFullPages * pageSize

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

  // console.log(search2D(pages, [2, 1]))

  for (let data of positions) {
    console.log("lokking for: " + data)
    let [x, y] = search2D(pages, data)
    results.push([x, y])

    // add check if you cant find the page

    let lastPageIdx = pages.length - 1
    let lastElIdx = pages[lastPageIdx].length - 1

    if (x == lastPageIdx && y == lastElIdx) {
      pages[lastPageIdx].pop()
    } else {
      pages[x][y] = pages[lastPageIdx][lastElIdx]
      pages[lastPageIdx].pop()
    }

    // get rid of empty pages
    if (pages[lastPageIdx].length == 0) {
      pages.pop()
    }
  }

  return results
}
