//
// Sends an Ethereum transaction on BitGo
//
var BitGoJS = require('../../src/index.js');
var BN = require("ethereumjs-util").BN;

if (process.argv.length < 6) {
  console.log("usage:\n\t" + process.argv[0] + " " + process.argv[1] + " <user> <pass> <walletId> <toAddress> <valueWei>");
  process.exit(-1);
}

var user = process.argv[2];
var password = process.argv[3];
var walletId = process.argv[4];
var toAddress = process.argv[5];
var valueWei = process.argv[6];
// var valueWei = new BN(process.argv[6], 10).toString(10); // can't do floats!!!!
var otp = '0000000';

var bitgo = new BitGoJS.BitGo();

var sendTransaction = function() {
  console.log("Getting wallet..");

  // Now get the wallet
  bitgo.eth().wallets().get({id: walletId}, function(err, wallet) {
    if (err) { console.log("Error getting wallet!"); console.dir(err); return process.exit(-1); }
    console.log("Balance is: " + wallet.balance());
    console.log("Balance in ETH: " + bitgo.eth().weiToEtherString(wallet.balance()));

    wallet.sendTransaction(
      { recipients: [ { toAddress: toAddress, value: valueWei }], walletPassphrase: password },
      function(err, result) {
        if (err) { console.log("Error sending transaction!"); console.dir(err); return process.exit(-1); }

        console.dir(result);
        process.exit(0);
      }
    );
  });
};

// Authenticate first
bitgo.authenticate({ username: user, password: password, otp: otp }, function(err, result) {
  if (err) { console.dir(err); throw new Error("Could not authenticate!"); }
  console.log("Unlocking account.." );
  bitgo.unlock({ otp: otp }, function(err) {
    if (err) { console.dir(err); throw new Error("Could not unlock!"); }
    sendTransaction();
  });
});
