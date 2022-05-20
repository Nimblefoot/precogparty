import { PROGRAM_ID } from "./programId"

export type CustomError =
  | IncorrectUser
  | SizeTooLarge
  | UserMissingOrder
  | OrderbookMissingOrder
  | LastPageEmpty
  | CantConvertOrder
  | OrderbookMismatch
  | MaxOrdersPlaced
  | PageFull

export class IncorrectUser extends Error {
  readonly code = 6000
  readonly name = "IncorrectUser"
  readonly msg = "Order has the wrong user"

  constructor() {
    super("6000: Order has the wrong user")
  }
}

export class SizeTooLarge extends Error {
  readonly code = 6001
  readonly name = "SizeTooLarge"
  readonly msg = "Size too large"

  constructor() {
    super("6001: Size too large")
  }
}

export class UserMissingOrder extends Error {
  readonly code = 6002
  readonly name = "UserMissingOrder"
  readonly msg = "User does not have a matching order"

  constructor() {
    super("6002: User does not have a matching order")
  }
}

export class OrderbookMissingOrder extends Error {
  readonly code = 6003
  readonly name = "OrderbookMissingOrder"
  readonly msg = "Orderbook does not have a matching order"

  constructor() {
    super("6003: Orderbook does not have a matching order")
  }
}

export class LastPageEmpty extends Error {
  readonly code = 6004
  readonly name = "LastPageEmpty"
  readonly msg = "Last Page of orders should not be empty"

  constructor() {
    super("6004: Last Page of orders should not be empty")
  }
}

export class CantConvertOrder extends Error {
  readonly code = 6005
  readonly name = "CantConvertOrder"
  readonly msg = "Can't convert a offering_apples into a sell or vice versa"

  constructor() {
    super("6005: Can't convert a offering_apples into a sell or vice versa")
  }
}

export class OrderbookMismatch extends Error {
  readonly code = 6006
  readonly name = "OrderbookMismatch"
  readonly msg = "Orberbook name does not match Order"

  constructor() {
    super("6006: Orberbook name does not match Order")
  }
}

export class MaxOrdersPlaced extends Error {
  readonly code = 6007
  readonly name = "MaxOrdersPlaced"
  readonly msg = "User already placed the maximum number of orders!"

  constructor() {
    super("6007: User already placed the maximum number of orders!")
  }
}

export class PageFull extends Error {
  readonly code = 6008
  readonly name = "PageFull"
  readonly msg = "Order page is full"

  constructor() {
    super("6008: Order page is full")
  }
}

export function fromCode(code: number): CustomError | null {
  switch (code) {
    case 6000:
      return new IncorrectUser()
    case 6001:
      return new SizeTooLarge()
    case 6002:
      return new UserMissingOrder()
    case 6003:
      return new OrderbookMissingOrder()
    case 6004:
      return new LastPageEmpty()
    case 6005:
      return new CantConvertOrder()
    case 6006:
      return new OrderbookMismatch()
    case 6007:
      return new MaxOrdersPlaced()
    case 6008:
      return new PageFull()
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
