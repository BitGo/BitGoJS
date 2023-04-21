/**
 * @hidden
 */

/**
 */
//
// Wallets Object
// BitGo accessor to a user's wallets.
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//
import {
  common,
  getAddressP2PKH,
  getNetwork,
  getSharedSecret,
  makeRandomKey,
  sanitizeLegacyPath,
} from '@bitgo/sdk-core';
import { bip32 } from '@bitgo/utxo-lib';
import * as utxolib from '@bitgo/utxo-lib';
import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
const co = Bluebird.coroutine;
const Wallet = require('./wallet');

//
// Constructor
//
const Wallets = function (bitgo) {
  // @ts-expect-error - no implicit this
  this.bitgo = bitgo;
};

//
// list
// List the user's wallets
//
Wallets.prototype.list = function (params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  const args: string[] = [];

  if (params.skip && params.prevId) {
    throw new Error('cannot specify both skip and prevId');
  }

  if (params.limit) {
    if (!_.isNumber(params.limit)) {
      throw new Error('invalid limit argument, expecting number');
    }
    args.push('limit=' + params.limit);
  }
  if (params.getbalances) {
    if (!_.isBoolean(params.getbalances)) {
      throw new Error('invalid getbalances argument, expecting boolean');
    }
    args.push('getbalances=' + params.getbalances);
  }
  if (params.skip) {
    if (!_.isNumber(params.skip)) {
      throw new Error('invalid skip argument, expecting number');
    }
    args.push('skip=' + params.skip);
  } else if (params.prevId) {
    args.push('prevId=' + params.prevId);
  }

  let query = '';
  if (args.length) {
    query = '?' + args.join('&');
  }

  const self = this;
  return Bluebird.resolve(this.bitgo.get(this.bitgo.url('/wallet' + query)).result())
    .then(function (body) {
      body.wallets = body.wallets.map(function (w) {
        return new Wallet(self.bitgo, w);
      });
      return body;
    })
    .nodeify(callback);
};

Wallets.prototype.getWallet = function (params, callback) {
  params = params || {};
  common.validateParams(params, ['id'], [], callback);

  const self = this;

  let query = '';
  if (params.gpk) {
    query = '?gpk=1';
  }

  return Bluebird.resolve(this.bitgo.get(this.bitgo.url('/wallet/' + params.id + query)).result())
    .then(function (wallet) {
      return new Wallet(self.bitgo, wallet);
    })
    .nodeify(callback);
};

//
// listInvites
// List the invites on a user
//
Wallets.prototype.listInvites = function (params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return Bluebird.resolve(this.bitgo.get(this.bitgo.url('/walletinvite')).result()).nodeify(callback);
};

//
// cancelInvite
// cancel a wallet invite that a user initiated
//
Wallets.prototype.cancelInvite = function (params, callback) {
  params = params || {};
  common.validateParams(params, ['walletInviteId'], [], callback);

  return Bluebird.resolve(this.bitgo.del(this.bitgo.url('/walletinvite/' + params.walletInviteId)).result()).nodeify(
    callback
  );
};

//
// listShares
// List the user's wallet shares
//
Wallets.prototype.listShares = function (params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return Bluebird.resolve(this.bitgo.get(this.bitgo.url('/walletshare')).result()).nodeify(callback);
};

//
// resendShareInvite
// Resend the invitation email which shares a wallet with another user
// Params:
//    walletShareId - the wallet share to get information on
//
Wallets.prototype.resendShareInvite = function (params, callback) {
  return co(function* () {
    params = params || {};
    common.validateParams(params, ['walletShareId'], [], callback);

    const urlParts = params.walletShareId + '/resendemail';
    // @ts-expect-error - no implicit this
    return this.bitgo.post(this.bitgo.url('/walletshare/' + urlParts)).result();
  })
    .call(this)
    .asCallback(callback);
};

//
// getShare
// Gets a wallet share information, including the encrypted sharing keychain. requires unlock if keychain is present.
// Params:
//    walletShareId - the wallet share to get information on
//
Wallets.prototype.getShare = function (params, callback) {
  params = params || {};
  common.validateParams(params, ['walletShareId'], [], callback);

  return Bluebird.resolve(this.bitgo.get(this.bitgo.url('/walletshare/' + params.walletShareId)).result()).nodeify(
    callback
  );
};

