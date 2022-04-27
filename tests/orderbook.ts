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
import { utf8 } from "@project-serum/anchor/dist/cjs/utils/bytes";

describe("orderbook", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Syrup as Program<Syrup>;
  const admin = Keypair.generate();
  const user = Keypair.generate();

  describe("end-to-end", async () => {
    it("works", async () => {
      await program.provider.connection.confirmTransaction(
        await program.provider.connection.requestAirdrop(
          admin.publicKey,
          1000000000
        ),
        "finalized"
      );
      await program.provider.connection.confirmTransaction(
        await program.provider.connection.requestAirdrop(
          user.publicKey,
          1000000000
        ),
        "finalized"
      );

      console.log("create a user account and check initialize");
      await program.methods
        .createUserAccount()
        .accounts({
          user: user.publicKey,
        })
        .signers([user])
        .rpc();

      const [userAccountAddress] = await PublicKey.findProgramAddress(
        [utf8.encode("user-account"), user.publicKey.toBuffer()],
        program.programId
      );
      let userAccount = await program.account.userAccount.fetch(
        userAccountAddress
      );
      assert.equal(
        userAccount.user.toString(),
        user.publicKey.toString(),
        "user should match the creator"
      );
      assert.equal(
        // @ts-ignore
        userAccount.orders.length,
        0,
        "initially orders should be empty"
      );
    });
  });
});
