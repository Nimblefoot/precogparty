import { useCallback } from "react"
import { useQuery } from "react-query"
import useWalletlessProgram from "./new/hooks/useWalletlessProgram"

export const useMarketsQuery = () => {
  const program = useWalletlessProgram()
  const fetchData = useCallback(
    () => program.account.predictionMarket.all(),
    [program]
  )

  const query = useQuery("markets", fetchData)

  return query
}
