import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react"
import { IDL } from "@/generated/idl/precog"
import { IDL as SyrupIDL } from "@/generated/idl/syrup"
import { PROGRAM_ID as SYRUP_ID } from "@/generated/syrup/programId"
import { Program } from "@project-serum/anchor"
import { PROGRAM_ID } from "@/generated/client/programId"
import { useMemo } from "react"

export default function useWalletlessProgram() {
  const provider = useConnection()
  const program = useMemo(
    () => new Program(IDL, PROGRAM_ID, provider),
    [provider]
  )
  return program
}

export function useSyrup() {
  const { connection } = useConnection()
  const wallet = useAnchorWallet()
  const program = useMemo(() => {
    if (!wallet) return undefined
    return new Program(SyrupIDL, SYRUP_ID, { connection, ...wallet })
  }, [connection, wallet])
  return program
}
