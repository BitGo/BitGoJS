/**
 * Send a transaction from a multi-sig wallet at BitGo.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */
const BitGoJS = require('bitgo');
const bitgo = new BitGoJS.BitGo({ env: 'staging' });
const Promise = require('bluebird');

const coin = 'hteth';
const basecoin = bitgo.coin(coin);
// TODO: set your access token here
const accessToken = null;
const walletId = null;
// TODO: set your passphrase here
const walletPassphrase = '';

Promise.coroutine(function* () {
    bitgo.authenticateWithAccessToken({ accessToken: accessToken });

    const walletInstance = yield basecoin.wallets().get({ id: walletId });

    const messageRaw = 'Shamir has too many secrets';
    const messageEncoded = `\u0019Ethereum Signed Message:\n${messageRaw.length}${messageRaw}`;

    const messageTxn = yield walletInstance.signMessage({
        message: {
            messageRaw,
            messageEncoded,
        },
        walletPassphrase,
    })

    console.log(messageTxn);

})();
