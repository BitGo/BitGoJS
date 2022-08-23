/**
 * This tool will help you creates a private key JSON file to be used with the external singing mode feature.
 * It creates a JSON file containing a list of wallet IDs and their corresponding encrypted user private keys.
 *
 * To run this file, use the command:
 * `yarn ts-node <path/to/fetchEncryptedPrivKeys.ts>`
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */
import { writeFile } from 'fs';
import { BitGo } from 'bitgo';

type Output = {
  [key: string]: string
}

type Credentials = {
  id: string,
  secret: string,
  password: string,
}

type WalletIds = {
  [key: string]: (string | Credentials)[]
}

// TODO: set env to 'test' or 'prod'
const bg = new BitGo({ env: 'test' });

// TODO: set your access token here
// const accessToken = '';

// TODO: set your coin type and wallet ids here e.g.
// const walletIds: WalletIds = {
// tbtc: ['61f039aad587c2000745c687373e0111', '6225b081cd291300071fed36b1362222'],
// tbtc: [{
// id: '<WALLET_ID>',
// secret: 'xprv...',
// password: '<WALLET_PASSWORD>'
// }],
// gteth: ['61fb21819c54dd000755f8de3a18e333'],
// };

export async function fetchKeys(ids: WalletIds, token: string): Promise<Record<string, string>> {
  bg.authenticateWithAccessToken({ accessToken: token });

  // get the encrypted user privKey for each walletId and store in the JSON output
  const output: Output = {};
  for (const [coinName, credentials] of Object.entries(ids)) {
    const coin = bg.coin(coinName);
    for (const credential of credentials) {
      const id = typeof credential === 'string' ? credential : credential.id;
      const wallet = await coin.wallets().get({ id });
      const userKeyId = wallet.keyIds()[0];
      const keychain = await coin.keychains().get({ id: userKeyId });

      if (keychain.encryptedPrv === undefined) {
        if (typeof credential === 'object') {
          const encryptedPrv = bg.encrypt({ password: credential.password, input: credential.secret });
          output[id] = encryptedPrv;
        } else {
          console.warn(`could not find a ${coinName} encrypted user private key for wallet id ${id}, skipping`);
          continue;
        }
      } else {
        output[id] = keychain.encryptedPrv;
      }
    }
  }

  const data = JSON.stringify(output, null, '\t');
  const fileName = 'encryptedPrivKeys.json';
  writeFile(fileName, data, (err) => {
    if (err) {
      throw err;
    }
    console.log(`Wallet IDs and encrypted private keys saved to ${fileName}`);
  });

  return Promise.resolve(output);
}

// fetchKeys(walletIds, accessToken).catch((e) => console.error(e));
