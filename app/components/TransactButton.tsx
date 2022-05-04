export type Status = "initial" | "sending" | "confirming";
type Props = {
  verb: string;
  status: Status;
  disabled?: boolean;
};

export default function TransactButton({ verb, status, disabled }: Props) {
  return (
    <>
      <button
        disabled={disabled}
        className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md 
        text-white 
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
          ${status === "initial" ? " bg-indigo-600 hover:bg-indigo-700" : ""}
          ${status === "sending" ? " bg-gray-400  animate-pulse " : ""}
          ${status === "confirming" ? "bg-piss animate-rainbow " : ""}
        `}
      >
        {status === "initial"
          ? verb
          : status === "sending"
          ? "Sending..."
          : "Confirming..."}
      </button>
    </>
  );
}
