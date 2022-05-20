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

const maxLength = 100 //

describe("orderbook", async () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.Syrup as Program<Syrup>
  const admin = Keypair.generate()
  const user = Keypair.generate()
  let orderbookName = Keypair.generate().publicKey

  // All PDAs set in `before` block
  let adminAccountAddress: PublicKey
  let userAccountAddress: PublicKey
  let orderbookInfo: PublicKey
  let firstPage: PublicKey
  let currencyVault: PublicKey
  let tokenVault: PublicKey
  let applesMint: PublicKey
  let orangesMint: PublicKey
  let uuserApplesATA: PublicKey
  let userorangesata: PublicKey
  let adminapplesata: PublicKey
  let adminorangesata: PublicKey

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

    uuserApplesATA = await createAssociatedTokenAccount(
      program.provider.connection, // connection
      user, // fee payer
      applesMint, // mint
      user.publicKey // owner,
    )

    userorangesata = await createAssociatedTokenAccount(
      program.provider.connection, // connection
      user, // fee payer
      orangesMint, // mint
      user.publicKey // owner,
    )

    adminapplesata = await createAssociatedTokenAccount(
      program.provider.connection, // connection
      user, // fee payer
      applesMint, // mint
      admin.publicKey // owner,
    )

    adminorangesata = await createAssociatedTokenAccount(
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
    ;[orderbookInfo] = await PublicKey.findProgramAddress(
      [orderbookName.toBytes(), utf8.encode("orderbook-info")],
      program.programId
    )
    ;[firstPage] = await PublicKey.findProgramAddress(
      [
        orderbookName.toBytes(),
        utf8.encode("page"),
        new anchor.BN(0).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    )

    currencyVault = await getAssociatedTokenAddress(
      applesMint,
      orderbookInfo,
      true
    )
    tokenVault = await getAssociatedTokenAddress(
      orangesMint,
      orderbookInfo,
      true
    )

    // initialize orderbook
    await program.methods
      .initializeOrderbook(orderbookName)
      .accounts({
        admin: provider.wallet.publicKey,
        applesMint,
        currencyVault,
        orangesMint,
        tokenVault,
        // orderbookInfo, //derivable from seeds
        firstPage,
      })
      .rpc()

    // create a user account for user and admin
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

  it("places 280 orders", async () => {
    await mintToChecked(
      program.provider.connection, // connection
      user, // fee payer
      applesMint, // mint
      uuserApplesATA, // receiver (sholud be a token account)
      admin, // mint authority
      5e8, // amount. if your decimals is 6, this is 500 tokens
      6 // decimals
    )

    await mintToChecked(
      program.provider.connection, // connection
      admin, // fee payer
      orangesMint, // mint
      adminorangesata, // receiver (sholud be a token account)
      admin, // mint authority
      5e8, // amount. if your decimals is 6, this is 500 tokens
      6 // decimals
    )

    // user places 140 offering_apples orders. Should deposit 400 units of currency
    for (let i = 0; i < 140; i++) {
      if ((i + 1) % 10 == 0) {
        console.log("place user order: " + (i + 1))
      }
      const [infoKey] = await PublicKey.findProgramAddress(
        [orderbookName.toBytes(), utf8.encode("orderbook-info")],
        program.programId
      )
      const info = await program.account.orderbookInfo.fetchNullable(infoKey)
      const nextOpenPageIndex = Math.floor(info.length / maxLength)
      const [currentPageKey] = await PublicKey.findProgramAddress(
        [
          orderbookName.toBytes(),
          utf8.encode("page"),
          new anchor.BN(nextOpenPageIndex).toArrayLike(Buffer, "le", 4),
        ],
        program.programId
      )

      await program.methods
        .placeOrder({
          user: user.publicKey,
          size: new anchor.BN(1e6),
          offering_apples: true,
          price: new anchor.BN(2e9),
        })
        .accounts({
          user: user.publicKey,
          userAta: uuserApplesATA,
          vault: currencyVault,
          orderbookInfo,
          currentPage: currentPageKey,
          userAccount: userAccountAddress,
        })
        .signers([user])
        .rpc({
          skipPreflight: true,
        })
    }

    // admin places 140 sell orders. should deposit 100 tokens.
    for (let i = 0; i < 140; i++) {
      if ((i + 1) % 10 == 0) {
        console.log("place admin order: " + (i + 1))
      }
      const [infoKey] = await PublicKey.findProgramAddress(
        [orderbookName.toBytes(), utf8.encode("orderbook-info")],
        program.programId
      )
      const info = await program.account.orderbookInfo.fetchNullable(infoKey)
      const nextOpenPageIndex = Math.floor(info.length / maxLength)
      const [currentPageKey] = await PublicKey.findProgramAddress(
        [
          orderbookName.toBytes(),
          utf8.encode("page"),
          new anchor.BN(nextOpenPageIndex).toArrayLike(Buffer, "le", 4),
        ],
        program.programId
      )

      await program.methods
        .placeOrder({
          user: admin.publicKey,
          size: new anchor.BN(1e6),
          offering_apples: false,
          price: new anchor.BN(3),
        })
        .accounts({
          user: admin.publicKey,
          userAta: adminorangesata,
          vault: tokenVault,
          orderbookInfo,
          currentPage: currentPageKey,
          userAccount: adminAccountAddress,
        })
        .signers([admin])
        .rpc({
          skipPreflight: true,
        })
    }

    let currencyVaultBalance =
      await program.provider.connection.getTokenAccountBalance(currencyVault)
    assert.equal(
      currencyVaultBalance.value.amount,
      "280000000",
      "Currency Vault Balance should match sum of orders."
    )
    let tokenVaultBalance =
      await program.provider.connection.getTokenAccountBalance(tokenVault)
    assert.equal(
      tokenVaultBalance.value.amount,
      "140000000",
      "Token Vault Balance should match sum of orders."
    )

    const [infoKey] = await PublicKey.findProgramAddress(
      [orderbookName.toBytes(), utf8.encode("orderbook-info")],
      program.programId
    )
    const info = await program.account.orderbookInfo.fetchNullable(infoKey)
    assert.equal(info.length, 280, "Should have 280 orders on the book.")
  })
})
