//
// Create a multi-sig wallet at BitGo.
// This makes use of the convenience function generateWallet
//
// This tool will help you see how to use the BitGo API to easily create a wallet.
// In this form, it creates 2 keys on the host which runs this example.
// It is HIGHLY RECOMMENDED that you GENERATE THE KEYS ON SEPARATE MACHINES for real money wallets!
//

const BitGoJS = require('../../src/index.js');

if (process.argv.length < 2) {
  console.log('usage:\n\t' + process.argv[0] + ' ' + process.argv[1] + ' <pass> <label> [backupXpub]');
  process.exit(-1);
}

const password = process.argv[2];
const label = process.argv[3];

const backupXpub = null;
const bitgo = new BitGoJS.BitGo({ accessToken: process.env.ACCESS_TOKEN });

// Create the wallet
bitgo.eth().wallets().generateWallet({ passphrase: password, label: label, backupXpub: backupXpub }, function(err, result) {
  if (err) { console.dir(err); throw new Error('Could not create wallet!'); }
  console.log('New Wallet: ' + result.wallet.id());
  console.dir(result.wallet.wallet);
  console.log('Addresses: ');
  console.dir(result.wallet.wallet.private.addresses);

  console.log('BACK THIS UP: ');
  console.log('User keychain encrypted xPrv: ' + result.userKeychain.encryptedXprv);
  console.log('Backup keychain encrypted xPrv: ' + result.backupKeychain.encryptedXprv);
});
