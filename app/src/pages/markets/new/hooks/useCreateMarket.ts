import { useCallback } from "react"
import { createMarket } from "@/generated/client/instructions"
import { PROGRAM_ID } from "@/generated/client/programId"
import { PROGRAM_ID as SYRUP_ID } from "@/generated/syrup/programId"
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js"
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import { utf8 } from "@project-serum/anchor/dist/cjs/utils/bytes"
import { CLUSTER, COLLATERAL_MINT } from "config"
import BN from "bn.js"
import { initializeOrderbook } from "@/generated/syrup/instructions"
import { requestAdditionalBudgetIx } from "./requestAdditionalBudgetIx"

const useCreateMarket = () => {
  const callback = useCallback(
    async ({
      name,
      description,
      authority,
      resolutionAuthority,
    }: {
      name: string
      description: string
      authority: PublicKey
      resolutionAuthority: PublicKey
    }) => {
      const collateralMint = COLLATERAL_MINT

      const [marketAccount] = await PublicKey.findProgramAddress(
        [Buffer.from("market_account"), Buffer.from(name)],
        PROGRAM_ID
      )

      const [noMint] = await PublicKey.findProgramAddress(
        [Buffer.from("no_mint"), marketAccount.toBuffer()],
        PROGRAM_ID
      )

      const [yesMint] = await PublicKey.findProgramAddress(
        [Buffer.from("yes_mint"), marketAccount.toBuffer()],
        PROGRAM_ID
      )

      const collateralVault = await getAssociatedTokenAddress(
        collateralMint,
        marketAccount,
        true
      )

      const x = createMarket(
        {
          marketName: name,
          marketDescription: description,
        },
        {
          marketAccount,
          yesMint,
          noMint,
          marketAuthority: authority,
          resolutionAuthority,
          descriptionAuthority: authority,
          collateralVault,
          collateralMint,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        }
      )

      const [orderbookInfo] = await PublicKey.findProgramAddress(
        [marketAccount.toBuffer(), utf8.encode("orderbook-info")],
        SYRUP_ID
      )
      const [firstPage] = await PublicKey.findProgramAddress(
        [
          marketAccount.toBuffer(),
          utf8.encode("page"),
          new BN(0).toArrayLike(Buffer, "le", 4),
        ],
        SYRUP_ID
      )
      const [tradeLog] = await PublicKey.findProgramAddress(
        [marketAccount.toBuffer(), utf8.encode("trades")],
        SYRUP_ID
      )

      const applesVault = await getAssociatedTokenAddress(
        yesMint,
        orderbookInfo,
        true
      )
      const orangesVault = await getAssociatedTokenAddress(
        noMint,
        orderbookInfo,
        true
      )

      const createBook = initializeOrderbook(
        {
          id: marketAccount,
        },
        {
          admin: authority,
          applesMint: yesMint,
          applesVault,
          orangesMint: noMint,
          orangesVault,
          orderbookInfo,
          firstPage,
          tradeLog,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        }
      )

      const txn = new Transaction().add(
        // on devnet the default seems to be the max budget, and using this instruction breaks things ?
        ...(CLUSTER === "mainnet" || CLUSTER === "devnet"
          ? [requestAdditionalBudgetIx(341007)]
          : []),
        x,
        createBook
      )
      return txn
    },
    []
  )

  return callback
}

export default useCreateMarket
