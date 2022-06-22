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
import { takeOrdersHelper } from "../app/src/utils/takeOrdersHelper"

const maxLength = 3 //
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
  let applesVault: PublicKey
  let orangesVault: PublicKey
  let applesMint: PublicKey
  let orangesMint: PublicKey
  let userApplesATA: PublicKey
  let userOrangesATA: PublicKey
  let adminApplesATA: PublicKey
  let adminOrangesATA: PublicKey

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

    // initialize orderbook
    await program.methods
      .initializeOrderbook(orderbookId)
      .accounts({
        admin: admin.publicKey,
        applesMint,
        applesVault,
        orangesMint,
        orangesVault,
        firstPage: firstPageAddress,
      })
      .signers([admin])
      .rpc()

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

  it("places 10 orders", async () => {
    await mintToChecked(
      program.provider.connection, // connection
      user, // fee payer
      applesMint, // mint
      userApplesATA, // receiver (sholud be a token account)
      admin, // mint authority
      5e8, // amount. if your decimals is 6, this is 500 tokens
      6 // decimals
    )

    await mintToChecked(
      program.provider.connection, // connection
      admin, // fee payer
      orangesMint, // mint
      adminOrangesATA, // receiver (sholud be a token account)
      admin, // mint authority
      5e8, // amount. if your decimals is 6, this is 500 tokens
      6 // decimals
    )

    for (let i = 0; i < 10; i++) {
      if ((i + 1) % 10 == 0) {
        console.log("place user order: " + (i + 1))
      }
      const [infoKey] = await PublicKey.findProgramAddress(
        [orderbookId.toBytes(), utf8.encode("orderbook-info")],
        program.programId
      )
      const info = await program.account.orderbookInfo.fetchNullable(infoKey)
      const nextOpenPageIndex = Math.floor(info.length / maxLength)
      const [currentPageKey] = await PublicKey.findProgramAddress(
        [
          orderbookId.toBytes(),
          utf8.encode("page"),
          new anchor.BN(nextOpenPageIndex).toArrayLike(Buffer, "le", 4),
        ],
        program.programId
      )

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
    }
  })

  it("cancels orders", async () => {
    const [infoKey] = await PublicKey.findProgramAddress(
      [orderbookId.toBytes(), utf8.encode("orderbook-info")],
      program.programId
    )
    const info = await program.account.orderbookInfo.fetchNullable(infoKey)
    const lastPageIndex = Math.floor((info.length - 1) / maxLength)

    const [lastPageKey] = await PublicKey.findProgramAddress(
      [
        orderbookId.toBytes(),
        utf8.encode("page"),
        new anchor.BN(lastPageIndex).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    )

    const [firstPageKey] = await PublicKey.findProgramAddress(
      [
        orderbookId.toBytes(),
        utf8.encode("page"),
        new anchor.BN(0).toArrayLike(Buffer, "le", 4),
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
        orderPage: firstPageKey,
      })
      .remainingAccounts([
        {
          pubkey: lastPageKey,
          isSigner: false,
          isWritable: true,
        },
      ])
      .signers([user])
      .rpc()
  })

  it("takes orders", async () => {
    const [infoKey] = await PublicKey.findProgramAddress(
      [orderbookId.toBytes(), utf8.encode("orderbook-info")],
      program.programId
    )
    const info = await program.account.orderbookInfo.fetchNullable(infoKey)
    const lastPageIndex = Math.floor((info.length - 1) / maxLength)

    const [lastPageKey] = await PublicKey.findProgramAddress(
      [
        orderbookId.toBytes(),
        utf8.encode("page"),
        new anchor.BN(lastPageIndex).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    )

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
          numApples: new anchor.BN(2e6),
          offeringApples: true,
          numOranges: new anchor.BN(1e6),
          memo: 0,
        },
        new anchor.BN(1e6),
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
      })
      .remainingAccounts([
        {
          pubkey: lastPageKey,
          isSigner: false,
          isWritable: true,
        },
      ])
      .signers([admin])
      .rpc()

    const info2 = await program.account.orderbookInfo.fetchNullable(
      orderbookInfoAddress
    )
    assert.equal(info2.length, 8, "correct orderbook length is 8")
  })

  it("takes a bunch of orders with takeOrdersHelper", async () => {
    const takeOrderData = []

    for (let i = 0; i < 8; i++) {
      takeOrderData.push({
        order: {
          user: user.publicKey,
          numApples: new anchor.BN(2e6),
          offeringApples: true,
          numOranges: new anchor.BN(1e6),
          memo: 0,
        },
        size: new anchor.BN(1e6),
        pageNumber: Math.floor(i / 3),
        index: i % 3,
      })
    }

    const reorderedData = takeOrdersHelper(takeOrderData, 8, 3)

    for (let [data, lastPageIndex] of reorderedData) {
      const [orderPageKey] = await PublicKey.findProgramAddress(
        [
          orderbookId.toBytes(),
          utf8.encode("page"),
          new anchor.BN(data.pageNumber).toArrayLike(Buffer, "le", 4),
        ],
        program.programId
      )

      const [lastPageKey] = await PublicKey.findProgramAddress(
        [
          orderbookId.toBytes(),
          utf8.encode("page"),
          new anchor.BN(lastPageIndex).toArrayLike(Buffer, "le", 4),
        ],
        program.programId
      )

      await program.methods
        .takeOrder(data.order, data.size, data.pageNumber, data.index)
        .accounts({
          taker: admin.publicKey,
          takerSendingAta: adminOrangesATA,
          takerReceivingAta: adminApplesATA,
          offererUserAccount: userAccountAddress,
          offererReceivingAta: userOrangesATA,
          vault: applesVault,
          orderbookInfo: orderbookInfoAddress,
          orderPage: orderPageKey,
        })
        .remainingAccounts([
          {
            pubkey: lastPageKey,
            isSigner: false,
            isWritable: true,
          },
        ])
        .signers([admin])
        .rpc()
    }
    const info = await program.account.orderbookInfo.fetchNullable(
      orderbookInfoAddress
    )
    assert.equal(info.length, 0, "orderbook should be empty")

    const firstPage = await program.account.orderbookPage.fetchNullable(
      firstPageAddress
    )

    const [pageTwoAddress] = await PublicKey.findProgramAddress(
      [
        orderbookId.toBytes(),
        utf8.encode("page"),
        new anchor.BN(1).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    )

    const [pageThreeAddress] = await PublicKey.findProgramAddress(
      [
        orderbookId.toBytes(),
        utf8.encode("page"),
        new anchor.BN(2).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    )

    const secondPage = await program.account.orderbookPage.fetchNullable(
      firstPageAddress
    )

    const thirdPage = await program.account.orderbookPage.fetchNullable(
      firstPageAddress
    )

    // @ts-ignore
    assert.equal(firstPage.list.length, 0, "first page should be emprty")
    // @ts-ignore
    assert.equal(secondPage.list.length, 0, "second page should be emprty")
    // @ts-ignore
    assert.equal(thirdPage.list.length, 0, "third page should be emprty")

    // console.log(JSON.stringify(firstPage.list))

    // place way more orders
    // for (let i = 0; i < 14; i++) {
    //   console.log("placing order: " + i)
    //   const [infoKey] = await PublicKey.findProgramAddress(
    //     [orderbookId.toBytes(), utf8.encode("orderbook-info")],
    //     program.programId
    //   )
    //   const info = await program.account.orderbookInfo.fetchNullable(infoKey)
    //   const nextOpenPageIndex = Math.floor(info.length / maxLength)
    //   const [currentPageKey] = await PublicKey.findProgramAddress(
    //     [
    //       orderbookId.toBytes(),
    //       utf8.encode("page"),
    //       new anchor.BN(nextOpenPageIndex).toArrayLike(Buffer, "le", 4),
    //     ],
    //     program.programId
    //   )

    //   await program.methods
    //     .placeOrder({
    //       user: user.publicKey,
    //       numApples: new anchor.BN(1e6),
    //       offeringApples: true,
    //       numOranges: new anchor.BN((i + 1) * 1e6),
    //       memo: 0,
    //     })
    //     .accounts({
    //       user: user.publicKey,
    //       userAta: userApplesATA,
    //       vault: applesVault,
    //       orderbookInfo: orderbookInfoAddress,
    //       currentPage: currentPageKey,
    //       userAccount: userAccountAddress,
    //     })
    //     .signers([user])
    //     .rpc({
    //       skipPreflight: true,
    //     })
    // }
  })
})
