import { PublicKey, Connection } from "@solana/web3.js"
import BN from "bn.js"
import * as borsh from "@project-serum/borsh"
import * as types from "../types"
import { PROGRAM_ID } from "../programId"

export interface UserAccountFields {
  orders: Array<types.OrderRecordFields>
  user: PublicKey
}

export interface UserAccountJSON {
  orders: Array<types.OrderRecordJSON>
  user: string
}

export class UserAccount {
  readonly orders: Array<types.OrderRecord>
  readonly user: PublicKey

  static readonly discriminator = Buffer.from([
    211, 33, 136, 16, 186, 110, 242, 127,
  ])

  static readonly layout = borsh.struct([
    borsh.vec(types.OrderRecord.layout(), "orders"),
    borsh.publicKey("user"),
  ])

  constructor(fields: UserAccountFields) {
    this.orders = fields.orders.map(
      (item) => new types.OrderRecord({ ...item })
    )
    this.user = fields.user
  }

  static async fetch(
    c: Connection,
    address: PublicKey
  ): Promise<UserAccount | null> {
    const info = await c.getAccountInfo(address)

    if (info === null) {
      return null
    }
    if (!info.owner.equals(PROGRAM_ID)) {
      throw new Error("account doesn't belong to this program")
    }

    return this.decode(info.data)
  }

  static decode(data: Buffer): UserAccount {
    if (!data.slice(0, 8).equals(UserAccount.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = UserAccount.layout.decode(data.slice(8))

    return new UserAccount({
      orders: dec.orders.map((item) => types.OrderRecord.fromDecoded(item)),
      user: dec.user,
    })
  }

  toJSON(): UserAccountJSON {
    return {
      orders: this.orders.map((item) => item.toJSON()),
      user: this.user.toString(),
    }
  }

  static fromJSON(obj: UserAccountJSON): UserAccount {
    return new UserAccount({
      orders: obj.orders.map((item) => types.OrderRecord.fromJSON(item)),
      user: new PublicKey(obj.user),
    })
  }
}
