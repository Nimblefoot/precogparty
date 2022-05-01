import * as anchor from "@project-serum/anchor";
import { AnchorError, Program, splitArgsAndCtx } from "@project-serum/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import { assert } from "chai";
import { getKeysAndData } from "../util/syrup";
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

      const tokenMint = await createMint(
        program.provider.connection,
        admin,
        admin.publicKey,
        null,
        6
      );

      const tokenVault = await getAssociatedTokenAddress(
        tokenMint,
        orderbookInfo,
        true
      );

      const [firstPage] = await PublicKey.findProgramAddress(
        [
          utf8.encode("test"),
          utf8.encode("page"),
          new anchor.BN(0).toArrayLike(Buffer, "le", 4),
        ],
        program.programId
      );

      await program.methods
        .initializeOrderbook("test")
        .accounts({
          admin: program.provider.wallet.publicKey,
          currencyMint,
          currencyVault,
          tokenMint,
          tokenVault,
          orderbookInfo,
          firstPage,
        })
        .rpc();

      let orderbookData = await program.account.orderbookInfo.fetch(
        orderbookInfo
      );

      assert.equal(
        orderbookData.currencyMint.toString(),
        currencyMint.toString(),
        "currency mints should match"
      );
      assert.equal(
        orderbookData.tokenMint.toString(),
        tokenMint.toString(),
        "token mints should match"
      );

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
        2e8, // amount. if your decimals is 8, you mint 10^8 for 1 token.
        6 // decimals
      );

      let tokenAmount =
        await program.provider.connection.getTokenAccountBalance(ata);

      console.log("lets place some order!");
      const size = 10;
      const mockData = [...Array(size).keys()].map((i) => ({
        user: user.publicKey,
        size: new anchor.BN((1e8 / 100) * (i + 1)),
        buy: true,
        price: new anchor.BN(1),
      }));

      for (let i = 0; i < size; i++) {
        const keysAndData = await getKeysAndData(program, "test");

        await program.methods
          .placeOrder("test", mockData[i])
          .accounts({
            user: user.publicKey,
            userAta: ata,
            vault: currencyVault,
            orderbookInfo,
            currentPage: keysAndData.pageKeys[keysAndData.info.lastPage],
            userAccount: userAccountAddress,
          })
          .signers([user])
          .rpc();
      }

      const vaultBalance =
        await program.provider.connection.getTokenAccountBalance(currencyVault);
      assert.equal(
        vaultBalance.value.amount,
        "55000000",
        "Vault Balance should match sum of orders." // sum 1 to 10 = 55
      );

      const keysAndData = await getKeysAndData(program, "test");
      assert.equal(keysAndData.info.length, 10, "correct orderbook length");
      assert.equal(
        // @ts-ignore
        keysAndData.lastPage.list.length,
        1,
        "correct length of final chunk"
      );
      userAccount = await program.account.userAccount.fetch(userAccountAddress);
      const seventhORder = userAccount.orders[7];
      assert.equal(seventhORder.pageNumber, 2, "correct page number for order");
      assert.equal(seventhORder.index, 1, "correct index for order");
    });
  });
});
