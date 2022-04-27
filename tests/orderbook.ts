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
    });
  });
});
