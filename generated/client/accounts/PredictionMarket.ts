import { PublicKey, Connection } from "@solana/web3.js"
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@project-serum/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface PredictionMarketFields {
  name: Array<number>
  descriptionUri: Array<number>
  bump: number
  yesMint: PublicKey
  yesMarket: PublicKey
  noMint: PublicKey
  noMarket: PublicKey
  marketAuthority: PublicKey
  resolutionAuthority: PublicKey
  descriptionAuthority: PublicKey
  resolution: number
  usdcVault: PublicKey
}

export interface PredictionMarketJSON {
  name: Array<number>
  descriptionUri: Array<number>
  bump: number
  yesMint: string
  yesMarket: string
  noMint: string
  noMarket: string
  marketAuthority: string
  resolutionAuthority: string
  descriptionAuthority: string
  resolution: number
  usdcVault: string
}

export class PredictionMarket {
  readonly name: Array<number>
  readonly descriptionUri: Array<number>
  readonly bump: number
  readonly yesMint: PublicKey
  readonly yesMarket: PublicKey
  readonly noMint: PublicKey
  readonly noMarket: PublicKey
  readonly marketAuthority: PublicKey
  readonly resolutionAuthority: PublicKey
  readonly descriptionAuthority: PublicKey
  readonly resolution: number
  readonly usdcVault: PublicKey

  static readonly discriminator = Buffer.from([
    117, 150, 97, 152, 119, 58, 51, 58,
  ])

  static readonly layout = borsh.struct([
    borsh.array(borsh.u8(), 16, "name"),
    borsh.array(borsh.u8(), 32, "descriptionUri"),
    borsh.u8("bump"),
    borsh.publicKey("yesMint"),
    borsh.publicKey("yesMarket"),
    borsh.publicKey("noMint"),
    borsh.publicKey("noMarket"),
    borsh.publicKey("marketAuthority"),
    borsh.publicKey("resolutionAuthority"),
    borsh.publicKey("descriptionAuthority"),
    borsh.u8("resolution"),
    borsh.publicKey("usdcVault"),
  ])

  constructor(fields: PredictionMarketFields) {
    this.name = fields.name
    this.descriptionUri = fields.descriptionUri
    this.bump = fields.bump
    this.yesMint = fields.yesMint
    this.yesMarket = fields.yesMarket
    this.noMint = fields.noMint
    this.noMarket = fields.noMarket
    this.marketAuthority = fields.marketAuthority
    this.resolutionAuthority = fields.resolutionAuthority
    this.descriptionAuthority = fields.descriptionAuthority
    this.resolution = fields.resolution
    this.usdcVault = fields.usdcVault
  }

  static async fetch(
    c: Connection,
    address: PublicKey
  ): Promise<PredictionMarket | null> {
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
  ): Promise<Array<PredictionMarket | null>> {
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

  static decode(data: Buffer): PredictionMarket {
    if (!data.slice(0, 8).equals(PredictionMarket.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = PredictionMarket.layout.decode(data.slice(8))

    return new PredictionMarket({
      name: dec.name,
      descriptionUri: dec.descriptionUri,
      bump: dec.bump,
      yesMint: dec.yesMint,
      yesMarket: dec.yesMarket,
      noMint: dec.noMint,
      noMarket: dec.noMarket,
      marketAuthority: dec.marketAuthority,
      resolutionAuthority: dec.resolutionAuthority,
      descriptionAuthority: dec.descriptionAuthority,
      resolution: dec.resolution,
      usdcVault: dec.usdcVault,
    })
  }

  toJSON(): PredictionMarketJSON {
    return {
      name: this.name,
      descriptionUri: this.descriptionUri,
      bump: this.bump,
      yesMint: this.yesMint.toString(),
      yesMarket: this.yesMarket.toString(),
      noMint: this.noMint.toString(),
      noMarket: this.noMarket.toString(),
      marketAuthority: this.marketAuthority.toString(),
      resolutionAuthority: this.resolutionAuthority.toString(),
      descriptionAuthority: this.descriptionAuthority.toString(),
      resolution: this.resolution,
      usdcVault: this.usdcVault.toString(),
    }
  }

  static fromJSON(obj: PredictionMarketJSON): PredictionMarket {
    return new PredictionMarket({
      name: obj.name,
      descriptionUri: obj.descriptionUri,
      bump: obj.bump,
      yesMint: new PublicKey(obj.yesMint),
      yesMarket: new PublicKey(obj.yesMarket),
      noMint: new PublicKey(obj.noMint),
      noMarket: new PublicKey(obj.noMarket),
      marketAuthority: new PublicKey(obj.marketAuthority),
      resolutionAuthority: new PublicKey(obj.resolutionAuthority),
      descriptionAuthority: new PublicKey(obj.descriptionAuthority),
      resolution: obj.resolution,
      usdcVault: new PublicKey(obj.usdcVault),
    })
  }
}
