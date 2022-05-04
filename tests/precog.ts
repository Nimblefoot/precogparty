import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Precog } from "../target/types/precog";

import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  getAccount,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert } from "chai";

const assertThrowsAsync = async (fn: () => Promise<any>, msg?: string) => {
  let error = null;
  try {
    await fn();
  } catch (err) {
    error = err;
  }
  assert.instanceOf(error, Error, msg);
};

//const USDC = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

describe("end-to-end", async () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;
  const program = anchor.workspace.Precog as Program<Precog>;

  const user = provider.wallet.publicKey;
  const marketName = "test market";

  const [marketAccount] = await PublicKey.findProgramAddress(
    [Buffer.from("market_account"), Buffer.from(marketName)],
    program.programId
  );

  it("end-to-end", async () => {
    const [noMint] = await PublicKey.findProgramAddress(
      [Buffer.from("no_mint"), marketAccount.toBuffer()],
      program.programId
    );

    const [yesMint] = await PublicKey.findProgramAddress(
      [Buffer.from("yes_mint"), marketAccount.toBuffer()],
      program.programId
    );

    /* SET UP USDC */
    const { usdcMint, userUsdc } = await (async () => {
      const usdcMintKeypair = new Keypair();
      const usdcMint = usdcMintKeypair.publicKey;
      const userUsdc = await getAssociatedTokenAddress(usdcMint, user);

      const lamports = await getMinimumBalanceForRentExemptMint(
        provider.connection
      );

      const IXcreateMintAccount = SystemProgram.createAccount({
        fromPubkey: user,
        newAccountPubkey: usdcMint,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      });
      const IXinitMint = createInitializeMintInstruction(
        usdcMint,
        6,
        user,
        null
      );
      const IXcreateUserUsdc = createAssociatedTokenAccountInstruction(
        user,
        userUsdc,
        user,
        usdcMint
      );
      const IXmintUsdc = createMintToInstruction(
        usdcMint,
        userUsdc,
        user,
        1000
      );
      const tx = new Transaction().add(
        IXcreateMintAccount,
        IXinitMint,
        IXcreateUserUsdc,
        IXmintUsdc
      );

      const sig = await provider
        .sendAndConfirm(tx, [usdcMintKeypair])
        .catch((e) => {
          console.log(e);
          throw e;
        });
      console.log("set up fake usdc", sig);

      return { usdcMint, userUsdc };
    })();

    const usdcVault = await getAssociatedTokenAddress(
      usdcMint,
      marketAccount,
      true
    );

    const sig = await program.methods
      .createMarket(marketName, "fart")
      .accounts({
        //marketAccount,
        //yesMint,
        noMint,
        marketAuthority: user,
        usdcMint,
        resolutionAuthority: user,
        descriptionAuthority: user,
        usdcVault,
      })
      .rpc()
      .catch((e) => {
        console.log(e);
        throw e;
      });

    console.log("createMarket", sig);

    const marketData = await program.account.predictionMarket.fetch(
      marketAccount
    );
    console.log(marketData);

    const userNo = await getAssociatedTokenAddress(noMint, user);
    const userYes = await getAssociatedTokenAddress(yesMint, user);

    /* 
    const accounts = {
      user: user.toString(),
      userNo: userNo.toString(),
      userYes: userYes.toString(),
      marketAccount: marketAccount.toString(),
      yesMint: yesMint.toString(),
      noMint: noMint.toString(),
      usdcVault: usdcVault.toString(),
      userUsdc: userUsdc.toString(),
    };
    console.log(accounts); */

    const startingUsdcAmount = parseInt(
      (await getAccount(connection, userUsdc)).amount.toString()
    );

    /* TEST MINT SET */
    await (async () => {
      const userAtaIxs = [
        createAssociatedTokenAccountInstruction(user, userNo, user, noMint),
        createAssociatedTokenAccountInstruction(user, userYes, user, yesMint),
      ];
      /* 
      const expectedFailure = await program.methods
        .mintContingentSet(new anchor.BN(1000000))
        .accounts({
          user,
          userNo,
          userYes,
          marketAccount,
          yesMint,
          noMint,
          usdcVault,
          userUsdc,
        })
        .preInstructions(userAtaIxs)
        .rpc()
        .catch((e) => "fail");

      assert.equal(
        expectedFailure,
        "fail",
        "can't mint more than you have in USDC"
      );
 */
      const sig = await program.methods
        .mintContingentSet(new anchor.BN(10))
        .accounts({
          user,
          userNo,
          userYes,
          marketAccount,
          yesMint,
          noMint,
          usdcVault,
          userUsdc,
        })
        .preInstructions(userAtaIxs)
        .rpc()
        .catch((e) => {
          console.log(e);
          throw e;
        });

      console.log("mint contingent set", sig);

      const userNoAccount = await getAccount(connection, userNo);
      assert.equal(userNoAccount.amount.toString(), "10");
      const userYesAccount = await getAccount(connection, userYes);
      assert.equal(userYesAccount.amount.toString(), "10");

      const endingUsdcAmount = parseInt(
        (await getAccount(connection, userUsdc)).amount.toString()
      );
      assert.equal(endingUsdcAmount, startingUsdcAmount - 10);
    })();

    /* TEST MERGE SET */
    await (async () => {
      const sig3 = await program.methods
        .mergeContingentSet(new anchor.BN(10))
        .accounts({
          user,
          userNo,
          userYes,
          marketAccount,
          yesMint,
          noMint,
          usdcVault,
          userUsdc,
        })
        .rpc()
        .catch((e) => {
          console.log(e);
          throw e;
        });
      console.log("merge set", sig3);

      const postMergeUsdc = parseInt(
        (await getAccount(connection, userUsdc)).amount.toString()
      );
      const userNoAccount = await getAccount(connection, userNo);
      const userYesAccount = await getAccount(connection, userYes);

      assert.equal(userNoAccount.amount.toString(), "0");
      assert.equal(userYesAccount.amount.toString(), "0");
      assert.equal(postMergeUsdc, startingUsdcAmount);
    })();

    /* RESOLVE MARKET */
    await (async () => {
      await assertThrowsAsync(
        () =>
          program.methods
            .resolveMarket(19)
            .accounts({
              resolutionAuthority: user,
              marketAccount,
            })
            .rpc(),
        "can't resolve with a nonsense outcome"
      );

      const sig = await program.methods
        .resolveMarket(2)
        .accounts({
          resolutionAuthority: user,
          marketAccount,
        })
        .rpc();
      console.log("resolve market NO", sig);

      await assertThrowsAsync(
        () =>
          program.methods
            .resolveMarket(1)
            .accounts({
              resolutionAuthority: user,
              marketAccount,
            })
            .rpc(),
        "can't resolve a resolved market"
      );
    })();

    /* TEST REDEEM CONTINGENT COINS */
    await (async () => {
      await program.methods
        .mintContingentSet(new anchor.BN(20))
        .accounts({
          user,
          userNo,
          userYes,
          marketAccount,
          yesMint,
          noMint,
          usdcVault,
          userUsdc,
        })
        .rpc()
        .catch((e) => {
          console.log(e);
          throw e;
        });

      await assertThrowsAsync(
        () =>
          program.methods
            .redeemContingentCoin(new anchor.BN(100))
            .accounts({
              user,
              marketAccount,
              contingentCoinMint: noMint,
              userContingentCoin: userNo,
              usdcVault,
              userUsdc,
            })
            .rpc(),
        "can't redeem more than you have"
      );
      await assertThrowsAsync(
        () =>
          program.methods
            .redeemContingentCoin(new anchor.BN(20))
            .accounts({
              user,
              marketAccount,
              contingentCoinMint: yesMint,
              userContingentCoin: userYes,
              usdcVault,
              userUsdc,
            })
            .rpc(),
        "can't redeem when outcome is not met"
      );
      const sig = await program.methods
        .redeemContingentCoin(new anchor.BN(20))
        .accounts({
          user,
          marketAccount,
          contingentCoinMint: noMint,
          userContingentCoin: userNo,
          usdcVault,
          userUsdc,
        })
        .rpc();
      console.log("redeemed NO coin", sig);

      const userNoAccount = await getAccount(connection, userNo);
      const postRedemptionUsdc = parseInt(
        (await getAccount(connection, userUsdc)).amount.toString()
      );
      assert.equal(userNoAccount.amount.toString(), "0");
      assert.equal(postRedemptionUsdc, startingUsdcAmount);
    })();
  });

  it("Updates description URI", async () => {
    const desc = "poopynoopy";
    const sig = await program.methods
      .updateMarketDescription(desc)
      .accounts({
        descriptionAuthority: user,
        marketAccount,
      })
      .rpc();
    console.log("updated description", sig);
    const onchainDescription = (
      await program.account.predictionMarket.fetch(marketAccount)
    ).description;
    const s = Buffer.from(onchainDescription).toString().trimEnd();
    assert.strictEqual(desc, s, "description uri updated");
  });
});
