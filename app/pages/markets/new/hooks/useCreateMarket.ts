import { useCallback } from "react";
import { createMarket } from "@/generated/client/instructions";
import { PROGRAM_ID } from "@/generated/client/programId";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  AuthorityType,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { COLLATERAL_MINT } from "config";

const useCreateMarket = () => {
  const { wallet, publicKey } = useWallet();
  const x = useConnection();

  const callback = useCallback(
    async ({
      name,
      description,
      authority,
    }: {
      name: string;
      description: string;
      authority: PublicKey;
    }) => {
      const collateralMint = COLLATERAL_MINT;

      const [marketAccount] = await PublicKey.findProgramAddress(
        [Buffer.from("market_account"), Buffer.from(name)],
        PROGRAM_ID
      );

      const [noMint] = await PublicKey.findProgramAddress(
        [Buffer.from("no_mint"), marketAccount.toBuffer()],
        PROGRAM_ID
      );

      const [yesMint] = await PublicKey.findProgramAddress(
        [Buffer.from("yes_mint"), marketAccount.toBuffer()],
        PROGRAM_ID
      );

      const collateralVault = await getAssociatedTokenAddress(
        collateralMint,
        marketAccount,
        true
      );

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
      );

      // TODO upload description to arweave
      // instructions: create orderbooks
      // instruction: create market

      const txn = new Transaction().add(x);
      return txn;
    },
    []
  );

  return callback;
};

export default useCreateMarket;
