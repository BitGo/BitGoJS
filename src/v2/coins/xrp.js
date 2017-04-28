const BaseCoin = require('../baseCoin');
const crypto = require('crypto');
const ripple = require('../../ripple');
const rippleKeypairs = require('ripple-keypairs');
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
  this.network = 'ripple.com';
  this.baseFactor = 1e6; // factor between base unit and smallest unit
};

Xrp.prototype.__proto__ = BaseCoin.prototype;

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

  let singleSigTxFee;
  let multiSigTxFee;
  let ledgerVersion; // one ledger every 5 seconds

  // TODO: replace with IMS calls
  const rippleLib = ripple({ server: common.Environments[this.bitgo.env].xrpNetwork });
  // create cosigner-setting transaction
  // specify the multisigners
  return Q.fcall(function() {
    return rippleLib.connect()
  })
  .then(function() {
    return [
      rippleLib.getFee(),
      rippleLib.getServerInfo()
    ];
  })
  .spread(function(fee, info) {
    // TODO: get recommended fee from server instead of doing number magic
    singleSigTxFee = `${fee * 1 + 0.00001}`;
    multiSigTxFee = `${fee * 3 + 0.00001}`;
    ledgerVersion = info.validatedLedger.ledgerVersion;
    return rippleLib.prepareSettings(rootAddress, {
      //
      signers: {
        threshold: 2,
        weights: [
          {
            address: userAddress,
            weight: 1
          },
          {
            address: backupAddress,
            weight: 1
          },
          {
            address: bitgoAddress,
            weight: 1
          }
        ]
      }
    }, {
      sequence: 1,
      fee: singleSigTxFee,
      maxLedgerVersion: ledgerVersion + 10
    });
  })
  .then(function(multisigAssignmentTx) {
    signedMultisigAssignmentTx = rippleLib.signWithPrivateKey(multisigAssignmentTx.txJSON, privateKey.toString('hex'));

    // sign transaction disabling master key
    return rippleLib.prepareSettings(rootAddress, { disableMasterKey: true }, {
      sequence: 2,
      fee: singleSigTxFee,
      maxLedgerVersion: ledgerVersion + 10
    });
  })
  .then(function(masterDeactivationTx) {
    signedMasterDeactivationTx = rippleLib.signWithPrivateKey(masterDeactivationTx.txJSON, privateKey.toString('hex'));

    // half-sign destination tag enforcement transaction
    return rippleLib.prepareSettings(rootAddress, { requireDestinationTag: true }, {
      sequence: 3,
      fee: multiSigTxFee,
      maxLedgerVersion: ledgerVersion + 10
    });
  })
  .then(function(destinationTagTx) {
    halfSignedDestinationTagTx = rippleLib.signWithPrivateKey(destinationTagTx.txJSON, userPrivateKey.toString('hex'), { signAs: userAddress });

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
