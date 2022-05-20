import { OrderFields } from "@/generated/syrup/types"
import { PublicKey } from "@solana/web3.js"
import React, { useMemo } from "react"
import { useOrderbook } from "./orderbookQueries"

const Orders = ({ marketAddress }: { marketAddress: PublicKey }) => {
  const orderbook = useOrderbook(marketAddress)
  const orders = useMemo(
    () =>
      orderbook.data?.pages
        .flatMap((page) => page.list)
        .sort((a, b) => a.price.toNumber() - b.price.toNumber()),
    [orderbook.data?.pages]
  )
  const yesOrders = useMemo(() => orders?.filter((x) => x.buy), [orders])
  const noOrders = useMemo(() => orders?.filter((x) => !x.buy), [orders])

  return orderbook.data ? (
    <>
      <div className=" w-full break-all">{JSON.stringify(orderbook.data)}</div>
      <div className="grid grid-cols-2">
        {[yesOrders, noOrders].map((orderCol, i) => (
          <div key={i}>
            {orderCol?.map((order) => (
              <Order key={JSON.stringify(order)} {...order} />
            ))}{" "}
          </div>
        ))}
      </div>
    </>
  ) : (
    <></>
  )
}

const Order = ({ price, size, buy }: OrderFields) => (
  <>
    <div>poopy</div>
  </>
)

export default Orders
