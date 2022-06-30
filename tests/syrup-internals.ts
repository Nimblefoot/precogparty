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
import { takeMultipleOrders } from "../app/src/utils/takeMultipleOrders"

const maxLength = 3 //
const orderbookId = Keypair.generate().publicKey

function getRandomSubarray(arr, size) {
  var shuffled = arr.slice(0),
    i = arr.length,
    min = i - size,
    temp,
    index
  while (i-- > min) {
    index = Math.floor((i + 1) * Math.random())
    temp = shuffled[index]
    shuffled[index] = shuffled[i]
    shuffled[i] = temp
  }
  return shuffled.slice(min)
}

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
  let secondPageAddress: PublicKey
  let thirdPageAddress: PublicKey
  let fourthPageAddress: PublicKey
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
    ;[secondPageAddress] = await PublicKey.findProgramAddress(
      [
        orderbookId.toBytes(),
        utf8.encode("page"),
        new anchor.BN(1).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    )
    ;[thirdPageAddress] = await PublicKey.findProgramAddress(
      [
        orderbookId.toBytes(),
        utf8.encode("page"),
        new anchor.BN(2).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    )
    ;[fourthPageAddress] = await PublicKey.findProgramAddress(
      [
        orderbookId.toBytes(),
        utf8.encode("page"),
        new anchor.BN(3).toArrayLike(Buffer, "le", 4),
      ],
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

  it("places 11 orders", async () => {
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

    for (let i = 0; i < 11; i++) {
      if ((i + 1) % 11 == 0) {
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
        3,
        1
      )
      .accounts({
        user: user.publicKey,
        userAccount: userAccountAddress,
        userAta: userApplesATA,
        vault: applesVault,
        orderbookInfo: orderbookInfoAddress,
        orderPage: fourthPageAddress,
      })
      .remainingAccounts([
        {
          pubkey: fourthPageAddress,
          isSigner: false,
          isWritable: true,
        },
      ])
      .signers([user])
      .rpc()

    let fourthPage = await program.account.orderbookPage.fetchNullable(
      fourthPageAddress
    )
    // @ts-ignore
    assert.equal(fourthPage.list.length, 1)

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
        orderPage: firstPageAddress,
      })
      .remainingAccounts([
        {
          pubkey: fourthPageAddress,
          isSigner: false,
          isWritable: true,
        },
      ])
      .signers([user])
      .rpc()

    // let firstPage = await program.account.orderbookPage.fetchNullable(
    //   firstPageAddress
    // )
    // let secondPage = await program.account.orderbookPage.fetchNullable(
    //   secondPageAddress
    // )
    // let thirdPage = await program.account.orderbookPage.fetchNullable(
    //   thirdPageAddress
    // )
    fourthPage = await program.account.orderbookPage.fetchNullable(
      fourthPageAddress
    )

    // console.log(
    //   "page lengths: " +
    //     // @ts-ignore
    //     firstPage.list.length +
    //     " - " +
    //     // @ts-ignore
    //     secondPage.list.length +
    //     " - " +
    //     // @ts-ignore
    //     thirdPage.list.length +
    //     " - " +
    //     // @ts-ignore
    //     fourthPage.list.length
    // )

    // @ts-ignore
    assert.equal(fourthPage.list.length, 0)
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
        1,
        2
      )
      .accounts({
        taker: admin.publicKey,
        takerSendingAta: adminOrangesATA,
        takerReceivingAta: adminApplesATA,
        offererUserAccount: userAccountAddress,
        offererReceivingAta: userOrangesATA,
        vault: applesVault,
        orderbookInfo: orderbookInfoAddress,
        orderPage: secondPageAddress,
        // takerTradeLog: adminTradeLog,
        // offererTradeLog: userTradeLog,
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
    let thirdPage = await program.account.orderbookPage.fetchNullable(
      thirdPageAddress
    )

    // @ts-ignore
    assert.equal(thirdPage.list.length, 2)
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
          // takerTradeLog: adminTradeLog,
          // offererTradeLog: userTradeLog,
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

    const firstPage = await program.account.orderbookPage.fetchNullable(
      firstPageAddress
    )

    const secondPage = await program.account.orderbookPage.fetchNullable(
      secondPageAddress
    )

    const thirdPage = await program.account.orderbookPage.fetchNullable(
      thirdPageAddress
    )

    assert.equal(info.length, 0, "orderbook should be empty")
    // @ts-ignore
    assert.equal(firstPage.list.length, 0, "first page should be emprty")
    // @ts-ignore
    assert.equal(secondPage.list.length, 0, "second page should be emprty")
    // @ts-ignore
    assert.equal(thirdPage.list.length, 0, "third page should be emprty")
  })

  it("places 20 orders. tests take_multiple_orders", async () => {
    for (let i = 0; i < 10; i++) {
      for (let j = 0; i < 2; j++) {
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
            user: j === 0 ? user.publicKey : admin.publicKey,
            numApples: new anchor.BN(1e6),
            offeringApples: true,
            numOranges: new anchor.BN((2 * i + j + 1) * 1e6),
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
    }
  })

  // it("Places 14 orders. Takes a random subset of 10 of them with takeorderhelper", async () => {
  //   // place way more orders
  //   for (let i = 0; i < 14; i++) {
  //     const [infoKey] = await PublicKey.findProgramAddress(
  //       [orderbookId.toBytes(), utf8.encode("orderbook-info")],
  //       program.programId
  //     )
  //     const info = await program.account.orderbookInfo.fetchNullable(infoKey)
  //     const nextOpenPageIndex = Math.floor(info.length / maxLength)
  //     const [currentPageKey] = await PublicKey.findProgramAddress(
  //       [
  //         orderbookId.toBytes(),
  //         utf8.encode("page"),
  //         new anchor.BN(nextOpenPageIndex).toArrayLike(Buffer, "le", 4),
  //       ],
  //       program.programId
  //     )

  //     await program.methods
  //       .placeOrder({
  //         user: user.publicKey,
  //         numApples: new anchor.BN(1e6),
  //         offeringApples: true,
  //         numOranges: new anchor.BN((i + 1) * 1e6),
  //         memo: 0,
  //       })
  //       .accounts({
  //         user: user.publicKey,
  //         userAta: userApplesATA,
  //         vault: applesVault,
  //         orderbookInfo: orderbookInfoAddress,
  //         currentPage: currentPageKey,
  //         userAccount: userAccountAddress,
  //       })
  //       .signers([user])
  //       .rpc({
  //         skipPreflight: true,
  //       })
  //   }

  //   // Going to fully take 10 random orders.
  //   const allKeys = [...Array(14).keys()].map((x) => x++)

  //   const targetKeys = getRandomSubarray(allKeys, 10)

  //   let orderData = []
  //   for (let i of targetKeys) {
  //     orderData.push({
  //       order: {
  //         user: user.publicKey,
  //         numApples: new anchor.BN(1e6),
  //         offeringApples: true,
  //         numOranges: new anchor.BN((i + 1) * 1e6),
  //         memo: 0,
  //       },
  //       size: new anchor.BN((i + 1) * 1e6),
  //       pageNumber: Math.floor(i / 3),
  //       index: i % 3,
  //     })
  //   }

  //   const orderedData = takeOrdersHelper(orderData, 14, 3)

  //   for (let [data, lastPageIndex] of orderedData) {
  //     const [orderPageKey] = await PublicKey.findProgramAddress(
  //       [
  //         orderbookId.toBytes(),
  //         utf8.encode("page"),
  //         new anchor.BN(data.pageNumber).toArrayLike(Buffer, "le", 4),
  //       ],
  //       program.programId
  //     )

  //     const [lastPageKey] = await PublicKey.findProgramAddress(
  //       [
  //         orderbookId.toBytes(),
  //         utf8.encode("page"),
  //         new anchor.BN(lastPageIndex).toArrayLike(Buffer, "le", 4),
  //       ],
  //       program.programId
  //     )

  //     await program.methods
  //       .takeOrder(data.order, data.size, data.pageNumber, data.index)
  //       .accounts({
  //         taker: admin.publicKey,
  //         takerSendingAta: adminOrangesATA,
  //         takerReceivingAta: adminApplesATA,
  //         offererUserAccount: userAccountAddress,
  //         offererReceivingAta: userOrangesATA,
  //         vault: applesVault,
  //         orderbookInfo: orderbookInfoAddress,
  //         orderPage: orderPageKey,
  //         // takerTradeLog: adminTradeLog,
  //         // offererTradeLog: userTradeLog,
  //       })
  //       .remainingAccounts([
  //         {
  //           pubkey: lastPageKey,
  //           isSigner: false,
  //           isWritable: true,
  //         },
  //       ])
  //       .signers([admin])
  //       .rpc()
  //   }

  //   const info = await program.account.orderbookInfo.fetchNullable(
  //     orderbookInfoAddress
  //   )

  //   const firstPage = await program.account.orderbookPage.fetchNullable(
  //     firstPageAddress
  //   )

  //   const secondPage = await program.account.orderbookPage.fetchNullable(
  //     secondPageAddress
  //   )

  //   const thirdPage = await program.account.orderbookPage.fetchNullable(
  //     thirdPageAddress
  //   )

  //   const fourthPage = await program.account.orderbookPage.fetchNullable(
  //     fourthPageAddress
  //   )

  //   assert.equal(info.length, 4, "orderbook should have four orders")
  //   // @ts-ignore
  //   assert.equal(firstPage.list.length, 3, "first page should be full")
  //   // @ts-ignore
  //   assert.equal(secondPage.list.length, 1, "second page should be length 1")
  //   // @ts-ignore
  //   assert.equal(thirdPage.list.length, 0, "third page should be emprty")
  //   // @ts-ignore
  //   assert.equal(fourthPage.list.length, 0, "fourth page should be emprty")
  // })
})
