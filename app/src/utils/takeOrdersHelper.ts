import { OrderFields } from "@/generated/syrup/types"
import { PublicKey, Keypair } from "@solana/web3.js"
import BN from "bn.js"
import * as anchor from "@project-serum/anchor"

export type BN_ = InstanceType<typeof BN>

export interface takeOrderData {
  order: OrderFields
  size: BN_
  pageNumber: number
  index: number
}

export const takeOrdersHelper = function (
  orderParams: Array<takeOrderData>,
  length: number,
  pageSize: number
): Array<[takeOrderData, number]> {
  let results: Array<[takeOrderData, number]>
  results = []

  const numFullPages = Math.floor(length / pageSize)
  let lastPageLength = length - numFullPages * pageSize

  let lastPage =
    lastPageLength > 0
      ? Array(lastPageLength).fill({
          numOranges: new anchor.BN(0),
          numApples: new anchor.BN(0),
          offeringApples: false,
          memo: 0,
          user: Keypair.generate().publicKey,
        })
      : null

  let pages = Array(numFullPages)
    .fill(null)
    .map(() =>
      Array(pageSize).fill({
        numOranges: new anchor.BN(0),
        numApples: new anchor.BN(0),
        offeringApples: false,
        memo: 0,
        user: Keypair.generate().publicKey,
      })
    )
  if (lastPage) {
    pages.push(lastPage)
  }

  for (let { order, pageNumber, index } of orderParams) {
    let x = pageNumber
    let y = index
    pages[x][y] = order
  }

  for (let { order, size } of orderParams) {
    let [x, y] = findMatchingOrder(pages, order)
    results.push([
      {
        order,
        size,
        pageNumber: x,
        index: y,
      },
      pages.length - 1,
    ])

    // add check if you cant find the page
    if (
      (order.offeringApples &&
        order.numOranges.toString() == size.toString()) ||
      (!order.offeringApples && order.numOranges.toString() == size.toString())
    ) {
      let lastPageIdx = pages.length - 1
      let lastElIdx = pages[lastPageIdx].length - 1

      if (x == lastPageIdx && y == lastElIdx) {
        pages[lastPageIdx].pop()
      } else {
        let lastVal = pages[lastPageIdx][lastElIdx]

        pages[x][y] = lastVal
        pages[lastPageIdx].pop()
      }

      // get rid of empty pages
      if (pages[lastPageIdx].length == 0) {
        pages.pop()
      }
    }
  }

  return results
}

export const findMatchingOrder = function (
  arr: Array<Array<OrderFields>>,
  target: OrderFields
): [number, number] {
  // console.log("target: " + JSON.stringify(target))

  for (let x = 0; x < arr.length; x++) {
    let y = arr[x].findIndex((val) => {
      return (
        val.numApples == target.numApples &&
        val.numOranges == target.numOranges &&
        val.user == target.user &&
        val.offeringApples === target.offeringApples &&
        val.memo == target.memo
      )
    })

    if (y > -1) {
      return [x, y]
    }
  }

  console.log("ERROR ERROR ERROR")

  return [-1, -1]
}

// export const search2D = function <T>(arr: Array<Array<T>>, target: T) {
//   for (let x = 0; x < arr.length; x++) {
//     let y = arr[x].findIndex(
//       (val) => JSON.stringify(val) == JSON.stringify(target)
//     )

//     if (y > -1) {
//       return [x, y]
//     }
//   }

//   return [-1, -1]
// }

// export const seePaginationHappen = function (
//   positions: Array<[number, number]>,
//   length: number,
//   pageSize: number
// ): Array<[number, number, number]> {
//   let results: Array<[number, number, number]>
//   results = []

//   const numFullPages = Math.floor(length / pageSize)
//   let lastPageLength = length - numFullPages * pageSize

//   let lastPage =
//     lastPageLength > 0 ? Array(lastPageLength).fill([-1, -1]) : null

//   let fullPages = Array(numFullPages)
//     .fill(null)
//     .map(() => Array(pageSize).fill([-1, -1]))
//   let pages = lastPage ? fullPages.concat(lastPage) : fullPages

//   for (let data of positions) {
//     // console.log(data)

//     let x = data[0]
//     let y = data[1]
//     pages[x][y] = [x, y]
//   }

//   // console.log(search2D(pages, [2, 1]))

//   for (let data of positions) {
//     console.log("lokking for: " + data)
//     let [x, y] = search2D(pages, data)
//     results.push([x, y, pages.length - 1])

//     // add check if you cant find the page

//     let lastPageIdx = pages.length - 1
//     let lastElIdx = pages[lastPageIdx].length - 1

//     if (x == lastPageIdx && y == lastElIdx) {
//       pages[lastPageIdx].pop()
//     } else {
//       pages[x][y] = pages[lastPageIdx][lastElIdx]
//       pages[lastPageIdx].pop()
//     }

//     // get rid of empty pages
//     if (pages[lastPageIdx].length == 0) {
//       pages.pop()
//     }
//   }

//   return results
// }
