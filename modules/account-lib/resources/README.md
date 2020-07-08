# Resources
This directory contains external logic required to handle signing/validation/address derivation for
a specific coin.

Typically, this manifests as a smaller snippet of code from a larger codebase, of which, this
library only requires a small portion of.

---

## TRX Resources
Tron uses [protocol buffers (protobufs)](https://developers.google.com/protocol-buffers). Instead of
pulling a bunch of non-relevant Tron full node code into this library as a dependency, we grab
exactly what we need and add it in `resources/trx/`.

### Generating protobufs for Tron

To generate static code from the proto files, run:

```bash
npm run gen-protobuf
```

To generate the respective TypeScript definitions:

```bash
npm run gen-protobufts
```

## XTZ Resources
Tezos multisig wallets are supported through smart contracts.

Official repositories:
* Generic multisig contract: https://github.com/murbard/smart-contracts/blob/master/multisig/michelson/generic.tz
