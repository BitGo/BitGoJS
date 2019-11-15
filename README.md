# BitGo Account Lib

Signing and transaction building logic for account-based coins.

## Supported coins

- Tron - trx/ttrx

## Usage

### Instantiation

To instantiate the builder, use the `getBuilder('ticker')` function:

```typescript
import * as accountLib from '@bitgo/account-lib';

const builder = accountLib.getBuilder('ttrx');
```

### Using the builder to sign an existent transaction

```typescript
import * as accountLib from '@bitgo/account-lib';

const unsignedBuildTransaction = {
  visible: false,
  txID: '80b8b9eaed51c8bba3b49f7f0e7cc5f21ac99a6f3e2893c663b544bf2c695b1d',
  raw_data: {
    contract: [ {
      parameter: {
        value: {
          amount: 1718,
          owner_address: '41c4530f6bfa902b7398ac773da56106a15af15f92',
          to_address: '4189ffaf9da8c6fae32189b2e6dce228249b1129aa'
        },
        type_url: 'type.googleapis.com/protocol.TransferContract'
      },
      type: 'TransferContract'
    } ],
    ref_block_bytes: '90e4',
    ref_block_hash: 'a018bf9892ddb138',
    expiration: 1571811468000,
    timestamp: 1571811410819
  },
  raw_data_hex: '0a0290e42208a018bf9892ddb13840e0c58ebadf2d5a66080112620a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412310a1541c4530f6bfa902b7398ac773da56106a15af15f9212154189ffaf9da8c6fae32189b2e6dce228249b1129aa18b60d7083878bbadf2d',
};

const builder = accountLib.getBuilder('ttrx');
builder.from(unsignedBuildTransaction);
builder.sign({ key: 'A81B2E0C55A7E2B2E837ZZC437A6397B316536196989A6F09EE49C19AD33590W' });
const tx = builder.build();
```

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
