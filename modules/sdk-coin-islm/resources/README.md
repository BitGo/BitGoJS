# Resources

This directory contains external logic required to handle signing/validation/address derivation for
a specific coin.

Typically, this manifests as a smaller snippet of code from a larger codebase, of which, this
library only requires a small portion of.

---

## ISLM Resources

Haqq Network (Islamic Coin) doesn't utilize the cosmos default `secp256k1` PubKey type & utilizes as different PubKey type `ethSecp256k1` exposed by ethermint. The protobuf files for `ethSecp256k1` are defined here : https://github.com/evmos/ethermint/blob/main/proto/ethermint/crypto/v1/ethsecp256k1/keys.proto

This directory contains the generated TypeScript types required, and also contains the `.proto` files used to generate them.
