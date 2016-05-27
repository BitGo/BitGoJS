//
// TransactionBuilder
// A utility for building and signing transactions
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var Q = require('q');
var bitcoin = require('./bitcoin');
var common = require('./common');
var Util = require('./util');
var _ = require('lodash');

//
// TransactionBuilder
// @params:
//   wallet:  a wallet object to send from
//   recipients: array of recipient objects and the amount to send to each e.g. [{address: '38BKDNZbPcLogvVbcx2ekJ9E6Vv94DqDqw', amount: 1500}, {address: '36eL8yQqCn1HMRmVFFo49t2PJ3pai8wQam', amount: 2000}]
//   fee: the fee to use with this transaction.  if not provided, a default, minimum fee will be used.
//   feeRate: the amount of fee per kilobyte - optional - specify either fee, feeRate, or feeTxConfirmTarget but not more than one
//   feeTxConfirmTarget: calculate the fees per kilobyte such that the transaction will be confirmed in this number of blocks
//   maxFeeRate: The maximum fee per kb to use in satoshis, for safety purposes when using dynamic fees
//   minConfirms: the minimum confirmations an output must have before spending
//   forceChangeAtEnd: force the change address to be the last output
//   changeAddress: specify the change address rather than generate a new one
//   noSplitChange: set to true to disable automatic change splitting for purposes of unspent management
//   targetWalletUnspents: specify a number of target unspents to maintain in the wallet (currently defaulted to 8 by the server)
//   validate: extra verification of the change addresses, which is always done server-side and is redundant client-side (defaults true)
//   minUnspentSize: The minimum use of unspent to use (don't spend dust transactions). Defaults to 0.
//   feeSingleKeySourceAddress: Use this single key address to pay fees
//   feeSingleKeyWIF: Use the address based on this private key to pay fees
exports.createTransaction = function(params) {
  var minConfirms = params.minConfirms || 0;
  var validate = params.validate === undefined ? true : params.validate;
  var recipients = [];
  var extraChangeAmounts = [];
  var travelInfos;

  // Sanity check the arguments passed in
  if (typeof(params.wallet) != 'object' ||
     (params.fee && typeof(params.fee) != 'number') ||
     (params.feeRate && typeof(params.feeRate) != 'number') ||
     typeof(minConfirms) != 'number' ||
     (params.forceChangeAtEnd && typeof(params.forceChangeAtEnd) !== 'boolean') ||
     (params.changeAddress && typeof(params.changeAddress) !== 'string') ||
     (params.noSplitChange && typeof(params.noSplitChange) !== 'boolean') ||
     (params.targetWalletUnspents && typeof(params.targetWalletUnspents) !== 'number') ||
     (validate && typeof(validate) !== 'boolean') ||
     (params.enforceMinConfirmsForChange && typeof(params.enforceMinConfirmsForChange) !== 'boolean') ||
     (params.minUnspentSize && typeof(params.minUnspentSize) !== 'number') ||
     (params.maxFeeRate && typeof(params.maxFeeRate) !== 'number') ||
     (params.unspents && params.unspents.length < 1) || // this should be an array and its length must be at least 1
     (params.feeTxConfirmTarget && typeof(params.feeTxConfirmTarget) !== 'number') ||
     (params.instant && typeof(params.instant) !== 'boolean') ||
     (params.bitgoFee && typeof(params.bitgoFee) !== 'object')
  ) {
    throw new Error('invalid argument');
  }

  var self = this;
  var bitgo = params.wallet.bitgo;
  var constants = bitgo.getConstants();

  // The user can specify a seperate, single-key wallet for the purposes of paying miner's fees
  // When creating a transaction this can be specified as an input address or the private key in WIF
  var feeSingleKeySourceAddress;
  var feeSingleKeyInputAmount = 0;
  if (params.feeSingleKeySourceAddress) {
    try {
      bitcoin.address.fromBase58Check(params.feeSingleKeySourceAddress);
      feeSingleKeySourceAddress = params.feeSingleKeySourceAddress;
    } catch (e) {
      throw new Error('invalid bitcoin address: ' + params.feeSingleKeySourceAddress);
    }
  }

  if (params.feeSingleKeyWIF) {
    var feeSingleKey;
      feeSingleKey = bitcoin.ECPair.fromWIF(params.feeSingleKeyWIF, bitcoin.getNetwork());
    feeSingleKeySourceAddress = feeSingleKey.getAddress();
    // If the user specifies both, check to make sure the feeSingleKeySourceAddress corresponds to the address of feeSingleKeyWIF
    if (params.feeSingleKeySourceAddress &&
        params.feeSingleKeySourceAddress !== feeSingleKeySourceAddress) {
      throw new Error('feeSingleKeySourceAddress did not correspond to address of feeSingleKeyWIF');
    }
  }

  if (typeof(params.recipients) != 'object') {
    throw new Error('recipients must be array of { address: abc, amount: 100000 } objects');
  }

  var feeParamsDefined = (typeof(params.fee) !== 'undefined') +
                          (typeof(params.feeRate) !== 'undefined') +
                          (typeof(params.feeTxConfirmTarget) !== 'undefined');
  if (feeParamsDefined > 1) {
    throw new Error('cannot specify more than one of fee, feeRate and feeTxConfirmTarget');
  }

  if (typeof(params.maxFeeRate) === 'undefined') {
    params.maxFeeRate = constants.maxFeeRate;
  }

  // Convert the old format of params.recipients (dictionary of address:amount) to new format: { destinationAddress, amount }
  if (!(params.recipients instanceof Array)) {
    recipients = [];
    Object.keys(params.recipients).forEach(function(destinationAddress) {
      var amount = params.recipients[destinationAddress];
      recipients.push({address: destinationAddress, amount: amount});
    });
  } else {
    recipients = params.recipients;
  }

  if (recipients.length === 0) {
    throw new Error('must have at least one recipient');
  }

  var fee = params.fee;
  var feeRate = params.feeRate;

  // Flag indicating whether this class will compute the fee
  var shouldComputeBestFee = (typeof(fee) == 'undefined');

  if (fee > constants.maxFee) {
    throw new Error('fee too generous');  // Protection against bad inputs
  }
  if (feeRate > constants.maxFeeRate) {
    throw new Error('fee rate too generous');  // Protection against bad inputs
  }

  var totalOutputAmount = 0;

  recipients.forEach(function(recipient) {
    if (typeof(recipient.address) == 'string') {
      var addressObj;
      try {
        bitcoin.address.fromBase58Check(recipient.address);
      } catch (e) {
        throw new Error('invalid bitcoin address: ' + recipient.address);
      }
      if (!!recipient.script) {
        // A script was provided as well - validate that the address corresponds to that
        if (bitcoin.address.toOutputScript(recipient.address, bitcoin.getNetwork()).toString('hex') != recipient.script) {
          throw new Error('both script and address provided but they did not match: ' + recipient.address + " " + recipient.script);
        }
      }
    }
    if (typeof(recipient.amount) != 'number' || isNaN(recipient.amount) || recipient.amount < 0) {
      throw new Error('invalid amount for ' + recipient.address + ': ' + recipient.amount);
    }
    totalOutputAmount += recipient.amount;
  });

  var bitgoFeeInfo = params.bitgoFee;
  if (bitgoFeeInfo &&
    (typeof(bitgoFeeInfo.amount) !== 'number' || typeof(bitgoFeeInfo.address) !== 'string')) {
    throw new Error('invalid bitgoFeeInfo');
  }

  // The total amount needed for this transaction.
  var totalAmount = totalOutputAmount + (fee || 0);

  // The list of unspent transactions being used in this transaction.
  var unspents;

  // The sum of the input values for this transaction.
  var inputAmount;

  var changeOutputs = [];

  // The transaction.
  var transaction = new bitcoin.TransactionBuilder(bitcoin.getNetwork());

  var getBitGoFee = function() {
    return Q().then(function() {
      if (bitgoFeeInfo) {
        return;
      }
      return params.wallet.getBitGoFee({ amount: totalOutputAmount, instant: params.instant })
      .then(function(result) {
        if (result && result.fee > 0) {
          bitgoFeeInfo = {
            amount: result.fee
          };
        }
      });
    })
    .then(function() {
      if (bitgoFeeInfo && bitgoFeeInfo.amount > 0) {
        totalAmount += bitgoFeeInfo.amount;
      }
    });
  };

  var getBitGoFeeAddress = function() {
    return Q().then(function() {
      // If we don't have bitgoFeeInfo, or address is already set, don't get a new one
      if (!bitgoFeeInfo || bitgoFeeInfo.address) {
        return;
      }
      return bitgo.getBitGoFeeAddress()
      .then(function(result) {
        bitgoFeeInfo.address = result.address;
      });
    });
  };

  // Get a dynamic fee estimate from the BitGo server if feeTxConfirmTarget is specified
  var getDynamicFeeEstimate = function () {
    if (params.feeTxConfirmTarget || !feeParamsDefined) {
      return bitgo.estimateFee({ numBlocks: params.feeTxConfirmTarget, maxFee: params.maxFeeRate })
      .then(function(result) {
        var estimatedFeeRate = result.feePerKb;
        if (estimatedFeeRate < constants.minFeeRate) {
          console.log(new Date() + ': Error when estimating fee for send from ' + params.wallet + ', it was too low - ' + estimatedFeeRate);
          feeRate = constants.minFeeRate;
        } else if (estimatedFeeRate > params.maxFeeRate) {
          feeRate = params.maxFeeRate;
        } else {
          feeRate = estimatedFeeRate;
        }
      })
      .catch(function(err) {
        // some error happened estimating the fee, so use the default
        console.log(new Date() + ': Error when estimating fee for send from - ' + params.wallet);
        console.dir(err);
        feeRate = constants.fallbackFeeRate;
      });
    }
    // always return a promise
    return Q();
  };

  // Get the unspents for the sending wallet.
  var getUnspents = function() {

    if (params.unspents) { // we just wanna use custom unspents
      unspents = params.unspents;
      return;
    }

    // Get enough unspents for the requested amount, plus a little more in case we need to pay an increased fee
    var options = {
      target: totalAmount + 0.01e8,  // fee @ 0.0001/kb for a 100kb tx
      minSize: params.minUnspentSize || 0,
      instant: params.instant, // insist on instant unspents only
      targetWalletUnspents: params.targetWalletUnspents
    };
    if (params.instant) {
      options.instant = params.instant; // insist on instant unspents only
    }

    return params.wallet.unspentsPaged(options)
    .then(function(results) {
      unspents = results.unspents.filter(function (u) {
        var confirms = u.confirmations || 0;
        if (!params.enforceMinConfirmsForChange && u.isChange) {
          return true;
        }
        return confirms >= minConfirms;
      });
      // For backwards compatibility, respect the old splitChangeSize=0 parameter
      if (!params.noSplitChange && params.splitChangeSize !== 0) {
        extraChangeAmounts = results.extraChangeAmounts || [];
      }
    });
  };

  // Get the unspents for the single key fee address
  var feeSingleKeyUnspents = [];
  var getUnspentsForSingleKey = function() {
    if (feeSingleKeySourceAddress) {
      var feeTarget = 0.01e8;
      if (params.instant) {
        feeTarget += totalAmount * 0.001;
      }
      return bitgo.get(bitgo.url('/address/' + feeSingleKeySourceAddress + '/unspents?target=' + feeTarget))
      .then(function(response) {
        if (response.body.total <= 0) {
          throw new Error("No unspents available in single key fee source");
        }
        feeSingleKeyUnspents = response.body.unspents;
      });
    }
  };

  var estimateTxSizeBytes = function() {
    var nExtraChange = extraChangeAmounts.length;
    var sizePerP2SHInput = 295;
    var sizePerP2PKHInput = 160;
    var sizePerOutput = 34;

    // Add 1 output for change, possibly 1 output for instant fee, and 1 output for the single key change if needed.
    // If we do change splitting, we will add more fee later.
    var nOutputs = (recipients.length + 1 + nExtraChange + (bitgoFeeInfo ? 1 : 0) + (feeSingleKeySourceAddress ? 1 : 0));
    var nP2SHInputs = transaction.tx.ins.length + (feeSingleKeySourceAddress ? 1 : 0);
    var nP2PKHInputs = (feeSingleKeySourceAddress ? 1 : 0);

    return sizePerP2SHInput * nP2SHInputs + sizePerP2PKHInput * nP2PKHInputs + sizePerOutput * nOutputs;
  };

  // Approximate the fee based on number of inputs & outputs
  var estimatedSize = 0;
  var calculateApproximateFee = function() {
    var feeRateToUse = typeof(feeRate) !== 'undefined' ? feeRate : constants.fallbackFeeRate;
    estimatedSize = estimateTxSizeBytes();
    return Math.ceil(estimatedSize * feeRateToUse / 1000);
  };

  // Iterate unspents, sum the inputs, and save _inputs with the total
  // input amound and final list of inputs to use with the transaction.
  var feeSingleKeyUnspentsUsed = [];
  var collectInputs = function () {
    inputAmount = 0;
    unspents.every(function (unspent) {
      inputAmount += unspent.value;
      var script = new Buffer(unspent.script, 'hex');
      transaction.addInput(unspent.tx_hash, unspent.tx_output_n, 0xffffffff, script);
      return (inputAmount < (feeSingleKeySourceAddress ? totalOutputAmount : totalAmount));
    });

    // if paying fees from an external single key wallet, add the inputs
    if (feeSingleKeySourceAddress) {
      // collect the amount used in the fee inputs so we can get change later
      feeSingleKeyInputAmount = 0;
      feeSingleKeyUnspentsUsed = [];
      feeSingleKeyUnspents.every(function (unspent) {
        feeSingleKeyInputAmount += unspent.value;
        inputAmount += unspent.value;
        transaction.addInput(unspent.tx_hash, unspent.tx_output_n);
        feeSingleKeyUnspentsUsed.push(unspent);
        // use the fee wallet to pay miner fees and potentially instant fees
        return (feeSingleKeyInputAmount < (fee + (bitgoFeeInfo ? bitgoFeeInfo.amount : 0)));
      });
    }

    if (shouldComputeBestFee) {
      var approximateFee = calculateApproximateFee();
      var shouldRecurse = typeof(fee) === 'undefined' || approximateFee > fee;
      fee = approximateFee;
      // Recompute totalAmount from scratch
      totalAmount = fee + totalOutputAmount;
      if (bitgoFeeInfo) {
        totalAmount += bitgoFeeInfo.amount;
      }
      if (shouldRecurse) {
        // if fee changed, re-collect inputs
        inputAmount = 0;
        transaction = new bitcoin.TransactionBuilder(bitcoin.getNetwork());
        return collectInputs();
      }
    }

    var totalFee = fee + (bitgoFeeInfo ? bitgoFeeInfo.amount : 0);

    if (feeSingleKeySourceAddress) {
      if (totalFee > _.sum(feeSingleKeyUnspents, 'value')) {
        var err = new Error('Insufficient fee amount available in single key fee source');
        err.result = {
          fee: fee,
          feeRate: feeRate,
          estimatedSize: estimatedSize,
          available: inputAmount,
          bitgoFee: bitgoFeeInfo
        };
        return Q.reject(err);
      }
    }

    if (inputAmount < (feeSingleKeySourceAddress ? totalOutputAmount : totalAmount)) {
      var err = new Error('Insufficient funds');
      err.result = {
        fee: fee,
        feeRate: feeRate,
        estimatedSize: estimatedSize,
        available: inputAmount,
        bitgoFee: bitgoFeeInfo
      };
      return Q.reject(err);
    }
  };

  // Add the outputs for this transaction.
  var collectOutputs = function () {
    var estimatedTxSize = estimateTxSizeBytes();
    if (estimatedTxSize >= 90000) {
      throw new Error('transaction too large: estimated size ' + estimatedTxSize + ' bytes');
    }

    var outputs = [];

    recipients.forEach(function (recipient) {
      var script;
      if (typeof(recipient.address) == 'string') {
        script = bitcoin.address.toOutputScript(recipient.address, bitcoin.getNetwork());
      } else if(typeof(recipient.script) === 'object') {
        script = recipient.script;
      } else {
        throw new Error('neither recipient address nor script was provided');
      }

      // validate travelInfo if it exists
      var travelInfo;
      if (!_.isEmpty(recipient.travelInfo)) {
        travelInfo = recipient.travelInfo;
        // Better to avoid trouble now, before tx is created
        bitgo.travelRule().validateTravelInfo(travelInfo);
      }

      outputs.push({
        script: script,
        amount: recipient.amount,
        travelInfo: travelInfo
      });
    });

    var getChangeOutputs = function(changeAmount) {
      if (changeAmount < 0) {
        throw new Error('negative change amount');
      }

      var result = [];
      // if we paid fees from a single key wallet, return the fee change first
      if (feeSingleKeySourceAddress) {
        var feeSingleKeyWalletChangeAmount = feeSingleKeyInputAmount - (fee + (bitgoFeeInfo ? bitgoFeeInfo.amount : 0));
        if (feeSingleKeyWalletChangeAmount >= constants.minOutputSize) {
          result.push({ address: feeSingleKeySourceAddress, amount: feeSingleKeyWalletChangeAmount });
          changeAmount = changeAmount - feeSingleKeyWalletChangeAmount;
        }
      }

      if (changeAmount < constants.minOutputSize) {
        // Give it to the miners
        return result;
      }

      if (params.wallet.type() === 'safe') {
        return params.wallet.addresses()
        .then(function(response) {
          result.push({ address: response.addresses[0].address, amount: changeAmount });
          return result;
        });
      }

      var extraChangeTotal = _.sum(extraChangeAmounts);
      // Sanity check
      if (extraChangeTotal > changeAmount) {
        extraChangeAmounts = [];
        extraChangeTotal = 0;
      }

      // copy and add remaining change amount
      var allChangeAmounts = extraChangeAmounts.slice(0);
      allChangeAmounts.push(changeAmount - extraChangeTotal);

      // Recursive async func to add all change outputs
      var addChangeOutputs = function() {
        var thisAmount = allChangeAmounts.shift();
        if (!thisAmount) {
          return result;
        }
        return Q().then(function() {
          if (params.changeAddress) {
            // If user passed a change address, use it for all outputs
            return params.changeAddress;
          } else {
            // Otherwise create a new address per output, for privacy
            return params.wallet.createAddress({chain: 1, validate: validate})
            .then(function(result) {
              return result.address;
            });
          }
        })
        .then(function(address) {
          result.push({ address: address, amount: thisAmount });
          return addChangeOutputs();
        });
      };

      return addChangeOutputs();
    };

    // Add change output(s) and instant fee output if applicable
    return Q().then(function() {
      return getChangeOutputs(inputAmount - totalAmount);
    })
    .then(function(result) {
      changeOutputs = result;
      var extraOutputs = changeOutputs.concat([]); // copy the array
      if (bitgoFeeInfo && bitgoFeeInfo.amount > 0) {
        extraOutputs.push(bitgoFeeInfo);
      }
      extraOutputs.forEach(function(output) {
        output.script = bitcoin.address.toOutputScript(output.address, bitcoin.getNetwork());

        // decide where to put the outputs - default is to randomize unless forced to end
        var outputIndex = params.forceChangeAtEnd ? outputs.length : _.random(0, outputs.length);
        outputs.splice(outputIndex, 0, output);
      });

      // Add all outputs to the transaction
      outputs.forEach(function(output) {
        transaction.addOutput(output.script, output.amount);
      });

      travelInfos = _(outputs).map(function(output, index) {
        var result = output.travelInfo;
        if (!result) {
          return undefined;
        }
        result.outputIndex = index;
        return result;
      })
      .filter()
      .value();
    });
  };

  // Serialize the transaction, returning what is needed to sign it
  var serialize = function () {
    // only need to return the unspents that were used and just the chainPath, redeemScript, and instant flag
    var pickedUnspents = _.map(unspents, function (unspent) { return _.pick(unspent, ['chainPath', 'redeemScript', 'instant']); });
    var prunedUnspents = _.slice(pickedUnspents, 0, transaction.tx.ins.length - feeSingleKeyUnspentsUsed.length);
    _.each(feeSingleKeyUnspentsUsed, function(feeUnspent) {
      prunedUnspents.push({ redeemScript: false, chainPath: false }); // mark as false to signify a non-multisig address
    });
    var result = {
      transactionHex: transaction.buildIncomplete().toHex(),
      unspents: prunedUnspents,
      fee: fee,
      changeAddresses: changeOutputs.map(function(co) { return _.pick(co, ['address', 'path', 'amount']); }),
      walletId: params.wallet.id(),
      walletKeychains: params.wallet.keychains,
      feeRate: feeRate,
      instant: params.instant,
      bitgoFee: bitgoFeeInfo,
      estimatedSize: estimatedSize,
      travelInfos: travelInfos,
    };

    // Add for backwards compatibility
    if (result.instant && bitgoFeeInfo) {
      result.instantFee = _.pick(bitgoFeeInfo, ['amount', 'address']);
    }

    return result;
  };

  return Q().then(function() {
    return getBitGoFee();
  })
  .then(function() {
    return Q.all([getBitGoFeeAddress(), getDynamicFeeEstimate(), getUnspents(), getUnspentsForSingleKey()]);
  })
  .then(collectInputs)
  .then(collectOutputs)
  .then(serialize);
};

