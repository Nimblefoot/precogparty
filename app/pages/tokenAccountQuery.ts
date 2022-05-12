import { getAssociatedTokenAddress } from "@solana/spl-token"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { useCallback } from "react"
import { useQueries, useQuery } from "react-query"

export const tokenAccountKeys = {
  all: ["tokenAccount"],
  token: (mint: PublicKey) => [...tokenAccountKeys.all, mint.toString()],
} as const

export const useTokenAccount = (mint: PublicKey | undefined) => {
  const { connection } = useConnection()
  const { publicKey } = useWallet()

  const get = useCallback(async () => {
    const ATA = await getAssociatedTokenAddress(mint!, publicKey!)
    return connection.getTokenAccountBalance(ATA)
  }, [connection, mint, publicKey])

  const query = useQuery(tokenAccountKeys.token(mint!), get, {
    enabled: publicKey !== null && mint !== undefined,
  })

  return query
}
