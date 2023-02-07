const BitGoJS = require('bitgo');
const { EcdsaEVMUnifiedWallets } = require('./dist/src');
const { Eth } = require('@bitgo/sdk-coin-eth');

const bitgo = new BitGoJS.BitGo({
  env: 'test',
});

const accessToken = 'v2xc934562f740b2015eaa50ede7f1eced7979775c62a86323024e0ad65210beb25'; // app-test bitgo
const label = 'TSS eth  message signing prod';
const passphrase = 'yFf@8nuY0qLJ2cAetH#%^UhOLog!0';
const walletVersion = 3;
const enterprise = '614a226f3da19200071b3d6a0180e87e'; // app-test bitgo enterprise
const passcodeEncryptionCode = passphrase;
const coin = 'eth';
const id = '6377c74be64f39000730e8a8e0ce812b';

async function createWallet() {
  bitgo.authenticateWithAccessToken({ accessToken });
  // bitgo.safeRegister('eth', Eth.createInstance);

  const params = {
    label: 'test123',
    multisigType: 'tss',
    walletVersion: 3,
    passphrase,
    enterprise,
  };

  const coinname = 'gteth';
  const wallets = new EcdsaEVMUnifiedWallets(bitgo, coinname);
  const result = await wallets.generateUnifiedWallet(params, [coinname, 'tpolygon']);
  console.log(result);
}

createWallet();
