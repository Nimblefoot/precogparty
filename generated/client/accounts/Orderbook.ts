import { PublicKey, Connection } from "@solana/web3.js"
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@project-serum/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface OrderbookFields {}

export interface OrderbookJSON {}

export class Orderbook {
  static readonly discriminator = Buffer.from([43, 34, 25, 113, 195, 69, 72, 7])

  static readonly layout = borsh.struct([])

  constructor(fields: OrderbookFields) {}

  static async fetch(
    c: Connection,
    address: PublicKey
  ): Promise<Orderbook | null> {
    const info = await c.getAccountInfo(address)

    if (info === null) {
      return null
    }
    if (!info.owner.equals(PROGRAM_ID)) {
      throw new Error("account doesn't belong to this program")
    }

    return this.decode(info.data)
  }

  static async fetchMultiple(
    c: Connection,
    addresses: PublicKey[]
  ): Promise<Array<Orderbook | null>> {
    const infos = await c.getMultipleAccountsInfo(addresses)

    return infos.map((info) => {
      if (info === null) {
        return null
      }
      if (!info.owner.equals(PROGRAM_ID)) {
        throw new Error("account doesn't belong to this program")
      }

      return this.decode(info.data)
    })
  }

  static decode(data: Buffer): Orderbook {
    if (!data.slice(0, 8).equals(Orderbook.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = Orderbook.layout.decode(data.slice(8))

    return new Orderbook({})
  }

  toJSON(): OrderbookJSON {
    return {}
  }

  static fromJSON(obj: OrderbookJSON): Orderbook {
    return new Orderbook({})
  }
}
