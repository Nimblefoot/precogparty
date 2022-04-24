import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { assert } from "chai";
import { getListKeys } from "../app/syrup";
import { Syrup } from "../target/types/syrup";

describe("append-only-list", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Syrup as Program<Syrup>;
  const payer = Keypair.generate();

  describe("end-to-end", async () => {
    it("works", async () => {
      let list = await getListKeys(program, 'test');

      await program.provider.connection.confirmTransaction(
        await program.provider.connection.requestAirdrop(payer.publicKey, 1000000000),
        "finalized"
      );

      console.log("initialization test")
      await program.methods.createList('test')
      .accounts({
        payer: payer.publicKey,
        listInfo: list.info,
        systemProgram: SystemProgram.programId,
        list: list.lastPage
      })
      .signers([payer])
      .rpc();

      let info = await program.account.listInfo.fetch(list.info);
      let lastPage = await program.account.listChunk.fetch(list.lastPage);

      assert.ok(info.owner.equals(payer.publicKey), "owner should be payer");
      assert.equal(info.lastPage, 0, "last page should be zero");

      // @ts-ignore-error - cant infer type of lastPage.list
      assert.equal(lastPage.list.length, 0, "initial list chunk should have length zero");

      console.log("pop off an empty array")
      await program.methods.pop('test')
      .accounts({
        payer: payer.publicKey,
        listInfo: list.info,
        list: list.lastPage
      })
      .signers([payer])
      .rpc();

      list = await getListKeys(program, 'test');
      lastPage = await program.account.listChunk.fetch(list.lastPage);
      assert.equal(info.lastPage, 0, "last page should remain zero after pop");


      console.log("append stuff")
      
      const size = 10;
      for (let i=0; i < size; i++) {
        list = await getListKeys(program, 'test');
        await program.methods.append('test', {
          value: i
        })
        .accounts({
          payer: payer.publicKey,
          listInfo: list.info,
          list: list.lastPage
        })
        .signers([payer])
        .rpc(); 
      }
      list = await getListKeys(program, 'test');
      info = await program.account.listInfo.fetch(list.info);
      lastPage = await program.account.listChunk.fetch(list.lastPage);
      assert.equal(info.length, size, "should be $size items")
      assert.equal(info.lastPage, 3, "last page should be 2 after 10 appends");
      assert.equal(lastPage.list.length, 1, "last chunk should have one element");


      console.log("delete elements and check the sizes still work")
      const pops = 2;
      for (let i=0; i < pops; i++) {
        list = await getListKeys(program, 'test');
        info = await program.account.listInfo.fetch(list.info);

        await program.methods.pop('test')
        .accounts({
          payer: payer.publicKey,
          listInfo: list.info,
          list: list.lastPage
        })
        .signers([payer])
        .rpc(); 
      }
      list = await getListKeys(program, 'test');
      info = await program.account.listInfo.fetch(list.info);
      lastPage = await program.account.listChunk.fetch(list.lastPage);
      assert.equal(info.length, size - pops, "items = size - pops")
      assert.equal(info.lastPage, 2, "last page should be 2 after 10 appends and 2 pops");
      assert.equal(lastPage.list.length, 2, "last chunk should have two elements");
    });
  });
});
