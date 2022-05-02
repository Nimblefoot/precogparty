import { BN, Program, Provider } from "@project-serum/anchor";
import { utf8 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { PublicKey } from "@solana/web3.js";
import { Syrup, IDL } from "../target/types/syrup";

export const getKeysAndData = async (program: Program<Syrup>, name: string) => {
  const infoKey = await PublicKey.findProgramAddress(
    [utf8.encode(name), utf8.encode("orderbook-info")],
    program.programId
  );
  const info = await program.account.orderbookInfo.fetchNullable(infoKey[0]);

  let pageKeys = [];
  for (let i = 0; i <= info.lastPage; i++) {
    const pageKey = await PublicKey.findProgramAddress(
      [
        utf8.encode(name),
        utf8.encode("page"),
        new BN(i).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    );

    if (pageKey) {
      pageKeys.push(pageKey[0]);
    } else {
      console.log("no page key????");
      console.log(i);
    }
  }
  const lastPage = await program.account.listChunk.fetchNullable(
    pageKeys[info.lastPage]
  );

  return {
    infoKey: infoKey[0],
    pageKeys,
    info,
    lastPage,
  };
};
