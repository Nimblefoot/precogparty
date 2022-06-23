import * as anchor from "@project-serum/anchor"
import { AnchorError, Program, splitArgsAndCtx } from "@project-serum/anchor"
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js"
import { assert, Assertion } from "chai"
import { Syrup } from "../target/types/syrup"
import { utf8 } from "@project-serum/anchor/dist/cjs/utils/bytes"
import * as spl from "@solana/spl-token"
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
} from "@solana/spl-token"

const maxLength = 100 //
const orderbookId = Keypair.generate().publicKey

describe("orderbook", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.Syrup as Program<Syrup>
  const admin = Keypair.generate()
  const user = Keypair.generate()

  // All PDAs set in `before` block
  let adminAccountAddress: PublicKey
  let userAccountAddress: PublicKey
  let orderbookInfoAddress: PublicKey
  let firstPageAddress: PublicKey
  let TradeLogAddress: PublicKey
  let applesVault: PublicKey
  let orangesVault: PublicKey
  let applesMint: PublicKey
  let orangesMint: PublicKey
  let userApplesATA: PublicKey
  let userOrangesATA: PublicKey
  let adminApplesATA: PublicKey
  let adminOrangesATA: PublicKey
  let adminTradeLog: PublicKey
  let userTradeLog: PublicKey

  before(async () => {
    /** SETUP */
    await program.provider.connection.confirmTransaction(
      await program.provider.connection.requestAirdrop(
        admin.publicKey,
        10000000000
      ),
      "finalized"
    )
    await program.provider.connection.confirmTransaction(
      await program.provider.connection.requestAirdrop(
        user.publicKey,
        1000000000
      ),
      "finalized"
    )

    applesMint = await createMint(
      program.provider.connection,
      admin,
      admin.publicKey,
      null,
      6
    )

    orangesMint = await createMint(
      program.provider.connection,
      admin,
      admin.publicKey,
      null,
      6
    )

    userApplesATA = await createAssociatedTokenAccount(
      program.provider.connection, // connection
      user, // fee payer
      applesMint, // mint
      user.publicKey // owner,
    )

    userOrangesATA = await createAssociatedTokenAccount(
      program.provider.connection, // connection
      user, // fee payer
      orangesMint, // mint
      user.publicKey // owner,
    )

    adminApplesATA = await createAssociatedTokenAccount(
      program.provider.connection, // connection
      user, // fee payer
      applesMint, // mint
      admin.publicKey // owner,
    )

    adminOrangesATA = await createAssociatedTokenAccount(
      program.provider.connection, // connection
      admin, // fee payer
      orangesMint, // mint
      admin.publicKey // owner,
    )

    /** PDAs */
    ;[adminAccountAddress] = await PublicKey.findProgramAddress(
      [utf8.encode("user-account"), admin.publicKey.toBuffer()],
      program.programId
    )
    ;[userAccountAddress] = await PublicKey.findProgramAddress(
      [utf8.encode("user-account"), user.publicKey.toBuffer()],
      program.programId
    )
    ;[orderbookInfoAddress] = await PublicKey.findProgramAddress(
      [orderbookId.toBytes(), utf8.encode("orderbook-info")],
      program.programId
    )
    ;[firstPageAddress] = await PublicKey.findProgramAddress(
      [
        orderbookId.toBytes(),
        utf8.encode("page"),
        new anchor.BN(0).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    )
    ;[TradeLogAddress] = await PublicKey.findProgramAddress(
      [orderbookId.toBytes(), utf8.encode("trades")],
      program.programId
    )
    ;[userTradeLog] = await PublicKey.findProgramAddress(
      [user.publicKey.toBuffer(), utf8.encode("trade-log")],
      program.programId
    )
    ;[adminTradeLog] = await PublicKey.findProgramAddress(
      [admin.publicKey.toBuffer(), utf8.encode("trade-log")],
      program.programId
    )

    // Vaults
    applesVault = await getAssociatedTokenAddress(
      applesMint,
      orderbookInfoAddress,
      true
    )

    orangesVault = await getAssociatedTokenAddress(
      orangesMint,
      orderbookInfoAddress,
      true
    )
  })

  it("initializes an orderbook", async () => {
    // initialize orderbook
    await program.methods
      .initializeOrderbook(orderbookId)
      .accounts({
        admin: admin.publicKey,
        applesMint,
        applesVault,
        orangesMint,
        orangesVault,
        // orderbookInfo, //derivable from seeds
        firstPage: firstPageAddress,
      })
      .signers([admin])
      .rpc()
  })

  it("creates accounts for user and admin", async () => {
    await program.methods
      .createUserAccount()
      .accounts({
        user: user.publicKey,
      })
      .signers([user])
      .rpc()

    await program.methods
      .createUserAccount()
      .accounts({
        user: admin.publicKey,
      })
      .signers([admin])
      .rpc()
  })

  it("handles placing orders", async () => {
    // MINT TOKENS
    // user has '500' apples.
    await mintToChecked(
      program.provider.connection, // connection
      user, // fee payer
      applesMint, // mint
      userApplesATA, // receiver (sholud be a token account)
      admin, // mint authority
      5e8, // amount. if your decimals is 6, this is 500 tokens
      6 // decimals
    )

    // admin has '500' oranges
    await mintToChecked(
      program.provider.connection, // connection
      admin, // fee payer
      orangesMint, // mint
      adminOrangesATA, // receiver (sholud be a token account)
      admin, // mint authority
      5e8, // amount. if your decimals is 6, this is 500 tokens
      6 // decimals
    )

    const orderbookInfo = await program.account.orderbookInfo.fetchNullable(
      orderbookInfoAddress
    )
    const nextOpenPageIndex = Math.floor(orderbookInfo.length / maxLength)
    const [currentPageKey] = await PublicKey.findProgramAddress(
      [
        orderbookId.toBytes(),
        utf8.encode("page"),
        new anchor.BN(nextOpenPageIndex).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    )

    const lastPageIndex = Math.floor((orderbookInfo.length - 1) / maxLength)
    const [lastPageKey] = await PublicKey.findProgramAddress(
      [
        orderbookId.toBytes(),
        utf8.encode("page"),
        new anchor.BN(lastPageIndex).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    )

    // sell two apples for 1 orange
    await program.methods
      .placeOrder({
        user: user.publicKey,
        numApples: new anchor.BN(2e6),
        offeringApples: true,
        numOranges: new anchor.BN(1e6),
        memo: 0,
      })
      .accounts({
        user: user.publicKey,
        userAta: userApplesATA,
        vault: applesVault,
        orderbookInfo: orderbookInfoAddress,
        currentPage: currentPageKey,
        userAccount: userAccountAddress,
      })
      .signers([user])
      .rpc({
        skipPreflight: true,
      })

    // sell five apples for five oranges
    await program.methods
      .placeOrder({
        user: user.publicKey,
        numApples: new anchor.BN(5e6),
        offeringApples: true,
        numOranges: new anchor.BN(5e6),
        memo: 0,
      })
      .accounts({
        user: user.publicKey,
        userAta: userApplesATA,
        vault: applesVault,
        orderbookInfo: orderbookInfoAddress,
        currentPage: currentPageKey,
        userAccount: userAccountAddress,
      })
      .signers([user])
      .rpc({
        skipPreflight: true,
      })

    const vaultBalance =
      await program.provider.connection.getTokenAccountBalance(applesVault)
    assert.equal(
      vaultBalance.value.amount,
      "7000000",
      "Vault Balance should be 7000000. Represnts 7 apples" // 1*2 + 5*1
    )

    // re-compute nextOpenPage before placing an order but we know its still the first page lol.
    // offers to sell five oranges for fifteen apples
    await program.methods
      .placeOrder({
        user: admin.publicKey,
        numOranges: new anchor.BN(5e6),
        offeringApples: false,
        numApples: new anchor.BN(1.5e7),
        memo: 0,
      })
      .accounts({
        user: admin.publicKey,
        userAta: adminOrangesATA,
        vault: orangesVault,
        orderbookInfo: orderbookInfoAddress,
        currentPage: currentPageKey,
        userAccount: adminAccountAddress,
      })
      .signers([admin])
      .rpc({
        skipPreflight: true,
      })

    const orangesVaultBalance =
      await program.provider.connection.getTokenAccountBalance(orangesVault)
    assert.equal(
      orangesVaultBalance.value.amount,
      "5000000",
      "Vault Balance should be 5000000. Represnts 5 oranges"
    )
  })

  it("cancels an order", async () => {
    const orderbookInfo = await program.account.orderbookInfo.fetchNullable(
      orderbookInfoAddress
    )
    const lastPageIndex = Math.floor((orderbookInfo.length - 1) / maxLength)
    const [lastPageKey] = await PublicKey.findProgramAddress(
      [
        orderbookId.toBytes(),
        utf8.encode("page"),
        new anchor.BN(lastPageIndex).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    )

    await program.methods
      .cancelOrder(
        {
          user: user.publicKey,
          numApples: new anchor.BN(2e6),
          offeringApples: true,
          numOranges: new anchor.BN(1e6),
          memo: 0,
        },
        0,
        0
      )
      .accounts({
        user: user.publicKey,
        userAccount: userAccountAddress,
        userAta: userApplesATA,
        vault: applesVault,
        orderbookInfo: orderbookInfoAddress,
        orderPage: lastPageKey,
      })
      .signers([user])
      .rpc()

    const vaultBalance =
      await program.provider.connection.getTokenAccountBalance(applesVault)
    assert.equal(
      vaultBalance.value.amount,
      "5000000",
      "Vault Balance should be reduced to 5000000."
    )

    const info2 = await program.account.orderbookInfo.fetchNullable(
      orderbookInfoAddress
    )
    assert.equal(info2.length, 2, "correct orderbook length is 2")

    const userAccount = await program.account.userAccount.fetch(
      userAccountAddress
    )
    assert.equal(
      // @ts-ignore
      userAccount.orders.length,
      1,
      "user should have one remaining orders"
    )
  })

  it("takes orders", async () => {
    // we know the last page and don't need to recompute lengths
    const [lastPageKey] = await PublicKey.findProgramAddress(
      [
        orderbookId.toBytes(),
        utf8.encode("page"),
        new anchor.BN(0).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    )

    // the max size is 5e6. Going to take for 2e6. the order is in position 0,1 cause of how deletion works (swap and pop)!
    await program.methods
      .takeOrder(
        {
          user: user.publicKey,
          numApples: new anchor.BN(5e6),
          offeringApples: true,
          numOranges: new anchor.BN(5e6),
          memo: 0,
        },
        new anchor.BN(2e6),
        0,
        1
      )
      .accounts({
        taker: admin.publicKey,
        takerSendingAta: adminOrangesATA,
        takerReceivingAta: adminApplesATA,
        offererUserAccount: userAccountAddress,
        offererReceivingAta: userOrangesATA,
        vault: applesVault,
        orderbookInfo: orderbookInfoAddress,
        orderPage: lastPageKey,
        tradeLog: TradeLogAddress,
        takerTradeLog: adminTradeLog,
        offererTradeLog: userTradeLog,
      })
      .signers([admin])
      .rpc()

    const applesVaultBalance =
      await program.provider.connection.getTokenAccountBalance(applesVault)
    assert.equal(
      applesVaultBalance.value.amount,
      "3000000",
      "Vault Balance should be reduced to 3000000."
    )

    const userOrangesBalance =
      await program.provider.connection.getTokenAccountBalance(userOrangesATA)
    assert.equal(
      userOrangesBalance.value.amount,
      "2000000",
      "User should have bought 2 oranges at a price of 1 apple each"
    )

    const adminApplesBalance =
      await program.provider.connection.getTokenAccountBalance(adminApplesATA)
    assert.equal(
      adminApplesBalance.value.amount,
      "2000000",
      "Admin sold 2 oranges for 1 apple each."
    )

    // User will take the admins sell order for the full amount
    let userApples = await program.provider.connection.getTokenAccountBalance(
      userApplesATA
    )
    const userApplesPreSale = parseInt(userApples.value.amount) / 1e6

    await program.methods
      .takeOrder(
        {
          user: admin.publicKey,
          numOranges: new anchor.BN(5e6),
          offeringApples: false,
          numApples: new anchor.BN(1.5e7),
          memo: 0,
        },
        new anchor.BN(15e6),
        0,
        0
      )
      .accounts({
        taker: user.publicKey,
        takerSendingAta: userApplesATA,
        takerReceivingAta: userOrangesATA,
        offererUserAccount: adminAccountAddress,
        offererReceivingAta: adminApplesATA,
        vault: orangesVault,
        orderbookInfo: orderbookInfoAddress,
        orderPage: lastPageKey,
        tradeLog: TradeLogAddress,
        takerTradeLog: userTradeLog,
        offererTradeLog: adminTradeLog,
      })
      .signers([user])
      .rpc({
        skipPreflight: true,
      })

    const userOrangesBalance2 =
      await program.provider.connection.getTokenAccountBalance(userOrangesATA)
    assert.equal(
      userOrangesBalance2.value.amount,
      "7000000",
      "User should have bought 7 oranges" //
    )

    const adminApplesBalance2 =
      await program.provider.connection.getTokenAccountBalance(adminApplesATA)
    assert.equal(
      adminApplesBalance2.value.amount,
      "17000000",
      "Admin sold 2 oranges for 1 apple each and 5 oranges for 3 apples each"
    )

    userApples = await program.provider.connection.getTokenAccountBalance(
      userApplesATA
    )
    const userApplesPostSale = parseInt(userApples.value.amount) / 1e6

    assert.equal(
      userApplesPreSale - userApplesPostSale,
      15,
      "User spent 15 apples to offering_apples 5 oranges for 3 apples each"
    )

    const orderbookInfo = await program.account.orderbookInfo.fetchNullable(
      orderbookInfoAddress
    )

    const tradeLog = await program.account.tradeLog.fetchNullable(
      TradeLogAddress
    )
    // @ts-ignore
    const lastTrades = tradeLog.trades.reverse().map((trade) => ({
      buyOrderForApples: trade.buyOrderForApples,
      numOranges: trade.numOranges.toString(),
      numApples: trade.numApples.toString(),
    }))
    assert.deepEqual(lastTrades, [
      {
        buyOrderForApples: false,
        numOranges: "15000000",
        numApples: "5000000",
      },
      { buyOrderForApples: true, numOranges: "2000000", numApples: "2000000" },
    ])
  })

  it("Closes an orderbook. Taking is blocked but you can still cancel, you can cancel other people's orders.", async () => {
    await program.methods
      .closeOrderbook()
      .accounts({
        admin: admin.publicKey,
        orderbookInfo: orderbookInfoAddress,
      })
      .signers([admin])
      .rpc()

    const [firstPageKey] = await PublicKey.findProgramAddress(
      [
        orderbookId.toBytes(),
        utf8.encode("page"),
        new anchor.BN(0).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    )

    await program.methods
      .takeOrder(
        {
          user: user.publicKey,
          numApples: new anchor.BN(3e6),
          offeringApples: true,
          numOranges: new anchor.BN(3e6),
          memo: 0,
        },
        new anchor.BN(2e6),
        0,
        0
      )
      .accounts({
        taker: admin.publicKey,
        takerSendingAta: adminOrangesATA,
        takerReceivingAta: adminApplesATA,
        offererUserAccount: userAccountAddress,
        offererReceivingAta: userOrangesATA,
        vault: applesVault,
        orderbookInfo: orderbookInfoAddress,
        orderPage: firstPageKey,
        tradeLog: TradeLogAddress,
        takerTradeLog: userTradeLog,
        offererTradeLog: adminTradeLog,
      })
      .signers([admin])
      .rpc({
        skipPreflight: true,
      })
      .catch(
        (e) =>
          "should not be able to take orders after the orderbook is closed!"
      )

    // can cancel other people's orders if orderbook is closed
    await program.methods
      .cancelOrder(
        {
          user: user.publicKey,
          numApples: new anchor.BN(3e6),
          offeringApples: true,
          numOranges: new anchor.BN(3e6),
          memo: 0,
        },
        0,
        0
      )
      .accounts({
        user: admin.publicKey,
        userAccount: userAccountAddress,
        userAta: userApplesATA,
        vault: applesVault,
        orderbookInfo: orderbookInfoAddress,
        orderPage: firstPageKey,
      })
      .signers([admin])
      .rpc()
  })

  it("checks security assumption hold", async () => {
    const result = await program.methods
      .initializeOrderbook(orderbookId)
      .accounts({
        admin: provider.wallet.publicKey,
        applesMint,
        applesVault,
        orangesMint,
        orangesVault,
        // orderbookInfo, //derivable from seeds
        firstPage: firstPageAddress,
      })
      .rpc({
        skipPreflight: true,
      })
      .catch((e) => "it failed")

    assert(
      result == "it failed",
      "Cannot have two orderbooks with the same name"
    )
  })
})
