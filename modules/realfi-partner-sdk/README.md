# @bitgo/realfi-partner-sdk

BitGo fork of [`@realfi-co/realfi-partner-sdk`](https://github.com/realfi-co/realfi-partner-sdk) **v2.14.0**
(`latest` / `preview` dist-tag; commit `1a8d3c0605f383e1180f8405075c08e14689ac47`).

Used by Wallet Platform to build RealFi sUSDr Plutus order transactions on Cardano.
BitGoJS `sdk-coin-ada` only pledge-signs the resulting CBOR — it does not depend on this package.

`src/` is tracked; `dist/` is built locally / at publish (`yarn workspace @bitgo/realfi-partner-sdk build`).

See `UPSTREAM.md` for rebase notes. Ticket: SI-1292.
