import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@project-serum/borsh"

export interface OrderFields {
  numApples: BN
  offeringApples: boolean
  user: PublicKey
  numOranges: BN
}

export interface OrderJSON {
  numApples: string
  offeringApples: boolean
  user: string
  numOranges: string
}

export class Order {
  readonly numApples: BN
  readonly offeringApples: boolean
  readonly user: PublicKey
  readonly numOranges: BN

  constructor(fields: OrderFields) {
    this.numApples = fields.numApples
    this.offeringApples = fields.offeringApples
    this.user = fields.user
    this.numOranges = fields.numOranges
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.u64("numApples"),
        borsh.bool("offeringApples"),
        borsh.publicKey("user"),
        borsh.u64("numOranges"),
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
    })
  }

  static toEncodable(fields: OrderFields) {
    return {
      numApples: fields.numApples,
      offeringApples: fields.offeringApples,
      user: fields.user,
      numOranges: fields.numOranges,
    }
  }

  toJSON(): OrderJSON {
    return {
      numApples: this.numApples.toString(),
      offeringApples: this.offeringApples,
      user: this.user.toString(),
      numOranges: this.numOranges.toString(),
    }
  }

  static fromJSON(obj: OrderJSON): Order {
    return new Order({
      numApples: new BN(obj.numApples),
      offeringApples: obj.offeringApples,
      user: new PublicKey(obj.user),
      numOranges: new BN(obj.numOranges),
    })
  }

  toEncodable() {
    return Order.toEncodable(this)
  }
}
