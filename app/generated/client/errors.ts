import { PROGRAM_ID } from "./programId"

export type CustomError =
  | LowCollateral
  | InvalidResolution
  | ContingentMintNotRecognized
  | MarketNotResolved
  | ContingencyNotMet

export class LowCollateral extends Error {
  readonly code = 6000
  readonly name = "LowCollateral"
  readonly msg = "Insufficient COLLATERAL"

  constructor() {
    super("6000: Insufficient COLLATERAL")
  }
}

export class InvalidResolution extends Error {
  readonly code = 6001
  readonly name = "InvalidResolution"
  readonly msg = "Unrecognized resolution; 1 -> yes, 2 -> no"

  constructor() {
    super("6001: Unrecognized resolution; 1 -> yes, 2 -> no")
  }
}

export class ContingentMintNotRecognized extends Error {
  readonly code = 6002
  readonly name = "ContingentMintNotRecognized"
  readonly msg =
    "Contingent coin mint supplied is not equal to the market's yes_mint or no_mint"

  constructor() {
    super(
      "6002: Contingent coin mint supplied is not equal to the market's yes_mint or no_mint"
    )
  }
}

export class MarketNotResolved extends Error {
  readonly code = 6003
  readonly name = "MarketNotResolved"
  readonly msg = "Market is not resolved"

  constructor() {
    super("6003: Market is not resolved")
  }
}

export class ContingencyNotMet extends Error {
  readonly code = 6004
  readonly name = "ContingencyNotMet"
  readonly msg = "The outcome associated with the coin is not the resolution"

  constructor() {
    super("6004: The outcome associated with the coin is not the resolution")
  }
}

export function fromCode(code: number): CustomError | null {
  switch (code) {
    case 6000:
      return new LowCollateral()
    case 6001:
      return new InvalidResolution()
    case 6002:
      return new ContingentMintNotRecognized()
    case 6003:
      return new MarketNotResolved()
    case 6004:
      return new ContingencyNotMet()
  }

  return null
}

function hasOwnProperty<X extends object, Y extends PropertyKey>(
  obj: X,
  prop: Y
): obj is X & Record<Y, unknown> {
  return Object.hasOwnProperty.call(obj, prop)
}

export function fromTxError(err: unknown): CustomError | null {
  if (
    typeof err !== "object" ||
    err === null ||
    !hasOwnProperty(err, "logs") ||
    !Array.isArray(err.logs)
  ) {
    return null
  }

  const log = err.logs.slice(-1)[0]
  if (typeof log !== "string") {
    return null
  }

  const components = log.split(`${PROGRAM_ID} failed: custom program error: `)
  if (components.length !== 2) {
    return null
  }

  let errorCode: number
  try {
    errorCode = parseInt(components[1], 16)
  } catch (parseErr) {
    return null
  }

  return fromCode(errorCode)
}
