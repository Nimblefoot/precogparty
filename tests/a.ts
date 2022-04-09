import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { A } from "../target/types/a";

describe("a", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.A as Program<A>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});