//
// updateShare
// updates a wallet share
// Params:
//    walletShareId - the wallet share to update
//    state - the new state of the wallet share
//
Wallets.prototype.updateShare = function (params, callback) {
  params = params || {};
  common.validateParams(params, ['walletShareId'], [], callback);

  return Bluebird.resolve(
    this.bitgo
      .post(this.bitgo.url('/walletshare/' + params.walletShareId))
      .send(params)
      .result()
  ).nodeify(callback);
};

//
// cancelShare
// cancels a wallet share
// Params:
//    walletShareId - the wallet share to update
//
Wallets.prototype.cancelShare = function (params, callback) {
  params = params || {};
  common.validateParams(params, ['walletShareId'], [], callback);

  return Bluebird.resolve(
    this.bitgo
      .del(this.bitgo.url('/walletshare/' + params.walletShareId))
      .send()
      .result()
  ).nodeify(callback);
};

//
// acceptShare
// Accepts a wallet share, adding the wallet to the user's list
// Needs a user's password to decrypt the shared key
// Params:
//    walletShareId - the wallet share to accept
//    userPassword - (required if more a keychain was shared) user's password to decrypt the shared wallet
//    newWalletPassphrase - new wallet passphrase for saving the shared wallet xprv.
//                          If left blank and a wallet with more than view permissions was shared, then the userpassword is used.
//    overrideEncryptedXprv - set only if the xprv was received out-of-band.
//
Wallets.prototype.acceptShare = function (params, callback) {
  params = params || {};
  common.validateParams(params, ['walletShareId'], ['overrideEncryptedXprv'], callback);

  const self = this;
  let encryptedXprv = params.overrideEncryptedXprv;

  return this.getShare({ walletShareId: params.walletShareId })
    .then(function (walletShare) {
      // Return right away if there is no keychain to decrypt, or if explicit encryptedXprv was provided
      if (!walletShare.keychain || !walletShare.keychain.encryptedXprv || encryptedXprv) {
        return walletShare;
      }

      // More than viewing was requested, so we need to process the wallet keys using the shared ecdh scheme
      if (!params.userPassword) {
        throw new Error('userPassword param must be provided to decrypt shared key');
      }

      return self.bitgo.getECDHKeychain().then(function (sharingKeychain) {
        if (!sharingKeychain.encryptedXprv) {
          throw new Error('EncryptedXprv was not found on sharing keychain');
        }

        // Now we have the sharing keychain, we can work out the secret used for sharing the wallet with us
        sharingKeychain.xprv = self.bitgo.decrypt({
          password: params.userPassword,
          input: sharingKeychain.encryptedXprv,
        });

        // Derive key by path (which is used between these 2 users only)
        const secret = getSharedSecret(
          bip32.fromBase58(sharingKeychain.xprv).derivePath(sanitizeLegacyPath(walletShare.keychain.path)),
          Buffer.from(walletShare.keychain.fromPubKey, 'hex')
        ).toString('hex');

        // Yes! We got the secret successfully here, now decrypt the shared wallet xprv
        const decryptedSharedWalletXprv = self.bitgo.decrypt({
          password: secret,
          input: walletShare.keychain.encryptedXprv,
        });

        // We will now re-encrypt the wallet with our own password
        const newWalletPassphrase = params.newWalletPassphrase || params.userPassword;
        encryptedXprv = self.bitgo.encrypt({ password: newWalletPassphrase, input: decryptedSharedWalletXprv });

        // Carry on to the next block where we will post the acceptance of the share with the encrypted xprv
        return walletShare;
      });
    })
    .then(function (walletShare) {
      const updateParams: any = {
        walletShareId: params.walletShareId,
        state: 'accepted',
      };

      if (encryptedXprv) {
        updateParams.encryptedXprv = encryptedXprv;
      }

      return self.updateShare(updateParams);
    })
    .nodeify(callback);
};

//
// createKey
// Create a single bitcoin key.  This runs locally.
// Returns: {
//   address: <address>
//   key: <key, in WIF format>
// }
Wallets.prototype.createKey = function (params) {
  const key = makeRandomKey();
  return {
    address: getAddressP2PKH(key),
    key: key.toWIF(),
  };
};

