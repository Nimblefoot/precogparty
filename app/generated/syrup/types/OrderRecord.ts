import * as borsh from "@project-serum/borsh"
import BN from "bn.js"
import * as types from "."

export interface OrderRecordFields {
  market: PublicKey
  numApples: BN
  offeringApples: boolean
  numOranges: BN
}

export interface OrderRecordJSON {
  market: string
  numApples: string
  offeringApples: boolean
  numOranges: string
}

export class OrderRecord {
  readonly market: PublicKey
  readonly numApples: BN
  readonly offeringApples: boolean
  readonly numOranges: BN

  constructor(fields: OrderRecordFields) {
    this.market = fields.market
    this.numApples = fields.numApples
    this.offeringApples = fields.offeringApples
    this.numOranges = fields.numOranges
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.publicKey("market"),
        borsh.u64("numApples"),
        borsh.bool("offeringApples"),
        borsh.u64("numOranges"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new OrderRecord({
      market: obj.market,
      numApples: obj.numApples,
      offeringApples: obj.offeringApples,
      numOranges: obj.numOranges,
    })
  }

  static toEncodable(fields: OrderRecordFields) {
    return {
      market: fields.market,
      numApples: fields.numApples,
      offeringApples: fields.offeringApples,
      numOranges: fields.numOranges,
    }
  }

  toJSON(): OrderRecordJSON {
    return {
      market: this.market.toString(),
      numApples: this.numApples.toString(),
      offeringApples: this.offeringApples,
      numOranges: this.numOranges.toString(),
    }
  }

  static fromJSON(obj: OrderRecordJSON): OrderRecord {
    return new OrderRecord({
      market: new PublicKey(obj.market),
      numApples: new BN(obj.numApples),
      offeringApples: obj.offeringApples,
      numOranges: new BN(obj.numOranges),
    })
  }

  toEncodable() {
    return OrderRecord.toEncodable(this)
  }
}
