import * as anchor from "@project-serum/anchor";
import { Program, splitArgsAndCtx } from "@project-serum/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import { assert } from "chai";
import { getListKeys } from "../app/syrup";
import { Syrup } from "../target/types/syrup";
import { utf8 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import * as spl from "@solana/spl-token";
import {
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  getAccount,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  getMint,
  createMint,
  createAssociatedTokenAccount,
  mintToChecked,
} from "@solana/spl-token";

describe("orderbook", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Syrup as Program<Syrup>;
  const admin = Keypair.generate();
  const user = Keypair.generate();

  describe("end-to-end", async () => {
    it("works", async () => {
      await program.provider.connection.confirmTransaction(
        await program.provider.connection.requestAirdrop(
          admin.publicKey,
          10000000000
        ),
        "finalized"
      );
      await program.provider.connection.confirmTransaction(
        await program.provider.connection.requestAirdrop(
          user.publicKey,
          1000000000
        ),
        "finalized"
      );

      console.log("create a user account and check initialize");
      await program.methods
        .createUserAccount()
        .accounts({
          user: user.publicKey,
        })
        .signers([user])
        .rpc();

      const [userAccountAddress] = await PublicKey.findProgramAddress(
        [utf8.encode("user-account"), user.publicKey.toBuffer()],
        program.programId
      );
      let userAccount = await program.account.userAccount.fetch(
        userAccountAddress
      );
      assert.equal(
        userAccount.user.toString(),
        user.publicKey.toString(),
        "user should match the creator"
      );
      assert.equal(
        // @ts-ignore
        userAccount.orders.length,
        0,
        "initially orders should be empty"
      );

      console.log("creates two mints and initialize an orderbook");
      const [orderbookInfo] = await PublicKey.findProgramAddress(
        [utf8.encode("test"), utf8.encode("orderbook-info")],
        program.programId
      );

      const currencyMint = await createMint(
        program.provider.connection,
        admin,
        admin.publicKey,
        null,
        6
      );

      const currencyVault = await getAssociatedTokenAddress(
        currencyMint,
        orderbookInfo,
        true
      );

      // const tokenMint = await createMint(
      //   program.provider.connection,
      //   admin,
      //   admin.publicKey,
      //   null,
      //   6
      // );

      // const tokenVault = await getAssociatedTokenAddress(
      //   tokenMint,
      //   orderbookInfo,
      //   true
      // );

      // const [firstPage] = await PublicKey.findProgramAddress(
      //   [
      //     utf8.encode("test"),
      //     utf8.encode("page"),
      //     new anchor.BN(0).toArrayLike(Buffer, "le", 4),
      //   ],
      //   program.programId
      // );

      // await program.methods
      //   .initializeOrderbook("test")
      //   .accounts({
      //     admin: program.provider.wallet.publicKey,
      //     currencyMint,
      //     currencyVault,
      //     tokenMint,
      //     tokenVault,
      //     orderbookInfo,
      //     firstPage,
      //   })
      //   .rpc();

      // let orderbookData = await program.account.orderbookInfo.fetch(
      //   orderbookInfo
      // );

      // assert.equal(
      //   orderbookData.currencyMint.toString(),
      //   currencyMint.toString(),
      //   "currency mints should match"
      // );
      // assert.equal(
      //   orderbookData.tokenMint.toString(),
      //   tokenMint.toString(),
      //   "token mints should match"
      // );

      let mintAccount = await getMint(
        program.provider.connection,
        currencyMint
      );

      let ata = await createAssociatedTokenAccount(
        program.provider.connection, // connection
        user, // fee payer
        currencyMint, // mint
        user.publicKey // owner,
      );

      let txhash = await mintToChecked(
        program.provider.connection, // connection
        user, // fee payer
        currencyMint, // mint
        ata, // receiver (sholud be a token account)
        admin, // mint authority
        1e8, // amount. if your decimals is 8, you mint 10^8 for 1 token.
        6 // decimals
      );

      let tokenAmount =
        await program.provider.connection.getTokenAccountBalance(ata);

      console.log(tokenAmount);
    });
  });
});
