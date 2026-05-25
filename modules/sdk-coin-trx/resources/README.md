# Resources

This directory contains external logic required to handle signing/validation/address derivation for
a specific coin.

Typically, this manifests as a smaller snippet of code from a larger codebase, of which, this
library only requires a small portion of.

---

## TRX Resources

Tron uses [protocol buffers (protobufs)](https://developers.google.com/protocol-buffers). Instead of
pulling a bunch of non-relevant Tron full node code into this library as a dependency, we grab
exactly what we need and add it in `resources/`.

### Generating protobufs for Tron

Static code for Tron protobufs is already included. Generating at build time can be problematic, until
[this issue](https://github.com/protobufjs/protobuf.js/issues/1477) is resolved. Should we ever need to
update the static code, the following commands can be run:

```bash
npm run gen-protobuf
```

To generate the respective TypeScript definitions:

```bash
npm run gen-protobufts
```
