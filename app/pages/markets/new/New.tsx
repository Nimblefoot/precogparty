import TransactButton, {
  StatelessTransactButton,
  useTransact,
} from "@/components/TransactButton"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey, Transaction } from "@solana/web3.js"
import { useRouter } from "next/router"
import React, { useEffect, useState } from "react"
import useCreateMarket from "./hooks/useCreateMarket"

const descriptionMaxLength = parseInt(
  process.env.NEXT_PUBLIC_MARKET_DESCRIPTION_CHARLIMIT as string
)
const nameMaxLength = 32

const New = ({}) => {
  const router = useRouter()
  const { publicKey } = useWallet()
  const { callback, status } = useTransact()

  /* We have Formik at home, honey */
  const [desc, setDesc] = useState("")
  const [name, setName] = useState("")
  const [resolutionAuthority, setResolutionAuthority] = useState("")
  const [closing, setClosing] = useState<string>(
    new Date(Date.now()).toISOString()
  )

  const getCreateMarketTxn = useCreateMarket()
  const getTxn = async () => {
    const authority =
      resolutionAuthority !== ""
        ? new PublicKey(resolutionAuthority)
        : publicKey!
    console.log("aaa", authority)
    const txn = await getCreateMarketTxn({
      name,
      description: desc,
      authority,
    })
    return txn
  }
  const onClick = async () => {
    const txn = await getTxn()
    await callback(txn)
  }

  useEffect(() => {
    if (status === "done") {
      router.push(`/markets?m=${name}`)
    }
  }, [router, status, name])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
      <div className="space-y-8 divide-y divide-gray-200 shadow bg-white rounded-lg px-4 sm:px-6 py-5">
        <div className="space-y-8 sm:divide-y sm:divide-gray-200 sm:space-y-5">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              New Market
            </h3>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 sm:pt-5 sm:mt-5">
            <div className="sm:col-span-4">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Question
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  name="name"
                  id="name"
                  maxLength={nameMaxLength}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 rounded-md sm:text-sm border-gray-300"
                  placeholder="eg. Will the sun be visible from Earth on January 1st, 2023?"
                />
              </div>
              <p
                className={`mt-2 text-sm text-gray-500 ${
                  name.length == nameMaxLength
                    ? "text-red-500 font-semibold"
                    : ""
                }`}
              >
                {name.length} / {nameMaxLength}
              </p>
            </div>

            <div className="sm:col-span-6">
              <label
                htmlFor="about"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  maxLength={descriptionMaxLength}
                />
              </div>
              <p
                className={`mt-2 text-sm text-gray-500 ${
                  desc.length == descriptionMaxLength
                    ? "text-red-500 font-semibold"
                    : ""
                }`}
              >
                {desc.length} / {descriptionMaxLength}
              </p>
            </div>
            <div className="sm:col-span-4">
              <label
                htmlFor="about"
                className="block text-sm font-medium text-gray-700"
              >
                Market closing datetime (local)
              </label>
              <div className="mt-1">
                <input
                  type="datetime-local"
                  id="closing-time"
                  name="closing-time"
                  className="flex-1 focus:ring-indigo-500 focus:border-indigo-500 block min-w-0 rounded-md sm:text-sm border-gray-300"
                  onChange={(e) => setClosing(e.target.value)}
                  value={closing}
                  min={Date.now()}
                />
              </div>
            </div>
            <div className="sm:col-span-4">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Resolution Authority
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  name="authority"
                  id="authority"
                  value={resolutionAuthority}
                  placeholder={
                    publicKey ? publicKey?.toString() + " (yourself)" : ""
                  }
                  onChange={(e) => setResolutionAuthority(e.target.value)}
                  className="flex-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 rounded-md sm:text-sm border-gray-300"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end">
            <button
              type="button"
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <StatelessTransactButton
              verb="Create Market"
              onClick={onClick}
              status={status}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default New
