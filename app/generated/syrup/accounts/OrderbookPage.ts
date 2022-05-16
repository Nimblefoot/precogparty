import { PublicKey, Connection } from "@solana/web3.js"
import BN from "bn.js"
import * as borsh from "@project-serum/borsh"
import * as types from "../types"
import { PROGRAM_ID } from "../programId"

export interface OrderbookPageFields {
  list: Array<types.OrderFields>
  orderbookName: PublicKey
  nameSet: boolean
}

export interface OrderbookPageJSON {
  list: Array<types.OrderJSON>
  orderbookName: string
  nameSet: boolean
}

export class OrderbookPage {
  readonly list: Array<types.Order>
  readonly orderbookName: PublicKey
  readonly nameSet: boolean

  static readonly discriminator = Buffer.from([
    181, 254, 37, 254, 234, 202, 8, 18,
  ])

  static readonly layout = borsh.struct([
    borsh.vec(types.Order.layout(), "list"),
    borsh.publicKey("orderbookName"),
    borsh.bool("nameSet"),
  ])

  constructor(fields: OrderbookPageFields) {
    this.list = fields.list.map((item) => new types.Order({ ...item }))
    this.orderbookName = fields.orderbookName
    this.nameSet = fields.nameSet
  }

  static async fetch(
    c: Connection,
    address: PublicKey
  ): Promise<OrderbookPage | null> {
    const info = await c.getAccountInfo(address)

    if (info === null) {
      return null
    }
    if (!info.owner.equals(PROGRAM_ID)) {
      throw new Error("account doesn't belong to this program")
    }

    return this.decode(info.data)
  }

  static decode(data: Buffer): OrderbookPage {
    if (!data.slice(0, 8).equals(OrderbookPage.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = OrderbookPage.layout.decode(data.slice(8))

    return new OrderbookPage({
      list: dec.list.map((item) => types.Order.fromDecoded(item)),
      orderbookName: dec.orderbookName,
      nameSet: dec.nameSet,
    })
  }

  toJSON(): OrderbookPageJSON {
    return {
      list: this.list.map((item) => item.toJSON()),
      orderbookName: this.orderbookName.toString(),
      nameSet: this.nameSet,
    }
  }

  static fromJSON(obj: OrderbookPageJSON): OrderbookPage {
    return new OrderbookPage({
      list: obj.list.map((item) => types.Order.fromJSON(item)),
      orderbookName: new PublicKey(obj.orderbookName),
      nameSet: obj.nameSet,
    })
  }
}
