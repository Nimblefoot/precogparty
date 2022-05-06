import { PublicKey, Connection } from "@solana/web3.js"
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@project-serum/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface PredictionMarketFields {
  name: string
  description: string
  bump: number
  yesMint: PublicKey
  noMint: PublicKey
  collateralVault: PublicKey
  marketAuthority: PublicKey
  resolutionAuthority: PublicKey
  descriptionAuthority: PublicKey
  resolution: number
}

export interface PredictionMarketJSON {
  name: string
  description: string
  bump: number
  yesMint: string
  noMint: string
  collateralVault: string
  marketAuthority: string
  resolutionAuthority: string
  descriptionAuthority: string
  resolution: number
}

export class PredictionMarket {
  readonly name: string
  readonly description: string
  readonly bump: number
  readonly yesMint: PublicKey
  readonly noMint: PublicKey
  readonly collateralVault: PublicKey
  readonly marketAuthority: PublicKey
  readonly resolutionAuthority: PublicKey
  readonly descriptionAuthority: PublicKey
  readonly resolution: number

  static readonly discriminator = Buffer.from([
    117, 150, 97, 152, 119, 58, 51, 58,
  ])

  static readonly layout = borsh.struct([
    borsh.str("name"),
    borsh.str("description"),
    borsh.u8("bump"),
    borsh.publicKey("yesMint"),
    borsh.publicKey("noMint"),
    borsh.publicKey("collateralVault"),
    borsh.publicKey("marketAuthority"),
    borsh.publicKey("resolutionAuthority"),
    borsh.publicKey("descriptionAuthority"),
    borsh.u8("resolution"),
  ])

  constructor(fields: PredictionMarketFields) {
    this.name = fields.name
    this.description = fields.description
    this.bump = fields.bump
    this.yesMint = fields.yesMint
    this.noMint = fields.noMint
    this.collateralVault = fields.collateralVault
    this.marketAuthority = fields.marketAuthority
    this.resolutionAuthority = fields.resolutionAuthority
    this.descriptionAuthority = fields.descriptionAuthority
    this.resolution = fields.resolution
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
      description: dec.description,
      bump: dec.bump,
      yesMint: dec.yesMint,
      noMint: dec.noMint,
      collateralVault: dec.collateralVault,
      marketAuthority: dec.marketAuthority,
      resolutionAuthority: dec.resolutionAuthority,
      descriptionAuthority: dec.descriptionAuthority,
      resolution: dec.resolution,
    })
  }

  toJSON(): PredictionMarketJSON {
    return {
      name: this.name,
      description: this.description,
      bump: this.bump,
      yesMint: this.yesMint.toString(),
      noMint: this.noMint.toString(),
      collateralVault: this.collateralVault.toString(),
      marketAuthority: this.marketAuthority.toString(),
      resolutionAuthority: this.resolutionAuthority.toString(),
      descriptionAuthority: this.descriptionAuthority.toString(),
      resolution: this.resolution,
    }
  }

  static fromJSON(obj: PredictionMarketJSON): PredictionMarket {
    return new PredictionMarket({
      name: obj.name,
      description: obj.description,
      bump: obj.bump,
      yesMint: new PublicKey(obj.yesMint),
      noMint: new PublicKey(obj.noMint),
      collateralVault: new PublicKey(obj.collateralVault),
      marketAuthority: new PublicKey(obj.marketAuthority),
      resolutionAuthority: new PublicKey(obj.resolutionAuthority),
      descriptionAuthority: new PublicKey(obj.descriptionAuthority),
      resolution: obj.resolution,
    })
  }
}
