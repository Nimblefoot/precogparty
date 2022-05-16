import * as borsh from "@project-serum/borsh"
import BN from "bn.js"
import * as types from "."

export interface OrderRecordFields {
  market: PublicKey
  size: BN
  buy: boolean
  price: BN
}

export interface OrderRecordJSON {
  market: string
  size: string
  buy: boolean
  price: string
}

export class OrderRecord {
  readonly market: PublicKey
  readonly size: BN
  readonly buy: boolean
  readonly price: BN

  constructor(fields: OrderRecordFields) {
    this.market = fields.market
    this.size = fields.size
    this.buy = fields.buy
    this.price = fields.price
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.publicKey("market"),
        borsh.u64("size"),
        borsh.bool("buy"),
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
      buy: obj.buy,
      price: obj.price,
    })
  }

  static toEncodable(fields: OrderRecordFields) {
    return {
      market: fields.market,
      size: fields.size,
      buy: fields.buy,
      price: fields.price,
    }
  }

  toJSON(): OrderRecordJSON {
    return {
      market: this.market.toString(),
      size: this.size.toString(),
      buy: this.buy,
      price: this.price.toString(),
    }
  }

  static fromJSON(obj: OrderRecordJSON): OrderRecord {
    return new OrderRecord({
      market: new PublicKey(obj.market),
      size: new BN(obj.size),
      buy: obj.buy,
      price: new BN(obj.price),
    })
  }

  toEncodable() {
    return OrderRecord.toEncodable(this)
  }
}
