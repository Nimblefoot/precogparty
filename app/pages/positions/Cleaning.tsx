import { StatelessTransactButton } from "@/components/TransactButton"
import { queryClient } from "pages/providers"
import { useQueries } from "react-query"
import { useMarketsWithPosition } from "./useMarketsWithPosition"

export const WithdrawAllButton = () => {
  const markets = useMarketsWithPosition()
  const userQueries = useQueries(
    [markets ?? []].map((user) => {
      return {
        queryKey: ["user", user.id],
        queryFn: () => queryClient.getQueryData,
      }
    })
  )

  return (
    <StatelessTransactButton
      onClick={async () => {}}
      status="initial"
      verb="Withdraw All"
    />
  )
}
