import { useCallback } from "react"
import { resolveMarket } from "@/generated/client/instructions"
import { useWallet } from "@solana/wallet-adapter-react"
import { PublicKey, Transaction } from "@solana/web3.js"
import { Resolution, RESOLUTION_MAPPING } from "config"

// import { PROGRAM_ID as SYRUP_ID } from "@/generated/syrup/programId"
// import { OrderFields } from "@/generated/syrup/types"
// import { useSyrup } from "src/hooks/useProgram"
// import { utf8 } from "@project-serum/anchor/dist/cjs/utils/bytes"

const useResolveMarketIxs = () => {
  const { publicKey } = useWallet()

  const callback = useCallback(
    async ({
      resolution,
      market,
    }: {
      resolution: Resolution
      market: PublicKey
    }) => {
      if (!publicKey) throw new Error("no publickey connected")

      const x = resolveMarket(
        {
          resolution: RESOLUTION_MAPPING[resolution],
        },
        {
          marketAccount: market,
          resolutionAuthority: publicKey,
        }
      )

      // issue: market resolver should be the orderbook admin? not sure if set?
      // const program = useSyrup()

      // const [orderbookInfo] = await PublicKey.findProgramAddress(
      //   [market.toBuffer(), utf8.encode("orderbook-info")],
      //   SYRUP_ID
      // )

      // const y = await program.methods
      //   .closeOrderbook()
      //   .accounts({
      //     admin: publicKey,
      //     orderbookInfo,
      //   })
      //   .instruction()

      // const txn = new Transaction().add(x).add(y)

      return [x]
    },
    [publicKey]
  )

  return callback
}

export default useResolveMarketIxs
