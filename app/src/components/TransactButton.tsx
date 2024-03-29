import useConfirmationAlert from "src/hooks/useConfirmationAlert"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js"
import clsx from "clsx"
import { useCallback, useState } from "react"
import ReactCanvasConfetti from "react-canvas-confetti"
import { bundleInstructions } from "@/utils/fillTransaction"
import { sign } from "crypto"

export type Status = "initial" | "signing" | "sending" | "confirming" | "done"
type PendingCount = [done: number, total: number]

//TODO lazy load canvas-confetti

type CallbackOptions = {
  onCancel?: () => void | Promise<void>
  onSuccess?: () => void | Promise<void>
  onError?: () => void | Promise<void>
}

export const useTransact = () => {
  const [status, setStatus] = useState<Status>("initial")
  const [pendingCount, setPendingCount] = useState<PendingCount>([0, 0])
  const { signTransaction, publicKey, signAllTransactions } = useWallet()
  const { connection } = useConnection()

  const [snackSuccess, snackError] = useConfirmationAlert()

  const callback = useCallback(
    async (ixs: TransactionInstruction[], options?: CallbackOptions) => {
      if (!signAllTransactions || !publicKey) {
        return
      }

      const bundles = bundleInstructions(ixs)

      setStatus("signing")

      const recentbhash = await connection.getLatestBlockhash()

      const txns = bundles.map((bundle, i) => {
        const txn = new Transaction().add(
          ...bundle,
          ...(bundles.length > 1
            ? [
                new TransactionInstruction({
                  keys: [
                    { pubkey: publicKey, isSigner: true, isWritable: true },
                  ],
                  data: Buffer.from(
                    `Precog transaction ${i + 1} of ${bundles.length}`,
                    "utf-8"
                  ),
                  programId: new PublicKey(
                    "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
                  ),
                }),
              ]
            : [])
        )
        txn.recentBlockhash = recentbhash.blockhash
        txn.feePayer = publicKey
        return txn
      })

      console.log("TXNS TO SEND", txns)

      let signed: Transaction[]
      try {
        signed = await signAllTransactions(txns)
      } catch (e: any) {
        setStatus("initial")
        if ((e.message as string).includes("User rejected the request")) {
          await options?.onCancel?.()
          return
        } else {
          console.log("pooey")
          console.error(e)
          snackError(e.message)
          await options?.onError?.()

          throw e
        }
      }

      let sig
      try {
        for (const [signedTx, i] of signed.map((x, i) => [x, i] as const)) {
          setStatus("sending")
          console.log("SENDING", signedTx)
          sig = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: signed.length > 1,
          })
          console.log("sent tx", sig)

          setStatus("confirming")
          const result = await connection.confirmTransaction(sig)
          console.log("confirmed tx", result)

          snackSuccess(
            signed.length > 1
              ? `Confirmed! (${i + 1} of ${signed.length})`
              : "Confirmed!",
            sig
          )
        }
        await options?.onSuccess?.()
        setStatus("done")
      } catch (e: any) {
        console.log(e.logs)
        console.error(e)
        await options?.onError?.()

        snackError(e.message, sig)
        setStatus("initial")
      }
    },
    [connection, publicKey, signAllTransactions, snackError, snackSuccess]
  )

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
