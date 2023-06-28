const BitGoJS = require('bitgo');
const bitgo = new BitGoJS.BitGo({ env: 'test' });
const Promise = require('bluebird');
const coin = 'tada';
const basecoin = bitgo.coin(coin);

// TODO: set your access token here
const accessToken = '';
const walletId = '649b57342f95fd00075b0ab393822a33';

// TODO: set your passphrase here
const walletPassphrase = null;

// TODO: set pledging inputs
const pledgingRawTxHex = '';
const pledgingNodePubKey = '';
const pledgingNodeKeySignature = '';

Promise.coroutine(function *() {
    // generating address w/ same staking key and same payment key
    bitgo.authenticateWithAccessToken({ accessToken: accessToken });
    yield bitgo.unlock({ otp: '000000', duration: 3600 });
    const walletInstance = yield basecoin.wallets().get({ id: walletId });

    const whitelistedParams = {
        intent: {
            intentType: 'pledge',
            rawTx: pledgingRawTxHex,
            nodePublicKey: pledgingNodePubKey,
            nodeKeySignature: pledgingNodeKeySignature,
        },
        apiVersion: 'lite',
        preview: undefined,
    };

    const unsignedTx = (yield bitgo
        .post(bitgo.url('/wallet/' + walletId + '/txrequests', 2))
        .send(whitelistedParams)
        .result());

    // sign tx
    const keychains = yield basecoin.keychains().getKeysForSigning({ wallet: walletInstance });
    const signedStakingTransaction = yield walletInstance.signTransaction({
        txPrebuild: unsignedTx,
        keychain: keychains[0],
        walletPassphrase: walletPassphrase,
        pubs: keychains.map((k) => k.pub),
        reqId: unsignedTx.txRequestId,
    });

    // submit tx
    const submittedTx = yield bitgo
        .post(basecoin.url('/wallet/' + walletId + '/tx/send'))
        .send({ txRequestId: signedStakingTransaction.txRequestId })
        .result();

    console.log('New Transaction:', JSON.stringify(submittedTx, null, 4));

})();
