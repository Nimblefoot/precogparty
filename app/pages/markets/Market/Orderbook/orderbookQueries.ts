import { OrderbookInfo, OrderbookPage } from "@/generated/syrup/accounts"
import { PROGRAM_ID as SYRUP_ID } from "@/generated/syrup/programId"
import { utf8 } from "@project-serum/anchor/dist/cjs/utils/bytes"
import { useConnection } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { useCallback, useMemo } from "react"
import { useQuery } from "react-query"

export const orderbookKeys = {
  all: ["orderbooks"],
  book: (address: PublicKey) => [...orderbookKeys.all, address.toString()],
  forCoin: (mint: PublicKey) => [...orderbookKeys.all, mint.toString()],
} as const

export type Orderbook = {
  info: OrderbookInfo
  pages: [OrderbookPage, ...OrderbookPage[]]
}

export const useOrderbook = (marketAddress: PublicKey) => {
  const { connection } = useConnection()

  const [orderbookInfo] = useMemo(
    () =>
      PublicKey.findProgramAddressSync(
        [marketAddress.toBuffer(), utf8.encode("orderbook-info")],
        SYRUP_ID
      ),
    [marketAddress]
  )

  const fetchData = useCallback(async () => {
    return await OrderbookInfo.fetch(connection, orderbookInfo)
  }, [connection, orderbookInfo])

  const query = useQuery(orderbookKeys.book(marketAddress), fetchData)

  return query
}
