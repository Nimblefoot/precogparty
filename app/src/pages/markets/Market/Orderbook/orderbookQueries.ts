import {
  OrderbookInfo,
  OrderbookPage,
  TradeLog,
  UserAccount,
} from "@/generated/syrup/accounts"
import { PROGRAM_ID as SYRUP_ID } from "@/generated/syrup/programId"
import { utf8 } from "@project-serum/anchor/dist/cjs/utils/bytes"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import BN from "bn.js"
import { useCallback, useMemo } from "react"
import { useQuery } from "react-query"
import { useMarkets } from "../hooks/marketQueries"

import * as R from "ramda"

export const orderbookKeys = {
  all: ["orderbooks"],
  book: (address: PublicKey) => [...orderbookKeys.all, address.toString()],
  userAccount: (address?: PublicKey) => ["user", address?.toString()],
  allLogs: ["log"],
  log: (address: PublicKey) => [...orderbookKeys.allLogs, address.toString()],
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

  const fetchData = useCallback(async (): Promise<Orderbook> => {
    const [firstPage] = await PublicKey.findProgramAddress(
      [
        marketAddress.toBuffer(),
        utf8.encode("page"),
        new BN(0).toArrayLike(Buffer, "le", 4),
      ],
      SYRUP_ID
    )

    const [info, page1] = await Promise.all([
      OrderbookInfo.fetch(connection, orderbookInfo),
      OrderbookPage.fetch(connection, firstPage),
    ] as const)

    if (info === null || page1 === null) throw new Error("orderbook info null")

    return { info, pages: [page1] }
  }, [connection, marketAddress, orderbookInfo])

  const query = useQuery(orderbookKeys.book(marketAddress), fetchData)

  return query
}

export const useOrderbookUserAccount = () => {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const fetchData = useCallback(async () => {
    const [userAccountAddress] = await PublicKey.findProgramAddress(
      [utf8.encode("user-account"), publicKey!.toBuffer()],
      SYRUP_ID
    )
    return UserAccount.fetch(connection, userAccountAddress)
  }, [connection, publicKey])

  const query = useQuery(
    orderbookKeys.userAccount(publicKey ?? undefined),
    fetchData,
    {
      enabled: !!publicKey,
    }
  )
  return query
}

export const useOrderbookLog = (marketAddress: PublicKey) => {
  const { connection } = useConnection()

  const fetchData = useCallback(async () => {
    const [tradeLog] = await PublicKey.findProgramAddress(
      [marketAddress.toBuffer(), utf8.encode("trades")],
      SYRUP_ID
    )

    const data = await TradeLog.fetch(connection, tradeLog)

    if (data === null)
      throw new Error(`no orderbook log found ${marketAddress.toString()}`)

    return formatTradeLog(data)!
  }, [connection, marketAddress])

  const query = useQuery(orderbookKeys.log(marketAddress), fetchData)

  return query
}

const formatTradeLog = <T extends TradeLog | null>(d: T) => {
  if (d === null) return null

  const trades = d.trades
  const start = d.start
  return {
    trades: trades.slice(start).concat(trades.slice(0, start)),
    start: d.start,
    openTime: d.openTime,
    closeTime: d.closeTime,
  }
}

// TODO make this use useOrderbookLog singular data in the way you would want
export const useOrderbookLogs = () => {
  const { connection } = useConnection()
  const { data: markets } = useMarkets()
  const fetchData = useCallback(async () => {
    if (!markets) throw new Error()

    const tradeLogs = await Promise.all(
      markets.map((m) =>
        PublicKey.findProgramAddress(
          [m.publicKey.toBuffer(), utf8.encode("trades")],
          SYRUP_ID
        )
      )
    )

    const data = await TradeLog.fetchMultiple(
      connection,
      tradeLogs.map(([addr]) => addr)
    )

    const pairs = R.zipObj(
      markets.map((x) => x.publicKey.toString()),
      data.map(formatTradeLog)
    )

    return pairs
  }, [connection, markets])

  const query = useQuery(orderbookKeys.allLogs, fetchData, {
    enabled: markets !== undefined,
  })

  return query
}
