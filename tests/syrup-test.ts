import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import { assert } from "chai";
import { getListKeys } from "../app/syrup";
import { Syrup } from "../target/types/syrup";

describe("unordered list", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Syrup as Program<Syrup>;
  const payer = Keypair.generate();

  describe("end-to-end", async () => {
    it("works", async () => {
      let list = await getListKeys(program, "test");

      await program.provider.connection.confirmTransaction(
        await program.provider.connection.requestAirdrop(
          payer.publicKey,
          1000000000
        ),
        "finalized"
      );

      console.log("initialization test");
      await program.methods
        .createList("test")
        .accounts({
          payer: payer.publicKey,
          listInfo: list.info,
          systemProgram: SystemProgram.programId,
          list: list.lastPage,
        })
        .signers([payer])
        .rpc();

      let info = await program.account.listInfo.fetch(list.info);
      let lastPage = await program.account.listChunk.fetch(list.lastPage);
      let firstPage;

      assert.ok(info.owner.equals(payer.publicKey), "owner should be payer");
      assert.equal(info.lastPage, 0, "last page should be zero");

      // @ts-ignore-error - cant infer type of lastPage.list
      assert.equal(
        lastPage.list.length,
        0,
        "initial list chunk should have length zero"
      );

      console.log("pop off an empty array");
      await program.methods
        .pop("test")
        .accounts({
          payer: payer.publicKey,
          listInfo: list.info,
          list: list.lastPage,
        })
        .signers([payer])
        .rpc();

      list = await getListKeys(program, "test");
      lastPage = await program.account.listChunk.fetch(list.lastPage);
      assert.equal(info.lastPage, 0, "last page should remain zero after pop");

      console.log("append stuff");

      const size = 10;
      const mockData = [...Array(size).keys()].map((i) => ({
        user: Keypair.generate().publicKey,
        size: new anchor.BN(i),
        buy: true,
        price: new anchor.BN(1),
      }));

      for (let data of mockData) {
        list = await getListKeys(program, "test");
        await program.methods
          .append("test", data)
          .accounts({
            payer: payer.publicKey,
            listInfo: list.info,
            list: list.lastPage,
          })
          .signers([payer])
          .rpc();
      }
      list = await getListKeys(program, "test");
      info = await program.account.listInfo.fetch(list.info);
      lastPage = await program.account.listChunk.fetch(list.lastPage);
      assert.equal(info.length, size, "should be $size items");
      assert.equal(info.lastPage, 3, "last page should be 3 after 10 appends");
      // @ts-ignore cant derive type of lastPage.list
      assert.equal(
        lastPage.list.length,
        1,
        "last chunk should have one element"
      );

      console.log("popping off multiple elements");
      const pops = 2;
      for (let i = 0; i < pops; i++) {
        list = await getListKeys(program, "test");
        info = await program.account.listInfo.fetch(list.info);

        await program.methods
          .pop("test")
          .accounts({
            payer: payer.publicKey,
            listInfo: list.info,
            list: list.lastPage,
          })
          .signers([payer])
          .rpc();
      }
      list = await getListKeys(program, "test");
      info = await program.account.listInfo.fetch(list.info);
      lastPage = await program.account.listChunk.fetch(list.lastPage);
      firstPage = await program.account.listChunk.fetch(list.firstPage);

      assert.equal(info.length, size - pops, "items = size - pops");
      assert.equal(
        info.lastPage,
        2,
        "last page should be 2 after 10 appends and 2 pops"
      );
      assert.equal(
        // @ts-ignore cant derive type of lastPage.lis
        JSON.stringify(lastPage.list.map((data) => data.size.toNumber())),
        JSON.stringify([6, 7]),
        "last chunk should have two elements with values 6 and 7"
      );

      console.log("Delete specific entries");
      list = await getListKeys(program, "test");
      info = await program.account.listInfo.fetch(list.info);

      await program.methods
        .delete("test", 1, 0)
        .accounts({
          payer: payer.publicKey,
          listInfo: list.info,
          list: list.firstPage,
          lastPage: list.lastPage,
        })
        .signers([payer])
        .rpc();

      info = await program.account.listInfo.fetch(list.info);
      lastPage = await program.account.listChunk.fetch(list.lastPage);
      firstPage = await program.account.listChunk.fetch(list.firstPage);
      assert.equal(
        // @ts-ignore cant derive type of lastPage.list
        JSON.stringify(lastPage.list.map((data) => data.size.toNumber())),
        JSON.stringify([6]),
        "correct last chunk"
      );
      assert.equal(
        // @ts-ignore cant derive type of firstPage.list
        JSON.stringify(firstPage.list.map((data) => data.size.toNumber())),
        JSON.stringify([0, 7, 2]),
        "correct first chunk given implementation"
      );
    });
  });
});
