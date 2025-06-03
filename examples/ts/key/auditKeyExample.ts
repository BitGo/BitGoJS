import { BitGoAPI } from '@bitgo/sdk-api';
import { Tltc } from '@bitgo/sdk-coin-ltc';
import * as sjcl from '@bitgo/sjcl';
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test',
});

const coin = 'tltc';
bitgo.register(coin, Tltc.createInstance);

async function main() {
  // 1. Generate a key pair for the coin
  const baseCoin = bitgo.coin(coin);
  const keyPair = baseCoin.generateKeyPair();
  const walletPassphrase = 'myStrongPassphrase';
  const encryptedPrv = sjcl.encrypt(walletPassphrase, keyPair.prv);

  // 2. Call the function with valid arguments so that the function validates the created key
  try {
    baseCoin.assertIsValidKey({
      encryptedPrv,
      walletPassphrase,
      publicKey: keyPair.pub,
    });
    console.log('Key validated successfully with correct passphrase and encryptedPrv.');
  } catch (e) {
    console.error('Unexpected error occurred', e);
  }

  // 3. Call the function with the incorrect passphrase, console log the captured error and explain it's the wrong password
  try {
    baseCoin.assertIsValidKey({
      encryptedPrv,
      walletPassphrase: 'wrongPassphrase',
      publicKey: keyPair.pub,
    });
  } catch (e) {
    console.log('Error with wrong passphrase:', e.message);
    console.log('This error is expected because the passphrase is incorrect.');
  }

  // 4. Call the function with a modified encryptedPrv, console log the captured error and explain that the prv is wrong
  try {
    const tamperedEncryptedPrv = encryptedPrv.slice(0, -1) + (encryptedPrv.slice(-1) === 'a' ? 'b' : 'a');
    baseCoin.assertIsValidKey({
      encryptedPrv: tamperedEncryptedPrv,
      walletPassphrase,
      publicKey: keyPair.pub,
    });
  } catch (e) {
    console.log('Error with tampered encryptedPrv:', e.message);
    console.log('This error is expected because the encrypted private key was modified and cannot be decrypted.');
  }

  // 5. Call the function with a mismatched public key, console log the captured error and explain the result
  try {
    // Generate a new key pair to get a different public key
    const anotherKeyPair = baseCoin.generateKeyPair();
    baseCoin.assertIsValidKey({
      encryptedPrv,
      walletPassphrase,
      publicKey: anotherKeyPair.pub, // mismatched public key
    });
  } catch (e) {
    console.log('Error with mismatched public key:', e.message);
    console.log('This error is expected because the public key does not match the decrypted private key.');
  }
}

main().catch((e) => console.error(e));
