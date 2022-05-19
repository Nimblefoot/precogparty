import { PublicKey } from "@solana/web3.js"
import React from "react"
import { useOrderbook } from "./orderbookQueries"

const Orders = ({ marketAddress }: { marketAddress: PublicKey }) => {
  const orderbook = useOrderbook(marketAddress)

  return orderbook.data ? (
    <div className=" w-full break-all">{JSON.stringify(orderbook.data)}</div>
  ) : (
    <></>
  )
}

export default Orders
