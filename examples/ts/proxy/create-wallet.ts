import { BitGoAPI } from '@bitgo/sdk-api';
import { Tpolygon } from '@bitgo/sdk-coin-polygon'; // Replace with your given coin (e.g. Ltc, Tltc)

// This script emulates a front-end using the BitGo SDK.
// Set up the BitGo connection object.
const bitgo = new BitGoAPI({
  // This value is ignored in favor of your real developer token, stored in your backend proxy machine.
  accessToken: 'unusedValue',
  // Set as prod/test as needed for whatever BitGo environment you want to use.
  // This *must* match the BitGo platform API your proxy instance is using.
  env: 'test',
  // In your real setup this would be <your.custom.backend.urlroot>, where you host the proxy instance.
  customRootURI: 'localhost:3000',
});
const coin = 'tpolygon';
bitgo.register(coin, Tpolygon.createInstance);

async function createTSSWalletSimple() {
  const newWallet = await bitgo
    .coin(coin)
    .wallets()
    .generateWallet({
      label: 'hot multisig wallet ' + Math.floor(Date.now() / 1000),
      // TODO: your wallet password
      passphrase: 'VerySecurePassword1234',
      // TODO: your enterprise ID
      enterprise: 'yourEnterpriseId',
      multisigType: 'tss',
      walletVersion: 3,
    });
  console.log(JSON.stringify(newWallet, undefined, 2));
}

async function main() {
  await createTSSWalletSimple();
}

main();
