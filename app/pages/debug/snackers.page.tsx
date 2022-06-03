import useConfirmationAlert from "@/hooks/useConfirmationAlert"

const Demo = () => {
  const [success, err] = useConfirmationAlert()

  return (
    <>
      <button onClick={() => success("You win!", "1312ofasofjsadf")}>
        win
      </button>
      <button onClick={() => err("You lose!", "1312ofasofjsadf")}>lose</button>
      <button onClick={() => err("fart!")}>lose (no tx)</button>
    </>
  )
}

export default Demo
