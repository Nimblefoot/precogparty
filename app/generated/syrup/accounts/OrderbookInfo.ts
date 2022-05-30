import { PublicKey, Connection } from "@solana/web3.js"
import BN from "bn.js"
import * as borsh from "@project-serum/borsh"
import * as types from "../types"
import { PROGRAM_ID } from "../programId"

export interface OrderbookInfoFields {
  admin: PublicKey
  length: number
  applesMint: PublicKey
  orangesMint: PublicKey
  bump: number
  closed: boolean
  id: PublicKey
  tradeLog: Array<types.TradeRecordFields>
}

export interface OrderbookInfoJSON {
  admin: string
  length: number
  applesMint: string
  orangesMint: string
  bump: number
  closed: boolean
  id: string
  tradeLog: Array<types.TradeRecordJSON>
}

export class OrderbookInfo {
  readonly admin: PublicKey
  readonly length: number
  readonly applesMint: PublicKey
  readonly orangesMint: PublicKey
  readonly bump: number
  readonly closed: boolean
  readonly id: PublicKey
  readonly tradeLog: Array<types.TradeRecord>

  static readonly discriminator = Buffer.from([
    126, 118, 193, 78, 125, 233, 132, 90,
  ])

  static readonly layout = borsh.struct([
    borsh.publicKey("admin"),
    borsh.u32("length"),
    borsh.publicKey("applesMint"),
    borsh.publicKey("orangesMint"),
    borsh.u8("bump"),
    borsh.bool("closed"),
    borsh.publicKey("id"),
    borsh.vec(types.TradeRecord.layout(), "tradeLog"),
  ])

  constructor(fields: OrderbookInfoFields) {
    this.admin = fields.admin
    this.length = fields.length
    this.applesMint = fields.applesMint
    this.orangesMint = fields.orangesMint
    this.bump = fields.bump
    this.closed = fields.closed
    this.id = fields.id
    this.tradeLog = fields.tradeLog.map(
      (item) => new types.TradeRecord({ ...item })
    )
  }

  static async fetch(
    c: Connection,
    address: PublicKey
  ): Promise<OrderbookInfo | null> {
    const info = await c.getAccountInfo(address)

    if (info === null) {
      return null
    }
    if (!info.owner.equals(PROGRAM_ID)) {
      throw new Error("account doesn't belong to this program")
    }

    return this.decode(info.data)
  }

  static decode(data: Buffer): OrderbookInfo {
    if (!data.slice(0, 8).equals(OrderbookInfo.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = OrderbookInfo.layout.decode(data.slice(8))

    return new OrderbookInfo({
      admin: dec.admin,
      length: dec.length,
      applesMint: dec.applesMint,
      orangesMint: dec.orangesMint,
      bump: dec.bump,
      closed: dec.closed,
      id: dec.id,
      tradeLog: dec.tradeLog.map((item) => types.TradeRecord.fromDecoded(item)),
    })
  }

  toJSON(): OrderbookInfoJSON {
    return {
      admin: this.admin.toString(),
      length: this.length,
      applesMint: this.applesMint.toString(),
      orangesMint: this.orangesMint.toString(),
      bump: this.bump,
      closed: this.closed,
      id: this.id.toString(),
      tradeLog: this.tradeLog.map((item) => item.toJSON()),
    }
  }

  static fromJSON(obj: OrderbookInfoJSON): OrderbookInfo {
    return new OrderbookInfo({
      admin: new PublicKey(obj.admin),
      length: obj.length,
      applesMint: new PublicKey(obj.applesMint),
      orangesMint: new PublicKey(obj.orangesMint),
      bump: obj.bump,
      closed: obj.closed,
      id: new PublicKey(obj.id),
      tradeLog: obj.tradeLog.map((item) => types.TradeRecord.fromJSON(item)),
    })
  }
}
