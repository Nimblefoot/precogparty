import { useCallback } from "react"
import { createMarket } from "@/generated/client/instructions"
import { PROGRAM_ID } from "@/generated/client/programId"
import { PROGRAM_ID as SYRUP_ID } from "@/generated/syrup/programId"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js"
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  AuthorityType,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import { utf8 } from "@project-serum/anchor/dist/cjs/utils/bytes"
import { COLLATERAL_MINT } from "config"
import BN from "bn.js"
import { initializeOrderbook } from "@/generated/syrup/instructions"

export const requestAdditionalBudgetIx = (budget: number) => {
  const data = Buffer.from(Uint8Array.of(0, ...new BN(budget).toArray("le", 4)))
  return new TransactionInstruction({
    keys: [],
    programId: new PublicKey("ComputeBudget111111111111111111111111111111"),
    data,
  })
}

const useCreateMarket = () => {
  const { wallet, publicKey } = useWallet()
  const x = useConnection()

  const callback = useCallback(
    async ({
      name,
      description,
      authority,
    }: {
      name: string
      description: string
      authority: PublicKey
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
          resolutionAuthority: authority,
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
          name: marketAccount,
        },
        {
          admin: authority,
          applesMint: yesMint,
          applesVault,
          orangesMint: noMint,
          orangesVault,
          orderbookInfo,
          firstPage,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        }
      )

      const txn = new Transaction().add(
        requestAdditionalBudgetIx(341007),
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
