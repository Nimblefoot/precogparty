import * as borsh from "@project-serum/borsh"
import BN from "bn.js"
import * as types from "."

export interface OrderRecordFields {
  market: PublicKey
  size: BN
  offering_apples: boolean
  price: BN
}

export interface OrderRecordJSON {
  market: string
  size: string
  offering_apples: boolean
  price: string
}

export class OrderRecord {
  readonly market: PublicKey
  readonly size: BN
  readonly offering_apples: boolean
  readonly price: BN

  constructor(fields: OrderRecordFields) {
    this.market = fields.market
    this.size = fields.size
    this.offering_apples = fields.offering_apples
    this.price = fields.price
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.publicKey("market"),
        borsh.u64("size"),
        borsh.bool("offering_apples"),
        borsh.u64("price"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new OrderRecord({
      market: obj.market,
      size: obj.size,
      offering_apples: obj.offering_apples,
      price: obj.price,
    })
  }

  static toEncodable(fields: OrderRecordFields) {
    return {
      market: fields.market,
      size: fields.size,
      offering_apples: fields.offering_apples,
      price: fields.price,
    }
  }

  toJSON(): OrderRecordJSON {
    return {
      market: this.market.toString(),
      size: this.size.toString(),
      offering_apples: this.offering_apples,
      price: this.price.toString(),
    }
  }

  static fromJSON(obj: OrderRecordJSON): OrderRecord {
    return new OrderRecord({
      market: new PublicKey(obj.market),
      size: new BN(obj.size),
      offering_apples: obj.offering_apples,
      price: new BN(obj.price),
    })
  }

  toEncodable() {
    return OrderRecord.toEncodable(this)
  }
}
