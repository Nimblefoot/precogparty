import { PublicKey, Connection } from "@solana/web3.js"
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@project-serum/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface OrderbookPageFields {
  list: Array<types.OrderFields>
  orderbookId: PublicKey
  idSet: boolean
}

export interface OrderbookPageJSON {
  list: Array<types.OrderJSON>
  orderbookId: string
  idSet: boolean
}

export class OrderbookPage {
  readonly list: Array<types.Order>
  readonly orderbookId: PublicKey
  readonly idSet: boolean

  static readonly discriminator = Buffer.from([
    181, 254, 37, 254, 234, 202, 8, 18,
  ])

  static readonly layout = borsh.struct([
    borsh.vec(types.Order.layout(), "list"),
    borsh.publicKey("orderbookId"),
    borsh.bool("idSet"),
  ])

  constructor(fields: OrderbookPageFields) {
    this.list = fields.list.map((item) => new types.Order({ ...item }))
    this.orderbookId = fields.orderbookId
    this.idSet = fields.idSet
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

  static async fetchMultiple(
    c: Connection,
    addresses: PublicKey[]
  ): Promise<Array<OrderbookPage | null>> {
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

  static decode(data: Buffer): OrderbookPage {
    if (!data.slice(0, 8).equals(OrderbookPage.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = OrderbookPage.layout.decode(data.slice(8))

    return new OrderbookPage({
      list: dec.list.map((item: any) => types.Order.fromDecoded(item)),
      orderbookId: dec.orderbookId,
      idSet: dec.idSet,
    })
  }

  toJSON(): OrderbookPageJSON {
    return {
      list: this.list.map((item) => item.toJSON()),
      orderbookId: this.orderbookId.toString(),
      idSet: this.idSet,
    }
  }

  static fromJSON(obj: OrderbookPageJSON): OrderbookPage {
    return new OrderbookPage({
      list: obj.list.map((item) => types.Order.fromJSON(item)),
      orderbookId: new PublicKey(obj.orderbookId),
      idSet: obj.idSet,
    })
  }
}
