/**
 * Recover XRP from a multi-sig wallet at BitGo.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api';
import { Tbtc } from '@bitgo/sdk-coin-btc';
import { AbstractUtxoCoin } from 'modules/abstract-utxo/src';
require('dotenv').config({ path: '../../.env' });

const userKey =
  'xpub661MyMwAqRbcGrW3eUjPwi8mmUXMKWqBkpUa5apWUmUzHkk9edLtUeVQdSJaDWD4z1JNU3bcYXu8eX2fcNWePBRErj9PLxwgDQdj8eUheGM';
const backupKey =
  'xpub661MyMwAqRbcFjX4gZgz65Cx2dwPHe5r8MPuoYuMq8uUsYFbDdLo7yqCtEVTnc8EPC8Vh73eBxc3Zk6cgx7dtXUE4YV2VwgEHomnfzMbroN';
const bitgoKey =
  'xpub661MyMwAqRbcEZR3eGcQDnP4yGHj3CvcQ489u76dgFVeTBwTA2MA9TwHRqhZoC6xMPa3AcuXkedQ8pwsU8YYEC7bSFTGs662C2BuyqMXkZ3';
const walletPassphrase = 'super-secret1234';
const scan = 20;
const walletContractAddress = 'tb1qprdy6jwxrrr2qrwgd2tzl8z99hqp29jn6f3sguxulqm448myj6jsy2nwsu';
const walletId = '68598f7d2c17a6e83f5e071784ef1c61';
const recoveryDestination = 'tb1qyysdeaf7v2jve8fcgwvn4g3930g5l0u3rf82fn608tyypaqhqfus69966z';
const apiKey = 'REPLACE WITH BLOCKCHAINER API KEY';

const userPrv =
  '{"iv":"iybvWuR394wQUXUuDO5Tew==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"Jw7MQaJkrgs=","ct":"dapKwHuSffoGFAO28lznPD1VyzkMrwbvWJv3XRd9xUm5W0Aknwk/6ZBj3LhGIiVRtw4wAf5iTUZnRsEn0y6S+4iuVBtuoQcXvq0joyGUDuApBppzQfjFQt7iKtajD1B3JI72kHrfMKiMPQnvj0a8ecBt2GQd+0U="}';
const backupPrv =
  '{"iv":"ynWOqwuZAGxYeZjPxzzOlg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"Jw7MQaJkrgs=","ct":"HtY/OClF/VHbAeo5NQWG02CNsIipfWSvjlGjZx3wdmbdZWmzPdRXkg7OWL0Bj5Gf7RS3a39t9bpHtwssS5F8FY9bkKTOt8kfSv4B19EIlG9+Okp68x13cX37kCaZaH7lM7QHoXJR1D5eacj8uMbVWc2QYZCaPmo="}';

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test',
});
const coin = 'tbtc';
bitgo.register(coin, Tbtc.createInstance);

const baseCoin = bitgo.coin(coin) as AbstractUtxoCoin;

async function main() {
  const unsignedTx = await baseCoin.recover({
    userKey,
    backupKey,
    bitgoKey,
    apiKey,
    recoveryDestination,
    ignoreAddressTypes: [],
    walletPassphrase,
    scan,
  });

  console.log(JSON.stringify(unsignedTx, null, 4));

  const txHex = 'txHex' in unsignedTx ? unsignedTx.txHex : '';
  const txInfo = 'txInfo' in unsignedTx ? unsignedTx.txInfo : undefined;

  // THIS ONE FAILS but not tested since I added the walletId field because
  // when I tried to test, I got the "too many api calls" and we requested a new key.
  const halfSignedTx = await baseCoin.signTransaction({
    isLastSignature: false,
    txPrebuild: {
      txHex,
      txInfo,
      walletId,
    },
    allowNonSegwitSigningWithoutPrevTx: true,
    pubs: [userKey, backupKey, bitgoKey],
    prv: bitgo.decrypt({ input: userPrv, password: walletPassphrase }),
  });

  console.log(JSON.stringify(halfSignedTx, null, 4));

  // You could ignore this part, first trying to figure it out a correct "halfSignedTx" output
  // This is totally untested, never reached this point.
  const fullSignedTx = await baseCoin.signTransaction({
    isLastSignature: true,
    txPrebuild: {
      txHex,
      txInfo,
    },
    pubs: [userKey, backupKey, bitgoKey],
    prv: bitgo.decrypt({ input: backupPrv, password: walletPassphrase }),
  });

  console.log(JSON.stringify(fullSignedTx, null, 4));
}

main().catch((e) => console.error(e));
