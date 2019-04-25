//
// Shows how, given the transactionHex, unspents and walletId, you can sign a transaction offline
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

const BitGoJS = require('../src/index.js');

const bitgo = new BitGoJS.BitGo();

const keychain = {
  xpub: 'xpub661MyMwAqRbcGQkZBL7SGgB4hALrcGYFBRut7VJzU6tkHtLZGrm866yqZ8dwwsFSAo7RpJwTWeaGx2G7zvhWUYtFkHq3wC3wEHRdYYESsxs',
  path: 'm',
  xprv: 'xprv9s21ZrQH143K3vg65JaRuYEL98WNCopPpCzHK6uNumMmR61QjKSsYJfMhsKGppDNFg1uALgS5gvSSQ8kAgnw3Td7iG9KaTsKmncVk3axJ33'
};

const unsignedTxData = {
  transactionHex: '0100000001cf34c73f607df4b80eb59a0d0158f80b4fa128552240e692cb6a4ecaac3632ad0100000017a9147f45dbb73897981d81fd8db8f4ef51ee341bbb4687ffffffff0240420f000000000017a914aceb37b3591d622cf34c7ffcba6385a1b36e344d87305bc2110000000017a9145b5fadfc6fb421709fed5f3c20beebc19cf5cd3d8700000000',
  unspents:
  [{ chainPath: '/1/3',
    redeemScript: '52210207c07603aa847a6e40537e2cb4e2cc6b656f058a213df0be11f3e3563cacefc0210380b77331da0c1f3528ead39c321d29e46d7704b692fd1290f9fcf2aad4225acc2102a8e8b5d8d34cb1667339d5febfa6774b8a258cafcf7031e83b37aae65e227f3353ae' }],
  fee: 10000,
  xpub: 'xpub661MyMwAqRbcGQkZBL7SGgB4hALrcGYFBRut7VJzU6tkHtLZGrm866yqZ8dwwsFSAo7RpJwTWeaGx2G7zvhWUYtFkHq3wC3wEHRdYYESsxs'
};

// Authenticate first
const wallet = bitgo.newWalletObject({ wallet: { id: '2MueBjgktHet8p9r3Q6Bqox18FNBVWpkxG7' } });
wallet.signTransaction({ transactionHex: unsignedTxData.transactionHex, unspents: unsignedTxData.unspents, keychain: keychain }, function(err, result) {
  console.dir(result);
});
