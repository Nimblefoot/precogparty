import { OrderFields } from "@/generated/syrup/types"
import { PublicKey } from "@solana/web3.js"
import { BN } from "bn.js"
import { COLLATERAL_DECIMALS, ORDERBOOK_PRICE_RATIO_DECIMALS } from "config"
import React, { useMemo } from "react"
import { useOrderbook } from "./orderbookQueries"
import { BN_, displayBN, displayOddsBN, order2ui } from "./util"
import clsx from "clsx"

const Orders = ({ marketAddress }: { marketAddress: PublicKey }) => {
  const orderbook = useOrderbook(marketAddress)
  const orders = useMemo(
    () =>
      orderbook.data?.pages
        .flatMap((page) => page.list)
        .sort((a, b) => a.price.toNumber() - b.price.toNumber()),
    [orderbook.data?.pages]
  )
  const yesOrders = useMemo(() => orders?.filter((x) => x.offering_apples), [orders])
  const noOrders = useMemo(() => orders?.filter((x) => !x.offering_apples), [orders])

  return orderbook.data ? (
    <>
      <div className=" w-full break-all">{JSON.stringify(orderbook.data)}</div>
      <div className="grid grid-cols-2">
        {[yesOrders, noOrders].map((orderCol, i) => (
          <div key={i}>
            <div>{["YES orders", "NO orders"][i]}</div>
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

const DECIMAL_MULTIPLIER = new BN(10 ** ORDERBOOK_PRICE_RATIO_DECIMALS)
const AMOUNT_MULTIPLIER = new BN(10 ** COLLATERAL_DECIMALS)

const Order = (order: OrderFields) => {
  const { price, size, offering_apples: yesForNo } = order
  const { odds, collateralSize } = order2ui(order)

  return (
    <>
      <div className="grid grid-cols-3">
        <div className={clsx(!yesForNo && "order-last")}>{collateralSize}</div>
        <div>{(100 * odds).toFixed(0)}%</div>
      </div>
    </>
  )
}

export default Orders
