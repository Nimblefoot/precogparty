import { PublicKey } from "@solana/web3.js"
import React, { FC } from "react"
// TODO lazy load
import Blockies from "react-blockies"

const User: FC<{ publicKey: PublicKey }> = ({ publicKey }) => {
  return (
    <a href="#" className="flex-shrink-0 w-full group block">
      <div className="flex items-center">
        <div
          className="inline-block h-7.5 w-7.5 rounded-full overflow-hidden" /* optional class name for the canvas element; "identicon" by default */
        >
          <Blockies
            seed={publicKey.toString()} /* the only required prop; determines how the image is generated */
            size={10}
            scale={3} /* width/height of each square in pixels; default = 4 */
          />
        </div>
        <div className="ml-1.5">
          <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
            {publicKey.toString().substring(0, 4) +
              ".." +
              publicKey.toString().substring(publicKey.toString().length - 4)}
          </p>
        </div>
      </div>
    </a>
  )
}

export const UserSmall: FC<{ publicKey: PublicKey }> = ({ publicKey }) => (
  <div
    className="inline-block h-[20px] w-[20px] rounded-full overflow-hidden" /* optional class name for the canvas element; "identicon" by default */
  >
    <Blockies
      seed={publicKey.toString()} /* the only required prop; determines how the image is generated */
      size={10}
      scale={2} /* width/height of each square in pixels; default = 4 */
    />
  </div>
)

export default User
