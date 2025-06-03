/**
 * Create an on-prem wallet
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { Tbtc } from '@bitgo/sdk-coin-btc';
require('dotenv').config({ path: '../../.env' });

// Add your access token here
const accessToken = '';
const bitgo = new BitGoAPI({
  accessToken,
  env: 'test',
});

const coin = 'tbtc';
const passphrase = 'new on-prem wallet';
const enterprise = '66632c6b42b03d265a939048beaaee55';

bitgo.register(coin, Tbtc.createInstance);

async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  // 1. create the key materials
  const userKey = await bitgo.coin(coin).keychains().create();
  const backupKey = await bitgo.coin(coin).keychains().create();

  // 2. call external KMS encryption service
  // Update: this doesn't matter, keys are not gonna be stored on bitgo so we don't need to encrypt them.
  //const { userPrv, backupPrv } = encryptPrvKeysKMS({ userKey: userKey.prv, backupKey: backupKey.prv, passphrase });

  // 3. register the keys to get the mongo ids (pub key id)
  // Update: encryptedPrv is not needed anymore, we don't store the prv keys in BitGo
  const userKeychain = await bitgo.coin(coin).keychains().add({
    pub: userKey.pub,
    //encryptedPrv: userPrv,
    keyType: 'independent',
    source: 'user',
  });
  const backupKeychain = await bitgo.coin(coin).keychains().add({
    pub: backupKey.pub,
    // encryptedPrv: backupPrv,
    keyType: 'independent',
    source: 'backup',
  });

  const bitgoKeychain = await bitgo
    .coin(coin)
    .keychains()
    .createBitGo({ enterprise, reqId: undefined, isDistributedCustody: false });

  // 4. create the on prem wallet
  const walletData = {
    label: 'OnPrem wallet creation example',
    m: 2,
    n: 3,
    type: 'cold',
    subType: 'onPrem',
    enterprise,
    multisigType: 'onchain',
    // order doesn't matter as ids are unique
    keys: [userKeychain.id, backupKeychain.id, bitgoKeychain.id],
  };

  const onPremWalletNew = await bitgo.post(`${coin}/wallet/add`).send(walletData).result();

  console.log('OnPrem wallet data example: ', JSON.stringify(onPremWalletNew, null, 2));
}

// TODO: delete this
function encryptPrvKeysKMS({ userKey, backupKey, passphrase }) {
  // This function simulated the key encryption process with an external KMS service.
  // Since it's an example, we're gonna use the encrypt utility from the SDK.
  return {
    userPrv: bitgo.encrypt({ password: passphrase, input: userKey }),
    backupPrv: bitgo.encrypt({ password: passphrase, input: backupKey }),
  };
}

main();