//
// createWalletWithKeychains
// Create a new 2-of-3 wallet and it's associated keychains.
// Returns the locally created keys with their encrypted xprvs.
// **WARNING: BE SURE TO BACKUP! NOT DOING SO CAN RESULT IN LOSS OF FUNDS!**
//
// 1. Creates the user keychain locally on the client, and encrypts it with the provided passphrase
// 2. If no xpub was provided, creates the backup keychain locally on the client, and encrypts it with the provided passphrase
// 3. Uploads the encrypted user and backup keychains to BitGo
// 4. Creates the BitGo key on the service
// 5. Creates the wallet on BitGo with the 3 public keys above
//
// Parameters include:
//   "passphrase": wallet passphrase to encrypt user and backup keys with
//   "label": wallet label, is shown in BitGo UI
//   "backupXpub": backup keychain xpub, it is HIGHLY RECOMMENDED you generate this on a separate machine!
//                 BITGO DOES NOT GUARANTEE SAFETY OF WALLETS WITH MULTIPLE KEYS CREATED ON THE SAME MACHINE **
//   "backupXpubProvider": Provision backup key from this provider (KRS), e.g. "keyternal".
//                         Setting this value will create an instant-capable wallet.
//   "passcodeEncryptionCode": the code used to encrypt the wallet passcode used in the recovery process
// Returns: {
//   wallet: newly created wallet model object
//   userKeychain: the newly created user keychain, which has an encrypted xprv stored on BitGo
//   backupKeychain: the newly created backup keychain
//
// ** BE SURE TO BACK UP THE ENCRYPTED USER AND BACKUP KEYCHAINS!**
//
// }
Wallets.prototype.createWalletWithKeychains = function (params, callback) {
  params = params || {};
  common.validateParams(
    params,
    ['passphrase'],
    ['label', 'backupXpub', 'enterprise', 'passcodeEncryptionCode'],
    callback
  );
  const self = this;
  const label = params.label;

  // Create the user and backup key.
  const userKeychain = this.bitgo.keychains().create();
  userKeychain.encryptedXprv = this.bitgo.encrypt({ password: params.passphrase, input: userKeychain.xprv });

  const keychainData: any = {
    xpub: userKeychain.xpub,
    encryptedXprv: userKeychain.encryptedXprv,
  };

  if (params.passcodeEncryptionCode) {
    keychainData.originalPasscodeEncryptionCode = params.passcodeEncryptionCode;
  }

  const hasBackupXpub = !!params.backupXpub;
  const hasBackupXpubProvider = !!params.backupXpubProvider;
  if (hasBackupXpub && hasBackupXpubProvider) {
    throw new Error('Cannot provide more than one backupXpub or backupXpubProvider flag');
  }

  if (params.disableTransactionNotifications !== undefined && !_.isBoolean(params.disableTransactionNotifications)) {
    throw new Error('Expected disableTransactionNotifications to be a boolean. ');
  }

  let backupKeychain;
  let bitgoKeychain;

  // Add the user keychain
  return self.bitgo
    .keychains()
    .add(keychainData)
    .then(function () {
      // Add the backup keychain
      if (params.backupXpubProvider) {
        // If requested, use a KRS or backup key provider
        return self.bitgo
          .keychains()
          .createBackup({
            provider: params.backupXpubProvider,
            disableKRSEmail: params.disableKRSEmail,
          })
          .then(function (keychain) {
            backupKeychain = keychain;
          });
      }

      if (params.backupXpub) {
        // user provided backup xpub
        backupKeychain = { xpub: params.backupXpub };
      } else {
        // no provided xpub, so default to creating one here
        backupKeychain = self.bitgo.keychains().create();
      }

      return self.bitgo.keychains().add(backupKeychain);
    })
    .then(function () {
      return self.bitgo.keychains().createBitGo();
    })
    .then(function (keychain) {
      bitgoKeychain = keychain;
      const walletParams: any = {
        label: label,
        m: 2,
        n: 3,
        keychains: [{ xpub: userKeychain.xpub }, { xpub: backupKeychain.xpub }, { xpub: bitgoKeychain.xpub }],
      };

      if (params.enterprise) {
        walletParams.enterprise = params.enterprise;
      }

      if (params.disableTransactionNotifications) {
        walletParams.disableTransactionNotifications = params.disableTransactionNotifications;
      }

      return self.add(walletParams);
    })
    .then(function (newWallet) {
      const result: any = {
        wallet: newWallet,
        userKeychain: userKeychain,
        backupKeychain: backupKeychain,
        bitgoKeychain: bitgoKeychain,
      };

      if (backupKeychain.xprv) {
        result.warning = 'Be sure to backup the backup keychain -- it is not stored anywhere else!';
      }

      return result;
    })
    .nodeify(callback);
};

