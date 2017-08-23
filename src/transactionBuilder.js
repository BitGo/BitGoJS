//
// TransactionBuilder
// A utility for building and signing transactions
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var Q = require('q');
var bitcoin = require('./bitcoin');
var bitcoinCash = require('./bitcoinCash');
var common = require('./common');
var Util = require('./util');
var _ = require('lodash');

const P2SH_INPUT_SIZE = 295;
const P2SH_P2WSH_INPUT_SIZE = 139;
const P2PKH_INPUT_SIZE = 160;
const OUTPUT_SIZE = 34;
const TX_OVERHEAD_SIZE = 10;

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
  var estTxSize;
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
      throw new Error('feeSingleKeySourceAddress: ' + params.feeSingleKeySourceAddress +
        ' did not correspond to address of feeSingleKeyWIF: ' + feeSingleKeySourceAddress);
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

  var totalOutputAmount = 0;

  recipients.forEach(function(recipient) {
    if (typeof(recipient.address) == 'string') {
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

  // the total number of unspents on this wallet
  var totalUnspentsCount;

  // the number of unspents we fetched from the server, before filtering
  var fetchedUnspentsCount;

  // The list of unspent transactions being used with zero-confirmations
  var zeroConfUnspentTxIds;

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
      return params.wallet.getBitGoFee({amount: totalOutputAmount, instant: params.instant})
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

  // Get a dynamic fee estimate from the BitGo server if feeTxConfirmTarget
  // is specified or if no fee-related params are specified
  var getDynamicFeeRateEstimate = function() {
    if (params.feeTxConfirmTarget || !feeParamsDefined) {
      return bitgo.estimateFee({
        numBlocks: params.feeTxConfirmTarget,
        maxFee: params.maxFeeRate,
        inputs: zeroConfUnspentTxIds,
        txSize: estTxSize,
        cpfpAware: true
      })
      .then(function(result) {
        var estimatedFeeRate = result.cpfpFeePerKb;
        var minimum = params.instant ? Math.max(constants.minFeeRate, constants.minInstantFeeRate) : constants.minFeeRate;
        // 5 satoshis per byte
        // it is worth noting that the padding only applies when the threshold is crossed, but not when the delta is less than the padding
        var padding = 5000;
        if (estimatedFeeRate < minimum) {
          console.log(new Date() + ': Error when estimating fee for send from ' + params.wallet.id() + ', it was too low - ' + estimatedFeeRate);
          feeRate = minimum + padding;
        } else if (estimatedFeeRate > params.maxFeeRate) {
          feeRate = params.maxFeeRate - padding;
        } else {
          feeRate = estimatedFeeRate;
        }
        return feeRate;
      })
      .catch(function(e) {
        // sanity check failed on tx size
        if (_.includes(e.message, 'invalid txSize')) {
          return Q.reject(e);
        }
        else {
          // couldn't estimate the fee, proceed using the default
          feeRate = constants.fallbackFeeRate;
          console.log("Error estimating fee for send from " + params.wallet.id() + ": " + e.message);
          return Q();
        }
      });
    }
  };


  // Get the unspents for the sending wallet.
  var getUnspents = function() {

    if (params.unspents) { // we just wanna use custom unspents
      unspents = params.unspents;
      return;
    }

    // Get enough unspents for the requested amount
    var options = {
      target: totalAmount,
      minSize: params.minUnspentSize || 0,
      instant: params.instant, // insist on instant unspents only
      targetWalletUnspents: params.targetWalletUnspents
    };
    if (params.instant) {
      options.instant = params.instant; // insist on instant unspents only
    }

    return params.wallet.unspentsPaged(options)
      .then(function(results) {
        totalUnspentsCount = results.total;
        fetchedUnspentsCount = results.count;
        unspents = results.unspents.filter(function(u) {
          var confirms = u.confirmations || 0;
          if (!params.enforceMinConfirmsForChange && u.isChange) {
            return true;
          }
          return confirms >= minConfirms;
        });

        // abort early if there's no viable unspents, because it won't be possible to create the txn later
        if (unspents.length === 0) {
          throw Error('0 unspents available for transaction creation');
        }

        // create array of unconfirmed unspent ID strings of the form "txHash:outputIndex"
        zeroConfUnspentTxIds = _(results.unspents).filter(function(u) {
          return !u.confirmations;
        }).map(function(u) {
          return u.tx_hash + ':' + u.tx_output_n;
        }).value();
        if (_.isEmpty(zeroConfUnspentTxIds)) {
          // we don't want to pass an empty array of inputs to the server, because it assumes if the
          // inputs arguments exists, it contains values
          zeroConfUnspentTxIds = undefined;
        }

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

  var minerFeeInfo = {};
  var txInfo = {};

  // Iterate unspents, sum the inputs, and save _inputs with the total
  // input amount and final list of inputs to use with the transaction.
  var feeSingleKeyUnspentsUsed = [];

  var collectInputs = function() {
    if (!unspents.length) {
      throw new Error('no unspents available on wallet');
    }
    inputAmount = 0;

    // Calculate the cost of spending a single input, i.e. the smallest economical unspent value
    return Q().then(function() {
      var minInputValue = 0;
      if (typeof(params.minUnspentSize) !== 'undefined') {
        minInputValue = params.minUnspentSize;
      }
      if (typeof(params.feeRate) !== 'undefined') {
        return Math.max((params.feeRate * P2SH_INPUT_SIZE) / 1000, minInputValue);
      } else {
        return bitgo.estimateFee({
          numBlocks: params.feeTxConfirmTarget,
          maxFee: params.maxFeeRate
        })
        .then(function(feeRateEstimate) {
          return Math.max((feeRateEstimate.feePerKb * P2SH_INPUT_SIZE) / 1000, minInputValue);
        });
      }
    }).then(function(minInputValue) {
      // Don't spend inputs that cannot pay for their own cost.
      unspents = _.filter(unspents, function(unspent) {
        return unspent.value > minInputValue;
      });
      let segwitInputCount = 0;
      unspents.every(function(unspent) {
        if (unspent.witnessScript) {
          segwitInputCount++;
        }
        inputAmount += unspent.value;
        transaction.addInput(unspent.tx_hash, unspent.tx_output_n, 0xffffffff);

        return (inputAmount < (feeSingleKeySourceAddress ? totalOutputAmount : totalAmount));
      });

      // if paying fees from an external single key wallet, add the inputs
      if (feeSingleKeySourceAddress) {
        // collect the amount used in the fee inputs so we can get change later
        feeSingleKeyInputAmount = 0;
        feeSingleKeyUnspentsUsed = [];
        feeSingleKeyUnspents.every(function(unspent) {
          feeSingleKeyInputAmount += unspent.value;
          inputAmount += unspent.value;
          transaction.addInput(unspent.tx_hash, unspent.tx_output_n);
          feeSingleKeyUnspentsUsed.push(unspent);
          // use the fee wallet to pay miner fees and potentially instant fees
          return (feeSingleKeyInputAmount < (fee + (bitgoFeeInfo ? bitgoFeeInfo.amount : 0)));
        });
      }

      txInfo = {
        nP2SHInputs: transaction.tx.ins.length - (feeSingleKeySourceAddress ? 1 : 0) - segwitInputCount,
        nP2SHP2WSHInputs: segwitInputCount,
        nP2PKHInputs: feeSingleKeySourceAddress ? 1 : 0,
        nOutputs: (
          recipients.length + 1 + // recipients and change
          extraChangeAmounts.length + // extra change splitting
          (bitgoFeeInfo && bitgoFeeInfo.amount > 0 ? 1 : 0) + // add output for bitgo fee
          (feeSingleKeySourceAddress ? 1 : 0) // add single key source address change
        )
      };

      estTxSize = estimateTransactionSize({
        nP2SHInputs: txInfo.nP2SHInputs,
        nP2SHP2WSHInputs: txInfo.nP2SHP2WSHInputs,
        nP2PKHInputs: txInfo.nP2PKHInputs,
        nOutputs: txInfo.nOutputs
      });
    }).then(getDynamicFeeRateEstimate)
      .then(function() {
        minerFeeInfo = exports.calculateMinerFeeInfo({
          bitgo: params.wallet.bitgo,
          feeRate: feeRate,
          nP2SHInputs: txInfo.nP2SHInputs,
          nP2SHP2WSHInputs: txInfo.nP2SHP2WSHInputs,
          nP2PKHInputs: txInfo.nP2PKHInputs,
          nOutputs: txInfo.nOutputs
        });

        if (shouldComputeBestFee) {
          var approximateFee = minerFeeInfo.fee;
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
          var summedSingleKeyUnspents = _.sumBy(feeSingleKeyUnspents, 'value');
          if (totalFee > summedSingleKeyUnspents) {
            var err = new Error('Insufficient fee amount available in single key fee source: ' + summedSingleKeyUnspents);
            err.result = {
              fee: fee,
              feeRate: feeRate,
              estimatedSize: minerFeeInfo.size,
              available: inputAmount,
              bitgoFee: bitgoFeeInfo,
              txInfo: txInfo
            };
            return Q.reject(err);
          }
        }

        if (inputAmount < (feeSingleKeySourceAddress ? totalOutputAmount : totalAmount)) {
          // The unspents we're using for inputs do not have sufficient value on them to
          // satisfy the user's requested spend amount. That may be because the wallet's balance
          // is simply too low, or it might be that the wallet's balance is sufficient but
          // we didn't fetch enough unspents. Too few unspents could result from the wallet
          // having many small unspents and we hit our limit on the number of inputs we can use
          // in a txn, or it might have been that the filters the user passed in (like minConfirms)
          // disqualified too many of the unspents
          var err;
          if (totalUnspentsCount === fetchedUnspentsCount) {
            // we fetched every unspent the wallet had, but it still wasn't enough
            err = new Error('Insufficient funds');
          } else {
            // we weren't able to fetch all the unspents on the wallet
            err = new Error('Transaction size too large due to too many unspents. Can send only ' + inputAmount + ' satoshis in this transaction');
          }
          err.result = {
            fee: fee,
            feeRate: feeRate,
            estimatedSize: minerFeeInfo.size,
            available: inputAmount,
            bitgoFee: bitgoFeeInfo,
            txInfo: txInfo
          };
          return Q.reject(err);
        }
      });
  };

  // Add the outputs for this transaction.
  var collectOutputs = function() {
    if (minerFeeInfo.size >= 90000) {
      throw new Error('transaction too large: estimated size ' + minerFeeInfo.size + ' bytes');
    }

    var outputs = [];

    recipients.forEach(function(recipient) {
      var script;
      if (typeof(recipient.address) == 'string') {
        script = bitcoin.address.toOutputScript(recipient.address, bitcoin.getNetwork());
      } else if (typeof(recipient.script) === 'object') {
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
        throw new Error('negative change amount: ' + changeAmount);
      }

      var result = [];
      // if we paid fees from a single key wallet, return the fee change first
      if (feeSingleKeySourceAddress) {
        var feeSingleKeyWalletChangeAmount = feeSingleKeyInputAmount - (fee + (bitgoFeeInfo ? bitgoFeeInfo.amount : 0));
        if (feeSingleKeyWalletChangeAmount >= constants.minOutputSize) {
          result.push({address: feeSingleKeySourceAddress, amount: feeSingleKeyWalletChangeAmount});
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
            result.push({address: response.addresses[0].address, amount: changeAmount});
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
            // determine if segwit or not
            const isSegwit = bitgo.getConstants().enableSegwit;
            const changeChain = isSegwit ? 11 : 1;
            return params.wallet.createAddress({ chain: changeChain, validate: validate })
              .then(function(result) {
                return result.address;
              });
          }
        })
          .then(function(address) {
            result.push({address: address, amount: thisAmount});
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
  var serialize = function() {
    // only need to return the unspents that were used and just the chainPath, redeemScript, and instant flag
    var pickedUnspents = _.map(unspents, function(unspent) {
      return _.pick(unspent, ['chainPath', 'redeemScript', 'instant', 'witnessScript', 'value']);
    });
    var prunedUnspents = _.slice(pickedUnspents, 0, transaction.tx.ins.length - feeSingleKeyUnspentsUsed.length);
    _.each(feeSingleKeyUnspentsUsed, function(feeUnspent) {
      prunedUnspents.push({ redeemScript: false, chainPath: false }); // mark as false to signify a non-multisig address
    });
    var result = {
      transactionHex: transaction.buildIncomplete().toHex(),
      unspents: prunedUnspents,
      fee: fee,
      changeAddresses: changeOutputs.map(function(co) {
        return _.pick(co, ['address', 'path', 'amount']);
      }),
      walletId: params.wallet.id(),
      walletKeychains: params.wallet.keychains,
      feeRate: feeRate,
      instant: params.instant,
      bitgoFee: bitgoFeeInfo,
      estimatedSize: minerFeeInfo.size,
      txInfo: txInfo,
      travelInfos: travelInfos
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
      return Q.all([getBitGoFeeAddress(), getUnspents(), getUnspentsForSingleKey()]);
    })
    .then(collectInputs)
    .then(collectOutputs)
    .then(serialize);
};


/**
 * Estimate the size of a transaction in bytes based on the number of
 * inputs and outputs present.
 * @params params {
 *   nP2SHInputs: number of P2SH (multisig) inputs
 *   nP2PKHInputs: number of P2PKH (single sig) inputs
 *   nOutputs: number of outputs
 * }
 *
 * @returns size: estimated size of the transaction in bytes
 */
var estimateTransactionSize = function(params) {
  if (!_.isInteger(params.nP2SHInputs) || params.nP2SHInputs < 0) {
    throw new Error('expecting positive nP2SHInputs');
  }
  if (!_.isInteger(params.nP2PKHInputs) || params.nP2PKHInputs < 0) {
    throw new Error('expecting positive nP2PKHInputs to be numeric');
  }
  if (!_.isInteger(params.nP2SHP2WSHInputs) || params.nP2SHP2WSHInputs < 0) {
    throw new Error('expecting positive nP2SHP2WSHInputs to be numeric');
  }
  if ((params.nP2SHInputs + params.nP2SHP2WSHInputs) < 1) {
    throw new Error('expecting at least one nP2SHInputs or nP2SHP2WSHInputs');
  }
  if (!_.isInteger(params.nOutputs) || params.nOutputs < 1) {
    throw new Error('expecting positive nOutputs');
  }



  var estimatedSize = P2SH_INPUT_SIZE * params.nP2SHInputs +
    P2SH_P2WSH_INPUT_SIZE * (params.nP2SHP2WSHInputs || 0) +
    P2PKH_INPUT_SIZE * (params.nP2PKHInputs || 0) +
    OUTPUT_SIZE * params.nOutputs +
    // if the tx contains at least one segwit input, the tx overhead is increased by 1
    TX_OVERHEAD_SIZE + (params.nP2SHP2WSHInputs > 0 ? 1 : 0);

  return estimatedSize;
};


/**
 * Calculate the fee and estimated size in bytes for a transaction.
 * @params params {
 *   bitgo: bitgo object
 *   feeRate: satoshis per kilobyte
 *   nP2SHInputs: number of P2SH (multisig) inputs
 *   nP2PKHInputs: number of P2PKH (single sig) inputs
 *   nOutputs: number of outputs
 * }
 *
 * @returns {
 *   size: estimated size of the transaction in bytes
 *   fee: estimated fee in satoshis for the transaction
 *   feeRate: fee rate that was used to estimate the fee for the transaction
 * }
 */
exports.calculateMinerFeeInfo = function(params) {
  var feeRateToUse = params.feeRate || params.bitgo.getConstants().fallbackFeeRate;
  var estimatedSize = estimateTransactionSize(params);

  return {
    size: estimatedSize,
    fee: Math.ceil(estimatedSize * feeRateToUse / 1000),
    feeRate: feeRateToUse
  };
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
  if (typeof(params.transactionHex) !== 'string') {
    throw new Error('expecting the transaction hex as a string');
  }
  if (!Array.isArray(params.unspents)) {
    throw new Error('expecting the unspents array');
  }
  if (typeof(validate) !== 'boolean') {
    throw new Error('expecting validate to be a boolean');
  }
  if (typeof(keychain) !== 'object' || typeof(keychain.xprv) !== 'string') {
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

  var transaction = bitcoinCash.Transaction.fromHex(params.transactionHex);
  if (transaction.ins.length !== params.unspents.length) {
    throw new Error('length of unspents array should equal to the number of transaction inputs');
  }

  var hdPath;
  if (keychain) {
    var rootExtKey = bitcoin.HDNode.fromBase58(keychain.xprv);
    hdPath = bitcoin.hdPath(rootExtKey);
  }

  var txb = bitcoinCash.TransactionBuilder.fromTransaction(transaction, rootExtKey.keyPair.network);

  for (let index = 0; index < txb.tx.ins.length; ++index) {
    const currentUnspent = params.unspents[index];
    if (currentUnspent.redeemScript === false) {
      // this is the input from a single key fee address
      if (!feeSingleKey) {
        throw new Error('single key address used in input but feeSingleKeyWIF not provided');
      }

      txb.sign(index, feeSingleKey);
      continue;
    }

    const chainPath = currentUnspent.chainPath;
    if (hdPath) {
      var subPath = keychain.walletSubPath || '/0/0';
      var path = keychain.path + subPath + chainPath;
      privKey = hdPath.deriveKey(path);
    }

    const isSegwitInput = !!currentUnspent.witnessScript;

    // subscript is the part of the output script after the OP_CODESEPARATOR.
    // Since we are only ever signing p2sh outputs, which do not have
    // OP_CODESEPARATORS, it is always the output script.
    let subscript = new Buffer(currentUnspent.redeemScript, 'hex');
    currentUnspent.validationScript = subscript;

    // In order to sign with bitcoinjs-lib, we must use its transaction
    // builder, confusingly named the same exact thing as our transaction
    // builder, but with inequivalent behavior.
    try {
      if (isSegwitInput) {
        const witnessScript = new Buffer(currentUnspent.witnessScript, 'hex');
        currentUnspent.validationScript = witnessScript;
        txb.sign(index, privKey, subscript, bitcoin.Transaction.SIGHASH_ALL, currentUnspent.value, witnessScript);
      } else {
        txb.sign(index, privKey, subscript, bitcoin.Transaction.SIGHASH_ALL);
      }
    } catch (e) {
      return Q.reject('Failed to sign input #' + index);
    }

  }

  // reserialize transaction
  transaction = txb.build();

  for (let index = 0; index < transaction.ins.length; ++index) {
    // bitcoinjs-lib adds one more OP_0 than we need. It creates one OP_0 for
    // every n public keys in an m-of-n multisig, and replaces the OP_0s with
    // the signature of the nth public key, then removes any remaining OP_0s
    // at the end. This behavior is not incorrect and valid for some use
    // cases, particularly if you do not know which keys will be signing the
    // transaction and the signatures may be added to the transaction in any
    // chronological order, but is not compatible with the BitGo API, which
    // assumes m OP_0s for m-of-n multisig (or m-1 after the first signature
    // is created). Thus we need to remove the superfluous OP_0.

    const currentUnspent = params.unspents[index];

    // The signatures are validated server side and on the bitcoin network, so
    // the signature validation is optional and can be disabled by setting:
    // validate = false
    if (validate) {
      if (exports.verifyInputSignatures(transaction, index, currentUnspent.validationScript, false, currentUnspent.value) !== -1) {
        throw new Error('number of signatures is invalid - something went wrong when signing');
      }
    }
  }

  return Q.when({
    transactionHex: transaction.toHex()
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
 * @param amount
 * @returns {number}
 */
exports.verifyInputSignatures = function(transaction, inputIndex, pubScript, ignoreKeyIndices, amount) {
  if (inputIndex < 0 || inputIndex >= transaction.ins.length) {
    throw new Error('illegal index');
  }

  ignoreKeyIndices = ignoreKeyIndices || [];
  const currentTransactionInput = transaction.ins[inputIndex];
  var sigScript = currentTransactionInput.script;
  var sigsNeeded = 1;
  var sigs = [];
  var pubKeys = [];
  var decompiledSigScript = bitcoin.script.decompile(sigScript);

  const isSegwitInput = currentTransactionInput.witness.length > 0;
  if (isSegwitInput) {
    decompiledSigScript = currentTransactionInput.witness;
    sigScript = bitcoin.script.compile(decompiledSigScript);
    if (!amount) {
      return 0;
    }
  }

  // Check the script type to determine number of signatures, the pub keys, and the script to hash.
  const inputClassification = bitcoinCash.script.classifyInput(sigScript, true);
  switch (inputClassification) {
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
        if (_.includes(ignoreKeyIndices, index - 1)) {
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

  let numVerifiedSignatures = 0;
  for (let sigIndex = 0; sigIndex < sigs.length; ++sigIndex) {
    // If this is an OP_0, then its been left as a placeholder for a future sig.
    if (sigs[sigIndex] === bitcoin.opcodes.OP_0) {
      continue;
    }

    var hashType = sigs[sigIndex][sigs[sigIndex].length - 1];
    sigs[sigIndex] = sigs[sigIndex].slice(0, sigs[sigIndex].length - 1); // pop hash type from end
    let signatureHash;
    if (isSegwitInput) {
      signatureHash = transaction.hashForWitnessV0(inputIndex, pubScript, amount, hashType);
    } else {
      signatureHash = transaction.hashForSignature(inputIndex, pubScript, hashType);
    }

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
