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

describe("end-to-end", async () => {
  // Configure the client to use the local cluster.

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;
  const program = anchor.workspace.Precog as Program<Precog>;

  const user = provider.wallet.publicKey;
  const marketName = "test market";

  let marketAccount: PublicKey;
  before(async () => {
    [marketAccount] = await PublicKey.findProgramAddress(
      [Buffer.from("market_account"), Buffer.from(marketName)],
      program.programId
    );
  });

  it("end-to-end", async () => {
    const [noMint] = await PublicKey.findProgramAddress(
      [Buffer.from("no_mint"), marketAccount.toBuffer()],
      program.programId
    );

    const [yesMint] = await PublicKey.findProgramAddress(
      [Buffer.from("yes_mint"), marketAccount.toBuffer()],
      program.programId
    );

    /* SET UP COLLATERAL */
    const { collateralMint, userCollateral } = await (async () => {
      const collateralMintKeypair = new Keypair();
      const collateralMint = collateralMintKeypair.publicKey;
      const userCollateral = await getAssociatedTokenAddress(
        collateralMint,
        user
      );

      const lamports = await getMinimumBalanceForRentExemptMint(
        provider.connection
      );

      const IXcreateMintAccount = SystemProgram.createAccount({
        fromPubkey: user,
        newAccountPubkey: collateralMint,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      });
      const IXinitMint = createInitializeMintInstruction(
        collateralMint,
        6,
        user,
        null
      );
      const IXcreateUserCollateral = createAssociatedTokenAccountInstruction(
        user,
        userCollateral,
        user,
        collateralMint
      );
      const IXmintCollateral = createMintToInstruction(
        collateralMint,
        userCollateral,
        user,
        1000
      );
      const tx = new Transaction().add(
        IXcreateMintAccount,
        IXinitMint,
        IXcreateUserCollateral,
        IXmintCollateral
      );

      const sig = await provider
        .sendAndConfirm(tx, [collateralMintKeypair])
        .catch((e) => {
          console.log(e);
          throw e;
        });
      console.log("set up fake collateral", sig);

      return { collateralMint, userCollateral };
    })();

    const collateralVault = await getAssociatedTokenAddress(
      collateralMint,
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
        collateralMint,
        resolutionAuthority: user,
        descriptionAuthority: user,
        collateralVault,
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
      collateralVault: collateralVault.toString(),
      userCollateral: userCollateral.toString(),
    };
    console.log(accounts); */

    const startingCollateralAmount = parseInt(
      (await getAccount(connection, userCollateral)).amount.toString()
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
          collateralVault,
          userCollateral,
        })
        .preInstructions(userAtaIxs)
        .rpc()
        .catch((e) => "fail");

      assert.equal(
        expectedFailure,
        "fail",
        "can't mint more than you have in COLLATERAL"
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
          collateralVault,
          userCollateral,
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

      const endingCollateralAmount = parseInt(
        (await getAccount(connection, userCollateral)).amount.toString()
      );
      assert.equal(endingCollateralAmount, startingCollateralAmount - 10);
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
          collateralVault,
          userCollateral,
        })
        .rpc()
        .catch((e) => {
          console.log(e);
          throw e;
        });
      console.log("merge set", sig3);

      const postMergeCollateral = parseInt(
        (await getAccount(connection, userCollateral)).amount.toString()
      );
      const userNoAccount = await getAccount(connection, userNo);
      const userYesAccount = await getAccount(connection, userYes);

      assert.equal(userNoAccount.amount.toString(), "0");
      assert.equal(userYesAccount.amount.toString(), "0");
      assert.equal(postMergeCollateral, startingCollateralAmount);
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
          collateralVault,
          userCollateral,
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
              collateralVault,
              userCollateral,
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
              collateralVault,
              userCollateral,
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
          collateralVault,
          userCollateral,
        })
        .rpc();
      console.log("redeemed NO coin", sig);

      const userNoAccount = await getAccount(connection, userNo);
      const postRedemptionCollateral = parseInt(
        (await getAccount(connection, userCollateral)).amount.toString()
      );
      assert.equal(userNoAccount.amount.toString(), "0");
      assert.equal(postRedemptionCollateral, startingCollateralAmount);
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
