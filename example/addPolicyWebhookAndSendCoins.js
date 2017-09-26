//
// Adds a policy webhook rule onto an existing wallet and then attempts to send out funds from the wallet, causing the webhook to fire.
// If the webhook URL returns a 200 status, the transaction is sent; otherwise it is denied.
// After the transaction is sent, the policy rule is removed
//
// Hint: Use ngrok and a simple http server to respond to the webhook and see what it sends
//
// Defaults to work on BitGo test environment at https://test.bitgo.com
//
// Copyright 2015, BitGo, Inc.  All Rights Reserved.
//

const BitGoJS = require('../src/index.js');

if (process.argv.length < 9) {
  console.log('usage:\n\t' + process.argv[0] + ' ' + process.argv[1] +
    ' <user> <pass> <otp> <walletId> <url> <walletPassphrase> <destinationAddress> <amountSatoshis>');

  console.log('user: user email (on test.bitgo.com)');
  console.log('pass: password');
  console.log('otp: one-time password, 0000000 on test');
  console.log('walletId: wallet ID (first address on the wallet)');
  console.log('url: webhook url (the url for the webhook policy)');
  console.log('walletPassphrase: passphrase to decrypt the user key');
  console.log('destinationAddress: the bitcoin address to send coins to');
  console.log('amountSatoshis: number of satoshis to send');
  process.exit(-1);
}

const user = process.argv[2];
const password = process.argv[3];
const otp = process.argv[4];
const walletId = process.argv[5];
const url = process.argv[6];
const walletPassphrase = process.argv[7];
const destinationAddress = process.argv[8];
const amountSatoshis = parseInt(process.argv[9], 10);

const bitgo = new BitGoJS.BitGo();

const setUpPolicyAndSendBitcoin = function() {
  console.log('Getting wallet..');
  // Now get the wallet
  bitgo.wallets().get({ id: walletId }, function(err, wallet) {
    if (err) { console.log('Error getting wallet!'); console.dir(err); return process.exit(-1); }
    console.log('Balance is: ' + (wallet.balance() / 1e8).toFixed(4));
    // Sets the policy
    const rule = {
      id: 'webhookRule1',
      type: 'webhook',
      action: { type: 'deny' },
      condition: { url: url }
    };
    console.dir(rule);
    console.log('Setting webhook policy rule.. ');
    wallet.setPolicyRule(rule, function callback(err, walletAfterPolicyChange) {
      if (err) { throw err; }
      console.log('New policy: ');
      console.dir(walletAfterPolicyChange.admin.policy);
      wallet.sendCoins({ address: destinationAddress, amount: amountSatoshis, walletPassphrase: walletPassphrase },
        function(err, result) {
        // removing the rule
          wallet.removePolicyRule({ id: 'webhookRule1' }, function(err, res) { console.log('Removed policy rule'); });
          if (err) { console.log('Error sending coins!'); console.dir(err); }
          if (result) {
            console.dir(result);
          }
        });
    });
  });
};

// Authenticate first
bitgo.authenticate({ username: user, password: password, otp: otp }, function(err, result) {
  if (err) { console.dir(err); throw new Error('Could not authenticate!'); }
  console.log('Unlocking account..' );
  bitgo.unlock({ otp: otp }, function(err) {
    if (err) { console.dir(err); throw new Error('Could not unlock!'); }
    setUpPolicyAndSendBitcoin();
  });
});
