import { BN, Program, Provider } from "@project-serum/anchor";
import { utf8 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { PublicKey } from "@solana/web3.js";
import { Syrup, IDL } from "../target/types/syrup";

interface ListKeys {
    info: PublicKey,
    lastPage: PublicKey,
    firstPage: PublicKey
}

export const getListKeys = async (program: Program<Syrup>, name: string): Promise<ListKeys> => {
    const infoKey = await PublicKey.findProgramAddress(
        [
            utf8.encode('list'),
            utf8.encode(name),
            utf8.encode('info')
        ],
        program.programId
    );
    const info = await program.account.listInfo.fetchNullable(infoKey[0]);

    const pageKey = await PublicKey.findProgramAddress(
        [
            utf8.encode('list'),
            utf8.encode(name),
            new BN(info ? info.lastPage : 0).toArrayLike(Buffer, 'le', 4)
        ],
        program.programId
    )

    const firstKey = await PublicKey.findProgramAddress(
        [
            utf8.encode('list'),
            utf8.encode(name),
            new BN(0).toArrayLike(Buffer, 'le', 4)
        ],
        program.programId
    )

    return { info: infoKey[0], lastPage: pageKey[0], firstPage: firstKey[0] };
}

export const makeListProgram = (provider: Provider): Program<Syrup> =>
    new Program(
        IDL,
        "7v8HDDmpuZ3oLMHEN2PmKrMAGTLLUnfRdZtFt5R2F3gK",
        provider
    )
