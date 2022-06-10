import { PublicKey, Connection } from "@solana/web3.js"
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@project-serum/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface TradeLogFields {
  trades: Array<types.TradeRecordFields>
}

export interface TradeLogJSON {
  trades: Array<types.TradeRecordJSON>
}

export class TradeLog {
  readonly trades: Array<types.TradeRecord>

  static readonly discriminator = Buffer.from([
    32, 113, 191, 71, 0, 74, 68, 182,
  ])

  static readonly layout = borsh.struct([
    borsh.vec(types.TradeRecord.layout(), "trades"),
  ])

  constructor(fields: TradeLogFields) {
    this.trades = fields.trades.map(
      (item) => new types.TradeRecord({ ...item })
    )
  }

  static async fetch(
    c: Connection,
    address: PublicKey
  ): Promise<TradeLog | null> {
    const info = await c.getAccountInfo(address)

    if (info === null) {
      return null
    }
    if (!info.owner.equals(PROGRAM_ID)) {
      throw new Error("account doesn't belong to this program")
    }

    return this.decode(info.data)
  }

  static async fetchMultiple(
    c: Connection,
    addresses: PublicKey[]
  ): Promise<Array<TradeLog | null>> {
    const infos = await c.getMultipleAccountsInfo(addresses)

    return infos.map((info) => {
      if (info === null) {
        return null
      }
      if (!info.owner.equals(PROGRAM_ID)) {
        throw new Error("account doesn't belong to this program")
      }

      return this.decode(info.data)
    })
  }

  static decode(data: Buffer): TradeLog {
    if (!data.slice(0, 8).equals(TradeLog.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = TradeLog.layout.decode(data.slice(8))

    return new TradeLog({
      trades: dec.trades.map(
        (
          item: any /* eslint-disable-line @typescript-eslint/no-explicit-any */
        ) => types.TradeRecord.fromDecoded(item)
      ),
    })
  }

  toJSON(): TradeLogJSON {
    return {
      trades: this.trades.map((item) => item.toJSON()),
    }
  }

  static fromJSON(obj: TradeLogJSON): TradeLog {
    return new TradeLog({
      trades: obj.trades.map((item) => types.TradeRecord.fromJSON(item)),
    })
  }
}