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

type WalletIds = {
  [key: string]: string[]
}

// TODO: set env to 'test' or 'prod'
const bg = new BitGo({ env: 'test' });
// TODO: set your access token here
const accessToken = '';
// // TODO: set your coin type and wallet ids here e.g.
const walletIds: WalletIds = {
  // tbtc: ['61f039aad587c2000745c687373e0111', '6225b081cd291300071fed36b1362222'],
  // gteth: ['61fb21819c54dd000755f8de3a18e333'],
};

async function main() {
  bg.authenticateWithAccessToken({ accessToken });

  // get the encrypted user privKey for each walletId and store in the JSON output
  const output: Output = {};
  for (const [coinName, ids] of Object.entries(walletIds)) {
    const coin = bg.coin(coinName);
    for (const id of ids) {
      const wallet = await coin.wallets().get({ id });
      const userKeyId = wallet.keyIds()[0];
      const keychain = await coin.keychains().get({ id: userKeyId });
      if (keychain.encryptedPrv === undefined) {
        console.warn(`could not find a ${coinName} encrypted user private key for wallet id ${id}, skipping`);
        continue;
      }
      output[id] = keychain.encryptedPrv;
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
}

main().catch((e) => console.error(e));
