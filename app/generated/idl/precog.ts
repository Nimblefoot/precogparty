export type Precog = {
  "version": "0.1.0",
  "name": "precog",
  "instructions": [
    {
      "name": "createMarket",
      "accounts": [
        {
          "name": "marketAuthority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "marketAccount",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "market_account"
              },
              {
                "kind": "arg",
                "type": "string",
                "path": "market_name"
              }
            ]
          }
        },
        {
          "name": "yesMint",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "yes_mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "PredictionMarket",
                "path": "market_account"
              }
            ]
          }
        },
        {
          "name": "noMint",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "no_mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "PredictionMarket",
                "path": "market_account"
              }
            ]
          }
        },
        {
          "name": "collateralVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collateralMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "resolutionAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "descriptionAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "marketName",
          "type": "string"
        },
        {
          "name": "marketDescription",
          "type": "string"
        }
      ]
    },
    {
      "name": "mintContingentSet",
      "accounts": [
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "marketAccount",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "market_account"
              },
              {
                "kind": "account",
                "type": "string",
                "account": "PredictionMarket",
                "path": "market_account.name"
              }
            ]
          }
        },
        {
          "name": "yesMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "noMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collateralVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userYes",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userNo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userCollateral",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "mergeContingentSet",
      "accounts": [
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "marketAccount",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "market_account"
              },
              {
                "kind": "account",
                "type": "string",
                "account": "PredictionMarket",
                "path": "market_account.name"
              }
            ]
          }
        },
        {
          "name": "yesMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "noMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collateralVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userYes",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userNo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userCollateral",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "redeemContingentCoin",
      "accounts": [
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "marketAccount",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "market_account"
              },
              {
                "kind": "account",
                "type": "string",
                "account": "PredictionMarket",
                "path": "market_account.name"
              }
            ]
          }
        },
        {
          "name": "contingentCoinMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collateralVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userContingentCoin",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userCollateral",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "resolveMarket",
      "accounts": [
        {
          "name": "resolutionAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "marketAccount",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "market_account"
              },
              {
                "kind": "account",
                "type": "string",
                "account": "PredictionMarket",
                "path": "market_account.name"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "resolution",
          "type": "u8"
        }
      ]
    },
    {
      "name": "updateMarketDescription",
      "accounts": [
        {
          "name": "descriptionAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "marketAccount",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "market_account"
              },
              {
                "kind": "account",
                "type": "string",
                "account": "PredictionMarket",
                "path": "market_account.name"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "marketDescription",
          "type": "string"
        }
      ]
    },
    {
      "name": "initMarketList",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "list",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "list"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "listMarket",
      "accounts": [
        {
          "name": "list",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "list"
              }
            ]
          }
        },
        {
          "name": "market",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "predictionMarket",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "yesMint",
            "type": "publicKey"
          },
          {
            "name": "noMint",
            "type": "publicKey"
          },
          {
            "name": "collateralVault",
            "type": "publicKey"
          },
          {
            "name": "marketAuthority",
            "type": "publicKey"
          },
          {
            "name": "resolutionAuthority",
            "type": "publicKey"
          },
          {
            "name": "descriptionAuthority",
            "type": "publicKey"
          },
          {
            "name": "resolution",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "marketList",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "markets",
            "type": {
              "vec": "publicKey"
            }
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "LowCollateral",
      "msg": "Insufficient COLLATERAL"
    },
    {
      "code": 6001,
      "name": "InvalidResolution",
      "msg": "Unrecognized resolution; 1 -> yes, 2 -> no"
    },
    {
      "code": 6002,
      "name": "ContingentMintNotRecognized",
      "msg": "Contingent coin mint supplied is not equal to the market's yes_mint or no_mint"
    },
    {
      "code": 6003,
      "name": "MarketNotResolved",
      "msg": "Market is not resolved"
    },
    {
      "code": 6004,
      "name": "ContingencyNotMet",
      "msg": "The outcome associated with the coin is not the resolution"
    }
  ]
};

