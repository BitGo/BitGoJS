const BitGoJS = require('bitgo');
const bitgo = new BitGoJS.BitGo({ env: 'test' });
const coin = 'tsui';
const basecoin = bitgo.coin(coin);

// TODO: set your access token here
const walletId = '<wallet-id>';
const accessToken = '<access-token>';

// TODO: set your passphrase here
const walletPassphrase = '<wallet-passphrase>';

// TODO: set tx hex here
const base64TxHex = '<base64-tx-hex>';

async function submitCustomTx() {
  // (Optional) unlock if needed
  bitgo.authenticateWithAccessToken({ accessToken: accessToken });
  await bitgo.unlock({ otp: '000000', duration: 3600 });
  const walletInstance = await basecoin.wallets().get({ id: walletId });

  console.log('Wallet ID:', walletInstance.id());

  const whitelistedParams = {
    intent: {
      intentType: 'customTx',
      rawTx: base64TxHex,
    },
    apiVersion: 'full', // TODO: change to 'lite' for hot wallet
  };

  const unsignedTx = await bitgo
    .post(bitgo.url('/wallet/' + walletId + '/txrequests', 2))
    .send(whitelistedParams)
    .result();

  console.log('Unsigned Transaction:', JSON.stringify(unsignedTx, null, 4));

  // TODO: uncomment below for hot wallet only
  // sign tx
  // const keychains = await basecoin.keychains().getKeysForSigning({ wallet: walletInstance });
  // const signedTx = await walletInstance.signTransaction({
  //   txPrebuild: unsignedTx,
  //   keychain: keychains[0],
  //   pubs: keychains.map((k) => k.pub),
  //   reqId: unsignedTx.txRequestId,
  //   walletPassphrase: walletPassphrase,
  // });

  // submit tx
  // const submittedTx = await bitgo
  //   .post(basecoin.url('/wallet/' + walletId + '/tx/send'))
  //   .send({ txRequestId: signedTx.txRequestId })
  //   .result();

  // console.log('Submitted transaction:', JSON.stringify(submittedTx, null, 4));
}

submitCustomTx().catch((e) => console.error(e));
