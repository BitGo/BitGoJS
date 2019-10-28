# BitGo Account Lib

Signing and transaction building logic for account-based coins.

## Generating protobufs

To generate static code from the proto files, run:

```bash
cd resources/trx/protobuf/
node ../../../node_modules/protobufjs/cli/bin/pbjs -t static-module -w commonjs -o tron.js Discover.proto Contract.proto tron.proto
```

Then, to generate the respective TypeScript definitions:

```bash
node ../../../node_modules/protobufjs/cli/bin/pbts -o tron.d.ts tron.js
```
