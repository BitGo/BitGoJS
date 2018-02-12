//
// Advanced transaction with OP_RETURN output
// This transaction will send out an OP_RETURN message onto the blockchain
//
// Copyright 2015, BitGo, Inc.  All Rights Reserved.
//

const BitGoJS = require('../src/index.js');
const BitcoinJSLib = require('bitgo-bitcoinjs-lib');

if (process.argv.length < 8) {
  console.log('usage:\n\t' + process.argv[0] + ' ' + process.argv[1] +
  ' <user> <pass> <otp> <walletId> <walletPassphrase> <message>');

  console.log('user: user email (on test.bitgo.com)');
  console.log('pass: password');
  console.log('otp: one-time password, 0000000 on test');
  console.log('walletId: wallet ID (first address on the wallet)');
  console.log('walletPassphrase: passphrase to decrypt the user key');
  console.log('message: message to be sent into the blockchain');
  process.exit(-1);
}

const user = process.argv[2];
const password = process.argv[3];
const otp = process.argv[4];
const walletId = process.argv[5];
const walletPassphrase = process.argv[6];
const message = process.argv[7];

const bitgo = new BitGoJS.BitGo();

const sendBitcoin = function() {
  console.log('Getting wallet..');

  // Now get the wallet
  bitgo.wallets().get({ id: walletId }, function(err, wallet) {
    if (err) {
      console.log('Error getting wallet!');
      console.dir(err);
      return process.exit(-1);
    }
    console.log('Balance is: ' + (wallet.balance() / 1e8).toFixed(4));

    wallet.getEncryptedUserKeychain({}, function(err, keychain) {
      if (err) {
        console.log('Error getting encrypted keychain!');
        console.dir(err);
        return process.exit(-1);
      }
      console.log('Got encrypted user keychain');

      // Decrypt the user key with the passphrase
      keychain.xprv = bitgo.decrypt({ password: walletPassphrase, input: keychain.encryptedXprv });

      const data = new Buffer(message);
      const outputScript = BitcoinJSLib.script.nullDataOutput(data);

      // Set recipients
      const recipients = [];
      recipients.push({ script: outputScript, amount: 0.0001 * 1e8 });

      console.log('Creating transaction');
      wallet.createTransaction({
        recipients: recipients
      },
      function(err, transaction) {
        if (err) {
          console.log('Failed to create transaction!');
          console.dir(err);
          return process.exit(-1);
        }
        console.dir(transaction);
        console.log('Signing transaction');
        wallet.signTransaction({
          transactionHex: transaction.transactionHex,
          unspents: transaction.unspents,
          keychain: keychain
        },
        function(err, transaction) {
          if (err) {
            console.log('Failed to sign transaction!');
            console.dir(err);
            return process.exit(-1);
          }
          console.dir(transaction);
          console.log('Sending transaction');
          wallet.sendTransaction({ tx: transaction.tx }, function(err, callback) {
            if (err) {
              console.log('Failed to send transaction to BitGo!');
              console.dir(err);
              return process.exit(-1);
            }
            console.log('Transaction sent!');
            console.dir(callback);
          });
        });
      });
    });
  });
};

// Authenticate first
bitgo.authenticate({ username: user, password: password, otp: otp }, function(err, result) {
  if (err) {
    console.dir(err);
    throw new Error('Could not authenticate!');
  }

  console.log('Unlocking account..' );
  bitgo.unlock({ otp: otp }, function(err) {
    if (err) { console.dir(err); throw new Error('Could not unlock!'); }
    sendBitcoin();
  });
});
