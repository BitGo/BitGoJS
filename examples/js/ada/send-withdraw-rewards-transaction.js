/**
 * Send an unstaking transaction from a multi-sig wallet at BitGo.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */
const BitGoAPI = require('@bitgo/sdk-api');
const Tada = require('@bitgo/sdk-coin-ada');
const coin = 'tada';
require('dotenv').config({ path: '../../.env' });

// TODO: set your access token here
const accessToken = process.env.ACCESS_TOKEN;
const walletId = '6391f932dc4b550007a7efbf98d23f95';

// TODO: set your passphrase here
const walletPassphrase = null;

const bitgo = new BitGoAPI.BitGoAPI({
  accessToken: accessToken,
  env: 'test',
});

bitgo.register(coin, Tada.createInstance);

async function main() {
  // generating address w/ same staking key and same payment key
  await bitgo.unlock({ otp: '000000', duration: 3600 });
  const walletInstance = await bitgo.coin(coin).wallets().get({ id: walletId });

  const whitelistedParams = {
    intent: {
      intentType: 'claim',
      stakingRequestId: '7265fe1ec9c304ad79f0-0000',
    },
    apiVersion: 'lite',
    preview: undefined,
  };
  // build tx
  const unsignedTx = await bitgo
    .post(bitgo.url('/wallet/' + walletId + '/txrequests', 2))
    .send(whitelistedParams)
    .result();

  // sign tx
  const keychains = await bitgo.coin(coin).keychains().getKeysForSigning({ wallet: walletInstance });
  // keychains[0] here refers to the root address
  const signedStakingTransaction = await walletInstance.signTransaction({
    txPrebuild: unsignedTx,
    keychain: keychains[0],
    walletPassphrase: walletPassphrase,
    pubs: keychains.map((k) => k.pub),
    reqId: unsignedTx.txRequestId,
  });

  // submit tx
  const submittedTx = await bitgo
    .post(bitgo.coin(coin).url('/wallet/' + walletId + '/tx/send'))
    .send({ txRequestId: signedStakingTransaction.txRequestId })
    .result();

  console.log('New Transaction:', JSON.stringify(submittedTx, null, 4));
}

main().catch((e) => console.error(e));
