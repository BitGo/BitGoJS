//
// TravelRule Object
// BitGo accessor for a specific enterprise
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var Util = require('./util');

var assert = require('assert');
var bitcoin = require('./bitcoin');
var common = require('./common');
var networks = require('bitcoinjs-lib/src/networks');
var Q = require('q');
var _ = require('lodash');
var sjcl = require('./sjcl.min');

//
// Constructor
//
var TravelRule = function(bitgo) {
  this.bitgo = bitgo;
};

TravelRule.prototype.url = function(extra) {
  extra = extra || '';
  return this.bitgo.url('/travel/' + extra);
};


 /**
  * Get available travel-rule info recipients for a transaction
  * @param params
  *  txid: transaction id
  * @param callback
  * @returns {*}
  */
TravelRule.prototype.getRecipients = function(params, callback) {
  params = params || {};
  params.txid = params.txid || params.hash;
  common.validateParams(params, ['txid'], [], callback);

  var url = this.url(params.txid + '/recipients');
  return this.bitgo.get(url)
  .result('recipients')
  .nodeify(callback);
};

TravelRule.prototype.validateTravelInfo = function(info) {
  var fields = {
    amount:          { type: 'number' },
    toAddress:       { type: 'string' },
    toEnterprise:    { type: 'string' },
    fromUserName:    { type: 'string' },
    fromUserAccount: { type: 'string' },
    fromUserAddress: { type: 'string' },
    toUserName:      { type: 'string' },
    toUserAccount:   { type: 'string' },
    toUserAddress:   { type: 'string' },
    extra:           { type: 'object' },
  };

  _.forEach(fields, function(field, fieldName) {
    // No required fields yet -- should there be?
    if (field.required) {
      if (info[fieldName] === undefined) {
        throw new Error('missing required field ' + fieldName + ' in travel info');
      }
    }
    if (info[fieldName] && typeof(info[fieldName]) !== field.type) {
      throw new Error('incorrect type for field ' + fieldName + ' in travel info, expected ' + field.type);
    }
  });

  // Strip out any other fields we don't know about
  var result = _.pick(info, _.keys(fields));
  if (_.isEmpty(result)) {
    throw new Error('empty travel data');
  }
  return result;
};

/**
 * Takes a transaction object as returned by getTransaction or listTransactions, along
 * with a keychain (or hdnode object), and attempts to decrypt any encrypted travel
 * info included in the transaction's receivedTravelInfo field.
 * Parameters:
 *   tx: a transaction object
 *   keychain: keychain object (with xprv)
 *   hdnode: a bitcoin.HDNode object (may be provided instead of keychain)
 * Returns:
 *   the tx object, augmented with decrypted travelInfo fields
 */
TravelRule.prototype.decryptReceivedTravelInfo = function(params) {
  params = params || {};

  var tx = params.tx;
  if (typeof(tx) != 'object') {
    throw new Error('expecting tx param to be object');
  }

  if (!tx.receivedTravelInfo || !tx.receivedTravelInfo.length) {
    return tx;
  }

  var hdNode;
  // Passing in hdnode is faster because it doesn't reconstruct the key every time
  if (params.hdnode) {
    hdNode = params.hdnode;
  } else {
    var keychain = params.keychain;
    if (typeof(keychain) != 'object' || typeof(keychain.xprv) != 'string') {
      throw new Error('expecting keychain param with xprv');
    }
    hdNode = bitcoin.HDNode.fromBase58(keychain.xprv);
  }

  var self = this;
  var hdPath = bitcoin.hdPath(hdNode);
  tx.receivedTravelInfo.forEach(function(info) {
    var key = hdPath.deriveKey(info.toPubKeyPath);
    var secret = self.bitgo.getECDHSecret({
      eckey: key,
      otherPubKeyHex: info.fromPubKey
    });
    try {
      var decrypted = sjcl.decrypt(secret, info.encryptedTravelInfo);
      info.travelInfo = JSON.parse(decrypted);
    } catch (err) {
      console.error('failed to decrypt or parse travel info for ', info.transactionId + ':' + info.outputIndex);
    }
  });

  return tx;
};

