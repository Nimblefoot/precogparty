import TransactButton from "@/components/TransactButton";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import React, { useEffect, useState } from "react";
import useCreateMarket from "./hooks/useCreateMarket";

const descriptionMaxLength = parseInt(
  process.env.NEXT_PUBLIC_MARKET_DESCRIPTION_CHARLIMIT as string
);
const nameMaxLength = 100;

const New = ({}) => {
  const { publicKey } = useWallet();
  const [desc, setDesc] = useState("");
  const [name, setName] = useState("");
  const [resolutionAuthority, setResolutionAuthority] = useState("");
  const [closing, setClosing] = useState<string>(
    new Date(Date.now()).toISOString()
  );

  const getCreateMarketTxn = useCreateMarket();
  const getTxn = async () => {
    const authority =
      resolutionAuthority !== ""
        ? new PublicKey(resolutionAuthority)
        : publicKey!;
    console.log("aaa", authority);
    const txn = await getCreateMarketTxn({
      name,
      description: desc,
      authority,
    });
    return txn;
  };

  return (
    <form className="space-y-8 divide-y divide-gray-200">
      <div className="space-y-8 divide-y divide-gray-200">
        <div>
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              New market
            </h3>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
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
      </div>

      <div className="pt-5">
        <div className="flex justify-end">
          <button
            type="button"
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <TransactButton verb="Create Market" getTxn={getTxn} />
        </div>
      </div>
    </form>
  );
};

export default New;
