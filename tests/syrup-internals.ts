import * as anchor from "@project-serum/anchor"
import { AnchorError, Program, splitArgsAndCtx } from "@project-serum/anchor"
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js"
import { assert } from "chai"
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

const maxLength = 3 // extremely small to make sure stuff works properly

describe("orderbook", async () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.Syrup as Program<Syrup>
  const admin = Keypair.generate()
  const user = Keypair.generate()
  let orderbookName = "test-test-test-1"

  // All PDAs set in `before` block
  let adminAccountAddress: PublicKey
  let userAccountAddress: PublicKey
  let orderbookInfo: PublicKey
  let firstPage: PublicKey
  let currencyVault: PublicKey
  let tokenVault: PublicKey
  let currencyMint: PublicKey
  let tokenMint: PublicKey
  let user_currency_ata: PublicKey
  let user_token_ata: PublicKey
  let admin_currency_ata: PublicKey
  let admin_token_ata: PublicKey

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

    currencyMint = await createMint(
      program.provider.connection,
      admin,
      admin.publicKey,
      null,
      6
    )

    tokenMint = await createMint(
      program.provider.connection,
      admin,
      admin.publicKey,
      null,
      6
    )

    user_currency_ata = await createAssociatedTokenAccount(
      program.provider.connection, // connection
      user, // fee payer
      currencyMint, // mint
      user.publicKey // owner,
    )

    user_token_ata = await createAssociatedTokenAccount(
      program.provider.connection, // connection
      user, // fee payer
      tokenMint, // mint
      user.publicKey // owner,
    )

    admin_currency_ata = await createAssociatedTokenAccount(
      program.provider.connection, // connection
      user, // fee payer
      currencyMint, // mint
      admin.publicKey // owner,
    )

    admin_token_ata = await createAssociatedTokenAccount(
      program.provider.connection, // connection
      admin, // fee payer
      tokenMint, // mint
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
    ;[orderbookInfo] = await PublicKey.findProgramAddress(
      [utf8.encode(orderbookName), utf8.encode("orderbook-info")],
      program.programId
    )
    ;[firstPage] = await PublicKey.findProgramAddress(
      [
        utf8.encode(orderbookName),
        utf8.encode("page"),
        new anchor.BN(0).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    )

    currencyVault = await getAssociatedTokenAddress(
      currencyMint,
      orderbookInfo,
      true
    )
    tokenVault = await getAssociatedTokenAddress(tokenMint, orderbookInfo, true)
  })

  const size = 10
  const mockData = [...Array(size).keys()].map((i) => ({
    user: user.publicKey,
    size: new anchor.BN((1e8 / 100) * (i + 1)),
    buy: true,
    price: new anchor.BN(2),
  }))

  it("creates a user account", async () => {
    await program.methods
      .createUserAccount()
      .accounts({
        user: user.publicKey,
      })
      .signers([user])
      .rpc()

    let userAccount = await program.account.userAccount.fetch(
      userAccountAddress
    )
    assert.equal(
      userAccount.user.toString(),
      user.publicKey.toString(),
      "user should match the creator"
    )
    assert.equal(
      // @ts-ignore
      userAccount.orders.length,
      0,
      "initially orders should be empty"
    )
  })

  it("initializes an orderbook", async () => {
    await program.methods
      .initializeOrderbook(orderbookName)
      .accounts({
        admin: provider.wallet.publicKey,
        currencyMint,
        currencyVault,
        tokenMint,
        tokenVault,
        // orderbookInfo, //derivable from seeds
        firstPage,
      })
      .rpc()

    let orderbookData = await program.account.orderbookInfo.fetch(orderbookInfo)

    assert.equal(
      orderbookData.currencyMint.toString(),
      currencyMint.toString(),
      "currency mints should match"
    )
    assert.equal(
      orderbookData.tokenMint.toString(),
      tokenMint.toString(),
      "token mints should match"
    )
  })

  it("places 10 orders", async () => {
    await mintToChecked(
      program.provider.connection, // connection
      user, // fee payer
      currencyMint, // mint
      user_currency_ata, // receiver (sholud be a token account)
      admin, // mint authority
      2e8, // amount. if your decimals is 8, you mint 10^8 for 1 token.
      6 // decimals
    )

    let txhash2 = await mintToChecked(
      program.provider.connection, // connection
      admin, // fee payer
      tokenMint, // mint
      admin_token_ata, // receiver (sholud be a token account)
      admin, // mint authority
      2e8, // amount. if your decimals is 8, you mint 10^8 for 1 token.
      6 // decimals
    )

    for (let i = 0; i < size; i++) {
      const [infoKey] = await PublicKey.findProgramAddress(
        [utf8.encode(orderbookName), utf8.encode("orderbook-info")],
        program.programId
      )
      const info = await program.account.orderbookInfo.fetchNullable(infoKey)
      const nextOpenPageIndex = Math.floor(info.length / maxLength)
      const [currentPageKey] = await PublicKey.findProgramAddress(
        [
          utf8.encode(orderbookName),
          utf8.encode("page"),
          new anchor.BN(nextOpenPageIndex).toArrayLike(Buffer, "le", 4),
        ],
        program.programId
      )

      await program.methods
        .placeOrder(mockData[i])
        .accounts({
          user: user.publicKey,
          userAta: user_currency_ata,
          vault: currencyVault,
          orderbookInfo,
          currentPage: currentPageKey,
          userAccount: userAccountAddress,
        })
        .signers([user])
        .rpc()
    }

    let vaultBalance = await program.provider.connection.getTokenAccountBalance(
      currencyVault
    )
    assert.equal(
      vaultBalance.value.amount,
      "110000000",
      "Vault Balance should match sum of orders." // sum 1 to 10 = 55. 55x 2 = 110.
    )

    const [infoKey] = await PublicKey.findProgramAddress(
      [utf8.encode(orderbookName), utf8.encode("orderbook-info")],
      program.programId
    )
    const info = await program.account.orderbookInfo.fetchNullable(infoKey)
    const lastPageIndex = Math.floor((info.length - 1) / maxLength)
    const [lastPageKey] = await PublicKey.findProgramAddress(
      [
        utf8.encode(orderbookName),
        utf8.encode("page"),
        new anchor.BN(lastPageIndex).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    )
    const lastPage = await program.account.orderbookPage.fetch(lastPageKey)

    assert.equal(info.length, 10, "correct orderbook length")
    assert.equal(
      // @ts-ignore
      lastPage.list.length,
      1,
      "correct length of final chunk"
    )
    const userAccount = await program.account.userAccount.fetch(
      userAccountAddress
    )
    const seventhOrder = userAccount.orders[6]
    assert.equal(
      seventhOrder.size.toString(),
      "7000000",
      "correct size for order"
    )
    assert.equal(seventhOrder.price, 2, "correct price for order")
  })

  it("cancels an order", async () => {
    const [infoKey] = await PublicKey.findProgramAddress(
      [utf8.encode(orderbookName), utf8.encode("orderbook-info")],
      program.programId
    )
    const info = await program.account.orderbookInfo.fetchNullable(infoKey)
    const lastPageIndex = Math.floor((info.length - 1) / maxLength)
    const [lastPageKey] = await PublicKey.findProgramAddress(
      [
        utf8.encode(orderbookName),
        utf8.encode("page"),
        new anchor.BN(lastPageIndex).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    )
    const firstOrder = mockData[0]
    await program.methods
      .cancelOrder(firstOrder, 0, 0)
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
      .rpc()

    const vaultBalance =
      await program.provider.connection.getTokenAccountBalance(currencyVault)
    assert.equal(
      vaultBalance.value.amount,
      "108000000",
      "Vault Balance should be reduced to 108000000." // sum 2 to 10 = 54. 54*2 = 108
    )

    const info2 = await program.account.orderbookInfo.fetchNullable(infoKey)
    const lastPageIndex2 = Math.floor((info2.length - 1) / maxLength)
    const [lastPageKey2] = await PublicKey.findProgramAddress(
      [
        utf8.encode(orderbookName),
        utf8.encode("page"),
        new anchor.BN(lastPageIndex2).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    )
    const lastPage2 = await program.account.orderbookPage.fetch(lastPageKey2)

    assert.equal(info2.length, 9, "correct orderbook length")
    assert.equal(
      // @ts-ignore
      lastPage2.list.length,
      3,
      "correct length of final chunk"
    )
    const userAccount = await program.account.userAccount.fetch(
      userAccountAddress
    )
    // @ts-ignore
    assert.equal(userAccount.orders.length, 9, "user should have nine orders")
  })

  it("takes an order", async () => {
    const [infoKey] = await PublicKey.findProgramAddress(
      [utf8.encode(orderbookName), utf8.encode("orderbook-info")],
      program.programId
    )
    const info = await program.account.orderbookInfo.fetchNullable(infoKey)
    const lastPageIndex = Math.floor((info.length - 1) / maxLength)

    const [lastPageKey] = await PublicKey.findProgramAddress(
      [
        utf8.encode(orderbookName),
        utf8.encode("page"),
        new anchor.BN(lastPageIndex).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    )

    await program.methods
      .takeOrder(new anchor.BN(9e6), 2, 2)
      .accounts({
        taker: admin.publicKey,
        takerSendingAta: admin_token_ata,
        takerReceivingAta: admin_currency_ata,
        offererUserAccount: userAccountAddress,
        offererReceivingAta: user_token_ata,
        vault: currencyVault,
        orderbookInfo,
        orderPage: lastPageKey,
        lastPage: lastPageKey,
      })
      .signers([admin])
      .rpc()

    const vaultBalance =
      await program.provider.connection.getTokenAccountBalance(currencyVault)
    assert.equal(
      vaultBalance.value.amount,
      "90000000",
      "Vault Balance should be reduced to 90000000." // (sum 2 to 10) - 9 = 45. 45 x 2 = 90
    )
    const userTokenBalance =
      await program.provider.connection.getTokenAccountBalance(user_token_ata)
    assert.equal(
      userTokenBalance.value.amount,
      "9000000",
      "User should have bought 9 tokens at a price of 2 usdc" //
    )

    const adminCurrencyBalance =
      await program.provider.connection.getTokenAccountBalance(
        admin_currency_ata
      )
    assert.equal(
      adminCurrencyBalance.value.amount,
      "18000000",
      "Admin sold 9 tokens for 2usdc each."
    )
  })

  it("modifies an order", async () => {
    const [infoKey] = await PublicKey.findProgramAddress(
      [utf8.encode(orderbookName), utf8.encode("orderbook-info")],
      program.programId
    )
    const info = await program.account.orderbookInfo.fetchNullable(infoKey)
    const lastPageIndex = Math.floor((info.length - 1) / maxLength)

    const [lastPageKey] = await PublicKey.findProgramAddress(
      [
        utf8.encode(orderbookName),
        utf8.encode("page"),
        new anchor.BN(lastPageIndex).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    )
    const lastPageData = await program.account.orderbookPage.fetch(lastPageKey)

    // last order has size 8 and price 2
    const newOrder1 = {
      size: new anchor.BN(10e6),
      price: new anchor.BN(2),
      user: user.publicKey,
      buy: true,
    }

    let currencyVaultAmount1 =
      await program.provider.connection.getTokenAccountBalance(currencyVault)
    let userCurrencyAmount1 =
      await program.provider.connection.getTokenAccountBalance(
        user_currency_ata
      )

    const currencyVaultBalance1 =
      parseInt(currencyVaultAmount1.value.amount) / 1e6
    const userCurrencyBalance1 =
      parseInt(userCurrencyAmount1.value.amount) / 1e6

    // console.log(currencyVaultBalance1); // 90
    // console.log(userCurrencyBalance1); // 92

    await program.methods
      .modifyOrder(newOrder1, 2, 1)
      .accounts({
        user: user.publicKey,
        orderPage: lastPageKey,
        userAccount: userAccountAddress,
        userAta: user_currency_ata,
        vault: currencyVault,
        orderbookInfo,
      })
      .signers([user])
      .rpc()

    let currencyVaultAmount2 =
      await program.provider.connection.getTokenAccountBalance(currencyVault)
    let userCurrencyAmount2 =
      await program.provider.connection.getTokenAccountBalance(
        user_currency_ata
      )

    const currencyVaultBalance2 =
      parseInt(currencyVaultAmount2.value.amount) / 1e6
    const userCurrencyBalance2 =
      parseInt(userCurrencyAmount2.value.amount) / 1e6

    assert.equal(
      currencyVaultBalance2 - currencyVaultBalance1,
      4,
      "vault should have increased by 4"
    )
    assert.equal(
      userCurrencyBalance2 - userCurrencyBalance1,
      -4,
      "user should have transfered out 4"
    )

    const lastPage = await program.account.orderbookPage.fetch(lastPageKey)
    assert.equal(lastPage.list[1].size.toString(), (10e6).toString())
  })
})
