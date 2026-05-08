import { BitGoAPI } from '@bitgo/sdk-api';
import { Tpolygon } from '@bitgo/sdk-coin-polygon'; // Replace with your given coin (e.g. Ltc, Tltc)
import { ProxyAgent } from 'proxy-agent';

// This script emulates a front-end using the BitGo SDK to BitGo backend via a proxy.
// Set up the BitGo connection object.
const bitgo = new BitGoAPI({
  // TODO: your developer access token to the BitGo platform API
  accessToken: 'your-token',
  // Set as prod/test as needed for whatever BitGo environment you want to use.
  // This *must* match the BitGo platform API your proxy instance is using.
  env: 'test',
  // TODO: In your real setup this would be <your.proxy.url>, where you host the proxy server.
  customProxyAgent: new ProxyAgent({
    getProxyForUrl: () => 'http://localhost:3000',
  }),
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
      enterprise: 'your-enterprise-id',
      multisigType: 'tss',
      walletVersion: 3,
    });
  console.log(JSON.stringify(newWallet, undefined, 2));
}

async function main() {
  await createTSSWalletSimple();
}

main();
