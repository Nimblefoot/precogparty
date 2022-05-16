import * as borsh from "@project-serum/borsh"
import BN from "bn.js"
import * as types from "."

export interface OrderFields {
  size: BN
  buy: boolean
  user: PublicKey
  price: BN
}

export interface OrderJSON {
  size: string
  buy: boolean
  user: string
  price: string
}

export class Order {
  readonly size: BN
  readonly buy: boolean
  readonly user: PublicKey
  readonly price: BN

  constructor(fields: OrderFields) {
    this.size = fields.size
    this.buy = fields.buy
    this.user = fields.user
    this.price = fields.price
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.u64("size"),
        borsh.bool("buy"),
        borsh.publicKey("user"),
        borsh.u64("price"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new Order({
      size: obj.size,
      buy: obj.buy,
      user: obj.user,
      price: obj.price,
    })
  }

  static toEncodable(fields: OrderFields) {
    return {
      size: fields.size,
      buy: fields.buy,
      user: fields.user,
      price: fields.price,
    }
  }

  toJSON(): OrderJSON {
    return {
      size: this.size.toString(),
      buy: this.buy,
      user: this.user.toString(),
      price: this.price.toString(),
    }
  }

  static fromJSON(obj: OrderJSON): Order {
    return new Order({
      size: new BN(obj.size),
      buy: obj.buy,
      user: new PublicKey(obj.user),
      price: new BN(obj.price),
    })
  }

  toEncodable() {
    return Order.toEncodable(this)
  }
}
