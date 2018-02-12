//
// Send money from a wallet on BitGo
// This is the advanced example using createTransaction / sendTransaction,
// which allows you to specify fees and the keychain used for signing the transaction.
// Defaults to work on BitGo test environment at https://test.bitgo.com
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

const BitGoJS = require('../src/index.js');

if (process.argv.length < 9) {
  console.log('usage:\n\t' + process.argv[0] + ' ' + process.argv[1] +
    ' <user> <pass> <otp> <walletId> <walletPassphrase> <destinationAddress> <amountSatoshis> <fee>');

  console.log('user: user email (on test.bitgo.com)');
  console.log('pass: password');
  console.log('otp: one-time password, 0000000 on test');
  console.log('walletId: wallet ID (first address on the wallet)');
  console.log('walletPassphrase: passphrase to decrypt the user key');
  console.log('destinationAddress: the bitcoin address to send coins to');
  console.log('amountSatoshis: number of satoshis to send');
  console.log('fee: fee to send to Bitcoin network (default 0.0001)');
  process.exit(-1);
}

const user = process.argv[2];
const password = process.argv[3];
const otp = process.argv[4];
const walletId = process.argv[5];
const walletPassphrase = process.argv[6];
const destinationAddress = process.argv[7];
const amountSatoshis = parseInt(process.argv[8], 10);
let fee = undefined; // required by bitcoin network

if (process.argv.length > 9) {
  fee = parseInt(process.argv[9], 10);
}

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

    if ((amountSatoshis + fee) > wallet.balance()) {
      console.log('(' + amountSatoshis + '+' + fee + ') is > ' + wallet.balance());
      console.log('Not enough money in wallet to send transaction!');
      return process.exit(-1);
    }

    wallet.getEncryptedUserKeychain({}, function(err, keychain) {
      if (err) {
        console.log('Error getting encrypted keychain!');
        console.dir(err);
        return process.exit(-1);
      }
      console.log('Got encrypted user keychain');

      // Decrypt the user key with a passphrase
      keychain.xprv = bitgo.decrypt({ password: walletPassphrase, input: keychain.encryptedXprv });

      // Set recipients
      const recipients = {};
      recipients[destinationAddress] = amountSatoshis;

      console.dir(keychain);
      console.log('Creating transaction');
      wallet.createTransaction({
        recipients: recipients,
        fee: fee
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
            console.log('Transaction sent: ' + callback.tx);
          });
        });
      }
      );
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