TravelRule.prototype.prepareParams = function(params) {
  params = params || {};
  params.txid = params.txid || params.hash;
  common.validateParams(params, ['txid'], ['fromPrivateInfo']);
  var txid = params.txid;
  var recipient = params.recipient;
  var travelInfo = params.travelInfo;
  if (!recipient || typeof(recipient) !== 'object') {
    throw new Error('invalid or missing recipient');
  }
  if (!travelInfo || typeof(travelInfo) !== 'object') {
    throw new Error('invalid or missing travelInfo');
  }
  if (!params.noValidate) {
    travelInfo = this.validateTravelInfo(travelInfo);
  }

  // Fill in toEnterprise if not already filled
  if (!travelInfo.toEnterprise && recipient.enterprise) {
    travelInfo.toEnterprise = recipient.enterprise;
  }

  // If a key was not provided, create a new random key
  var fromKey = params.fromKey && bitcoin.ECPair.fromWIF(params.fromKey, bitcoin.getNetwork());
  if (!fromKey) {
    fromKey = bitcoin.makeRandomKey();
  }

  // Compute the shared key for encryption
  var sharedSecret = this.bitgo.getECDHSecret({
    eckey: fromKey,
    otherPubKeyHex: recipient.pubKey
  });

  // JSON-ify and encrypt the payload
  var travelInfoJSON = JSON.stringify(travelInfo);
  var encryptedTravelInfo = sjcl.encrypt(sharedSecret, travelInfoJSON);

  var result = {
    txid: txid,
    outputIndex: recipient.outputIndex,
    toPubKey: recipient.pubKey,
    fromPubKey: fromKey.getPublicKeyBuffer().toString('hex'),
    encryptedTravelInfo: encryptedTravelInfo
  };

  if (params.fromPrivateInfo) {
    result.fromPrivateInfo = params.fromPrivateInfo;
  }

  return result;
};

/**
 * Send travel data to the server for a transaction
 */
TravelRule.prototype.send = function(params, callback) {
  params = params || {};
  params.txid = params.txid || params.hash;
  common.validateParams(params, ['txid', 'toPubKey', 'encryptedTravelInfo'], ['fromPubKey', 'fromPrivateInfo'], callback);

  if (typeof(params.outputIndex) !== 'number') {
    throw new Error('invalid outputIndex');
  }

  return this.bitgo.post(this.url(params.txid + '/' + params.outputIndex))
  .send(params)
  .result()
  .nodeify(callback);
};

/**
 * Send multiple travel rule infos for the outputs of a single transaction.
 * Parameters:
 *   - txid (or hash): txid of the transaction (must be a sender of the tx)
 *   - travelInfos: array of travelInfo objects which look like the following:
 *     {
 *       outputIndex: number,     // tx output index
 *       fromUserName: string,    // name of the sending user
 *       fromUserAccount: string, // account id of the sending user
 *       fromUserAddress: string, // mailing address of the sending user
 *       toUserName: string,      // name of the receiving user
 *       toUserAccount: string,   // account id of the receiving user
 *       toUserAddress: string    // mailing address of the receiving user
 *     }
 *     All fields aside from outputIndex are optional, but at least one must
 *     be defined.
 *
 *  It is not necessary to provide travelInfo for all output indices.
 *  End-to-end encryption of the travel info is handled automatically by this method.
 *
 */
TravelRule.prototype.sendMany = function(params, callback) {
  params = params || {};
  params.txid = params.txid || params.hash;
  common.validateParams(params, ['txid'], callback);

  var travelInfos = params.travelInfos;
  if (!_.isArray(travelInfos)) {
    throw new Error('expected parameter travelInfos to be array');
  }

  var self = this;
  var travelInfoMap = _(travelInfos)
    .indexBy('outputIndex')
    .mapValues(function(travelInfo) {
      return self.validateTravelInfo(travelInfo);
    })
    .value();

  return self.getRecipients({ txid: params.txid })
  .then(function(recipients) {

    // Build up data to post
    var sendParamsList = [];
    // don't regenerate a new random key for each recipient
    var fromKey = params.fromKey || bitcoin.makeRandomKey().toWIF();

    recipients.forEach(function(recipient) {
      var outputIndex = recipient.outputIndex;
      var info = travelInfoMap[outputIndex];
      if (info) {
        if (info.amount && info.amount !== recipient.amount) {
          throw new Error('amount did not match for output index ' + outputIndex);
        }
        var sendParams = self.prepareParams({
          txid: params.txid,
          recipient: recipient,
          travelInfo: info,
          fromKey: fromKey,
          noValidate: true // don't re-validate
        });
        sendParamsList.push(sendParams);
      }
    });

    var results = [];
    var errors = [];

    var result = {
      matched: sendParamsList.length,
      results: []
    };

    var sendSerial = function() {
      var sendParams = sendParamsList.shift();
      if (!sendParams) {
        return result;
      }
      return self.send(sendParams)
      .then(function(res) {
        result.results.push({ result: res });
        return sendSerial();
      })
      .catch(function(err) {
        result.results.push({ error: err.toString() });
        return sendSerial();
      });
    };

    return sendSerial();
  });
};

module.exports = TravelRule;