export const IDL: Precog = {
  "version": "0.1.0",
  "name": "precog",
  "instructions": [
    {
      "name": "createMarket",
      "accounts": [
        {
          "name": "marketAuthority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "marketAccount",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "market_account"
              },
              {
                "kind": "arg",
                "type": "string",
                "path": "market_name"
              }
            ]
          }
        },
        {
          "name": "yesMint",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "yes_mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "PredictionMarket",
                "path": "market_account"
              }
            ]
          }
        },
        {
          "name": "noMint",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "no_mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "PredictionMarket",
                "path": "market_account"
              }
            ]
          }
        },
        {
          "name": "collateralVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collateralMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "resolutionAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "descriptionAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "marketName",
          "type": "string"
        },
        {
          "name": "marketDescription",
          "type": "string"
        }
      ]
    },
    {
      "name": "mintContingentSet",
      "accounts": [
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "marketAccount",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "market_account"
              },
              {
                "kind": "account",
                "type": "string",
                "account": "PredictionMarket",
                "path": "market_account.name"
              }
            ]
          }
        },
        {
          "name": "yesMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "noMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collateralVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userYes",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userNo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userCollateral",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "mergeContingentSet",
      "accounts": [
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "marketAccount",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "market_account"
              },
              {
                "kind": "account",
                "type": "string",
                "account": "PredictionMarket",
                "path": "market_account.name"
              }
            ]
          }
        },
        {
          "name": "yesMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "noMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collateralVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userYes",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userNo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userCollateral",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "redeemContingentCoin",
      "accounts": [
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "marketAccount",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "market_account"
              },
              {
                "kind": "account",
                "type": "string",
                "account": "PredictionMarket",
                "path": "market_account.name"
              }
            ]
          }
        },
        {
          "name": "contingentCoinMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collateralVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userContingentCoin",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userCollateral",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "resolveMarket",
      "accounts": [
        {
          "name": "resolutionAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "marketAccount",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "market_account"
              },
              {
                "kind": "account",
                "type": "string",
                "account": "PredictionMarket",
                "path": "market_account.name"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "resolution",
          "type": "u8"
        }
      ]
    },
    {
      "name": "updateMarketDescription",
      "accounts": [
        {
          "name": "descriptionAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "marketAccount",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "market_account"
              },
              {
                "kind": "account",
                "type": "string",
                "account": "PredictionMarket",
                "path": "market_account.name"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "marketDescription",
          "type": "string"
        }
      ]
    },
    {
      "name": "initMarketList",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "list",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "list"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "listMarket",
      "accounts": [
        {
          "name": "list",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "list"
              }
            ]
          }
        },
        {
          "name": "market",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "predictionMarket",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "yesMint",
            "type": "publicKey"
          },
          {
            "name": "noMint",
            "type": "publicKey"
          },
          {
            "name": "collateralVault",
            "type": "publicKey"
          },
          {
            "name": "marketAuthority",
            "type": "publicKey"
          },
          {
            "name": "resolutionAuthority",
            "type": "publicKey"
          },
          {
            "name": "descriptionAuthority",
            "type": "publicKey"
          },
          {
            "name": "resolution",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "marketList",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "markets",
            "type": {
              "vec": "publicKey"
            }
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "LowCollateral",
      "msg": "Insufficient COLLATERAL"
    },
    {
      "code": 6001,
      "name": "InvalidResolution",
      "msg": "Unrecognized resolution; 1 -> yes, 2 -> no"
    },
    {
      "code": 6002,
      "name": "ContingentMintNotRecognized",
      "msg": "Contingent coin mint supplied is not equal to the market's yes_mint or no_mint"
    },
    {
      "code": 6003,
      "name": "MarketNotResolved",
      "msg": "Market is not resolved"
    },
    {
      "code": 6004,
      "name": "ContingencyNotMet",
      "msg": "The outcome associated with the coin is not the resolution"
    }
  ]
};
