import * as borsh from "@project-serum/borsh"
import BN from "bn.js"
import * as types from "."

export interface OrderRecordFields {
  market: PublicKey
  numApples: BN
  offeringApples: boolean
  numOranges: BN
  memo: number
}

export interface OrderRecordJSON {
  market: string
  numApples: string
  offeringApples: boolean
  numOranges: string
  memo: number
}

export class OrderRecord {
  readonly market: PublicKey
  readonly numApples: BN
  readonly offeringApples: boolean
  readonly numOranges: BN
  readonly memo: number

  constructor(fields: OrderRecordFields) {
    this.market = fields.market
    this.numApples = fields.numApples
    this.offeringApples = fields.offeringApples
    this.numOranges = fields.numOranges
    this.memo = fields.memo
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.publicKey("market"),
        borsh.u64("numApples"),
        borsh.bool("offeringApples"),
        borsh.u64("numOranges"),
        borsh.u8("memo"),
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
      memo: obj.memo,
    })
  }

  static toEncodable(fields: OrderRecordFields) {
    return {
      market: fields.market,
      numApples: fields.numApples,
      offeringApples: fields.offeringApples,
      numOranges: fields.numOranges,
      memo: fields.memo,
    }
  }

  toJSON(): OrderRecordJSON {
    return {
      market: this.market.toString(),
      numApples: this.numApples.toString(),
      offeringApples: this.offeringApples,
      numOranges: this.numOranges.toString(),
      memo: this.memo,
    }
  }

  static fromJSON(obj: OrderRecordJSON): OrderRecord {
    return new OrderRecord({
      market: new PublicKey(obj.market),
      numApples: new BN(obj.numApples),
      offeringApples: obj.offeringApples,
      numOranges: new BN(obj.numOranges),
      memo: obj.memo,
    })
  }

  toEncodable() {
    return OrderRecord.toEncodable(this)
  }
}
