import { useConnection } from "@solana/wallet-adapter-react";
import { IDL } from "@/generated/idl/precog";
import { Program } from "@project-serum/anchor";
import { PROGRAM_ID } from "@/generated/client/programId";
import { useMemo } from "react";

export default function useWalletlessProgram() {
  const provider = useConnection();
  const program = useMemo(
    () => new Program(IDL, PROGRAM_ID, provider),
    [provider]
  );
  return program;
}