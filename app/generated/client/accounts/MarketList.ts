import { PublicKey, Connection } from "@solana/web3.js"
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@project-serum/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface MarketListFields {
  markets: Array<PublicKey>
}

export interface MarketListJSON {
  markets: Array<string>
}

export class MarketList {
  readonly markets: Array<PublicKey>

  static readonly discriminator = Buffer.from([
    191, 111, 36, 175, 202, 76, 93, 245,
  ])

  static readonly layout = borsh.struct([
    borsh.vec(borsh.publicKey(), "markets"),
  ])

  constructor(fields: MarketListFields) {
    this.markets = fields.markets
  }

  static async fetch(
    c: Connection,
    address: PublicKey
  ): Promise<MarketList | null> {
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
  ): Promise<Array<MarketList | null>> {
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

  static decode(data: Buffer): MarketList {
    if (!data.slice(0, 8).equals(MarketList.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = MarketList.layout.decode(data.slice(8))

    return new MarketList({
      markets: dec.markets,
    })
  }

  toJSON(): MarketListJSON {
    return {
      markets: this.markets.map((item) => item.toString()),
    }
  }

  static fromJSON(obj: MarketListJSON): MarketList {
    return new MarketList({
      markets: obj.markets.map((item) => new PublicKey(item)),
    })
  }
}
