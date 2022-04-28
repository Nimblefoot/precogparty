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

      console.log("creating token accounts and setting up orderbook");
      const [authority] = await PublicKey.findProgramAddress(
        [utf8.encode("authority")],
        program.programId
      );

      const usdcMint = await createMint(
        program.provider.connection,
        admin,
        admin.publicKey,
        null,
        9
      );

      const usdcVault = await getAssociatedTokenAddress(
        usdcMint,
        authority,
        true
      );

      await program.methods
        .createVault()
        .accounts({
          payer: program.provider.wallet.publicKey,
          usdcMint,
          usdcVault,
          authority,
        })
        .rpc();
      console.log("fake mint worked");

      const [orderbookInfo] = await PublicKey.findProgramAddress(
        [utf8.encode("test"), utf8.encode("orderbook-info")],
        program.programId
      );

      const currencyMint = await createMint(
        program.provider.connection,
        admin,
        admin.publicKey,
        null,
        9
      );
      // console.log(currencyMint.toString());

      const currencyVault = await getAssociatedTokenAddress(
        currencyMint,
        orderbookInfo,
        true
      );
      // console.log(currencyVault.toString());

      const tokenMint = await createMint(
        program.provider.connection,
        admin,
        admin.publicKey,
        null,
        9
      );
      // console.log(tokenMint.toString());

      const tokenVault = await getAssociatedTokenAddress(
        tokenMint,
        orderbookInfo,
        true
      );
      // console.log(tokenVault.toString());

      await program.methods
        .initializeOrderbook("test")
        .accounts({
          admin: program.provider.wallet.publicKey,
          currencyMint,
          currencyVault,
          tokenMint,
          tokenVault,
          orderbookInfo,
        })
        .rpc();

      // let tokenMintPubkey = await createMint(
      //   program.provider.connection,
      //   admin,
      //   admin.publicKey,
      //   admin.publicKey,
      //   8,
      //   admin
      // );
      // const tokenVault = await createAssociatedTokenAccount(
      //   program.provider.connection, // connection
      //   admin, // fee payer
      //   tokenMintPubkey, // mint
      //   admin.publicKey // owner,
      // );

      // console.log(orderbookInfo.toString());

      // const { usdcMint, userUsdc, usdcMintKeypair } = await (async () => {
      //   const usdcMintKeypair = new Keypair();
      //   const usdcMint = usdcMintKeypair.publicKey;
      //   const userUsdc = await getAssociatedTokenAddress(
      //     usdcMint,
      //     user.publicKey
      //   );

      //   const lamports = await getMinimumBalanceForRentExemptMint(
      //     program.provider.connection
      //   );

      //   const IXcreateMintAccount = SystemProgram.createAccount({
      //     fromPubkey: user.publicKey,
      //     newAccountPubkey: usdcMint,
      //     space: MINT_SIZE,
      //     lamports,
      //     programId: TOKEN_PROGRAM_ID,
      //   });
      //   const IXinitMint = createInitializeMintInstruction(
      //     usdcMint,
      //     6,
      //     user.publicKey,
      //     null
      //   );
      //   const IXcreateUserUsdc = createAssociatedTokenAccountInstruction(
      //     user.publicKey,
      //     userUsdc,
      //     user.publicKey,
      //     usdcMint
      //   );
      //   const IXmintUsdc = createMintToInstruction(
      //     usdcMint,
      //     userUsdc,
      //     user.publicKey,
      //     1000
      //   );
      //   const tx = new Transaction().add(
      //     IXcreateMintAccount,
      //     IXinitMint,
      //     IXcreateUserUsdc,
      //     IXmintUsdc
      //   );

      //   const sig = await program.provider
      //     .send(tx, [usdcMintKeypair])
      //     .catch((e) => {
      //       console.log(e);
      //       throw e;
      //     });
      //   console.log("set up fake usdc", sig);

      //   return { usdcMint, userUsdc, usdcMintKeypair };
      // })();
    });
  });
});