//
// createForwardWallet
// Creates a forward wallet from a single private key.
// BitGo will watch the wallet and send any incoming transactions to a destination multi-sig wallet
// WARNING: THE PRIVATE KEY WILL BE SENT TO BITGO. YOU MUST CONTACT BITGO BEFORE USING THIS FEATURE!
// WE CANNOT GUARANTEE THE SECURITY OF SINGLE-SIG WALLETS AS CUSTODY IS UNCLEAR.
//
// Params:
//    privKey - the private key on a legacy single-signature wallet to be watched (WIF format)
//    sourceAddress - the bitcoin address to forward from (corresponds to the private key)
//    destinationWallet - the wallet object to send the destination coins to (when incoming transactions are detected)
//    label - label for the wallet
//
Wallets.prototype.createForwardWallet = function (params, callback) {
  params = params || {};
  common.validateParams(params, ['privKey', 'sourceAddress'], ['label'], callback);

  if (!_.isObject(params.destinationWallet) || !params.destinationWallet.id) {
    throw new Error('expecting destinationWallet object');
  }

  const self = this;

  let newDestinationAddress;
  let addressFromPrivKey;

  try {
    const key = utxolib.ECPair.fromWIF(params.privKey, getNetwork() as utxolib.BitcoinJSNetwork);
    addressFromPrivKey = getAddressP2PKH(key);
  } catch (e) {
    throw new Error('expecting a valid privKey');
  }

  if (addressFromPrivKey !== params.sourceAddress) {
    throw new Error(
      'privKey does not match source address - got ' + addressFromPrivKey + ' expected ' + params.sourceAddress
    );
  }

  return params.destinationWallet.createAddress().then(function (result) {
    // Create new address on the destination wallet to receive coins
    newDestinationAddress = result.address;

    const walletParams: any = {
      type: 'forward',
      sourceAddress: params.sourceAddress,
      destinationAddress: newDestinationAddress,
      privKey: params.privKey,
      label: params.label,
    };

    if (params.enterprise) {
      walletParams.enterprise = params.enterprise;
    }

    return Bluebird.resolve(self.bitgo.post(self.bitgo.url('/wallet')).send(walletParams).result()).nodeify(callback);
  });
};

/**
 * Add a new wallet (advanced mode).
 * This allows you to manually submit the keychains, type, m and n of the wallet
 * @param {string} label label of the wallet to be shown in UI
 * @param {number} m number of keys required to unlock wallet (2)
 * @param {number} n number of keys available on the wallet (3)
 * @param {array} keychains array of keychain xpubs
 * @param {string} enterprise ID of the enterprise entity to create this wallet under.
 * @param {boolean} disableTransactionNotifications When set to true disables notifications for transactions on this wallet.
 */
Wallets.prototype.add = function (params, callback) {
  params = params || {};
  common.validateParams(params, [], ['label', 'enterprise'], callback);

  if (Array.isArray(params.keychains) === false || !_.isNumber(params.m) || !_.isNumber(params.n)) {
    throw new Error('invalid argument');
  }

  // TODO: support more types of multisig
  if (params.m !== 2 || params.n !== 3) {
    throw new Error('unsupported multi-sig type');
  }

  const self = this;
  const keychains = params.keychains.map(function (k) {
    return { xpub: k.xpub };
  });
  const walletParams: any = {
    label: params.label,
    m: params.m,
    n: params.n,
    keychains: keychains,
  };

  if (params.enterprise) {
    walletParams.enterprise = params.enterprise;
  }

  if (params.disableTransactionNotifications) {
    walletParams.disableTransactionNotifications = params.disableTransactionNotifications;
  }

  return Bluebird.resolve(this.bitgo.post(this.bitgo.url('/wallet')).send(walletParams).result())
    .then(function (body) {
      return new Wallet(self.bitgo, body);
    })
    .nodeify(callback);
};

//
// get
// Shorthand to getWallet
// Parameters include:
//   id: the id of the wallet
//
Wallets.prototype.get = function (params, callback) {
  return this.getWallet(params, callback);
};

//
// remove
// Remove an existing wallet.
// Parameters include:
//   id: the id of the wallet
//
Wallets.prototype.remove = function (params, callback) {
  params = params || {};
  common.validateParams(params, ['id'], [], callback);

  return Bluebird.resolve(this.bitgo.del(this.bitgo.url('/wallet/' + params.id)).result()).nodeify(callback);
};

module.exports = Wallets;
