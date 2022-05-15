# Setup

Generate a local keypair in ./dev-wallet.json. This file will get git ignored.

Use yarn not npm

# Testing

If you run the syrup-internals test you need to set the orderbook-page-small-size flag.
anchor test -- --features orderbook-page-small-size

# History

The orderbook implementation is based on web3-append-only-list which was written by Ellie High.
