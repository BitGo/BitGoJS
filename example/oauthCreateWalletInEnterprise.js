//
// Using OAuth, authenticate with an auth code and create a wallet for the user under the oauth partners enterprise
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

const BitGoJS = require('../src/index.js');

if (process.argv.length <= 7) {
  console.log('usage:\n\t' + process.argv[0] + ' ' + process.argv[1] + ' <clientId> <clientSecret> <enterpriseId> <oAuthAuthorizationCode> <walletLabel> <walletPassphrase>');
  process.exit(-1);
}

const clientId = process.argv[2];
const clientSecret = process.argv[3];
const enterpriseId = process.argv[4];
const authorizationCode = process.argv[5];
const walletLabel = process.argv[6];
const walletPassPhrase = process.argv[7];

const bitgo = new BitGoJS.BitGo({ clientId: clientId, clientSecret: clientSecret });

const createWallet = function() {
  try {
    // Create the user and backup key. Remember to back these up!!
    // Note: This is an example only!
    // It is highly recommended that you obtain the user and backup key from separate machines!
    const userKey = bitgo.keychains().create();
    const backupKey = bitgo.keychains().create();

    // Add keychains to BitGo
    const options = {
      label: 'key1',
      xpub: userKey.xpub,
      encryptedXprv: bitgo.encrypt({ password: walletPassPhrase, input: userKey.xprv })
    };
    bitgo.keychains().add(options, function(err, keychain) {
      if (err) {
        console.dir(err);
        throw new Error('Could not create the user keychain');
      }
      console.log('User keychain xPub: ' + userKey.xpub);

      const options = {
        label: 'key2',
        xpub: backupKey.xpub
      };
      bitgo.keychains().add(options, function(err, keychain) {
        if (err) {
          console.dir(err);
          throw new Error('Could not create the backup keychain');
        }
        console.log('Backup keychain xPub: ' + backupKey.xpub);

        // Now tell BitGo to create their server side key
        bitgo.keychains().createBitGo({}, function(err, keychain) {
          if (err) {
            throw new Error('Could not create 3rd keychain on BitGo');
          }
          console.log('BitGo service keychain xPub: ' + keychain.xpub);

          const options = {
            label: walletLabel,
            m: 2,
            n: 3,
            enterprise: enterpriseId,
            keychains: [
              { xpub: userKey.xpub },
              { xpub: backupKey.xpub },
              { xpub: keychain.xpub }]
          };
          bitgo.wallets().add(options, function(err, result) {
            if (err) {
              console.dir(err);
              throw new Error('Could not add wallet on BitGo');
            }
            console.log('Wallet Created!');
            console.dir(result.wallet);
            console.log('\n\nBACK THIS UP: ');
            console.log('User keychain encrypted xPrv - WRITE IT DOWN: ' + bitgo.encrypt({ password: walletPassPhrase, input: userKey.xprv }));
            console.log('Backup keychain encrypted xPrv - WRITE IT DOWN: ' + bitgo.encrypt({ password: walletPassPhrase, input: userKey.xprv }));

            bitgo.wallets().list({}, function(err, result) {
              console.dir(result);
            });
          });
        });
      });
    });
  } catch (e) {
    console.dir(e.message);
  }
};

// First, Authenticate
bitgo.authenticateWithAuthCode({ authCode: authorizationCode }, function(err, result) {
  if (err) {
    console.dir(err);
    throw new Error('Could not auth!');
  }

  console.dir(result);
  console.log('Successfully logged in with auth code!');

  bitgo.me({}, function(err, response) {
    if (err) {
      console.dir(err);
      throw new Error('Could not get user!');
    }

    createWallet();
  });
});
