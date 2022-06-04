import { useSnackbar } from "notistack"

import { useCallback } from "react"

const useConfirmationAlert = () => {
  const { enqueueSnackbar } = useSnackbar()

  const success = useCallback(
    (msg: string, tx: string) => {
      enqueueSnackbar(msg, {
        autoHideDuration: 5000,
        // TODO make the snackbars not look like arse
        //content: <div>poopy</div>,
        action: (
          <div className="ml-4">
            <a
              href={`https://solscan.io/tx/${tx}?cluster=${process.env.NEXT_PUBLIC_CLUSTER}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <button
                type="button"
                className="rounded-md hover:bg-opacity-20 hover:bg-white inline-flex items-center p-2 border border-white text-white shadow-sm text-xs font-medium"
              >
                View on Solscan
              </button>
            </a>
          </div>
        ),
        variant: "success",
      })
    },
    [enqueueSnackbar]
  )

  const error = useCallback(
    (msg: string, tx?: string) => {
      enqueueSnackbar(msg, {
        autoHideDuration: 5000,
        action:
          tx !== undefined ? (
            <div className=" ml-4">
              <a
                href={`https://solscan.io/tx/${tx}?cluster=${process.env.NEXT_PUBLIC_CLUSTER}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <button
                  type="button"
                  className="rounded-md hover:bg-opacity-20 hover:bg-white inline-flex items-center p-2 border border-white text-white shadow-sm text-xs font-medium"
                >
                  View on Solscan
                </button>
              </a>
            </div>
          ) : undefined,
        variant: "error",
      })
    },
    [enqueueSnackbar]
  )

  return [success, error] as const
}

export default useConfirmationAlert
