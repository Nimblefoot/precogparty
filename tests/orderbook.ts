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

const maxLength = 3;

describe("orderbook", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Syrup as Program<Syrup>;
  const admin = Keypair.generate();
  const user = Keypair.generate();

  // All PDAs set in `before` block
  let userAccountAddress: PublicKey;
  let orderbookInfo: PublicKey;
  let firstPage: PublicKey;
  let currencyVault: PublicKey;
  let tokenVault: PublicKey;
  let currencyMint: PublicKey;
  let tokenMint: PublicKey;
  let user_currency_ata: PublicKey;

  before(async () => {
    /** SETUP */
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

    currencyMint = await createMint(
      program.provider.connection,
      admin,
      admin.publicKey,
      null,
      6
    );

    user_currency_ata = await createAssociatedTokenAccount(
      program.provider.connection, // connection
      user, // fee payer
      currencyMint, // mint
      user.publicKey // owner,
    );

    tokenMint = await createMint(
      program.provider.connection,
      admin,
      admin.publicKey,
      null,
      6
    );

    /** PDAs */
    [userAccountAddress] = await PublicKey.findProgramAddress(
      [utf8.encode("user-account"), user.publicKey.toBuffer()],
      program.programId
    );

    [orderbookInfo] = await PublicKey.findProgramAddress(
      [utf8.encode("test"), utf8.encode("orderbook-info")],
      program.programId
    );

    [firstPage] = await PublicKey.findProgramAddress(
      [
        utf8.encode("test"),
        utf8.encode("page"),
        new anchor.BN(0).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    );

    currencyVault = await getAssociatedTokenAddress(
      currencyMint,
      orderbookInfo,
      true
    );
    tokenVault = await getAssociatedTokenAddress(
      tokenMint,
      orderbookInfo,
      true
    );
  });

  const size = 10;
  const mockData = [...Array(size).keys()].map((i) => ({
    user: user.publicKey,
    size: new anchor.BN((1e8 / 100) * (i + 1)),
    buy: true,
    price: new anchor.BN(1),
  }));

  it("creates a user account", async () => {
    await program.methods
      .createUserAccount()
      .accounts({
        user: user.publicKey,
      })
      .signers([user])
      .rpc();

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
  });

  it("initializes an orderbook", async () => {
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
  });

  it("places 10 orders", async () => {
    let txhash = await mintToChecked(
      program.provider.connection, // connection
      user, // fee payer
      currencyMint, // mint
      user_currency_ata, // receiver (sholud be a token account)
      admin, // mint authority
      2e8, // amount. if your decimals is 8, you mint 10^8 for 1 token.
      6 // decimals
    );

    for (let i = 0; i < size; i++) {
      const [infoKey] = await PublicKey.findProgramAddress(
        [utf8.encode("test"), utf8.encode("orderbook-info")],
        program.programId
      );
      const info = await program.account.orderbookInfo.fetchNullable(infoKey);
      const nextOpenPageIndex = Math.floor(info.length / maxLength);
      const [currentPageKey] = await PublicKey.findProgramAddress(
        [
          utf8.encode("test"),
          utf8.encode("page"),
          new anchor.BN(nextOpenPageIndex).toArrayLike(Buffer, "le", 4),
        ],
        program.programId
      );

      await program.methods
        .placeOrder("test", mockData[i])
        .accounts({
          user: user.publicKey,
          userAta: user_currency_ata,
          vault: currencyVault,
          orderbookInfo,
          currentPage: currentPageKey,
          userAccount: userAccountAddress,
        })
        .signers([user])
        .rpc();
    }

    let vaultBalance = await program.provider.connection.getTokenAccountBalance(
      currencyVault
    );
    assert.equal(
      vaultBalance.value.amount,
      "55000000",
      "Vault Balance should match sum of orders." // sum 1 to 10 = 55
    );

    const [infoKey] = await PublicKey.findProgramAddress(
      [utf8.encode("test"), utf8.encode("orderbook-info")],
      program.programId
    );
    const info = await program.account.orderbookInfo.fetchNullable(infoKey);
    const lastPageIndex = Math.floor((info.length - 1) / maxLength);
    const [lastPageKey] = await PublicKey.findProgramAddress(
      [
        utf8.encode("test"),
        utf8.encode("page"),
        new anchor.BN(lastPageIndex).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    );
    const lastPage = await program.account.orderbookPage.fetch(lastPageKey);

    assert.equal(info.length, 10, "correct orderbook length");
    assert.equal(
      // @ts-ignore
      lastPage.list.length,
      1,
      "correct length of final chunk"
    );
    const userAccount = await program.account.userAccount.fetch(
      userAccountAddress
    );
    const seventhOrder = userAccount.orders[6];
    assert.equal(
      seventhOrder.size.toString(),
      "7000000",
      "correct size for order"
    );
    assert.equal(seventhOrder.price, 1, "correct price for order");
  });

  it("cancels an order", async () => {
    const [infoKey] = await PublicKey.findProgramAddress(
      [utf8.encode("test"), utf8.encode("orderbook-info")],
      program.programId
    );
    const info = await program.account.orderbookInfo.fetchNullable(infoKey);
    const lastPageIndex = Math.floor((info.length - 1) / maxLength);
    const [lastPageKey] = await PublicKey.findProgramAddress(
      [
        utf8.encode("test"),
        utf8.encode("page"),
        new anchor.BN(lastPageIndex).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    );
    const firstOrder = mockData[0];
    await program.methods
      .cancelOrder("test", firstOrder, 0, 0)
      .accounts({
        user: user.publicKey,
        userAccount: userAccountAddress,
        userAta: user_currency_ata,
        vault: currencyVault,
        orderbookInfo,
        orderPage: firstPage,
        lastPage: lastPageKey,
      })
      .signers([user])
      .rpc();

    const vaultBalance =
      await program.provider.connection.getTokenAccountBalance(currencyVault);
    assert.equal(
      vaultBalance.value.amount,
      "54000000",
      "Vault Balance should be reduced to 54000000." // sum 2 to 10 = 54
    );

    const info2 = await program.account.orderbookInfo.fetchNullable(infoKey);
    const lastPageIndex2 = Math.floor((info2.length - 1) / maxLength);
    const [lastPageKey2] = await PublicKey.findProgramAddress(
      [
        utf8.encode("test"),
        utf8.encode("page"),
        new anchor.BN(lastPageIndex2).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    );
    const lastPage2 = await program.account.orderbookPage.fetch(lastPageKey2);

    assert.equal(info2.length, 9, "correct orderbook length");
    assert.equal(
      // @ts-ignore
      lastPage2.list.length,
      3,
      "correct length of final chunk"
    );
    const userAccount = await program.account.userAccount.fetch(
      userAccountAddress
    );
    // @ts-ignore
    assert.equal(userAccount.orders.length, 9, "user should have nine orders");
  });
});
