export type CustomError =
  | IncorrectUser
  | SizeTooLarge
  | UserMissingOrder
  | OrderbookMissingOrder
  | LastPageEmpty
  | CantConvertOrder
  | OrderbookMismatch
  | OrderTooSmall
  | WrongOrder
  | WrongVault
  | WrongRemainingAccount
  | MissingLastPage
  | OrderbookClosed
  | OrderbookNameAlreadySet
  | MaxOrdersPlaced
  | PageFull

export class IncorrectUser extends Error {
  static readonly code = 6000
  readonly code = 6000
  readonly name = "IncorrectUser"
  readonly msg = "Order has the wrong user"

  constructor(readonly logs?: string[]) {
    super("6000: Order has the wrong user")
  }
}

export class SizeTooLarge extends Error {
  static readonly code = 6001
  readonly code = 6001
  readonly name = "SizeTooLarge"
  readonly msg = "Size too large"

  constructor(readonly logs?: string[]) {
    super("6001: Size too large")
  }
}

export class UserMissingOrder extends Error {
  static readonly code = 6002
  readonly code = 6002
  readonly name = "UserMissingOrder"
  readonly msg = "User does not have a matching order"

  constructor(readonly logs?: string[]) {
    super("6002: User does not have a matching order")
  }
}

export class OrderbookMissingOrder extends Error {
  static readonly code = 6003
  readonly code = 6003
  readonly name = "OrderbookMissingOrder"
  readonly msg = "Orderbook does not have a matching order"

  constructor(readonly logs?: string[]) {
    super("6003: Orderbook does not have a matching order")
  }
}

export class LastPageEmpty extends Error {
  static readonly code = 6004
  readonly code = 6004
  readonly name = "LastPageEmpty"
  readonly msg = "Last Page of orders should not be empty"

  constructor(readonly logs?: string[]) {
    super("6004: Last Page of orders should not be empty")
  }
}

export class CantConvertOrder extends Error {
  static readonly code = 6005
  readonly code = 6005
  readonly name = "CantConvertOrder"
  readonly msg = "Can't convert a offering_apples into a sell or vice versa"

  constructor(readonly logs?: string[]) {
    super("6005: Can't convert a offering_apples into a sell or vice versa")
  }
}

export class OrderbookMismatch extends Error {
  static readonly code = 6006
  readonly code = 6006
  readonly name = "OrderbookMismatch"
  readonly msg = "Orberbook name does not match Order"

  constructor(readonly logs?: string[]) {
    super("6006: Orberbook name does not match Order")
  }
}

export class OrderTooSmall extends Error {
  static readonly code = 6007
  readonly code = 6007
  readonly name = "OrderTooSmall"
  readonly msg = "Order too small"

  constructor(readonly logs?: string[]) {
    super("6007: Order too small")
  }
}

export class WrongOrder extends Error {
  static readonly code = 6008
  readonly code = 6008
  readonly name = "WrongOrder"
  readonly msg = "Orders need to match"

  constructor(readonly logs?: string[]) {
    super("6008: Orders need to match")
  }
}

export class WrongVault extends Error {
  static readonly code = 6009
  readonly code = 6009
  readonly name = "WrongVault"
  readonly msg = "Vaults dont match"

  constructor(readonly logs?: string[]) {
    super("6009: Vaults dont match")
  }
}

export class WrongRemainingAccount extends Error {
  static readonly code = 6010
  readonly code = 6010
  readonly name = "WrongRemainingAccount"
  readonly msg = "Wrong Account Passed to Remaining Accounts."

  constructor(readonly logs?: string[]) {
    super("6010: Wrong Account Passed to Remaining Accounts.")
  }
}

export class MissingLastPage extends Error {
  static readonly code = 6011
  readonly code = 6011
  readonly name = "MissingLastPage"
  readonly msg = "Last Page not passed"

  constructor(readonly logs?: string[]) {
    super("6011: Last Page not passed")
  }
}

export class OrderbookClosed extends Error {
  static readonly code = 6012
  readonly code = 6012
  readonly name = "OrderbookClosed"
  readonly msg = "Orderbook Closed"

  constructor(readonly logs?: string[]) {
    super("6012: Orderbook Closed")
  }
}

export class OrderbookNameAlreadySet extends Error {
  static readonly code = 6013
  readonly code = 6013
  readonly name = "OrderbookNameAlreadySet"
  readonly msg = "Orderbook page orderbook name already set"

  constructor(readonly logs?: string[]) {
    super("6013: Orderbook page orderbook name already set")
  }
}

export class MaxOrdersPlaced extends Error {
  static readonly code = 6014
  readonly code = 6014
  readonly name = "MaxOrdersPlaced"
  readonly msg = "User already placed the maximum number of orders!"

  constructor(readonly logs?: string[]) {
    super("6014: User already placed the maximum number of orders!")
  }
}

export class PageFull extends Error {
  static readonly code = 6015
  readonly code = 6015
  readonly name = "PageFull"
  readonly msg = "Order page is full"

  constructor(readonly logs?: string[]) {
    super("6015: Order page is full")
  }
}

export function fromCode(code: number, logs?: string[]): CustomError | null {
  switch (code) {
    case 6000:
      return new IncorrectUser(logs)
    case 6001:
      return new SizeTooLarge(logs)
    case 6002:
      return new UserMissingOrder(logs)
    case 6003:
      return new OrderbookMissingOrder(logs)
    case 6004:
      return new LastPageEmpty(logs)
    case 6005:
      return new CantConvertOrder(logs)
    case 6006:
      return new OrderbookMismatch(logs)
    case 6007:
      return new OrderTooSmall(logs)
    case 6008:
      return new WrongOrder(logs)
    case 6009:
      return new WrongVault(logs)
    case 6010:
      return new WrongRemainingAccount(logs)
    case 6011:
      return new MissingLastPage(logs)
    case 6012:
      return new OrderbookClosed(logs)
    case 6013:
      return new OrderbookNameAlreadySet(logs)
    case 6014:
      return new MaxOrdersPlaced(logs)
    case 6015:
      return new PageFull(logs)
  }

  return null
}
