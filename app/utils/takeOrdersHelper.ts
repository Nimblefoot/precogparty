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
