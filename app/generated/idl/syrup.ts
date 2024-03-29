export type Syrup = {
  version: "0.1.0"
  name: "syrup"
  instructions: [
    {
      name: "initializeOrderbook"
      accounts: [
        {
          name: "admin"
          isMut: true
          isSigner: true
        },
        {
          name: "orderbookInfo"
          isMut: true
          isSigner: false
          pda: {
            seeds: [
              {
                kind: "arg"
                type: "publicKey"
                path: "id"
              },
              {
                kind: "const"
                type: "string"
                value: "orderbook-info"
              }
            ]
          }
        },
        {
          name: "firstPage"
          isMut: true
          isSigner: false
          pda: {
            seeds: [
              {
                kind: "arg"
                type: "publicKey"
                path: "id"
              },
              {
                kind: "const"
                type: "string"
                value: "page"
              },
              {
                kind: "account"
                type: "publicKey"
                account: "OrderbookInfo"
                path: "orderbook_info"
              }
            ]
          }
        },
        {
          name: "applesMint"
          isMut: false
          isSigner: false
        },
        {
          name: "applesVault"
          isMut: true
          isSigner: false
        },
        {
          name: "orangesMint"
          isMut: false
          isSigner: false
        },
        {
          name: "orangesVault"
          isMut: true
          isSigner: false
        },
        {
          name: "tradeLog"
          isMut: true
          isSigner: false
          pda: {
            seeds: [
              {
                kind: "arg"
                type: "publicKey"
                path: "id"
              },
              {
                kind: "const"
                type: "string"
                value: "trades"
              }
            ]
          }
        },
        {
          name: "tokenProgram"
          isMut: false
          isSigner: false
        },
        {
          name: "associatedTokenProgram"
          isMut: false
          isSigner: false
        },
        {
          name: "rent"
          isMut: false
          isSigner: false
        },
        {
          name: "systemProgram"
          isMut: false
          isSigner: false
        }
      ]
      args: [
        {
          name: "id"
          type: "publicKey"
        }
      ]
    },
    {
      name: "createUserAccount"
      accounts: [
        {
          name: "user"
          isMut: true
          isSigner: true
        },
        {
          name: "userAccount"
          isMut: true
          isSigner: false
          pda: {
            seeds: [
              {
                kind: "const"
                type: "string"
                value: "user-account"
              },
              {
                kind: "account"
                type: "publicKey"
                path: "user"
              }
            ]
          }
        },
        {
          name: "systemProgram"
          isMut: false
          isSigner: false
        }
      ]
      args: []
    },
    {
      name: "placeOrder"
      accounts: [
        {
          name: "user"
          isMut: true
          isSigner: true
        },
        {
          name: "userAccount"
          isMut: true
          isSigner: false
          pda: {
            seeds: [
              {
                kind: "const"
                type: "string"
                value: "user-account"
              },
              {
                kind: "account"
                type: "publicKey"
                path: "user"
              }
            ]
          }
        },
        {
          name: "userAta"
          isMut: true
          isSigner: false
        },
        {
          name: "vault"
          isMut: true
          isSigner: false
        },
        {
          name: "orderbookInfo"
          isMut: true
          isSigner: false
          pda: {
            seeds: [
              {
                kind: "account"
                type: "publicKey"
                account: "OrderbookInfo"
                path: "orderbook_info.id"
              },
              {
                kind: "const"
                type: "string"
                value: "orderbook-info"
              }
            ]
          }
        },
        {
          name: "currentPage"
          isMut: true
          isSigner: false
          pda: {
            seeds: [
              {
                kind: "account"
                type: "publicKey"
                account: "OrderbookInfo"
                path: "orderbook_info.id"
              },
              {
                kind: "const"
                type: "string"
                value: "page"
              },
              {
                kind: "account"
                type: "publicKey"
                account: "OrderbookInfo"
                path: "orderbook_info"
              }
            ]
          }
        },
        {
          name: "tokenProgram"
          isMut: false
          isSigner: false
        },
        {
          name: "associatedTokenProgram"
          isMut: false
          isSigner: false
        },
        {
          name: "rent"
          isMut: false
          isSigner: false
        },
        {
          name: "systemProgram"
          isMut: false
          isSigner: false
        }
      ]
      args: [
        {
          name: "order"
          type: {
            defined: "Order"
          }
        }
      ]
    },
    {
      name: "takeOrder"
      accounts: [
        {
          name: "taker"
          isMut: true
          isSigner: true
        },
        {
          name: "takerTradeLog"
          isMut: true
          isSigner: false
          pda: {
            seeds: [
              {
                kind: "account"
                type: "publicKey"
                path: "taker"
              },
              {
                kind: "const"
                type: "string"
                value: "trade-log"
              }
            ]
          }
        },
        {
          name: "takerSendingAta"
          isMut: true
          isSigner: false
        },
        {
          name: "takerReceivingAta"
          isMut: true
          isSigner: false
        },
        {
          name: "offererUserAccount"
          isMut: true
          isSigner: false
          pda: {
            seeds: [
              {
                kind: "const"
                type: "string"
                value: "user-account"
              },
              {
                kind: "arg"
                type: {
                  defined: "Order"
                }
                path: "order.user"
              }
            ]
          }
        },
        {
          name: "offererTradeLog"
          isMut: true
          isSigner: false
          pda: {
            seeds: [
              {
                kind: "arg"
                type: {
                  defined: "Order"
                }
                path: "order.user"
              },
              {
                kind: "const"
                type: "string"
                value: "trade-log"
              }
            ]
          }
        },
        {
          name: "offererReceivingAta"
          isMut: true
          isSigner: false
        },
        {
          name: "vault"
          isMut: true
          isSigner: false
        },
        {
          name: "orderbookInfo"
          isMut: true
          isSigner: false
          pda: {
            seeds: [
              {
                kind: "account"
                type: "publicKey"
                account: "OrderbookInfo"
                path: "orderbook_info.id"
              },
              {
                kind: "const"
                type: "string"
                value: "orderbook-info"
              }
            ]
          }
        },
        {
          name: "orderPage"
          isMut: true
          isSigner: false
          pda: {
            seeds: [
              {
                kind: "account"
                type: "publicKey"
                account: "OrderbookInfo"
                path: "orderbook_info.id"
              },
              {
                kind: "const"
                type: "string"
                value: "page"
              },
              {
                kind: "arg"
                type: "u32"
                path: "page_number"
              }
            ]
          }
        },
        {
          name: "tradeLog"
          isMut: true
          isSigner: false
          pda: {
            seeds: [
              {
                kind: "account"
                type: "publicKey"
                account: "OrderbookInfo"
                path: "orderbook_info.id"
              },
              {
                kind: "const"
                type: "string"
                value: "trades"
              }
            ]
          }
        },
        {
          name: "tokenProgram"
          isMut: false
          isSigner: false
        },
        {
          name: "associatedTokenProgram"
          isMut: false
          isSigner: false
        },
        {
          name: "rent"
          isMut: false
          isSigner: false
        },
        {
          name: "systemProgram"
          isMut: false
          isSigner: false
        }
      ]
      args: [
        {
          name: "order"
          type: {
            defined: "Order"
          }
        },
        {
          name: "amountToExchange"
          type: "u64"
        },
        {
          name: "pageNumber"
          type: "u32"
        },
        {
          name: "index"
          type: "u32"
        }
      ]
    },
    {
      name: "cancelOrder"
      accounts: [
        {
          name: "user"
          isMut: true
          isSigner: true
        },
        {
          name: "userAccount"
          isMut: true
          isSigner: false
          pda: {
            seeds: [
              {
                kind: "const"
                type: "string"
                value: "user-account"
              },
              {
                kind: "arg"
                type: {
                  defined: "Order"
                }
                path: "order.user"
              }
            ]
          }
        },
        {
          name: "userAta"
          isMut: true
          isSigner: false
        },
        {
          name: "vault"
          isMut: true
          isSigner: false
        },
        {
          name: "orderbookInfo"
          isMut: true
          isSigner: false
          pda: {
            seeds: [
              {
                kind: "account"
                type: "publicKey"
                account: "OrderbookInfo"
                path: "orderbook_info.id"
              },
              {
                kind: "const"
                type: "string"
                value: "orderbook-info"
              }
            ]
          }
        },
        {
          name: "orderPage"
          isMut: true
          isSigner: false
          pda: {
            seeds: [
              {
                kind: "account"
                type: "publicKey"
                account: "OrderbookInfo"
                path: "orderbook_info.id"
              },
              {
                kind: "const"
                type: "string"
                value: "page"
              },
              {
                kind: "arg"
                type: "u32"
                path: "page_number"
              }
            ]
          }
        },
        {
          name: "tokenProgram"
          isMut: false
          isSigner: false
        }
      ]
      args: [
        {
          name: "order"
          type: {
            defined: "Order"
          }
        },
        {
          name: "pageNumber"
          type: "u32"
        },
        {
          name: "index"
          type: "u32"
        }
      ]
    },
    {
      name: "closeOrderbook"
      accounts: [
        {
          name: "admin"
          isMut: true
          isSigner: true
        },
        {
          name: "orderbookInfo"
          isMut: true
          isSigner: false
          pda: {
            seeds: [
              {
                kind: "account"
                type: "publicKey"
                account: "OrderbookInfo"
                path: "orderbook_info.id"
              },
              {
                kind: "const"
                type: "string"
                value: "orderbook-info"
              }
            ]
          }
        },
        {
          name: "tradeLog"
          isMut: true
          isSigner: false
          pda: {
            seeds: [
              {
                kind: "account"
                type: "publicKey"
                account: "OrderbookInfo"
                path: "orderbook_info.id"
              },
              {
                kind: "const"
                type: "string"
                value: "trades"
              }
            ]
          }
        }
      ]
      args: []
    }
  ]
  accounts: [
    {
      name: "tradeLog"
      type: {
        kind: "struct"
        fields: [
          {
            name: "trades"
            type: {
              vec: {
                defined: "TradeRecord"
              }
            }
          },
          {
            name: "openTime"
            type: "i64"
          },
          {
            name: "closeTime"
            type: "i64"
          },
          {
            name: "start"
            type: "u32"
          }
        ]
      }
    },
    {
      name: "orderbookInfo"
      type: {
        kind: "struct"
        fields: [
          {
            name: "admin"
            type: "publicKey"
          },
          {
            name: "length"
            type: "u32"
          },
          {
            name: "applesMint"
            type: "publicKey"
          },
          {
            name: "orangesMint"
            type: "publicKey"
          },
          {
            name: "bump"
            type: "u8"
          },
          {
            name: "closed"
            type: "bool"
          },
          {
            name: "id"
            type: "publicKey"
          },
          {
            name: "mostRecentTrade"
            type: {
              option: {
                defined: "TradeRecord"
              }
            }
          }
        ]
      }
    },
    {
      name: "orderbookPage"
      type: {
        kind: "struct"
        fields: [
          {
            name: "list"
            type: {
              vec: {
                defined: "Order"
              }
            }
          },
          {
            name: "orderbookId"
            type: "publicKey"
          },
          {
            name: "idSet"
            type: "bool"
          }
        ]
      }
    },
    {
      name: "userAccount"
      type: {
        kind: "struct"
        fields: [
          {
            name: "orders"
            type: {
              vec: {
                defined: "OrderRecord"
              }
            }
          },
          {
            name: "user"
            type: "publicKey"
          }
        ]
      }
    }
  ]
  types: [
    {
      name: "Order"
      type: {
        kind: "struct"
        fields: [
          {
            name: "numApples"
            type: "u64"
          },
          {
            name: "offeringApples"
            type: "bool"
          },
          {
            name: "user"
            type: "publicKey"
          },
          {
            name: "numOranges"
            type: "u64"
          },
          {
            name: "memo"
            type: "u8"
          }
        ]
      }
    },
    {
      name: "TradeRecord"
      type: {
        kind: "struct"
        fields: [
          {
            name: "numApples"
            type: "u64"
          },
          {
            name: "buyOrderForApples"
            type: "bool"
          },
          {
            name: "numOranges"
            type: "u64"
          },
          {
            name: "time"
            type: "i64"
          }
        ]
      }
    },
    {
      name: "OrderRecord"
      type: {
        kind: "struct"
        fields: [
          {
            name: "market"
            type: "publicKey"
          },
          {
            name: "numApples"
            type: "u64"
          },
          {
            name: "offeringApples"
            type: "bool"
          },
          {
            name: "numOranges"
            type: "u64"
          },
          {
            name: "memo"
            type: "u8"
          }
        ]
      }
    }
  ]
  errors: [
    {
      code: 6000
      name: "IncorrectUser"
      msg: "Order has the wrong user"
    },
    {
      code: 6001
      name: "SizeTooLarge"
      msg: "Size too large"
    },
    {
      code: 6002
      name: "UserMissingOrder"
      msg: "User does not have a matching order"
    },
    {
      code: 6003
      name: "OrderbookMissingOrder"
      msg: "Orderbook does not have a matching order"
    },
    {
      code: 6004
      name: "LastPageEmpty"
      msg: "Last Page of orders should not be empty"
    },
    {
      code: 6005
      name: "CantConvertOrder"
      msg: "Can't convert a offering_apples into a sell or vice versa"
    },
    {
      code: 6006
      name: "OrderbookMismatch"
      msg: "Orberbook name does not match Order"
    },
    {
      code: 6007
      name: "OrderTooSmall"
      msg: "Order too small"
    },
    {
      code: 6008
      name: "WrongOrder"
      msg: "Orders need to match"
    },
    {
      code: 6009
      name: "WrongVault"
      msg: "Vaults dont match"
    },
    {
      code: 6010
      name: "WrongRemainingAccount"
      msg: "Wrong Account Passed to Remaining Accounts."
    },
    {
      code: 6011
      name: "MissingLastPage"
      msg: "Last Page not passed"
    },
    {
      code: 6012
      name: "OrderbookClosed"
      msg: "Orderbook Closed"
    },
    {
      code: 6013
      name: "OrderbookNameAlreadySet"
      msg: "Orderbook page orderbook name already set"
    },
    {
      code: 6014
      name: "MaxOrdersPlaced"
      msg: "User already placed the maximum number of orders!"
    },
    {
      code: 6015
      name: "PageFull"
      msg: "Order page is full"
    }
  ]
}

