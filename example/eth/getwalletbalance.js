//
// Create a multi-sig wallet at BitGo.
// This makes use of the convenience function generateWallet
//
// This tool will help you see how to use the BitGo API to easily create a wallet.
// In this form, it creates 2 keys on the host which runs this example.
// It is HIGHLY RECOMMENDED that you GENERATE THE KEYS ON SEPARATE MACHINES for real money wallets!
//

var BitGoJS = require('../../src/index.js');

if (process.argv.length < 5) {
  console.log("usage:\n\t" + process.argv[0] + " " + process.argv[1] + " <user> <pass> <walletId>");
  process.exit(-1);
}

var user = process.argv[2];
var password = process.argv[3];
var otp = '0000000';
var walletId = process.argv[4];

var bitgo = new BitGoJS.BitGo();

// Authenticate
bitgo.authenticate({ username: user, password: password, otp: otp }, function(err, result) {
  if (err) { console.dir(err); throw new Error("Could not authenticate!"); }

  // Create the wallet
  bitgo.eth().wallets().get({id: walletId}, function(err, wallet) {
    if (err) { console.dir(err); throw err; }
    console.log('Balance is: ' + bitgo.eth().weiToEtherString(wallet.balance()));
  });
});
