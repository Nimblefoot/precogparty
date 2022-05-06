import {
  PredictionMarket,
  PredictionMarketJSON,
} from "@/generated/client/accounts";
import { PROGRAM_ID } from "@/generated/client/programId";
import { ClockIcon } from "@heroicons/react/outline";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import User from "./User";

const useMarketData = (name: string | undefined) => {
  const { connection } = useConnection();
  const [data, setData] = useState<PredictionMarketJSON | undefined>();

  const getMarketData = useCallback(async () => {
    if (name === undefined) return undefined;

    const [marketAccount] = await PublicKey.findProgramAddress(
      [Buffer.from("market_account"), Buffer.from(name)],
      PROGRAM_ID
    );
    const market = await PredictionMarket.fetch(connection, marketAccount);
    return market ? market.toJSON() : undefined;
  }, [connection, name]);

  useEffect(() => {
    (async () => {
      setData(await getMarketData());
    })();
  }, [getMarketData, data]);

  return data;
};

const Market = ({}) => {
  const router = useRouter();
  const marketName = router.query.m;
  const market = useMarketData(
    typeof marketName === "string" ? marketName : undefined
  );

  return market ? (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Replace with your content */}
        <div className="py-4 border-4 border-dashed border-gray-200 rounded-lg h-96">
          <div className="">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-2xl font-semibold text-gray-900">
                {marketName}
              </h1>
              <div className="flex content-center flex-row gap-4 mt-2">
                <div>
                  <User publicKey={new PublicKey(market.marketAuthority)} />
                </div>
                <div className="text-sm flex justify-center flex-col">
                  <div className="flex">
                    <div className="h-5 w-5 self-center mr-1">
                      <ClockIcon />
                    </div>
                    <div className="">Jan 25 2020</div>
                  </div>
                </div>
              </div>
              <p className="mt-4">{market.description}</p>
            </div>
          </div>
        </div>
        {/* /End replace */}
      </div>
    </>
  ) : (
    <div>market does not exist</div>
  );
};

export default Market;