export const IDL: Syrup = {
  version: "0.1.0",
  name: "syrup",
  instructions: [
    {
      name: "initializeOrderbook",
      accounts: [
        {
          name: "admin",
          isMut: true,
          isSigner: true,
        },
        {
          name: "orderbookInfo",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "arg",
                type: "publicKey",
                path: "id",
              },
              {
                kind: "const",
                type: "string",
                value: "orderbook-info",
              },
            ],
          },
        },
        {
          name: "firstPage",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "arg",
                type: "publicKey",
                path: "id",
              },
              {
                kind: "const",
                type: "string",
                value: "page",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "OrderbookInfo",
                path: "orderbook_info",
              },
            ],
          },
        },
        {
          name: "applesMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "applesVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "orangesMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "orangesVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tradeLog",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "arg",
                type: "publicKey",
                path: "id",
              },
              {
                kind: "const",
                type: "string",
                value: "trades",
              },
            ],
          },
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "id",
          type: "publicKey",
        },
      ],
    },
    {
      name: "createUserAccount",
      accounts: [
        {
          name: "user",
          isMut: true,
          isSigner: true,
        },
        {
          name: "userAccount",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "user-account",
              },
              {
                kind: "account",
                type: "publicKey",
                path: "user",
              },
            ],
          },
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "placeOrder",
      accounts: [
        {
          name: "user",
          isMut: true,
          isSigner: true,
        },
        {
          name: "userAccount",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "user-account",
              },
              {
                kind: "account",
                type: "publicKey",
                path: "user",
              },
            ],
          },
        },
        {
          name: "userAta",
          isMut: true,
          isSigner: false,
        },
        {
          name: "vault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "orderbookInfo",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "account",
                type: "publicKey",
                account: "OrderbookInfo",
                path: "orderbook_info.id",
              },
              {
                kind: "const",
                type: "string",
                value: "orderbook-info",
              },
            ],
          },
        },
        {
          name: "currentPage",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "account",
                type: "publicKey",
                account: "OrderbookInfo",
                path: "orderbook_info.id",
              },
              {
                kind: "const",
                type: "string",
                value: "page",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "OrderbookInfo",
                path: "orderbook_info",
              },
            ],
          },
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "order",
          type: {
            defined: "Order",
          },
        },
      ],
    },
    {
      name: "takeOrder",
      accounts: [
        {
          name: "taker",
          isMut: true,
          isSigner: true,
        },
        {
          name: "takerTradeLog",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "account",
                type: "publicKey",
                path: "taker",
              },
              {
                kind: "const",
                type: "string",
                value: "trade-log",
              },
            ],
          },
        },
        {
          name: "takerSendingAta",
          isMut: true,
          isSigner: false,
        },
        {
          name: "takerReceivingAta",
          isMut: true,
          isSigner: false,
        },
        {
          name: "offererUserAccount",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "user-account",
              },
              {
                kind: "arg",
                type: {
                  defined: "Order",
                },
                path: "order.user",
              },
            ],
          },
        },
        {
          name: "offererTradeLog",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "arg",
                type: {
                  defined: "Order",
                },
                path: "order.user",
              },
              {
                kind: "const",
                type: "string",
                value: "trade-log",
              },
            ],
          },
        },
        {
          name: "offererReceivingAta",
          isMut: true,
          isSigner: false,
        },
        {
          name: "vault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "orderbookInfo",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "account",
                type: "publicKey",
                account: "OrderbookInfo",
                path: "orderbook_info.id",
              },
              {
                kind: "const",
                type: "string",
                value: "orderbook-info",
              },
            ],
          },
        },
        {
          name: "orderPage",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "account",
                type: "publicKey",
                account: "OrderbookInfo",
                path: "orderbook_info.id",
              },
              {
                kind: "const",
                type: "string",
                value: "page",
              },
              {
                kind: "arg",
                type: "u32",
                path: "page_number",
              },
            ],
          },
        },
        {
          name: "tradeLog",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "account",
                type: "publicKey",
                account: "OrderbookInfo",
                path: "orderbook_info.id",
              },
              {
                kind: "const",
                type: "string",
                value: "trades",
              },
            ],
          },
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "order",
          type: {
            defined: "Order",
          },
        },
        {
          name: "amountToExchange",
          type: "u64",
        },
        {
          name: "pageNumber",
          type: "u32",
        },
        {
          name: "index",
          type: "u32",
        },
      ],
    },
    {
      name: "cancelOrder",
      accounts: [
        {
          name: "user",
          isMut: true,
          isSigner: true,
        },
        {
          name: "userAccount",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "user-account",
              },
              {
                kind: "arg",
                type: {
                  defined: "Order",
                },
                path: "order.user",
              },
            ],
          },
        },
        {
          name: "userAta",
          isMut: true,
          isSigner: false,
        },
        {
          name: "vault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "orderbookInfo",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "account",
                type: "publicKey",
                account: "OrderbookInfo",
                path: "orderbook_info.id",
              },
              {
                kind: "const",
                type: "string",
                value: "orderbook-info",
              },
            ],
          },
        },
        {
          name: "orderPage",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "account",
                type: "publicKey",
                account: "OrderbookInfo",
                path: "orderbook_info.id",
              },
              {
                kind: "const",
                type: "string",
                value: "page",
              },
              {
                kind: "arg",
                type: "u32",
                path: "page_number",
              },
            ],
          },
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "order",
          type: {
            defined: "Order",
          },
        },
        {
          name: "pageNumber",
          type: "u32",
        },
        {
          name: "index",
          type: "u32",
        },
      ],
    },
    {
      name: "closeOrderbook",
      accounts: [
        {
          name: "admin",
          isMut: true,
          isSigner: true,
        },
        {
          name: "orderbookInfo",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "account",
                type: "publicKey",
                account: "OrderbookInfo",
                path: "orderbook_info.id",
              },
              {
                kind: "const",
                type: "string",
                value: "orderbook-info",
              },
            ],
          },
        },
        {
          name: "tradeLog",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "account",
                type: "publicKey",
                account: "OrderbookInfo",
                path: "orderbook_info.id",
              },
              {
                kind: "const",
                type: "string",
                value: "trades",
              },
            ],
          },
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "tradeLog",
      type: {
        kind: "struct",
        fields: [
          {
            name: "trades",
            type: {
              vec: {
                defined: "TradeRecord",
              },
            },
          },
          {
            name: "openTime",
            type: "i64",
          },
          {
            name: "closeTime",
            type: "i64",
          },
          {
            name: "start",
            type: "u32",
          },
        ],
      },
    },
    {
      name: "orderbookInfo",
      type: {
        kind: "struct",
        fields: [
          {
            name: "admin",
            type: "publicKey",
          },
          {
            name: "length",
            type: "u32",
          },
          {
            name: "applesMint",
            type: "publicKey",
          },
          {
            name: "orangesMint",
            type: "publicKey",
          },
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "closed",
            type: "bool",
          },
          {
            name: "id",
            type: "publicKey",
          },
          {
            name: "mostRecentTrade",
            type: {
              option: {
                defined: "TradeRecord",
              },
            },
          },
        ],
      },
    },
    {
      name: "orderbookPage",
      type: {
        kind: "struct",
        fields: [
          {
            name: "list",
            type: {
              vec: {
                defined: "Order",
              },
            },
          },
          {
            name: "orderbookId",
            type: "publicKey",
          },
          {
            name: "idSet",
            type: "bool",
          },
        ],
      },
    },
    {
      name: "userAccount",
      type: {
        kind: "struct",
        fields: [
          {
            name: "orders",
            type: {
              vec: {
                defined: "OrderRecord",
              },
            },
          },
          {
            name: "user",
            type: "publicKey",
          },
        ],
      },
    },
  ],
  types: [
    {
      name: "Order",
      type: {
        kind: "struct",
        fields: [
          {
            name: "numApples",
            type: "u64",
          },
          {
            name: "offeringApples",
            type: "bool",
          },
          {
            name: "user",
            type: "publicKey",
          },
          {
            name: "numOranges",
            type: "u64",
          },
          {
            name: "memo",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "TradeRecord",
      type: {
        kind: "struct",
        fields: [
          {
            name: "numApples",
            type: "u64",
          },
          {
            name: "buyOrderForApples",
            type: "bool",
          },
          {
            name: "numOranges",
            type: "u64",
          },
          {
            name: "time",
            type: "i64",
          },
        ],
      },
    },
    {
      name: "OrderRecord",
      type: {
        kind: "struct",
        fields: [
          {
            name: "market",
            type: "publicKey",
          },
          {
            name: "numApples",
            type: "u64",
          },
          {
            name: "offeringApples",
            type: "bool",
          },
          {
            name: "numOranges",
            type: "u64",
          },
          {
            name: "memo",
            type: "u8",
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "IncorrectUser",
      msg: "Order has the wrong user",
    },
    {
      code: 6001,
      name: "SizeTooLarge",
      msg: "Size too large",
    },
    {
      code: 6002,
      name: "UserMissingOrder",
      msg: "User does not have a matching order",
    },
    {
      code: 6003,
      name: "OrderbookMissingOrder",
      msg: "Orderbook does not have a matching order",
    },
    {
      code: 6004,
      name: "LastPageEmpty",
      msg: "Last Page of orders should not be empty",
    },
    {
      code: 6005,
      name: "CantConvertOrder",
      msg: "Can't convert a offering_apples into a sell or vice versa",
    },
    {
      code: 6006,
      name: "OrderbookMismatch",
      msg: "Orberbook name does not match Order",
    },
    {
      code: 6007,
      name: "OrderTooSmall",
      msg: "Order too small",
    },
    {
      code: 6008,
      name: "WrongOrder",
      msg: "Orders need to match",
    },
    {
      code: 6009,
      name: "WrongVault",
      msg: "Vaults dont match",
    },
    {
      code: 6010,
      name: "WrongRemainingAccount",
      msg: "Wrong Account Passed to Remaining Accounts.",
    },
    {
      code: 6011,
      name: "MissingLastPage",
      msg: "Last Page not passed",
    },
    {
      code: 6012,
      name: "OrderbookClosed",
      msg: "Orderbook Closed",
    },
    {
      code: 6013,
      name: "OrderbookNameAlreadySet",
      msg: "Orderbook page orderbook name already set",
    },
    {
      code: 6014,
      name: "MaxOrdersPlaced",
      msg: "User already placed the maximum number of orders!",
    },
    {
      code: 6015,
      name: "PageFull",
      msg: "Order page is full",
    },
  ],
}
