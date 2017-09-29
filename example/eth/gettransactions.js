//
// Sends an Ethereum transaction on BitGo
//
const BitGoJS = require('../../src/index.js');

if (process.argv.length < 5) {
  console.log('usage:\n\t' + process.argv[0] + ' ' + process.argv[1] + ' <user> <password> <walletId>');
  process.exit(-1);
}

const user = process.argv[2];
const password = process.argv[3];
const otp = '0000000';
const walletId = process.argv[4];
const _ = require('lodash');

const bitgo = new BitGoJS.BitGo();

const getTransactions = function() {
  console.log('Getting wallet..');

  // Now get the wallet
  bitgo.eth().wallets().get({ id: walletId }, function(err, wallet) {
    if (err) { console.log('Error getting wallet!'); console.dir(err); return process.exit(-1); }
    // console.dir(wallet.wallet);
    console.log('Balance is: ' + wallet.balance());
    console.log('Balance in ETH: ' + bitgo.eth().weiToEtherString(wallet.balance()));

    wallet.transactions({}, function(err, res) {
      // console.dir(res);
      const interestingFields = ['txHash', 'parentTxHash', 'from', 'to', 'value', 'blockHash', 'confirmations', 'type', 'receiveTime'];
      const prettyTxs = _.map(res.transactions, function(t) { return _.pick(t, interestingFields); });
      console.log('Count: ' + res.count);
      console.log('Start: ' + res.start);
      console.log('Limit: ' + res.limit);
      console.log('Transactions: ');

      console.dir(prettyTxs);
    });
  });
};

// Authenticate first
bitgo.authenticate({ username: user, password: password, otp: otp }, function(err, result) {
  if (err) { console.dir(err); throw new Error('Could not authenticate!'); }
  console.log('Authenticated.. ');
  getTransactions();
});
