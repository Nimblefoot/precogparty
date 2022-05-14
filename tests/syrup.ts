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

    // Vaults
    currencyVault = await getAssociatedTokenAddress(
      currencyMint,
      orderbookInfo,
      true
    )

    tokenVault = await getAssociatedTokenAddress(tokenMint, orderbookInfo, true)
  })

  it("initializes an orderbook", async () => {
    // initialize orderbook
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
    // user has '500' currency.
    await mintToChecked(
      program.provider.connection, // connection
      user, // fee payer
      currencyMint, // mint
      user_currency_ata, // receiver (sholud be a token account)
      admin, // mint authority
      5e8, // amount. if your decimals is 6, this is 500 tokens
      6 // decimals
    )

    // admin has '500' tokens
    await mintToChecked(
      program.provider.connection, // connection
      admin, // fee payer
      tokenMint, // mint
      admin_token_ata, // receiver (sholud be a token account)
      admin, // mint authority
      5e8, // amount. if your decimals is 6, this is 500 tokens
      6 // decimals
    )

    const orderbookInfoData = await program.account.orderbookInfo.fetchNullable(
      orderbookInfo
    )
    const nextOpenPageIndex = Math.floor(orderbookInfoData.length / maxLength)
    const [currentPageKey] = await PublicKey.findProgramAddress(
      [
        utf8.encode(orderbookName),
        utf8.encode("page"),
        new anchor.BN(nextOpenPageIndex).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    )

    await program.methods
      .placeOrder({
        user: user.publicKey,
        size: new anchor.BN(1e6),
        buy: true,
        price: new anchor.BN(2),
      })
      .accounts({
        user: user.publicKey,
        userAta: user_currency_ata,
        vault: currencyVault,
        orderbookInfo,
        currentPage: currentPageKey,
        userAccount: userAccountAddress,
      })
      .signers([user])
      .rpc({
        skipPreflight: true,
      })

    // re-compute nextOpenPage before placing an order but we know its still the first page lol.
    await program.methods
      .placeOrder({
        user: admin.publicKey,
        size: new anchor.BN(5e6),
        buy: false,
        price: new anchor.BN(3),
      })
      .accounts({
        user: admin.publicKey,
        userAta: admin_token_ata,
        vault: tokenVault,
        orderbookInfo,
        currentPage: currentPageKey,
        userAccount: adminAccountAddress,
      })
      .signers([admin])
      .rpc({
        skipPreflight: true,
      })
  })
})
