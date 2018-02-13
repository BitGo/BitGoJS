//
// TransactionBuilder
// A utility for building and signing transactions
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

const Promise = require('bluebird');
const bitcoin = require('./bitcoin');
const config = require('./config');
const _ = require('lodash');

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
//   minUnspentSize: The minimum size in satoshis of unspent to use (to prevent spending unspents worth less than fee added). Defaults to 0.
//   feeSingleKeySourceAddress: Use this single key address to pay fees
//   feeSingleKeyWIF: Use the address based on this private key to pay fees
exports.createTransaction = function(params) {
  const minConfirms = params.minConfirms || 0;
  const validate = params.validate === undefined ? true : params.validate;
  let recipients = [];
  let opReturns = [];
  let extraChangeAmounts = [];
  let estTxSize;
  let travelInfos;

  // Sanity check the arguments passed in
  if (!_.isObject(params.wallet) ||
  (params.fee && !_.isNumber(params.fee)) ||
  (params.feeRate && !_.isNumber(params.feeRate)) ||
  !_.isInteger(minConfirms) ||
  (params.forceChangeAtEnd && !_.isBoolean(params.forceChangeAtEnd)) ||
  (params.changeAddress && !_.isString(params.changeAddress)) ||
  (params.noSplitChange && !_.isBoolean(params.noSplitChange)) ||
  (params.targetWalletUnspents && !_.isInteger(params.targetWalletUnspents)) ||
  (validate && !_.isBoolean(validate)) ||
  (params.enforceMinConfirmsForChange && !_.isBoolean(params.enforceMinConfirmsForChange)) ||
  (params.minUnspentSize && !_.isNumber(params.minUnspentSize)) ||
  (params.maxFeeRate && !_.isNumber(params.maxFeeRate)) ||
  // this should be an array and its length must be at least 1
  (params.unspents && (!Array.isArray(params.unspents) || params.unspents.length < 1)) ||
  (params.feeTxConfirmTarget && !_.isInteger(params.feeTxConfirmTarget)) ||
  (params.instant && !_.isBoolean(params.instant)) ||
  (params.bitgoFee && !_.isObject(params.bitgoFee))
  ) {
    throw new Error('invalid argument');
  }

  const bitgo = params.wallet.bitgo;
  const constants = bitgo.getConstants();

  // The user can specify a seperate, single-key wallet for the purposes of paying miner's fees
  // When creating a transaction this can be specified as an input address or the private key in WIF
  let feeSingleKeySourceAddress;
  let feeSingleKeyInputAmount = 0;
  if (params.feeSingleKeySourceAddress) {
    try {
      bitcoin.address.fromBase58Check(params.feeSingleKeySourceAddress);
      feeSingleKeySourceAddress = params.feeSingleKeySourceAddress;
    } catch (e) {
      throw new Error('invalid bitcoin address: ' + params.feeSingleKeySourceAddress);
    }
  }

  if (params.feeSingleKeyWIF) {
    const feeSingleKey = bitcoin.ECPair.fromWIF(params.feeSingleKeyWIF, bitcoin.getNetwork());
    feeSingleKeySourceAddress = feeSingleKey.getAddress();
    // If the user specifies both, check to make sure the feeSingleKeySourceAddress corresponds to the address of feeSingleKeyWIF
    if (params.feeSingleKeySourceAddress &&
    params.feeSingleKeySourceAddress !== feeSingleKeySourceAddress) {
      throw new Error('feeSingleKeySourceAddress: ' + params.feeSingleKeySourceAddress +
      ' did not correspond to address of feeSingleKeyWIF: ' + feeSingleKeySourceAddress);
    }
  }

  if (!_.isObject(params.recipients)) {
    throw new Error('recipients must be array of { address: abc, amount: 100000 } objects');
  }

  const feeParamsDefined = (!_.isUndefined(params.fee)) +
  (!_.isUndefined(params.feeRate)) +
  (!_.isUndefined(params.feeTxConfirmTarget));
  if (feeParamsDefined > 1) {
    throw new Error('cannot specify more than one of fee, feeRate and feeTxConfirmTarget');
  }

  if (_.isUndefined(params.maxFeeRate)) {
    params.maxFeeRate = constants.maxFeeRate;
  }

  // Convert the old format of params.recipients (dictionary of address:amount) to new format: { destinationAddress, amount }
  if (!(params.recipients instanceof Array)) {
    recipients = [];
    Object.keys(params.recipients).forEach(function(destinationAddress) {
      const amount = params.recipients[destinationAddress];
      recipients.push({ address: destinationAddress, amount: amount });
    });
  } else {
    recipients = params.recipients;
  }

  if (params.opReturns) {
    if (!(params.opReturns instanceof Array)) {
      opReturns = [];
      Object.keys(params.opReturns).forEach(function(message) {
        const amount = params.opReturns[message];
        opReturns.push({ message, amount });
      });
    } else {
      opReturns = params.opReturns;
    }
  }

  if (recipients.length === 0 && opReturns.length === 0) {
    throw new Error('must have at least one recipient');
  }

  let fee = params.fee;
  let feeRate = params.feeRate;

  // Flag indicating whether this class will compute the fee
  const shouldComputeBestFee = (_.isUndefined(fee));

  let totalOutputAmount = 0;

  recipients.forEach(function(recipient) {
    if (_.isString(recipient.address)) {
      try {
        bitcoin.address.fromBase58Check(recipient.address);
      } catch (e) {
        throw new Error('invalid bitcoin address: ' + recipient.address);
      }
      if (!!recipient.script) {
        // A script was provided as well - validate that the address corresponds to that
        if (bitcoin.address.toOutputScript(recipient.address, bitcoin.getNetwork())
        .toString('hex') !== recipient.script) {
          throw new Error('both script and address provided but they did not match: ' + recipient.address + ' ' + recipient.script);
        }
      }
    }
    if (!_.isInteger(recipient.amount) || recipient.amount < 0) {
      throw new Error('invalid amount for ' + recipient.address + ': ' + recipient.amount);
    }
    totalOutputAmount += recipient.amount;
  });

  opReturns.forEach(function(opReturn) {
    totalOutputAmount += opReturn.amount;
  });

  let bitgoFeeInfo = params.bitgoFee;
  if (bitgoFeeInfo &&
  (!_.isInteger(bitgoFeeInfo.amount) || !_.isString(bitgoFeeInfo.address))) {
    throw new Error('invalid bitgoFeeInfo');
  }

  // The total amount needed for this transaction.
  let totalAmount = totalOutputAmount + (fee || 0);

  // The list of unspent transactions being used in this transaction.
  let unspents;

  // the total number of unspents on this wallet
  let totalUnspentsCount;

  // the number of unspents we fetched from the server, before filtering
  let fetchedUnspentsCount;

  // The list of unspent transactions being used with zero-confirmations
  let zeroConfUnspentTxIds;

  // The sum of the input values for this transaction.
  let inputAmount;

  let changeOutputs = [];

  // The transaction.
  let transaction = new bitcoin.TransactionBuilder(bitcoin.getNetwork());

  const getBitGoFee = function() {
    return Promise.try(function() {
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

  const getBitGoFeeAddress = function() {
    return Promise.try(function() {
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
  const getDynamicFeeRateEstimate = function() {
    if (params.feeTxConfirmTarget || !feeParamsDefined) {
      return bitgo.estimateFee({
        numBlocks: params.feeTxConfirmTarget,
        maxFee: params.maxFeeRate,
        inputs: zeroConfUnspentTxIds,
        txSize: estTxSize,
        cpfpAware: true
      })
      .then(function(result) {
        const estimatedFeeRate = result.cpfpFeePerKb;
        const minimum = params.instant ? Math.max(constants.minFeeRate, constants.minInstantFeeRate) : constants.minFeeRate;
        // 5 satoshis per byte
        // it is worth noting that the padding only applies when the threshold is crossed, but not when the delta is less than the padding
        const padding = 5000;
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
          return Promise.reject(e);
        } else {
          // couldn't estimate the fee, proceed using the default
          feeRate = constants.fallbackFeeRate;
          console.log('Error estimating fee for send from ' + params.wallet.id() + ': ' + e.message);
          return Promise.resolve();
        }
      });
    }
  };


  // Get the unspents for the sending wallet.
  const getUnspents = function() {

    if (params.unspents) { // we just wanna use custom unspents
      unspents = params.unspents;
      return;
    }

    // Get enough unspents for the requested amount
    const options = {
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
        const confirms = u.confirmations || 0;
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
  let feeSingleKeyUnspents = [];
  const getUnspentsForSingleKey = function() {
    if (feeSingleKeySourceAddress) {
      let feeTarget = 0.01e8;
      if (params.instant) {
        feeTarget += totalAmount * 0.001;
      }
      return bitgo.get(bitgo.url('/address/' + feeSingleKeySourceAddress + '/unspents?target=' + feeTarget))
      .then(function(response) {
        if (response.body.total <= 0) {
          throw new Error('No unspents available in single key fee source');
        }
        feeSingleKeyUnspents = response.body.unspents;
      });
    }
  };

  let minerFeeInfo = {};
  let txInfo = {};

  // Iterate unspents, sum the inputs, and save _inputs with the total
  // input amount and final list of inputs to use with the transaction.
  let feeSingleKeyUnspentsUsed = [];

  const collectInputs = function() {
    if (!unspents.length) {
      throw new Error('no unspents available on wallet');
    }
    inputAmount = 0;

    // Calculate the cost of spending a single input, i.e. the smallest economical unspent value
    return Promise.try(function() {

      if (_.isNumber(params.feeRate) || _.isNumber(params.originalFeeRate)) {
        return (!_.isUndefined(params.feeRate) ? params.feeRate : params.originalFeeRate);
      } else {
        return bitgo.estimateFee({
          numBlocks: params.feeTxConfirmTarget,
          maxFee: params.maxFeeRate
        })
        .then(function(feeRateEstimate) {
          return feeRateEstimate.feePerKb;
        });
      }
    }).then(function(feeRate) {
      // Don't spend inputs that cannot pay for their own cost.
      let minInputValue = 0;
      if (_.isInteger(params.minUnspentSize)) {
        minInputValue = params.minUnspentSize;
      }

      let prunedUnspentCount = 0;
      const originalUnspentCount = unspents.length;
      unspents = _.filter(unspents, function(unspent) {
        const isSegwitInput = !!unspent.witnessScript;
        const currentInputSize = isSegwitInput ? config.tx.P2SH_P2WSH_INPUT_SIZE : config.tx.P2SH_INPUT_SIZE;
        const feeBasedMinInputValue = (feeRate * currentInputSize) / 1000;
        const currentMinInputValue = Math.max(minInputValue, feeBasedMinInputValue);
        if (currentMinInputValue > unspent.value) {
          // pruning unspent
          const pruneDetails = {
            generalMinInputValue: minInputValue,
            feeBasedMinInputValue,
            currentMinInputValue,
            feeRate,
            inputSize: currentInputSize,
            unspent: unspent
          };
          console.log(`pruning unspent: ${JSON.stringify(pruneDetails, null, 4)}`);
          prunedUnspentCount++;
          return false;
        }
        return true;
      });

      if (prunedUnspentCount > 0) {
        console.log(`pruned ${prunedUnspentCount} out of ${originalUnspentCount} unspents`);
      }

      if (unspents.length === 0) {
        throw new Error('insufficient funds');
      }
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
        const approximateFee = minerFeeInfo.fee;
        const shouldRecurse = _.isUndefined(fee) || approximateFee > fee;
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

      const totalFee = fee + (bitgoFeeInfo ? bitgoFeeInfo.amount : 0);

      if (feeSingleKeySourceAddress) {
        const summedSingleKeyUnspents = _.sumBy(feeSingleKeyUnspents, 'value');
        if (totalFee > summedSingleKeyUnspents) {
          const err = new Error('Insufficient fee amount available in single key fee source: ' + summedSingleKeyUnspents);
          err.result = {
            fee: fee,
            feeRate: feeRate,
            estimatedSize: minerFeeInfo.size,
            available: inputAmount,
            bitgoFee: bitgoFeeInfo,
            txInfo: txInfo
          };
          return Promise.reject(err);
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
        let err;
        if (totalUnspentsCount === fetchedUnspentsCount) {
          // we fetched every unspent the wallet had, but it still wasn't enough
          err = new Error('Insufficient funds');
        } else {
          // we weren't able to fetch all the unspents on the wallet
          err = new Error(`Transaction size too large due to too many unspents. Can send only ${inputAmount} satoshis in this transaction`);
        }
        err.result = {
          fee: fee,
          feeRate: feeRate,
          estimatedSize: minerFeeInfo.size,
          available: inputAmount,
          bitgoFee: bitgoFeeInfo,
          txInfo: txInfo
        };
        return Promise.reject(err);
      }
    });
  };

  // Add the outputs for this transaction.
  const collectOutputs = function() {
    if (minerFeeInfo.size >= 90000) {
      throw new Error('transaction too large: estimated size ' + minerFeeInfo.size + ' bytes');
    }

    const outputs = [];

    recipients.forEach(function(recipient) {
      let script;
      if (_.isString(recipient.address)) {
        script = bitcoin.address.toOutputScript(recipient.address, bitcoin.getNetwork());
      } else if (_.isObject(recipient.script)) {
        script = recipient.script;
      } else {
        throw new Error('neither recipient address nor script was provided');
      }

      // validate travelInfo if it exists
      let travelInfo;
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

    opReturns.forEach(function({ message, amount }) {
      const script = bitcoin.script.fromASM('OP_RETURN ' + Buffer.from(message).toString('hex'));
      outputs.push({ script, amount });
    });

    const getChangeOutputs = function(changeAmount) {
      if (changeAmount < 0) {
        throw new Error('negative change amount: ' + changeAmount);
      }

      const result = [];
      // if we paid fees from a single key wallet, return the fee change first
      if (feeSingleKeySourceAddress) {
        const feeSingleKeyWalletChangeAmount = feeSingleKeyInputAmount - (fee + (bitgoFeeInfo ? bitgoFeeInfo.amount : 0));
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

      let extraChangeTotal = _.sum(extraChangeAmounts);
      // Sanity check
      if (extraChangeTotal > changeAmount) {
        extraChangeAmounts = [];
        extraChangeTotal = 0;
      }

      // copy and add remaining change amount
      const allChangeAmounts = extraChangeAmounts.slice(0);
      allChangeAmounts.push(changeAmount - extraChangeTotal);

      // Recursive async func to add all change outputs
      const addChangeOutputs = function() {
        const thisAmount = allChangeAmounts.shift();
        if (!thisAmount) {
          return result;
        }
        return Promise.try(function() {
          if (params.changeAddress) {
            // If user passed a change address, use it for all outputs
            return params.changeAddress;
          } else {
            // Otherwise create a new address per output, for privacy
            // determine if segwit or not
            const changeChain = params.wallet.getChangeChain(params);
            return params.wallet.createAddress({ chain: changeChain, validate: validate })
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
    return Promise.try(function() {
      return getChangeOutputs(inputAmount - totalAmount);
    })
    .then(function(result) {
      changeOutputs = result;
      const extraOutputs = changeOutputs.concat([]); // copy the array
      if (bitgoFeeInfo && bitgoFeeInfo.amount > 0) {
        extraOutputs.push(bitgoFeeInfo);
      }
      extraOutputs.forEach(function(output) {
        output.script = bitcoin.address.toOutputScript(output.address, bitcoin.getNetwork());

        // decide where to put the outputs - default is to randomize unless forced to end
        const outputIndex = params.forceChangeAtEnd ? outputs.length : _.random(0, outputs.length);
        outputs.splice(outputIndex, 0, output);
      });

      // Add all outputs to the transaction
      outputs.forEach(function(output) {
        transaction.addOutput(output.script, output.amount);
      });

      travelInfos = _(outputs).map(function(output, index) {
        const result = output.travelInfo;
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
  const serialize = function() {
    // only need to return the unspents that were used and just the chainPath, redeemScript, and instant flag
    const pickedUnspents = _.map(unspents, function(unspent) {
      return _.pick(unspent, ['chainPath', 'redeemScript', 'instant', 'witnessScript', 'script', 'value']);
    });
    const prunedUnspents = _.slice(pickedUnspents, 0, transaction.tx.ins.length - feeSingleKeyUnspentsUsed.length);
    _.each(feeSingleKeyUnspentsUsed, function(feeUnspent) {
      prunedUnspents.push({ redeemScript: false, chainPath: false }); // mark as false to signify a non-multisig address
    });
    const result = {
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

  return Promise.try(function() {
    return getBitGoFee();
  })
  .then(function() {
    return Promise.all([getBitGoFeeAddress(), getUnspents(), getUnspentsForSingleKey()]);
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
const estimateTransactionSize = function(params) {
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


  const estimatedSize = config.tx.P2SH_INPUT_SIZE * params.nP2SHInputs +
  config.tx.P2SH_P2WSH_INPUT_SIZE * (params.nP2SHP2WSHInputs || 0) +
  config.tx.P2PKH_INPUT_SIZE * (params.nP2PKHInputs || 0) +
  config.tx.OUTPUT_SIZE * params.nOutputs +
  // if the tx contains at least one segwit input, the tx overhead is increased by 1
  config.tx.TX_OVERHEAD_SIZE + (params.nP2SHP2WSHInputs > 0 ? 1 : 0);

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
  const feeRateToUse = params.feeRate || params.bitgo.getConstants().fallbackFeeRate;
  const estimatedSize = estimateTransactionSize(params);

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
  let keychain = params.keychain; // duplicate so as to not mutate below

  const validate = (params.validate === undefined) ? true : params.validate;
  let privKey;
  if (!_.isString(params.transactionHex)) {
    throw new Error('expecting the transaction hex as a string');
  }
  if (!Array.isArray(params.unspents)) {
    throw new Error('expecting the unspents array');
  }
  if (!_.isBoolean(validate)) {
    throw new Error('expecting validate to be a boolean');
  }
  if (!_.isObject(keychain) || !_.isString(keychain.xprv)) {
    if (_.isString(params.signingKey)) {
      privKey = bitcoin.ECPair.fromWIF(params.signingKey, bitcoin.getNetwork());
      keychain = undefined;
    } else {
      throw new Error('expecting the keychain object with xprv');
    }
  }

  let feeSingleKey;
  if (params.feeSingleKeyWIF) {
    feeSingleKey = bitcoin.ECPair.fromWIF(params.feeSingleKeyWIF, bitcoin.getNetwork());
  }

  let transaction = bitcoin.Transaction.fromHex(params.transactionHex);
  if (transaction.ins.length !== params.unspents.length) {
    throw new Error('length of unspents array should equal to the number of transaction inputs');
  }

  let hdPath;
  let rootExtKey;
  if (keychain) {
    rootExtKey = bitcoin.HDNode.fromBase58(keychain.xprv);
    hdPath = bitcoin.hdPath(rootExtKey);
  }

  const txb = bitcoin.TransactionBuilder.fromTransaction(transaction, _.get(rootExtKey, 'keyPair.network', bitcoin.getNetwork()));
  const enableBCH = (_.isBoolean(params.forceBCH) && params.forceBCH === true);
  if (enableBCH) {
    txb.enableBitcoinCash(enableBCH);
    txb.setVersion(2);
  }

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
      const subPath = keychain.walletSubPath || '/0/0';
      const path = keychain.path + subPath + chainPath;
      privKey = hdPath.deriveKey(path);
    }

    const isSegwitInput = !!currentUnspent.witnessScript;

    // subscript is the part of the output script after the OP_CODESEPARATOR.
    // Since we are only ever signing p2sh outputs, which do not have
    // OP_CODESEPARATORS, it is always the output script.
    const subscript = new Buffer(currentUnspent.redeemScript, 'hex');
    currentUnspent.validationScript = subscript;

    // In order to sign with bitcoinjs-lib, we must use its transaction
    // builder, confusingly named the same exact thing as our transaction
    // builder, but with inequivalent behavior.
    try {

      if (isSegwitInput) {
        let signatures = _.cloneDeep(txb.inputs[index].signatures);
        const witnessScript = new Buffer(currentUnspent.witnessScript, 'hex');
        currentUnspent.validationScript = witnessScript;
        txb.sign(index, privKey, subscript, bitcoin.Transaction.SIGHASH_ALL, currentUnspent.value, witnessScript);

        if (Array.isArray(signatures)) {
          // for segwit inputs, if they are partially signed, bitcoinjs-lib overrides previous signatures
          // this workaround forces them to be preserved
          signatures = signatures.filter(sig => !!sig);
          // Last, override builder's signatures property to an array including previous signatures, if there are any.
          const builderSignatures = txb.inputs[index].signatures;
          const nonEmptySignatures = _.remove(builderSignatures, sig => !!sig);
          signatures.push.apply(signatures, nonEmptySignatures);
          txb.inputs[index].signatures = signatures;
        }

      } else {
        // only if bitcoin cash is enabled, which should only be in unit tests anyway
        const bchParameter = enableBCH ? currentUnspent.value : undefined;
        let sigHashType = bitcoin.Transaction.SIGHASH_ALL;
        if (enableBCH) {
          sigHashType |= bitcoin.Transaction.SIGHASH_BITCOINCASHBIP143;
        }
        txb.sign(index, privKey, subscript, sigHashType, bchParameter);
      }

    } catch (e) {
      // we need to know what's causing this
      e.result = {
        unspent: currentUnspent
      };
      e.message = `${e.message} — ${JSON.stringify(e.result, null, 4)}`;
      console.trace(e);
      return Promise.reject('Failed to sign input #' + index);
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
      const signatureCount = exports.verifyInputSignatures(transaction, index, currentUnspent.validationScript, false, currentUnspent.value, enableBCH);
      // TODO: figure out something smarter for half-signed

      // if params.fullLocalSigning is set to true, we allow custom non-zero values
      // otherwise, the signature count has to be -1

      const fullLocalSigning = !!params.fullLocalSigning;
      if (signatureCount === 0 || (!fullLocalSigning && signatureCount !== -1)) {
        // if the signature count is positive, we do not want to throw the error, because it is expected
        throw new Error('number of signatures is invalid - something went wrong when signing');
      }

    }
  }

  return Promise.resolve({
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
exports.verifyInputSignatures = function(transaction, inputIndex, pubScript, ignoreKeyIndices, amount, isBCH = false) {
  if (inputIndex < 0 || inputIndex >= transaction.ins.length) {
    throw new Error('illegal index');
  }

  ignoreKeyIndices = ignoreKeyIndices || [];
  const currentTransactionInput = transaction.ins[inputIndex];
  let sigScript = currentTransactionInput.script;
  let sigsNeeded = 1;
  const sigs = [];
  const pubKeys = [];
  let decompiledSigScript = bitcoin.script.decompile(sigScript);

  const isSegwitInput = currentTransactionInput.witness.length > 0;
  if (isSegwitInput) {
    decompiledSigScript = currentTransactionInput.witness;
    sigScript = bitcoin.script.compile(decompiledSigScript);
    if (!amount) {
      return 0;
    }
  }

  // Check the script type to determine number of signatures, the pub keys, and the script to hash.
  const inputClassification = bitcoin.script.classifyInput(sigScript, true);
  switch (inputClassification) {
    case 'scripthash':
      // Replace the pubScript with the P2SH Script.
      pubScript = decompiledSigScript[decompiledSigScript.length - 1];
      const decompiledPubScript = bitcoin.script.decompile(pubScript);
      sigsNeeded = decompiledPubScript[0] - bitcoin.opcodes.OP_1 + 1;
      for (let index = 1; index < decompiledSigScript.length - 1; ++index) {
        sigs.push(decompiledSigScript[index]);
      }
      for (let index = 1; index < decompiledPubScript.length - 2; ++index) {
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

    const hashType = sigs[sigIndex][sigs[sigIndex].length - 1];
    sigs[sigIndex] = sigs[sigIndex].slice(0, sigs[sigIndex].length - 1); // pop hash type from end
    let signatureHash;
    if (isSegwitInput) {
      signatureHash = transaction.hashForWitnessV0(inputIndex, pubScript, amount, hashType);
    } else if (isBCH) {
      signatureHash = transaction.hashForCashSignature(inputIndex, pubScript, amount, hashType);
    } else {
      signatureHash = transaction.hashForSignature(inputIndex, pubScript, hashType);
    }

    let validSig = false;

    // Enumerate the possible public keys
    for (let pubKeyIndex = 0; pubKeyIndex < pubKeys.length; ++pubKeyIndex) {
      const pubKey = bitcoin.ECPair.fromPublicKeyBuffer(pubKeys[pubKeyIndex]);
      const signature = bitcoin.ECSignature.fromDER(sigs[sigIndex]);
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
