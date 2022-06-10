import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@project-serum/borsh"

export interface TradeRecordFields {
  numApples: BN
  buyOrderForApples: boolean
  numOranges: BN
  time: BN
}

export interface TradeRecordJSON {
  numApples: string
  buyOrderForApples: boolean
  numOranges: string
  time: string
}

export class TradeRecord {
  readonly numApples: BN
  readonly buyOrderForApples: boolean
  readonly numOranges: BN
  readonly time: BN

  constructor(fields: TradeRecordFields) {
    this.numApples = fields.numApples
    this.buyOrderForApples = fields.buyOrderForApples
    this.numOranges = fields.numOranges
    this.time = fields.time
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.u64("numApples"),
        borsh.bool("buyOrderForApples"),
        borsh.u64("numOranges"),
        borsh.i64("time"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new TradeRecord({
      numApples: obj.numApples,
      buyOrderForApples: obj.buyOrderForApples,
      numOranges: obj.numOranges,
      time: obj.time,
    })
  }

  static toEncodable(fields: TradeRecordFields) {
    return {
      numApples: fields.numApples,
      buyOrderForApples: fields.buyOrderForApples,
      numOranges: fields.numOranges,
      time: fields.time,
    }
  }

  toJSON(): TradeRecordJSON {
    return {
      numApples: this.numApples.toString(),
      buyOrderForApples: this.buyOrderForApples,
      numOranges: this.numOranges.toString(),
      time: this.time.toString(),
    }
  }

  static fromJSON(obj: TradeRecordJSON): TradeRecord {
    return new TradeRecord({
      numApples: new BN(obj.numApples),
      buyOrderForApples: obj.buyOrderForApples,
      numOranges: new BN(obj.numOranges),
      time: new BN(obj.time),
    })
  }

  toEncodable() {
    return TradeRecord.toEncodable(this)
  }
}
