import useConfirmationAlert from "src/hooks/useConfirmationAlert"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { Transaction } from "@solana/web3.js"
import clsx from "clsx"
import { connect } from "http2"
import { useState } from "react"
import ReactCanvasConfetti from "react-canvas-confetti"

export type Status = "initial" | "signing" | "sending" | "confirming" | "done"

//TODO lazy load canvas-confetti

export const useTransact = () => {
  const [status, setStatus] = useState<Status>("initial")
  const { sendTransaction, signTransaction, publicKey } = useWallet()
  const { connection } = useConnection()

  const [snackSuccess, snackError] = useConfirmationAlert()

  const callback = async (
    txn: Transaction,
    options?: {
      onCancel?: () => void | Promise<void>
      onSuccess?: () => void | Promise<void>
      onError?: () => void | Promise<void>
    }
  ) => {
    if (!signTransaction || !publicKey) {
      return
    }

    setStatus("signing")
    const recentbhash = await connection.getLatestBlockhash()
    txn.recentBlockhash = recentbhash.blockhash
    txn.feePayer = publicKey

    let signed
    try {
      signed = await signTransaction(txn)
    } catch (e: any) {
      if ((e.message as string).includes("User rejected the request")) {
        setStatus("initial")
        await options?.onCancel?.()
        return
      } else {
        snackError(e.message)
        throw e
      }
    }

    setStatus("sending")
    console.log(txn)

    let sig
    try {
      sig = await connection.sendRawTransaction(signed.serialize(), {
        //skipPreflight: true,
      })
      console.log("sent tx", sig)

      setStatus("confirming")
      const result = await connection.confirmTransaction(sig)
      console.log("confirmed tx", result)

      snackSuccess("Confirmed!", sig)

      setStatus("done")
    } catch (e: any) {
      console.error(e)

      snackError(e.message, sig)
      setStatus("initial")
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
  ...props
}: {
  verb: string
  disabled?: boolean
  status: Status
  onClick: () => Promise<void>
  className?: string
} & React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>) {
  return (
    <>
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
        className={clsx(
          "inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md",
          "text-white",
          "disabled:bg-gray-300 disabled:shadow-none",

          (status === "initial" || status === "done") &&
            "bg-indigo-600 hover:bg-indigo-700",
          status === "signing" && "bg-gray-400  animate-pulse",
          status === "sending" && "bg-gray-400  animate-pulse",
          status === "confirming" && "animate-rainbow",
          className
        )}
        {...props}
      >
        {status === "initial" || status === "done"
          ? verb
          : status === "sending"
          ? "Sending..."
          : status === "signing"
          ? "Signing..."
          : "Confirming..."}
      </button>
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
