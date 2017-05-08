const BaseCoin = require('../baseCoin');
const crypto = require('crypto');
const querystring = require('querystring');
const ripple = require('../../ripple');
const rippleAddressCodec = require('ripple-address-codec');
const rippleKeypairs = require('ripple-keypairs');
const url = require('url');
const prova = require('../../prova');
const Q = require('q');
const common = require('../../common');
const _ = require('lodash');

const Xrp = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away
  this.__proto__ = Xrp.prototype;
  // TODO: replace dependency with platform IMS
};

Xrp.prototype.__proto__ = BaseCoin.prototype;

/**
 * Returns the factor between the base unit and its smallest subdivison
 * @return {number}
 */
Xrp.prototype.getBaseFactor = function() {
  return 1e6;
};

/**
 * Evaluates whether an address string is valid for this coin
 * @param address
 */
Xrp.prototype.isValidAddress = function(address) {
  const destinationDetails = url.parse(address);
  const queryDetails = querystring.parse(destinationDetails.query);
  const destinationAddress = destinationDetails.pathname;
  if (!rippleAddressCodec.isValidAddress(destinationAddress)) {
    return false;
  }

  // there are no other properties like destination tags
  if (destinationDetails.pathname === address) {
    return true;
  }

  if (!queryDetails.dt) {
    // if there are more properties, the query details need to contain the destination tag property
    return false;
  }

  const parsedTag = parseInt(queryDetails.dt);
  if (!Number.isSafeInteger(parsedTag)) {
    return false;
  }

  if (parsedTag > 0xFFFFFFFF || parsedTag < 0) {
    return false;
  }

  // the simplest form, reconstruction after the deconstruction, should be deterministic
  const normalizedAddress = `${destinationAddress}?dt=${parsedTag}`;
  return normalizedAddress === address;
};

/**
 * Get fee info from server
 * @param params
 * @param callback
 * @returns {*}
 */
Xrp.prototype.getFeeInfo = function(params, callback) {
  return this.bitgo.get(this.url('/public/feeinfo'))
  .result()
  .nodeify(callback);
};

/**
 * Assemble keychain and half-sign prebuilt transaction
 * @param params
 * - txPrebuild
 * - prv
 * @returns {{txHex}}
 */
Xrp.prototype.signTransaction = function(params) {
  const txPrebuild = params.txPrebuild;
  const userPrv = params.prv;
  const userKey = prova.HDNode.fromBase58(userPrv).getKey();
  const userPrivateKey = userKey.getPrivateKeyBuffer();
  const userAddress = rippleKeypairs.deriveAddress(userKey.getPublicKeyBuffer().toString('hex'));

  const rippleLib = ripple();
  const halfSigned = rippleLib.signWithPrivateKey(txPrebuild.txHex, userPrivateKey.toString('hex'), { signAs: userAddress });
  return { halfSigned: { txHex: halfSigned.signedTransaction } };
};

/**
 * Ripple requires additional parameters for wallet generation to be sent to the server. The additional parameters are
 * the root public key, which is the basis of the root address, two signed, and one half-signed initialization txs
 * @param walletParams
 * @param keychains
 * @return {*|Request|Promise.<TResult>|{anyOf}}
 */
Xrp.prototype.supplementGenerateWallet = function(walletParams, keychains) {
  const { userKeychain, backupKeychain, bitgoKeychain } = keychains;

  const userKey = prova.HDNode.fromBase58(userKeychain.prv).getKey();
  const userPrivateKey = userKey.d.toBuffer();
  const userAddress = rippleKeypairs.deriveAddress(userKey.getPublicKeyBuffer().toString('hex'));

  const backupKey = prova.HDNode.fromBase58(backupKeychain.pub).getKey();
  const backupAddress = rippleKeypairs.deriveAddress(backupKey.getPublicKeyBuffer().toString('hex'));

  const bitgoKey = prova.HDNode.fromBase58(bitgoKeychain.pub).getKey();
  const bitgoAddress = rippleKeypairs.deriveAddress(bitgoKey.getPublicKeyBuffer().toString('hex'));

  // initially, we need to generate a random root address which has to be distinct from all three keychains
  const keyPair = prova.ECPair.makeRandom();
  const publicKey = keyPair.getPublicKeyBuffer();
  const privateKey = keyPair.getPrivateKeyBuffer();
  const rootAddress = rippleKeypairs.deriveAddress(publicKey.toString('hex'));

  let signedMultisigAssignmentTx;
  let signedMasterDeactivationTx;
  let halfSignedDestinationTagTx;

  const self = this;
  const rippleLib = ripple();

  return self.getFeeInfo()
  .then(function(feeInfo) {
    // TODO: get recommended fee from server instead of doing number magic
    const fee = feeInfo.xrpOpenLedgerFee;
    const ledgerVersion = feeInfo.height;
    const multisigAssignmentTx = {
      TransactionType: 'SignerListSet',
      Account: rootAddress,
      SignerQuorum: 2,
      SignerEntries: [
        {
          SignerEntry: {
            Account: userAddress,
            SignerWeight: 1
          }
        },
        {
          SignerEntry: {
            Account: backupAddress,
            SignerWeight: 1
          }
        },
        {
          SignerEntry: {
            Account: bitgoAddress,
            SignerWeight: 1
          }
        }
      ],
      Flags: 2147483648,
      LastLedgerSequence: ledgerVersion + 10,
      Fee: `${fee}`,
      Sequence: 1
    };
    signedMultisigAssignmentTx = rippleLib.signWithPrivateKey(JSON.stringify(multisigAssignmentTx), privateKey.toString('hex'));

    const masterDeactivationTx = {
      TransactionType: 'AccountSet',
      Account: rootAddress,
      SetFlag: 4,
      Flags: 2147483648,
      LastLedgerSequence: ledgerVersion + 10,
      Fee: `${fee}`,
      Sequence: 2
    };
    signedMasterDeactivationTx = rippleLib.signWithPrivateKey(JSON.stringify(masterDeactivationTx), privateKey.toString('hex'));

    const destinationTagTx = {
      TransactionType: 'AccountSet',
      Account: rootAddress,
      SetFlag: 1,
      Flags: 2147483648,
      LastLedgerSequence: 1019193,
      Fee: `${fee * 3}`,
      Sequence: 3
    };
    halfSignedDestinationTagTx = rippleLib.signWithPrivateKey(JSON.stringify(destinationTagTx), userPrivateKey.toString('hex'), { signAs: userAddress });

    walletParams.rootPub = publicKey.toString('hex');
    walletParams.initializationTxs = {
      setMultisig: signedMultisigAssignmentTx.signedTransaction,
      disableMasterKey: signedMasterDeactivationTx.signedTransaction,
      forceDestinationTag: halfSignedDestinationTagTx.signedTransaction
    };
    return walletParams;
  });
};

module.exports = Xrp;
