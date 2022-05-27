import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { useCallback } from "react"
import { useQueries, useQuery } from "react-query"
import { queryClient } from "./providers"

export const tokenAccountKeys = {
  all: ["tokenAccount"],
  token: (mint: PublicKey | undefined) => [
    ...tokenAccountKeys.all,
    mint?.toString(),
  ],
} as const

export const useMarketAccounts = (market: PublicKey) => {}

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

export const useAllTokenAccounts = () => {
  const { connection } = useConnection()
  const { publicKey } = useWallet()

  const get = useCallback(async () => {
    if (!publicKey)
      throw new Error("attempted to retrieve token accounts without publicKey")
    return connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: TOKEN_PROGRAM_ID,
    })
  }, [connection, publicKey])

  const query = useQuery(tokenAccountKeys.all, get, {
    enabled: publicKey !== null,
    onSuccess: (accounts) => {
      accounts.value.forEach((account) =>
        queryClient.setQueryData(
          tokenAccountKeys.token(
            new PublicKey(account.account.data.parsed.info.mint)
          ),
          {
            value: account.account.data.parsed.info.tokenAmount,
            context: accounts.context,
          }
        )
      )
    },
  })

  return query
}
