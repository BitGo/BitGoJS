# BitGo sdk-unified-wallet

Install:

```
npm i @bitgo/sdk-unified-wallet @bitgo/sdk-api @bitgo/sdk-coin-eth @bitgo/sdk-coin-polygon
```

Example: Generate an EVM wallet

```
const { EcdsaEVMUnifiedWallets } = require('@bitgo/sdk-unified-wallet');
const { BitGoAPI } =  require('@bitgo/sdk-api');
const { Eth, Gteth } = require('@bitgo/sdk-coin-eth')
const { Polygon, Tpolygon } = require('@bitgo/sdk-coin-polygon')

const bitgo = new BitGoAPI({
    env: 'test',
  });

// bitgo.register('eth', Eth.createInstance);
bitgo.register('gteth', Gteth.createInstance);
// bitgo.register('polygon', Eth.createInstance);
bitgo.register('tpolygon', Tpolygon.createInstance);

const accessToken = '';
const passphrase = '';
const enterprise = '';
const label = '';

async function createWallet() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const params = {
    label,
    multisigType: 'tss',
    walletVersion: 3,
    passphrase,
    enterprise,
  };

  const wallets = new EcdsaEVMUnifiedWallets(bitgo);
  const result = await wallets.generateUnifiedWallet(params);
  console.log(result);
}

createWallet();

```
