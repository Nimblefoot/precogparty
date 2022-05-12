import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/outline"
import { PublicKey } from "@solana/web3.js"
import Link from "next/link"
import { useMarket, useMarkets } from "pages/markets/Market/hooks/marketQueries"
import { useAllTokenAccounts } from "pages/tokenAccountQuery"
import React, { useMemo } from "react"

const YesBadge = () => (
  <>
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-lime-100 text-lime-800">
      <CheckCircleIcon className="h-4 w-4 -ml-1 mr-1" />
      YES
    </span>
  </>
)

const NoBadge = () => (
  <>
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
      <XCircleIcon className="h-4 w-4 -ml-1 mr-1" />
      NO
    </span>
  </>
)

const usePositions = () => {
  const accounts = useAllTokenAccounts()
  const markets = useMarkets()

  // TODO maybe wrap this in useQuery?
  // TODO in future we should have pointers from tokens to markets on chain
  const positions = useMemo(() => {
    if (!markets.data) return undefined
    if (!accounts.data) return undefined

    const accountsSimplified = accounts.data.value.map((account) => ({
      mint: new PublicKey(account.account.data.parsed.info.mint),
      uiAmount: account.account.data.parsed.info.tokenAmount.uiAmount,
    }))

    const nonzero = accountsSimplified.filter(({ uiAmount }) => uiAmount > 0)

    return markets.data
      .map((market) => {
        const [yesAccount] = nonzero.filter(({ mint }) =>
          mint.equals(market.account.yesMint)
        )
        const [noAccount] = nonzero.filter(({ mint }) =>
          mint.equals(market.account.noMint)
        )

        if (yesAccount || noAccount)
          return {
            marketAddress: market.publicKey,
            yesAccount,
            noAccount,
          } as const
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
          <h1 className="text-xl font-semibold text-gray-900">Tokens</h1>
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
                      Market
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Balance
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
                    <Position
                      key={position.marketAddress.toString()}
                      {...position}
                    />
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
  yesAccount,
  noAccount,
}: NonNullable<ReturnType<typeof usePositions>>[number]) {
  const market = useMarket(marketAddress)

  return (
    <tr>
      <td
        className={`
          whitespace-nowrap py-4 pl-4 pr-3 text-lg font-medium sm:pl-6
          ${market.data?.resolution === 0 ? "text-gray-900" : "text-gray-500"}
        `}
      >
        <Link href={`/markets?m=${market.data?.name}`} passHref>
          <a>
            {market.data?.name} {market.data?.resolution === 1 && <YesBadge />}
            {market.data?.resolution === 2 && <NoBadge />}
          </a>
        </Link>
      </td>
      <td
        className={`
        whitespace-nowrap px-3 py-4 text-sm 
      `}
      >
        {yesAccount && (
          <span className="text-lime-700">${yesAccount.uiAmount} YES</span>
        )}
        {yesAccount && noAccount && <>{",  "}</>}
        {noAccount && (
          <span className="text-rose-700">${noAccount.uiAmount} NO</span>
        )}
      </td>

      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6"></td>
    </tr>
  )
}
