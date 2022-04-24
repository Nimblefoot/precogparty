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
      // console.dir(list.lastPage, { depth: null })
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

      assert.ok(info.owner.equals(payer.publicKey));
      assert.equal(info.lastPage, 0);

      // @ts-ignore-error - cant infer type of lastPage.list
      assert.equal(lastPage.list.length, 0);

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
      // console.dir(list.lastPage, { depth: null })

      info = await program.account.listInfo.fetch(list.info);
      lastPage = await program.account.listChunk.fetch(list.lastPage);

      assert.equal(info.lastPage, 0);

      // console.log("append stuff")

    });
  });
});
