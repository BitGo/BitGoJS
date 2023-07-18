This directory contains a very simple example proxy setup that allows developers to use local BitGo SDK methods with a non-BitGo back-end.
This is in contrast to the [BitGo Express module](https://github.com/BitGo/BitGoJS/tree/master/modules/express) which implements the SDK on the server that you host in order to provide specific SDK logic before proxying requests to BitGo APIs for your convenience.
Please take the time to review your use case as you choose between these options.

## Setup + Usage

- Acquire a test environment account, enterprise and access token
- Fill in the `TODO` sections with the relevant credentials
- `npm install`
- `ts-node server.ts`
- In a separate shell: `ts-node create-wallet.ts`