/*
 * Given a transaction hex, unspent information (chain path and redeem scripts), and the keychain xprv,
 * perform key derivation and sign the inputs in the transaction based on the unspent information provided
 *
 * @params:
 *  transactionHex serialized form of the transaction in hex
 *  unspents array of unspent information, where each unspent is a chainPath and redeemScript with the same
 *  index as the inputs in the transactionHex
 *  keychain Keychain containing the xprv to sign with. For legacy support of safe wallets, keychain can
    also be a WIF private key.
 *  signingKey private key in WIF for safe wallets, when keychain is unavailable
 *  validate client-side signature verification - can be disabled for improved performance (signatures
 *           are still validated server-side).
 *  feeSingleKeyWIF Use the address based on this private key to pay fees
 * @returns {*}
 */
exports.signTransaction = function(params) {
  var keychain = params.keychain; // duplicate so as to not mutate below

  var validate = (params.validate === undefined) ? true : params.validate;
  var privKey;
  if (typeof(params.transactionHex) != 'string') {
    throw new Error('expecting the transaction hex as a string');
  }
  if (!Array.isArray(params.unspents)) {
    throw new Error('expecting the unspents array');
  }
  if (typeof(validate) != 'boolean') {
    throw new Error('expecting validate to be a boolean');
  }
  if (typeof(keychain) != 'object' || typeof(keychain.xprv) != 'string') {
    if (typeof(params.signingKey) === 'string') {
      privKey = bitcoin.ECPair.fromWIF(params.signingKey, bitcoin.getNetwork());
      keychain = undefined;
    } else {
      throw new Error('expecting the keychain object with xprv');
    }
  }

  var feeSingleKey;
  if (params.feeSingleKeyWIF) {
    feeSingleKey = bitcoin.ECPair.fromWIF(params.feeSingleKeyWIF, bitcoin.getNetwork());
  }

  var transaction = bitcoin.Transaction.fromHex(params.transactionHex);
  if (transaction.ins.length !== params.unspents.length) {
    throw new Error('length of unspents array should equal to the number of transaction inputs');
  }

  var hdPath;
  if (keychain) {
    rootExtKey = bitcoin.HDNode.fromBase58(keychain.xprv);
    hdPath = bitcoin.hdPath(rootExtKey);
  }
  var txb;

  for (var index = 0; index < transaction.ins.length; ++index) {
    if (params.unspents[index].redeemScript === false) {
      // this is the input from a single key fee address
      if (!feeSingleKey) {
        throw new Error('single key address used in input but feeSingleKeyWIF not provided');
      }

      txb = bitcoin.TransactionBuilder.fromTransaction(transaction, bitcoin.getNetwork());
      txb.sign(index, feeSingleKey);
      transaction = txb.buildIncomplete();
      continue;
    }

    if (hdPath) {
      var subPath = keychain.walletSubPath || '/0/0';
      var path = keychain.path + subPath + params.unspents[index].chainPath;
      privKey = hdPath.deriveKey(path);
    }

    // subscript is the part of the output script after the OP_CODESEPARATOR.
    // Since we are only ever signing p2sh outputs, which do not have
    // OP_CODESEPARATORS, it is always the output script.
    var subscript  = new Buffer(params.unspents[index].redeemScript, 'hex');

    // In order to sign with bitcoinjs-lib, we must use its transaction
    // builder, confusingly named the same exact thing as our transaction
    // builder, but with inequivalent behavior.
    txb = bitcoin.TransactionBuilder.fromTransaction(transaction, bitcoin.getNetwork());
    try {
      txb.sign(index, privKey, subscript, bitcoin.Transaction.SIGHASH_ALL);
    } catch (e) {
      return Q.reject('Failed to sign input #' + index);
    }

    // Build the "incomplete" transaction, i.e. one that does not have all
    // the signatures (since we are only signing the first of 2 signatures in
    // a 2-of-3 multisig).
    transaction = txb.buildIncomplete();

    // bitcoinjs-lib adds one more OP_0 than we need. It creates one OP_0 for
    // every n public keys in an m-of-n multisig, and replaces the OP_0s with
    // the signature of the nth public key, then removes any remaining OP_0s
    // at the end. This behavior is not incorrect and valid for some use
    // cases, particularly if you do not know which keys will be signing the
    // transaction and the signatures may be added to the transaction in any
    // chronological order, but is not compatible with the BitGo API, which
    // assumes m OP_0s for m-of-n multisig (or m-1 after the first signature
    // is created). Thus we need to remove the superfluous OP_0.
    var chunks = bitcoin.script.decompile(transaction.ins[index].script);
    if (chunks.length !== 5) {
      throw new Error('unexpected number of chunks in the OP_CHECKMULTISIG script after signing');
    }
    if (chunks[1]) {
      chunks.splice(2, 1); // The extra OP_0 is the third chunk
    } else if (chunks[2]) {
      chunks.splice(1, 1); // The extra OP_0 is the second chunk
    }

    transaction.ins[index].script = bitcoin.script.compile(chunks);

    // The signatures are validated server side and on the bitcoin network, so
    // the signature validation is optional and can be disabled by setting:
    // validate = false
    if (validate) {
      if (exports.verifyInputSignatures(transaction, index, subscript) !== -1) {
        throw new Error('number of signatures is invalid - something went wrong when signing');
      }
    }
  }

  return Q.when({
    transactionHex: transaction.toBuffer().toString('hex')
  });
};

