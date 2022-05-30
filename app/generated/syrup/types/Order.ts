import * as borsh from "@project-serum/borsh"
import BN from "bn.js"
import * as types from "."

export interface OrderFields {
  numApples: BN
  offeringApples: boolean
  user: PublicKey
  numOranges: BN
  memo: number
}

export interface OrderJSON {
  numApples: string
  offeringApples: boolean
  user: string
  numOranges: string
  memo: number
}

export class Order {
  readonly numApples: BN
  readonly offeringApples: boolean
  readonly user: PublicKey
  readonly numOranges: BN
  readonly memo: number

  constructor(fields: OrderFields) {
    this.numApples = fields.numApples
    this.offeringApples = fields.offeringApples
    this.user = fields.user
    this.numOranges = fields.numOranges
    this.memo = fields.memo
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.u64("numApples"),
        borsh.bool("offeringApples"),
        borsh.publicKey("user"),
        borsh.u64("numOranges"),
        borsh.u8("memo"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new Order({
      numApples: obj.numApples,
      offeringApples: obj.offeringApples,
      user: obj.user,
      numOranges: obj.numOranges,
      memo: obj.memo,
    })
  }

  static toEncodable(fields: OrderFields) {
    return {
      numApples: fields.numApples,
      offeringApples: fields.offeringApples,
      user: fields.user,
      numOranges: fields.numOranges,
      memo: fields.memo,
    }
  }

  toJSON(): OrderJSON {
    return {
      numApples: this.numApples.toString(),
      offeringApples: this.offeringApples,
      user: this.user.toString(),
      numOranges: this.numOranges.toString(),
      memo: this.memo,
    }
  }

  static fromJSON(obj: OrderJSON): Order {
    return new Order({
      numApples: new BN(obj.numApples),
      offeringApples: obj.offeringApples,
      user: new PublicKey(obj.user),
      numOranges: new BN(obj.numOranges),
      memo: obj.memo,
    })
  }

  toEncodable() {
    return Order.toEncodable(this)
  }
}
