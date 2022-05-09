import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { Transaction } from "@solana/web3.js"
import { connect } from "http2"
import { useState } from "react"
import ReactCanvasConfetti from "react-canvas-confetti"

export type Status = "initial" | "signing" | "sending" | "confirming" | "done"

//TODO lazy load canvas-confetti

export const useTransact = () => {
  const [status, setStatus] = useState<Status>("initial")
  const { sendTransaction, signTransaction, publicKey } = useWallet()
  const { connection } = useConnection()

  const callback = async (txn: Transaction) => {
    if (!signTransaction || !publicKey) {
      return
    }

    setStatus("signing")
    const recentbhash = await connection.getLatestBlockhash()
    txn.recentBlockhash = recentbhash.blockhash
    txn.feePayer = publicKey

    const signed = await signTransaction(txn)

    setStatus("sending")
    // this combines sending and signing steps for now
    console.log(txn)
    console.log(JSON.stringify(txn))
    try {
      const sig = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: true,
      })

      console.log("sent tx", sig)
      setStatus("confirming")

      const result = await connection.confirmTransaction(sig)
      console.log("confirmed tx", result)
      setStatus("done")
    } catch {
      console.log(txn)
      console.log(JSON.stringify(txn))
    }
  }
  return { callback, status }
}

export function StatelessTransactButton({
  verb,
  disabled,
  status,
  onClick,
  className,
}: {
  verb: string
  disabled?: boolean
  status: Status
  onClick: () => Promise<void>
  className?: string
}) {
  return (
    <>
      <div>
        <ReactCanvasConfetti
          style={{
            position: "fixed",
            pointerEvents: "none",
            width: "100%",
            height: "100%",
            top: 0,
            left: 0,
          }}
          // origin = {x, y}
          width={1000}
          height={1000}
          fire={status === "done"}
          disableForReducedMotion
        />
        <button
          disabled={disabled}
          onClick={onClick}
          className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md 
        text-white 
          disabled:bg-gray-300 disabled:shadow-none 
          ${
            status === "initial" || status === "done"
              ? " bg-indigo-600 hover:bg-indigo-700"
              : ""
          } 
          ${status === "signing" ? " bg-gray-400  animate-pulse " : ""} 
          ${status === "sending" ? " bg-gray-400  animate-pulse " : ""} 
          ${status === "confirming" ? "animate-rainbow " : ""} 
          ${className} 
        `}
        >
          {status === "initial" || status === "done"
            ? verb
            : status === "sending"
            ? "Sending..."
            : status === "signing"
            ? "Signing..."
            : "Confirming..."}
        </button>
      </div>
    </>
  )
}

type Props = {
  verb: string
  disabled?: boolean
  getTxn: () => Promise<Transaction>
}

export default function TransactButton({ getTxn, ...props }: Props) {
  const { callback, status } = useTransact()

  const onClick = async () => {
    const txn = await getTxn()
    await callback(txn)
  }
  return (
    <StatelessTransactButton {...props} status={status} onClick={onClick} />
  )
}
