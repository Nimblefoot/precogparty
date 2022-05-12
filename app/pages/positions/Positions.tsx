import { PublicKey } from "@solana/web3.js"
import { useMarket, useMarkets } from "pages/markets/Market/hooks/marketQueries"
import { useAllTokenAccounts } from "pages/tokenAccountQuery"
import React, { useMemo } from "react"

const usePositions = () => {
  const accounts = useAllTokenAccounts()
  const markets = useMarkets()

  // TODO maybe wrap this in useQuery?
  // TODO in future we should have pointers from tokens to markets on chain
  const positions = useMemo(() => {
    if (!markets.data) return undefined
    if (!accounts.data) return undefined

    return accounts.data.value
      .map((account) => {
        const mint = new PublicKey(account.account.data.parsed.info.mint)

        const [yesMarket] = markets.data.filter((market) =>
          market.account.yesMint.equals(mint)
        )

        if (yesMarket) {
          return {
            mint,
            uiAmount: account.account.data.parsed.info.tokenAmount.uiAmount,
            marketAddress: yesMarket.publicKey,
            position: "yes",
          } as const
        }

        const [noMarket] = markets.data.filter((market) =>
          market.account.noMint.equals(mint)
        )
        if (noMarket) {
          return {
            mint,
            uiAmount: account.account.data.parsed.info.tokenAmount
              .uiAmount as number,
            marketAddress: noMarket.publicKey,
            position: "no",
          } as const
        }

        return undefined
      })
      .filter((x): x is typeof x & {} => x !== undefined)
  }, [accounts.data, markets.data])

  return positions
}

const Positions = ({}) => {
  const positions = usePositions()

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Positions</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all the users in your account including their name, title,
            email and role.
          </p>
        </div>
      </div>
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Position
                    </th>

                    <th
                      scope="col"
                      className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                    >
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {positions?.map((position) => (
                    <Position key={position.mint.toString()} {...position} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Positions

function Position({
  marketAddress,
  mint,
  uiAmount,
  position,
}: NonNullable<ReturnType<typeof usePositions>>[number]) {
  const market = useMarket(marketAddress)

  return (
    <tr>
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
        {market.data?.name}
      </td>
      <td
        className={`
        whitespace-nowrap px-3 py-4 text-sm
        ${position === "yes" ? "text-lime-600" : "text-rose-600"}
      `}
      >
        {uiAmount} {position}
      </td>

      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6"></td>
    </tr>
  )
}
