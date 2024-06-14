/**
 * @hidden
 */

/**
 */
//
// TransactionBuilder
// A utility for building and signing transactions
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

import { bip32 } from '@bitgo/utxo-lib';
import * as Bluebird from 'bluebird';
import * as utxolib from '@bitgo/utxo-lib';
import * as _ from 'lodash';
import { VirtualSizes } from '@bitgo/unspents';
import debugLib = require('debug');
const debug = debugLib('bitgo:v1:txb');
import { common, getAddressP2PKH, getNetwork, sanitizeLegacyPath } from '@bitgo/sdk-core';
import { verifyAddress } from './verifyAddress';

interface BaseOutput {
  amount: number;
  travelInfo?: any;
}

interface AddressOutput extends BaseOutput {
  address: string;
}

interface ScriptOutput extends BaseOutput {
  script: Buffer;
}

type Output = AddressOutput | ScriptOutput;

interface BitGoUnspent {
  value: number;
  tx_hash: Buffer;
  tx_output_n: number;
}

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
//   unspentsFetchParams: Extra parameters to use for fetching unspents for this transaction
//   unspents: array of unspent objects to use while constructing the transaction instead of fetching from the API
exports.createTransaction = function (params) {
  const minConfirms = params.minConfirms || 0;
  const validate = params.validate === undefined ? true : params.validate;
  let recipients: { address: string; amount: number; script?: string; travelInfo?: any }[] = [];
  let opReturns: { message: string; amount: number }[] = [];
  let extraChangeAmounts: number[] = [];
  let estTxSize: number;
  let travelInfos;

  // Sanity check the arguments passed in
  if (
    !_.isObject(params.wallet) ||
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
    (params.bitgoFee && !_.isObject(params.bitgoFee)) ||
    (params.unspentsFetchParams && !_.isObject(params.unspentsFetchParams))
  ) {
    throw new Error('invalid argument');
  }

  const bitgo = params.wallet.bitgo;
  const constants = bitgo.getConstants();
  const network = getNetwork(common.Environments[bitgo.getEnv()].network);

  // The user can specify a seperate, single-key wallet for the purposes of paying miner's fees
  // When creating a transaction this can be specified as an input address or the private key in WIF
  let feeSingleKeySourceAddress;
  let feeSingleKeyInputAmount = 0;
  if (params.feeSingleKeySourceAddress) {
    try {
      utxolib.address.fromBase58Check(params.feeSingleKeySourceAddress, network);
      feeSingleKeySourceAddress = params.feeSingleKeySourceAddress;
    } catch (e) {
      throw new Error('invalid bitcoin address: ' + params.feeSingleKeySourceAddress);
    }
  }

  if (params.feeSingleKeyWIF) {
    const feeSingleKey = utxolib.ECPair.fromWIF(params.feeSingleKeyWIF, network as utxolib.BitcoinJSNetwork);
    feeSingleKeySourceAddress = getAddressP2PKH(feeSingleKey);
    // If the user specifies both, check to make sure the feeSingleKeySourceAddress corresponds to the address of feeSingleKeyWIF
    if (params.feeSingleKeySourceAddress && params.feeSingleKeySourceAddress !== feeSingleKeySourceAddress) {
      throw new Error(
        'feeSingleKeySourceAddress: ' +
          params.feeSingleKeySourceAddress +
          ' did not correspond to address of feeSingleKeyWIF: ' +
          feeSingleKeySourceAddress
      );
    }
  }

  if (!_.isObject(params.recipients)) {
    throw new Error('recipients must be array of { address: abc, amount: 100000 } objects');
  }

  let feeParamsDefined = 0;
  if (!_.isUndefined(params.fee)) {
    feeParamsDefined++;
  }

  if (!_.isUndefined(params.feeRate)) {
    feeParamsDefined++;
  }

  if (!_.isUndefined(params.feeTxConfirmTarget)) {
    feeParamsDefined++;
  }

  if (feeParamsDefined > 1) {
    throw new Error('cannot specify more than one of fee, feeRate and feeTxConfirmTarget');
  }

  if (_.isUndefined(params.maxFeeRate)) {
    params.maxFeeRate = constants.maxFeeRate;
  }

  // Convert the old format of params.recipients (dictionary of address:amount) to new format: { destinationAddress, amount }
  if (!(params.recipients instanceof Array)) {
    recipients = [];
    Object.keys(params.recipients).forEach(function (destinationAddress) {
      const amount = params.recipients[destinationAddress];
      recipients.push({ address: destinationAddress, amount: amount });
    });
  } else {
    recipients = params.recipients;
  }

  if (params.opReturns) {
    if (!(params.opReturns instanceof Array)) {
      opReturns = [];
      Object.keys(params.opReturns).forEach(function (message) {
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
  const shouldComputeBestFee = _.isUndefined(fee);

  let totalOutputAmount = 0;

  recipients.forEach(function (recipient) {
    if (_.isString(recipient.address)) {
      if (!verifyAddress(recipient.address, network)) {
        throw new Error('invalid bitcoin address: ' + recipient.address);
      }
      if (!!recipient.script) {
        // A script was provided as well - validate that the address corresponds to that
        if (utxolib.address.toOutputScript(recipient.address, network).toString('hex') !== recipient.script) {
          throw new Error(
            'both script and address provided but they did not match: ' + recipient.address + ' ' + recipient.script
          );
        }
      }
    }
    if (!_.isInteger(recipient.amount) || recipient.amount < 0) {
      throw new Error('invalid amount for ' + recipient.address + ': ' + recipient.amount);
    }
    totalOutputAmount += recipient.amount;
  });

  opReturns.forEach(function (opReturn) {
    totalOutputAmount += opReturn.amount;
  });

  let bitgoFeeInfo = params.bitgoFee;
  if (bitgoFeeInfo && (!_.isInteger(bitgoFeeInfo.amount) || !_.isString(bitgoFeeInfo.address))) {
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

  let changeOutputs: Output[] = [];

  let containsUncompressedPublicKeys = false;

  // The transaction.
  let transaction = utxolib.bitgo.createTransactionBuilderForNetwork(network);

  const getBitGoFee = function () {
    return Bluebird.try(function () {
      if (bitgoFeeInfo) {
        return;
      }
      return params.wallet.getBitGoFee({ amount: totalOutputAmount, instant: params.instant }).then(function (result) {
        if (result && result.fee > 0) {
          bitgoFeeInfo = {
            amount: result.fee,
          };
        }
      });
    }).then(function () {
      if (bitgoFeeInfo && bitgoFeeInfo.amount > 0) {
        totalAmount += bitgoFeeInfo.amount;
      }
    });
  };

  const getBitGoFeeAddress = function () {
    return Bluebird.try(function () {
      // If we don't have bitgoFeeInfo, or address is already set, don't get a new one
      if (!bitgoFeeInfo || bitgoFeeInfo.address) {
        return;
      }
      return bitgo.getBitGoFeeAddress().then(function (result) {
        bitgoFeeInfo.address = result.address;
      });
    });
  };

  // Get a dynamic fee estimate from the BitGo server if feeTxConfirmTarget
  // is specified or if no fee-related params are specified
  const getDynamicFeeRateEstimate = function () {
    if (params.feeTxConfirmTarget || !feeParamsDefined) {
      return bitgo
        .estimateFee({
          numBlocks: params.feeTxConfirmTarget,
          maxFee: params.maxFeeRate,
          inputs: zeroConfUnspentTxIds,
          txSize: estTxSize,
          cpfpAware: true,
        })
        .then(function (result) {
          const estimatedFeeRate = result.cpfpFeePerKb;
          const minimum = params.instant
            ? Math.max(constants.minFeeRate, constants.minInstantFeeRate)
            : constants.minFeeRate;
          // 5 satoshis per byte
          // it is worth noting that the padding only applies when the threshold is crossed, but not when the delta is less than the padding
          const padding = 5000;
          if (estimatedFeeRate < minimum) {
            console.log(
              new Date() +
                ': Error when estimating fee for send from ' +
                params.wallet.id() +
                ', it was too low - ' +
                estimatedFeeRate
            );
            feeRate = minimum + padding;
          } else if (estimatedFeeRate > params.maxFeeRate) {
            feeRate = params.maxFeeRate - padding;
          } else {
            feeRate = estimatedFeeRate;
          }
          return feeRate;
        })
        .catch(function (e) {
          // sanity check failed on tx size
          if (_.includes(e.message, 'invalid txSize')) {
            return Bluebird.reject(e);
          } else {
            // couldn't estimate the fee, proceed using the default
            feeRate = constants.fallbackFeeRate;
            console.log('Error estimating fee for send from ' + params.wallet.id() + ': ' + e.message);
            return Bluebird.resolve();
          }
        });
    }
  };

  // Get the unspents for the sending wallet.
  const getUnspents = function () {
    if (params.unspents) {
      // we just wanna use custom unspents
      unspents = params.unspents;
      return;
    }

    // Get enough unspents for the requested amount
    const options = _.merge({}, params.unspentsFetchParams || {}, {
      target: totalAmount,
      minSize: params.minUnspentSize || 0,
      instant: params.instant, // insist on instant unspents only
      targetWalletUnspents: params.targetWalletUnspents,
    });
    if (params.instant) {
      options.instant = params.instant; // insist on instant unspents only
    }

    return params.wallet.unspentsPaged(options).then(function (results) {
      console.log(`Unspents fetched\n:  ${JSON.stringify(results, null, 2)}`);
      totalUnspentsCount = results.total;
      fetchedUnspentsCount = results.count;
      unspents = results.unspents.filter(function (u) {
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
      zeroConfUnspentTxIds = _(results.unspents)
        .filter(function (u) {
          return !u.confirmations;
        })
        .map(function (u) {
          return u.tx_hash + ':' + u.tx_output_n;
        })
        .value();
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
  let feeSingleKeyUnspents: BitGoUnspent[] = [];
  const getUnspentsForSingleKey = function () {
    if (feeSingleKeySourceAddress) {
      let feeTarget = 0.01e8;
      if (params.instant) {
        feeTarget += totalAmount * 0.001;
      }
      return bitgo
        .get(bitgo.url('/address/' + feeSingleKeySourceAddress + '/unspents?target=' + feeTarget))
        .then(function (response) {
          if (response.body.total <= 0) {
            throw new Error('No unspents available in single key fee source');
          }
          feeSingleKeyUnspents = response.body.unspents;
        });
    }
  };

  let minerFeeInfo: any = {};
  let txInfo: any = {};

  // Iterate unspents, sum the inputs, and save _inputs with the total
  // input amount and final list of inputs to use with the transaction.
  let feeSingleKeyUnspentsUsed: BitGoUnspent[] = [];

  const collectInputs = function () {
    if (!unspents.length) {
      throw new Error('no unspents available on wallet');
    }
    inputAmount = 0;

    // Calculate the cost of spending a single input, i.e. the smallest economical unspent value
    return Bluebird.try(function () {
      if (_.isNumber(params.feeRate) || _.isNumber(params.originalFeeRate)) {
        return !_.isUndefined(params.feeRate) ? params.feeRate : params.originalFeeRate;
      } else {
        return bitgo
          .estimateFee({
            numBlocks: params.feeTxConfirmTarget,
            maxFee: params.maxFeeRate,
          })
          .then(function (feeRateEstimate) {
            return feeRateEstimate.feePerKb;
          });
      }
    })
      .then(function (feeRate) {
        // Don't spend inputs that cannot pay for their own cost.
        let minInputValue = 0;
        if (_.isInteger(params.minUnspentSize)) {
          minInputValue = params.minUnspentSize;
        }

        let prunedUnspentCount = 0;
        const originalUnspentCount = unspents.length;
        unspents = _.filter(unspents, function (unspent) {
          const isSegwitInput = !!unspent.witnessScript;
          const currentInputSize = isSegwitInput ? VirtualSizes.txP2shP2wshInputSize : VirtualSizes.txP2shInputSize;
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
              unspent: unspent,
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
        unspents.every(function (unspent) {
          if (unspent.witnessScript) {
            segwitInputCount++;
          }
          inputAmount += unspent.value;
          transaction.addInput(unspent.tx_hash, unspent.tx_output_n, 0xffffffff);

          return inputAmount < (feeSingleKeySourceAddress ? totalOutputAmount : totalAmount);
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
            return feeSingleKeyInputAmount < fee + (bitgoFeeInfo ? bitgoFeeInfo.amount : 0);
          });
        }

        txInfo = {
          nP2shInputs: transaction.tx.ins.length - (feeSingleKeySourceAddress ? 1 : 0) - segwitInputCount,
          nP2shP2wshInputs: segwitInputCount,
          nP2pkhInputs: feeSingleKeySourceAddress ? 1 : 0,
          // add single key source address change
          nOutputs:
            recipients.length +
            1 + // recipients and change
            extraChangeAmounts.length + // extra change splitting
            (bitgoFeeInfo && bitgoFeeInfo.amount > 0 ? 1 : 0) + // add output for bitgo fee
            (feeSingleKeySourceAddress ? 1 : 0),
        };

        // As per the response of get unspents API, for v1 safe wallets redeemScript is returned
        // in the response in hex format
        containsUncompressedPublicKeys = unspents.some(
          (u) => u.redeemScript.length === 201 * 2 /* hex length is twice the length in bytes */
        );

        estTxSize = estimateTransactionSize({
          containsUncompressedPublicKeys,
          nP2shInputs: txInfo.nP2shInputs,
          nP2shP2wshInputs: txInfo.nP2shP2wshInputs,
          nP2pkhInputs: txInfo.nP2pkhInputs,
          nOutputs: txInfo.nOutputs,
        });
      })
      .then(getDynamicFeeRateEstimate)
      .then(function () {
        minerFeeInfo = exports.calculateMinerFeeInfo({
          bitgo: params.wallet.bitgo,
          containsUncompressedPublicKeys,
          feeRate: feeRate,
          nP2shInputs: txInfo.nP2shInputs,
          nP2shP2wshInputs: txInfo.nP2shP2wshInputs,
          nP2pkhInputs: txInfo.nP2pkhInputs,
          nOutputs: txInfo.nOutputs,
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
            transaction = utxolib.bitgo.createTransactionBuilderForNetwork(network);
            return collectInputs();
          }
        }

        const totalFee = fee + (bitgoFeeInfo ? bitgoFeeInfo.amount : 0);

        if (feeSingleKeySourceAddress) {
          const summedSingleKeyUnspents = _.sumBy(feeSingleKeyUnspents, 'value');
          if (totalFee > summedSingleKeyUnspents) {
            const err: any = new Error(
              'Insufficient fee amount available in single key fee source: ' + summedSingleKeyUnspents
            );
            err.result = {
              fee: fee,
              feeRate: feeRate,
              estimatedSize: minerFeeInfo.size,
              available: inputAmount,
              bitgoFee: bitgoFeeInfo,
              txInfo: txInfo,
            };
            return Bluebird.reject(err);
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
            err = new Error(
              `Transaction size too large due to too many unspents. Can send only ${inputAmount} satoshis in this transaction`
            );
          }
          err.result = {
            fee: fee,
            feeRate: feeRate,
            estimatedSize: minerFeeInfo.size,
            available: inputAmount,
            bitgoFee: bitgoFeeInfo,
            txInfo: txInfo,
          };
          return Bluebird.reject(err);
        }
      });
  };

  // Add the outputs for this transaction.
  const collectOutputs = function () {
    if (minerFeeInfo.size >= 90000) {
      throw new Error('transaction too large: estimated size ' + minerFeeInfo.size + ' bytes');
    }

    const outputs: Output[] = [];

    recipients.forEach(function (recipient) {
      let script;
      if (_.isString(recipient.address)) {
        script = utxolib.address.toOutputScript(recipient.address, network);
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
        travelInfo: travelInfo,
      });
    });

    opReturns.forEach(function ({ message, amount }) {
      const script = utxolib.script.fromASM('OP_RETURN ' + Buffer.from(message).toString('hex'));
      outputs.push({ script, amount });
    });

    const getChangeOutputs = function (changeAmount: number): Output[] | Bluebird<Output[]> {
      if (changeAmount < 0) {
        throw new Error('negative change amount: ' + changeAmount);
      }

      const result: Output[] = [];
      // if we paid fees from a single key wallet, return the fee change first
      if (feeSingleKeySourceAddress) {
        const feeSingleKeyWalletChangeAmount =
          feeSingleKeyInputAmount - (fee + (bitgoFeeInfo ? bitgoFeeInfo.amount : 0));
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
        return params.wallet.addresses().then(function (response) {
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
      const addChangeOutputs = function (): Output[] | Bluebird<Output[]> {
        const thisAmount = allChangeAmounts.shift();
        if (!thisAmount) {
          return result;
        }
        return Bluebird.try(function () {
          if (params.changeAddress) {
            // If user passed a change address, use it for all outputs
            return params.changeAddress;
          } else {
            // Otherwise create a new address per output, for privacy
            // determine if segwit or not
            const changeChain = params.wallet.getChangeChain(params);
            return params.wallet.createAddress({ chain: changeChain, validate: validate }).then(function (result) {
              return result.address;
            });
          }
        }).then(function (address) {
          result.push({ address: address, amount: thisAmount });
          return addChangeOutputs();
        });
      };

      return addChangeOutputs();
    };

    // Add change output(s) and instant fee output if applicable
    return Bluebird.try(function () {
      return getChangeOutputs(inputAmount - totalAmount);
    }).then(function (result) {
      changeOutputs = result;
      const extraOutputs = changeOutputs.concat([]); // copy the array
      if (bitgoFeeInfo && bitgoFeeInfo.amount > 0) {
        extraOutputs.push(bitgoFeeInfo);
      }
      extraOutputs.forEach(function (output) {
        if ((output as AddressOutput).address) {
          (output as ScriptOutput).script = utxolib.address.toOutputScript((output as AddressOutput).address, network);
        }

        // decide where to put the outputs - default is to randomize unless forced to end
        const outputIndex = params.forceChangeAtEnd ? outputs.length : _.random(0, outputs.length);
        outputs.splice(outputIndex, 0, output);
      });

      // Add all outputs to the transaction
      outputs.forEach(function (output) {
        transaction.addOutput((output as ScriptOutput).script, output.amount);
      });

      travelInfos = _(outputs)
        .map(function (output, index) {
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
  const serialize = function () {
    // only need to return the unspents that were used and just the chainPath, redeemScript, and instant flag
    const pickedUnspents: any = _.map(unspents, function (unspent) {
      return _.pick(unspent, ['chainPath', 'redeemScript', 'instant', 'witnessScript', 'script', 'value']);
    });
    const prunedUnspents = _.slice(pickedUnspents, 0, transaction.tx.ins.length - feeSingleKeyUnspentsUsed.length);
    _.each(feeSingleKeyUnspentsUsed, function (feeUnspent) {
      prunedUnspents.push({ redeemScript: false, chainPath: false }); // mark as false to signify a non-multisig address
    });
    const result: any = {
      transactionHex: transaction.buildIncomplete().toHex(),
      unspents: prunedUnspents,
      fee: fee,
      changeAddresses: changeOutputs.map(function (co) {
        return _.pick(co, ['address', 'path', 'amount']);
      }),
      walletId: params.wallet.id(),
      walletKeychains: params.wallet.keychains,
      feeRate: feeRate,
      instant: params.instant,
      bitgoFee: bitgoFeeInfo,
      estimatedSize: minerFeeInfo.size,
      txInfo: txInfo,
      travelInfos: travelInfos,
    };

    // Add for backwards compatibility
    if (result.instant && bitgoFeeInfo) {
      result.instantFee = _.pick(bitgoFeeInfo, ['amount', 'address']);
    }

    return result;
  };

  return Bluebird.try(function () {
    return getBitGoFee();
  })
    .then(function () {
      return Bluebird.all([getBitGoFeeAddress(), getUnspents(), getUnspentsForSingleKey()]);
    })
    .then(collectInputs)
    .then(collectOutputs)
    .then(serialize);
};

/**
 * Estimate the size of a transaction in bytes based on the number of
 * inputs and outputs present.
 * @params params {
 *   nP2shInputs: number of P2SH (multisig) inputs
 *   nP2pkhInputs: number of P2PKH (single sig) inputs
 *   nOutputs: number of outputs
 * }
 *
 * @returns size: estimated size of the transaction in bytes
 */
const estimateTransactionSize = function (params) {
  if (!_.isInteger(params.nP2shInputs) || params.nP2shInputs < 0) {
    throw new Error('expecting positive nP2shInputs');
  }
  if (!_.isInteger(params.nP2pkhInputs) || params.nP2pkhInputs < 0) {
    throw new Error('expecting positive nP2pkhInputs to be numeric');
  }
  if (!_.isInteger(params.nP2shP2wshInputs) || params.nP2shP2wshInputs < 0) {
    throw new Error('expecting positive nP2shP2wshInputs to be numeric');
  }
  if (params.nP2shInputs + params.nP2shP2wshInputs < 1) {
    throw new Error('expecting at least one nP2shInputs or nP2shP2wshInputs');
  }
  if (!_.isInteger(params.nOutputs) || params.nOutputs < 1) {
    throw new Error('expecting positive nOutputs');
  }

  // The size of an uncompressed public key is 32 bytes more than the compressed key,
  // and hence, needs to be accounted for in the transaction size estimation.
  const uncompressedPublicKeysTripleCorrectionFactor = 32 * 3;

  return (
    // This is not quite accurate - if there is a mix of inputs scripts where some used
    // compressed keys and some used uncompressed keys, we would overestimate the size.
    // Since we don't have mixed input sets, this should not be an issue in practice.
    (VirtualSizes.txP2shInputSize +
      (params.containsUncompressedPublicKeys ? uncompressedPublicKeysTripleCorrectionFactor : 0)) *
      params.nP2shInputs +
    VirtualSizes.txP2shP2wshInputSize * (params.nP2shP2wshInputs || 0) +
    VirtualSizes.txP2pkhInputSizeUncompressedKey * (params.nP2pkhInputs || 0) +
    VirtualSizes.txP2pkhOutputSize * params.nOutputs +
    // if the tx contains at least one segwit input, the tx overhead is increased by 1
    VirtualSizes.txOverheadSize +
    (params.nP2shP2wshInputs > 0 ? 1 : 0)
  );
};

/**
 * Calculate the fee and estimated size in bytes for a transaction.
 * @params params {
 *   bitgo: bitgo object
 *   feeRate: satoshis per kilobyte
 *   nP2shInputs: number of P2SH (multisig) inputs
 *   nP2pkhInputs: number of P2PKH (single sig) inputs
 *   nOutputs: number of outputs
 * }
 *
 * @returns {
 *   size: estimated size of the transaction in bytes
 *   fee: estimated fee in satoshis for the transaction
 *   feeRate: fee rate that was used to estimate the fee for the transaction
 * }
 */
exports.calculateMinerFeeInfo = function (params) {
  const feeRateToUse = params.feeRate || params.bitgo.getConstants().fallbackFeeRate;
  const estimatedSize = estimateTransactionSize(params);

  return {
    size: estimatedSize,
    fee: Math.ceil((estimatedSize * feeRateToUse) / 1000),
    feeRate: feeRateToUse,
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
exports.signTransaction = function (params) {
  let keychain = params.keychain; // duplicate so as to not mutate below

  const validate = params.validate === undefined ? true : params.validate;
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
  let network = getNetwork();
  const enableBCH = _.isBoolean(params.forceBCH) && params.forceBCH === true;

  if (!_.isObject(keychain) || !_.isString((keychain as any).xprv)) {
    if (_.isString(params.signingKey)) {
      privKey = utxolib.ECPair.fromWIF(params.signingKey, network as utxolib.BitcoinJSNetwork);
      keychain = undefined;
    } else {
      throw new Error('expecting the keychain object with xprv');
    }
  }

  let feeSingleKey;
  if (params.feeSingleKeyWIF) {
    feeSingleKey = utxolib.ECPair.fromWIF(params.feeSingleKeyWIF, network as utxolib.BitcoinJSNetwork);
  }

  debug('Network: %O', network);

  if (enableBCH) {
    debug('Enabling BCH…');
    network = utxolib.networks.bitcoincash;
    debug('New network: %O', network);
  }

  const transaction = utxolib.bitgo.createTransactionFromHex(params.transactionHex, network);
  if (transaction.ins.length !== params.unspents.length) {
    throw new Error('length of unspents array should equal to the number of transaction inputs');
  }

  // decorate transaction with input values for TransactionBuilder instantiation
  const isUtxoTx = _.isObject(transaction) && Array.isArray((transaction as any).ins);
  const areValidUnspents = _.isObject(params) && Array.isArray((params as any).unspents);
  if (isUtxoTx && areValidUnspents) {
    // extend the transaction inputs with the values
    const inputValues = _.map((params as any).unspents, (u) => _.pick(u, 'value'));
    transaction.ins.map((currentItem, index) => _.extend(currentItem, inputValues[index]));
  }

  let rootExtKey;
  if (keychain) {
    rootExtKey = bip32.fromBase58(keychain.xprv);
  }

  const txb = utxolib.bitgo.createTransactionBuilderFromTransaction(transaction);

  for (let index = 0; index < txb.tx.ins.length; ++index) {
    const currentUnspent = params.unspents[index];
    if (currentUnspent.redeemScript === false) {
      // this is the input from a single key fee address
      if (!feeSingleKey) {
        throw new Error('single key address used in input but feeSingleKeyWIF not provided');
      }

      if (enableBCH) {
        feeSingleKey.network = network;
      }

      txb.sign(index, feeSingleKey);
      continue;
    }

    if (currentUnspent.witnessScript && enableBCH) {
      throw new Error('BCH does not support segwit inputs');
    }

    const chainPath = currentUnspent.chainPath;
    if (rootExtKey) {
      const { walletSubPath = '/0/0' } = keychain;
      const path = sanitizeLegacyPath(keychain.path + walletSubPath + chainPath);
      debug(
        'derived user key path "%s" using keychain path "%s", walletSubPath "%s", keychain walletSubPath "%s" and chainPath "%s"',
        path,
        keychain.path,
        walletSubPath,
        keychain.walletSubPath,
        chainPath
      );
      privKey = rootExtKey.derivePath(path);
    }

    privKey.network = network;

    // subscript is the part of the output script after the OP_CODESEPARATOR.
    // Since we are only ever signing p2sh outputs, which do not have
    // OP_CODESEPARATORS, it is always the output script.
    const subscript = Buffer.from(currentUnspent.redeemScript, 'hex');
    currentUnspent.validationScript = subscript;

    // In order to sign with bitcoinjs-lib, we must use its transaction
    // builder, confusingly named the same exact thing as our transaction
    // builder, but with inequivalent behavior.
    try {
      const witnessScript = currentUnspent.witnessScript ? Buffer.from(currentUnspent.witnessScript, 'hex') : undefined;
      const sigHash = utxolib.bitgo.getDefaultSigHash(network);
      txb.sign(index, privKey, subscript, sigHash, currentUnspent.value, witnessScript);
    } catch (e) {
      // try fallback derivation path (see BG-46497)
      let fallbackSigningSuccessful = false;
      try {
        const fallbackPath = sanitizeLegacyPath(keychain.path + chainPath);
        debug(
          'derived fallback user key path "%s" using keychain path "%s" and chainPath "%s"',
          fallbackPath,
          keychain.path,
          chainPath
        );
        privKey = rootExtKey.derivePath(fallbackPath);
        const witnessScript = currentUnspent.witnessScript
          ? Buffer.from(currentUnspent.witnessScript, 'hex')
          : undefined;
        const sigHash = utxolib.bitgo.getDefaultSigHash(network);
        txb.sign(index, privKey, subscript, sigHash, currentUnspent.value, witnessScript);
        fallbackSigningSuccessful = true;
      } catch (fallbackError) {
        debug('input sign failed for fallback path: %s', fallbackError.message);
      }
      // we need to know what's causing this
      if (!fallbackSigningSuccessful) {
        e.result = {
          unspent: currentUnspent,
        };
        e.message = `Failed to sign input #${index} - ${e.message} - ${JSON.stringify(e.result, null, 4)} - \n${
          e.stack
        }`;
        debug('input sign failed: %s', e.message);
        return Bluebird.reject(e);
      }
    }
  }

  const partialTransaction = txb.buildIncomplete();

  if (validate) {
    partialTransaction.ins.forEach((input, index) => {
      const signatureCount = utxolib.bitgo
        .getSignatureVerifications(partialTransaction, index, params.unspents[index].value)
        .filter((v) => v.signedBy !== undefined).length;
      if (signatureCount < 1) {
        throw new Error('expected at least one valid signature');
      }
      if (params.fullLocalSigning && signatureCount < 2) {
        throw new Error('fullLocalSigning set: expected at least two valid signatures');
      }
    });
  }

  return Bluebird.resolve({
    transactionHex: partialTransaction.toHex(),
  });
};
