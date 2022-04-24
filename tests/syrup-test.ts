import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import { getListKeys } from "../app/syrup";
import { Syrup } from "../target/types/syrup";

describe("append-only-list", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Syrup as Program<Syrup>;
  const payer = Keypair.generate();

  describe("initialization", async () => {
    let list
    let info;

    before(async () => {
      list = await getListKeys(program, 'test');
      await program.provider.connection.confirmTransaction(
        await program.provider.connection.requestAirdrop(payer.publicKey, 1000000000),
        "finalized"
      );


      await program.methods.createList('test')
      .accounts({
        payer: payer.publicKey,
        listInfo: list.info,
        systemProgram: SystemProgram.programId
      })
      .signers([payer])
      .rpc();

      info = await program.account.listInfo.fetch(list.info);
    });

    it("is initialized", async () => {
      assert.ok(info.owner.equals(payer.publicKey));
      assert.equal(info.lastPage, 0);
    })
  });

  describe("list check", async () => {
    before(async () => {
      await program.provider.connection.confirmTransaction(
        await program.provider.connection.requestAirdrop(payer.publicKey, 1000000000),
        "finalized"
      );
      const size = 7;

      const keys = Array.apply(null, Array(size)).map((i) => {
        value: i
      });

      let list = await getListKeys(program, 'test2');
      await program.methods.createList('test2')
        .accounts({
          payer: payer.publicKey,
          listInfo: list.info,
          systemProgram: SystemProgram.programId
        })
        .signers([payer])
        .rpc();

      for (const item in keys) {
        if ((item as unknown as number % 10) == 0) {
          console.log(`Appended ${item} keys.`)
        }
        list = await getListKeys(program, 'test2');

        await program.methods.append(
          'test2',
          keys[item],
        ).accounts(
          {
            payer: payer.publicKey,
            listInfo: list.info,
            list: list.lastPage,
            systemProgram: SystemProgram.programId
          }
        ).signers([payer])
        .rpc();
      }

      for (let i=0; i < 2; i++) {
        list = await getListKeys(program, 'test2');

        await program.methods.pop(
          'test2',
        ).accounts(
          {
            payer: payer.publicKey,
            listInfo: list.info,
            list: list.lastPage
          }
        ).signers([payer])
        .rpc();
      }

    });

    it("works", async () => {
      const list = await getListKeys(program, 'test2');

      const listInfo = await program.account.listInfo.fetch(list.info);
      assert.equal(listInfo.lastPage, 1);
      assert.equal(listInfo.length, 5 );

      const page = await program.account.listChunk.fetch(list.lastPage);
      // assert.equal(page.list.length, 2);
    });
  });
});
