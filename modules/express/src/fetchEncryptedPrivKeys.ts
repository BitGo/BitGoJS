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
import { BitGo, EnvironmentName } from 'bitgo';
import 'dotenv/config';

type Output = {
  [key: string]: string;
};

type Credentials = {
  walletId: string; // Id of the BitGo wallet.
  walletPassword: string; // Password used for the wallet.
  secret: string; // xprv of user key or backup key.
};

type WalletIds = {
  [key: string]: (string | Credentials)[];
};

type WalletWithPrv = Array<{
  walletId: string;
  encryptedPrv: string;
}>;

const esAccessToken = process.env.BITGO_EXTERNAL_SIGNER_ACCESS_TOKEN;
const esWalletIDs = process.env.BITGO_EXTERNAL_SIGNER_WALLET_IDS; // example: {"tbtc":[{"walletId":"xxx","walletPassword":"xxx","secret":"xxx"}]}
const esWalletWithPrv = process.env.BITGO_EXTERNAL_SIGNER_WALLET_IDS_WITH_PRV; // example: [{"walletId":"xxx","encryptedPrv":"xxx"}]

// TODO: set env to 'test' or 'prod'
const bg = new BitGo({ env: (process.env.BITGO_EXTERNAL_SIGNER_ENV as EnvironmentName) ?? 'test' });

// TODO: set your access token here
const accessToken = esAccessToken || '';

// TODO: set your coin type and wallet ids here e.g.
const walletIds: WalletIds = esWalletIDs ? JSON.parse(esWalletIDs) : {};
// {
// tbtc: ['61f039aad587c2000745c687373e0111', '6225b081cd291300071fed36b1362222'],
// tbtc: [{
// walletId: '<WALLET_ID>',
// walletPassword: '<WALLET_PASSWORD>',
// secret: 'xprv...',
// }],
// gteth: ['61fb21819c54dd000755f8de3a18e333'],
// };

// TODO: set walletId and encryptedPrv here e.g.
const walletWithPrv: WalletWithPrv = esWalletWithPrv ? JSON.parse(esWalletWithPrv) : [];
// [
//   {
//     walletId: '<WALLET_ID>',
//     encryptedPrv: '<ENCRYPTED_PRV>',
//   },
// ];

export async function fetchKeys(ids: WalletIds, token: string, accessToken?: string): Promise<Record<string, string>> {
  bg.authenticateWithAccessToken({ accessToken: token });

  // get the encrypted user privKey for each walletId and store in the JSON output
  const output: Output = {};
  for (const [coinName, credentials] of Object.entries(ids)) {
    const coin = bg.coin(coinName);
    for (const credential of credentials) {
      const id = typeof credential === 'string' ? credential : credential.walletId;
      const wallet = await coin.wallets().get({ id });
      const userKeyId = wallet.keyIds()[0];
      const keychain = await coin.keychains().get({ id: userKeyId });

      if (keychain.encryptedPrv === undefined) {
        if (typeof credential === 'object') {
          const encryptedPrv = bg.encrypt({ password: credential.walletPassword, input: credential.secret });
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

  for (const { walletId, encryptedPrv } of walletWithPrv) {
    output[walletId] = encryptedPrv;
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

fetchKeys(walletIds, accessToken).catch((e) => console.error(e));
