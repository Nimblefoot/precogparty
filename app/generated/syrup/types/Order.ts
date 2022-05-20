import * as borsh from "@project-serum/borsh"
import BN from "bn.js"
import * as types from "."

export interface OrderFields {
  size: BN
  offering_apples: boolean
  user: PublicKey
  price: BN
}

export interface OrderJSON {
  size: string
  offering_apples: boolean
  user: string
  price: string
}

export class Order {
  readonly size: BN
  readonly offering_apples: boolean
  readonly user: PublicKey
  readonly price: BN

  constructor(fields: OrderFields) {
    this.size = fields.size
    this.offering_apples = fields.offering_apples
    this.user = fields.user
    this.price = fields.price
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.u64("size"),
        borsh.bool("offering_apples"),
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
      offering_apples: obj.offering_apples,
      user: obj.user,
      price: obj.price,
    })
  }

  static toEncodable(fields: OrderFields) {
    return {
      size: fields.size,
      offering_apples: fields.offering_apples,
      user: fields.user,
      price: fields.price,
    }
  }

  toJSON(): OrderJSON {
    return {
      size: this.size.toString(),
      offering_apples: this.offering_apples,
      user: this.user.toString(),
      price: this.price.toString(),
    }
  }

  static fromJSON(obj: OrderJSON): Order {
    return new Order({
      size: new BN(obj.size),
      offering_apples: obj.offering_apples,
      user: new PublicKey(obj.user),
      price: new BN(obj.price),
    })
  }

  toEncodable() {
    return Order.toEncodable(this)
  }
}
