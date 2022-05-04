import { useState } from "react";
import ReactCanvasConfetti from "react-canvas-confetti";

export type Status = "initial" | "signing" | "sending" | "confirming" | "done";
type Props = {
  verb: string;
  status: Status;
  disabled?: boolean;
};

export default function TransactButton({ verb, status, disabled }: Props) {
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
          className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md 
        text-white 
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
          ${
            status === "initial" || status === "done"
              ? " bg-indigo-600 hover:bg-indigo-700"
              : ""
          }
          ${status === "signing" ? " bg-gray-400  animate-pulse " : ""}
          ${status === "sending" ? " bg-gray-400  animate-pulse " : ""}
          ${status === "confirming" ? "animate-rainbow " : ""}
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
  );
}
