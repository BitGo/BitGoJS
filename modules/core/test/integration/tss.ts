const BitGoJS = require('../../src/index');

describe('Test TSS', function () {
  const bitgo = new BitGoJS.BitGo({
    accessToken: 'v2xe4ed21bcaf02b1caaa0d3eb6dfa9c1e2e727ba8975a9bce6ae0566bde9d214a6',
    env: 'custom',
    customRootURI: 'https://testnet-01-app.bitgo-dev.com',
  });

  // const bitgo = new BitGoJS.BitGo({
  //   accessToken: 'v2xa422998f9adb3dbceb01703c691eb5ba10b5be66cdddb68b8fc55e29e0bc89b4',
  //   env: 'custom',
  //   customRootURI: 'https://testnet-06-app.bitgo-dev.com',
  // });

  xit('should generate key chains', async function () {
    const test = await bitgo.coin('tsol').wallets().generateTssKeyChains({
      label: 'testing tss',
      passphrase: 'Ghghjkg!455544llll'
    });

    console.log('keychains', JSON.stringify(test, undefined, 2));
  });
});
