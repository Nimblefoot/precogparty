import { Resolution } from "config"
import React from "react"
export function Splitty({ resolution }: { resolution: Resolution }) {
  return (
    <div className="grid grid-cols-2 w-[50%] self-center">
      <div
        className={`border-r border-b rounded-br-md ml-2 mb-[-1px] mr-[-0.5px] h-2
                ${
                  resolution === "no" ? "border-transparent" : "border-gray-400"
                }
              `}
      />
      <div
        className={`border-l border-b rounded-bl-md mr-2 mb-[-1px] ml-[-0.5px] h-2
                ${
                  resolution === "yes"
                    ? "border-transparent"
                    : "border-gray-400"
                }

              `}
      />
      <div
        className={`border-l border-t rounded-tl-md mr-3 h-2
                ${
                  resolution === "no" ? "border-transparent" : "border-gray-400"
                }

              `}
      />
      <div
        className={`border-r border-t rounded-tr-md ml-3 h-2
                ${
                  resolution === "yes"
                    ? "border-transparent"
                    : "border-gray-400"
                }
              `}
      />
    </div>
  )
}