/**
 * Verify the signature on an input.
 *
 * If the transaction is fully signed, returns a positive number representing the number of valid signatures.
 * If the transaction is partially signed, returns a negative number representing the number of valid signatures.
 * @param transaction The bitcoinjs-lib transaction object
 * @param inputIndex the input index to verify
 * @param pubScript the redeem script to verify with
 * @param ignoreKeyIndices array of multisig keys indexes (in order of keychains on the wallet). e.g. [1] to ignore backup keys
 * @returns {number}
 */
exports.verifyInputSignatures = function(transaction, inputIndex, pubScript, ignoreKeyIndices) {
  if (inputIndex < 0 || inputIndex >= transaction.ins.length) {
    throw new Error('illegal index');
  }

  ignoreKeyIndices = ignoreKeyIndices || [];
  var sigScript = transaction.ins[inputIndex].script;
  var sigsNeeded = 1;
  var sigs = [];
  var pubKeys = [];
  var decompiledSigScript = bitcoin.script.decompile(sigScript);

  // Check the script type to determine number of signatures, the pub keys, and the script to hash.
  switch(bitcoin.script.classifyInput(sigScript, true)) {
    case 'scripthash':
      // Replace the pubScript with the P2SH Script.
      pubScript = decompiledSigScript[decompiledSigScript.length - 1];
      var decompiledPubScript = bitcoin.script.decompile(pubScript);
      sigsNeeded = decompiledPubScript[0] - bitcoin.opcodes.OP_1 + 1;
      for (var index = 1; index < decompiledSigScript.length - 1; ++index) {
        sigs.push(decompiledSigScript[index]);
      }
      for (index = 1; index < decompiledPubScript.length - 2; ++index) {
        // we minus 1 because the key indexes start from the second chunk (first chunk is used for total keys)
        if (_.contains(ignoreKeyIndices, index - 1)) {
          // ignore this public key (do not treat it as valid for a signature)
          continue;
        }
        pubKeys.push(decompiledPubScript[index]);
      }
      break;
    case 'pubkeyhash':
      sigsNeeded = 1;
      sigs.push(decompiledSigScript[0]);
      pubKeys.push(decompiledSigScript[1]);
      break;
    default:
      return 0;
  }

  var numVerifiedSignatures = 0;
  for (var sigIndex = 0; sigIndex < sigs.length; ++sigIndex) {
    // If this is an OP_0, then its been left as a placeholder for a future sig.
    if (sigs[sigIndex] == bitcoin.opcodes.OP_0) {
      continue;
    }

    var hashType = sigs[sigIndex][sigs[sigIndex].length - 1];
    sigs[sigIndex] = sigs[sigIndex].slice(0, sigs[sigIndex].length - 1); // pop hash type from end
    var signatureHash = transaction.hashForSignature(inputIndex, pubScript, hashType);

    var validSig = false;

    // Enumerate the possible public keys
    for (var pubKeyIndex = 0; pubKeyIndex < pubKeys.length; ++pubKeyIndex) {
      var pubKey = bitcoin.ECPair.fromPublicKeyBuffer(pubKeys[pubKeyIndex]);
      var signature = bitcoin.ECSignature.fromDER(sigs[sigIndex]);
      validSig = pubKey.verify(signatureHash, signature);
      if (validSig) {
        pubKeys.splice(pubKeyIndex, 1);  // remove the pubkey so we can't match 2 sigs against the same pubkey
        break;
      }
    }
    if (!validSig) {
      throw new Error('invalid signature for index ' + inputIndex);
    }
    numVerifiedSignatures++;
  }

  if (numVerifiedSignatures < sigsNeeded) {
    numVerifiedSignatures = -numVerifiedSignatures;
  }
  return numVerifiedSignatures;
};
