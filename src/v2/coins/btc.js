const baseCoinPrototype = require('../baseCoin').prototype;
const common = require('../../common');
const bitcoin = require('bitcoinjs-lib');
const Promise = require('bluebird');
const prova = require('prova-lib');
const _ = require('lodash');

const Btc = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away
  this.network = bitcoin.networks.bitcoin;
};

Btc.prototype = Object.create(baseCoinPrototype);
Btc.constructor = Btc;

/**
 * Returns the factor between the base unit and its smallest subdivison
 * @return {number}
 */
Btc.prototype.getBaseFactor = function() {
  return 1e8;
};

Btc.prototype.getChain = function() {
  return 'btc';
};
Btc.prototype.getFamily = function() {
  return 'btc';
};

Btc.prototype.getFullName = function() {
  return 'Bitcoin';
};

Btc.prototype.isValidAddress = function(address, forceAltScriptSupport) {
  const validVersions = [
    this.network.pubKeyHash,
    this.network.scriptHash
  ];
  if (this.altScriptHash && (forceAltScriptSupport || this.supportAltScriptDestination)) {
    validVersions.push(this.altScriptHash);
  }

  let addressDetails;
  try {
    addressDetails = bitcoin.address.fromBase58Check(address);
  } catch (e) {
    return false;
  }

  // the address version needs to be among the valid ones
  return validVersions.indexOf(addressDetails.version) !== -1;
};

/**
 * Make sure an address is valid and throw an error if it's not.
 * @param address The address string on the network
 * @param keychains Keychain objects with xpubs
 * @param coinSpecific Coin-specific details for the address such as a witness script
 * @param chain Derivation chain
 * @param index Derivation index
 */
Btc.prototype.verifyAddress = function({ address, keychains, coinSpecific, chain, index }) {
  if (!this.isValidAddress(address)) {
    throw new Error(`invalid address: ${address}`);
  }

  const expectedAddress = this.generateAddress({
    segwit: !!coinSpecific.witnessScript,
    keychains,
    threshold: 2,
    chain: chain,
    index: index
  });

  if (expectedAddress.address !== address) {
    throw new Error(`address validation failure: expected ${expectedAddress.address} but got ${address}`);
  }
};

/**
 * Generate an address for a wallet based on a set of configurations
 * @param segwit True if segwit
 * @param keychains Array of objects with xpubs
 * @param threshold Minimum number of signatures
 * @param chain Derivation chain
 * @param index Derivation index
 * @returns {{chain: number, index: number, coin: number, coinSpecific: {outputScript, redeemScript}}}
 */
Btc.prototype.generateAddress = function({ segwit, keychains, threshold, chain, index }) {
  const isSegwit = !!segwit;
  let signatureThreshold = 2;
  if (_.isInteger(threshold)) {
    signatureThreshold = threshold;
    if (signatureThreshold <= 0) {
      throw new Error('threshold has to be positive');
    }
    if (signatureThreshold > keychains.length) {
      throw new Error('threshold cannot exceed number of keys');
    }
  }

  let derivationChain = 0;
  if (_.isInteger(chain) && chain > 0) {
    derivationChain = chain;
  }

  let derivationIndex = 0;
  if (_.isInteger(index) && index > 0) {
    derivationIndex = index;
  }

  const path = 'm/0/0/' + derivationChain + '/' + derivationIndex;
  const hdNodes = keychains.map(({ pub }) => prova.HDNode.fromBase58(pub));
  const derivedKeys = hdNodes.map(hdNode => hdNode.hdPath().deriveKey(path).getPublicKeyBuffer());

  const inputScript = bitcoin.script.multisig.output.encode(signatureThreshold, derivedKeys);
  const inputScriptHash = bitcoin.crypto.hash160(inputScript);
  let outputScript = bitcoin.script.scriptHash.output.encode(inputScriptHash);

  const addressDetails = {
    chain: derivationChain,
    index: derivationIndex,
    coin: this.getChain(),
    coinSpecific: {}
  };

  addressDetails.coinSpecific.redeemScript = inputScript.toString('hex');

  if (isSegwit) {
    const witnessScriptHash = bitcoin.crypto.sha256(inputScript);
    const redeemScript = bitcoin.script.witnessScriptHash.output.encode(witnessScriptHash);
    const redeemScriptHash = bitcoin.crypto.hash160(redeemScript);
    outputScript = bitcoin.script.scriptHash.output.encode(redeemScriptHash);
    addressDetails.coinSpecific.witnessScript = inputScript.toString('hex');
    addressDetails.coinSpecific.redeemScript = redeemScript.toString('hex');
  }

  addressDetails.coinSpecific.outputScript = outputScript.toString('hex');
  addressDetails.address = bitcoin.address.fromOutputScript(outputScript, this.network);

  return addressDetails;
};

/**
 * Assemble keychain and half-sign prebuilt transaction
 * @param params
 * - txPrebuild
 * - prv
 * @returns {{txHex}}
 */
Btc.prototype.signTransaction = function(params) {
  const txPrebuild = params.txPrebuild;
  const userPrv = params.prv;

  if (_.isUndefined(txPrebuild) || !_.isObject(txPrebuild)) {
    if (!_.isUndefined(txPrebuild) && !_.isObject(txPrebuild)) {
      throw new Error(`txPrebuild must be an object, got type ${typeof txPrebuild}`);
    }
    throw new Error('missing txPrebuild parameter');
  }
  let transaction = bitcoin.Transaction.fromHex(txPrebuild.txHex);

  if (transaction.ins.length !== txPrebuild.txInfo.unspents.length) {
    throw new Error('length of unspents array should equal to the number of transaction inputs');
  }

  if (_.isUndefined(userPrv) || !_.isString(userPrv)) {
    if (!_.isUndefined(userPrv) && !_.isString(userPrv)) {
      throw new Error(`prv must be a string, got type ${typeof userPrv}`);
    }
    throw new Error('missing prv parameter to sign transaction');
  }

  const keychain = bitcoin.HDNode.fromBase58(userPrv);
  const hdPath = bitcoin.hdPath(keychain);
  const txb = bitcoin.TransactionBuilder.fromTransaction(transaction);

  const signatureIssues = [];

  for (let index = 0; index < transaction.ins.length; ++index) {
    const currentUnspent = txPrebuild.txInfo.unspents[index];
    const path = 'm/0/0/' + currentUnspent.chain + '/' + currentUnspent.index;
    const privKey = hdPath.deriveKey(path);

    const currentSignatureIssue = {
      inputIndex: index,
      unspent: currentUnspent,
      path: path
    };

    const subscript = new Buffer(currentUnspent.redeemScript, 'hex');
    const isSegwit = !!currentUnspent.witnessScript;
    try {
      if (isSegwit) {
        const witnessScript = Buffer.from(currentUnspent.witnessScript, 'hex');
        txb.sign(index, privKey, subscript, bitcoin.Transaction.SIGHASH_ALL, currentUnspent.value, witnessScript);
      } else {
        txb.sign(index, privKey, subscript, bitcoin.Transaction.SIGHASH_ALL);
      }

    } catch (e) {
      currentSignatureIssue.error = e;
      signatureIssues.push(currentSignatureIssue);
      continue;
    }

    transaction = txb.buildIncomplete();

    const isValidSignature = this.verifySignature(transaction, index, currentUnspent.value);
    if (!isValidSignature) {
      currentSignatureIssue.error = new Error('invalid signature');
      signatureIssues.push(currentSignatureIssue);
    }
  }

  if (signatureIssues.length > 0) {
    const failedIndices = signatureIssues.map(currentIssue => currentIssue.inputIndex);
    const error = new Error(`Failed to sign inputs at indices ${failedIndices.join(', ')}`);
    error.code = 'input_signature_failure';
    error.signingErrors = signatureIssues;
    throw error;
  }

  return {
    txHex: transaction.toBuffer().toString('hex')
  };
};

/**
 * Verify the signature on a (half-signed) transaction
 * @param transaction bitcoinjs-lib tx object
 * @param inputIndex The input whererfore to check the signature
 * @param amount For segwit and BCH, the input amount needs to be known for signature verification
 * @returns {boolean}
 */
Btc.prototype.verifySignature = function(transaction, inputIndex, amount) {
  const currentInput = transaction.ins[inputIndex];
  let signatureScript = currentInput.script;
  let decompiledSigScript = bitcoin.script.decompile(signatureScript);

  const isSegwitInput = currentInput.witness.length > 0;
  if (isSegwitInput) {
    decompiledSigScript = currentInput.witness;
    signatureScript = bitcoin.script.compile(decompiledSigScript);
    if (!amount) {
      return false;
    }
  }

  const inputClassification = bitcoin.script.classifyInput(signatureScript, true);
  if (inputClassification !== 'scripthash') {
    return false;
  }

  // all but the last entry
  const signatures = decompiledSigScript.slice(0, -1);
  // the last entry
  const pubScript = _.last(decompiledSigScript);
  const decompiledPubScript = bitcoin.script.decompile(pubScript);
  // the second through antepenultimate entries
  const publicKeys = decompiledPubScript.slice(1, -2);

  // get the first non-empty signature and verify it against all public keys
  const signatureBuffer = _.find(signatures, s => !_.isEmpty(s));
  if (signatureBuffer.length === 0) {
    // signature buffer must not be empty
    return false;
  }
  // slice the last byte from the signature hash input because it's the hash type
  const signature = bitcoin.ECSignature.fromDER(signatureBuffer.slice(0, -1));
  const hashType = _.last(signatureBuffer);

  for (const publicKeyBuffer of publicKeys) {
    const publicKey = bitcoin.ECPair.fromPublicKeyBuffer(publicKeyBuffer);
    let signatureHash = transaction.hashForSignature(inputIndex, pubScript, hashType);
    if (isSegwitInput) {
      signatureHash = transaction.hashForWitnessV0(inputIndex, pubScript, amount, hashType);
    } else if (this.getFamily() === 'bch') {
      signatureHash = transaction.hashForCashSignature(inputIndex, pubScript, amount, hashType);
    }

    if (publicKey.verify(signatureHash, signature)) {
      return true;
    }
  }

  return false;
};

Btc.prototype.explainTransaction = function(params) {
  const self = this;
  const transaction = bitcoin.Transaction.fromBuffer(new Buffer(params.txHex, 'hex'));
  const id = transaction.getId();
  let changeAddresses = [];
  let spendAmount = 0;
  let changeAmount = 0;
  if (params.txInfo && params.txInfo.changeAddresses) {
    changeAddresses = params.txInfo.changeAddresses;
  }
  const explanation = {
    displayOrder: ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs'],
    id: id,
    outputs: [],
    changeOutputs: []
  };
  transaction.outs.forEach(function(currentOutput) {
    const currentAddress = bitcoin.address.fromOutputScript(currentOutput.script, self.network);
    const currentAmount = currentOutput.value;

    if (changeAddresses.indexOf(currentAddress) !== -1) {
      // this is change
      changeAmount += currentAmount;
      explanation.changeOutputs.push({
        address: currentAddress,
        amount: currentAmount
      });
      return;
    }

    spendAmount += currentAmount;
    explanation.outputs.push({
      address: currentAddress,
      amount: currentAmount
    });
  });
  explanation.outputAmount = spendAmount;
  explanation.changeAmount = changeAmount;

  // add fee info if available
  if (params.feeInfo) {
    explanation.displayOrder.push('fee');
    explanation.fee = params.feeInfo;
  }
  return explanation;
};

Btc.prototype.getRecoveryBlockchainApiBaseUrl = function() {
  return common.Environments[this.bitgo.env].blockrApiBaseUrl;
};

Btc.prototype.getRecoveryFeeRecommendationApiBaseUrl = function() {
  return 'https://bitcoinfees.21.co/api/v1/fees/recommended';
};

Btc.prototype.calculateRecoveryAddress = function(scriptHashScript) {
  return bitcoin.address.fromOutputScript(scriptHashScript, this.network);
};

Btc.prototype.getRecoveryFeePerBytes = function() {
  return 100;
};

/**
 * Builds a funds recovery transaction without BitGo
 * @param params
 * - userKey: [encrypted] xprv
 * - backupKey: [encrypted] xrpv
 * - walletPassphrase: necessary if one of the xprvs is encrypted
 * - bitgoKey: xpub
 * - recoveryDestination: target address to send recovered funds to
 * @param callback
 */
Btc.prototype.recover = function(params, callback) {
  const craftTransaction = function(unspents, destinationAddress) {
    const txSigningRequest = {};

    const totalInputAmount = _.sumBy(unspents, 'amount');
    if (totalInputAmount <= 0) {
      throw new Error('No input to recover - aborting!');
    }
    const transactionBuilder = new bitcoin.TransactionBuilder(self.network);

    // try to find a realtime recommended fee rate so that we don't under or overpay
    return Promise.try(function() {
      let feePerByte = self.getRecoveryFeePerBytes(); // satoshis per byte of data
      const externalGetRequest = self.bitgo.get(self.getRecoveryFeeRecommendationApiBaseUrl());
      externalGetRequest.forceV1Auth = true;
      return externalGetRequest
      .result()
      .then(function(response) {
        if (Number.isInteger(response.hourFee)) {
          // 21's fee estimates are in satoshis per byte
          feePerByte = response.hourFee;
        }
        return feePerByte;
      });
    })
    .then(function(feePerByte) {
      // assume 34 bytes for the single output and 295 bytes for each tx input
      const approximateSize = new bitcoin.Transaction().toBuffer().length + 34 + (295 * unspents.length);
      const approximateFee = approximateSize * feePerByte;

      // Construct a transaction
      txSigningRequest.inputs = [];
      _.forEach(unspents, function(unspent) {
        const address = addresses[unspent.address];
        transactionBuilder.addInput(unspent.tx, unspent.n, 0xffffffff, Buffer.from(unspent.script, 'hex'));
        txSigningRequest.inputs.push({
          chainPath: address.chainPath,
          redeemScript: address.redeemScript.toString('hex')
        });
      });
      transactionBuilder.addOutput(destinationAddress, totalInputAmount - approximateFee);

      // Sign the inputs

      if (isLedger) {
        // TODO: arik add Ledger support
        // return signLedgerTx(transactionBuilder);
      } else {
        let i = 0;
        _.forEach(unspents, function(unspent) {
          const address = addresses[unspent.address];
          const backupPrivateKey = address.backupKey.keyPair;
          const userPrivateKey = address.userKey.keyPair;
          // force-override networks
          backupPrivateKey.network = self.network;
          userPrivateKey.network = self.network;
          transactionBuilder.sign(i, backupPrivateKey, address.redeemScript, bitcoin.Transaction.SIGHASH_ALL);
          transactionBuilder.sign(i++, userPrivateKey, address.redeemScript, bitcoin.Transaction.SIGHASH_ALL);
        });
      }
    })
    .then(function() {
      txSigningRequest.transactionHex = transactionBuilder.build().toBuffer().toString('hex');
      return txSigningRequest;
    });
  };

  const createMultiSigAddress = function(keyArray) {
    const publicKeys = [];
    keyArray.forEach(function(k) {
      publicKeys.push(k.getPublicKeyBuffer());
    });

    const redeemScript = bitcoin.script.multisig.output.encode(2, publicKeys);
    const redeemScriptHash = bitcoin.crypto.hash160(redeemScript);
    const scriptHashScript = bitcoin.script.scriptHash.output.encode(redeemScriptHash);
    const address = self.calculateRecoveryAddress(scriptHashScript);
    address.redeemScript = redeemScript;
    const addressObject = {
      hash: scriptHashScript,
      redeemScript: redeemScript,
      address: address
    };
    return addressObject;
  };

  const deriveKeys = function(keyArray, index) {
    const results = [];
    keyArray.forEach(function(k) {
      results.push(k.derive(index));
    });
    return results;
  };

  const collectUnspents = function(keys) {

    const unspents = [];
    const txMap = {};

    // BitGo's key derivation paths are /0/0/0/i for user-generated addresses and /0/0/1/i for change adddresses.
    // Derive these top level paths first for performance reasons
    let keys_0_0;
    if (isLedger) {
      // TODO: arik add ledger support
      keys_0_0 = [keys[0]].concat(deriveKeys(deriveKeys(keys.slice(1), 0), 0));
    } else {
      keys_0_0 = deriveKeys(deriveKeys(keys, 0), 0);
    }
    const keys_0_0_0 = deriveKeys(keys_0_0, 0);
    const keys_0_0_1 = deriveKeys(keys_0_0, 1);

    // We want to get the wallet id, which is the first /0/0/0/0.
    // Never used, but potentially useful for debugging, uncomment to use
    // const walletAddress = createMultiSigAddress(deriveKeys(keys_0_0_0, 0));

    let lookupThisBatch = [];
    let numSequentialAddressesWithoutTxs = 0;

    const queryBlockchainUnspentsPath = function(keyArray, basePath) {

      const gatherUnspentAddresses = function(addrIndex) {
        return Promise.try(function() {
          // Derive the address
          const derivedKeys = deriveKeys(keyArray, addrIndex);
          const address = createMultiSigAddress(derivedKeys);
          const addressBase58 = address.address;

          // get address info from blockr and check for existence of unspents
          const externalGetRequest = self.bitgo.get(blockrApiBaseUrl + '/address/info/' + addressBase58);
          externalGetRequest.forceV1Auth = true;
          return externalGetRequest
          .result()
          .then(function(body) {
            if (body.data.nb_txs === 0) {
              //
              numSequentialAddressesWithoutTxs++;
            } else {
              numSequentialAddressesWithoutTxs = 0;
            }

            if (body.data.balance > 0) {
              lookupThisBatch.push(addressBase58);
              address.chainPath = basePath + '/' + addrIndex;
              address.userKey = derivedKeys[0];
              address.backupKey = derivedKeys[1];
              addresses[addressBase58] = address;
            }

            if (numSequentialAddressesWithoutTxs >= MAX_SEQUENTIAL_ADDRESSES_WITHOUT_TXS) {
              numSequentialAddressesWithoutTxs = 0; // reset this in case this function will be called again
              // stop searching for addresses with unspents in them
              // we are done
              return;
            }

            return gatherUnspentAddresses(addrIndex + 1);
          });
        });
      };

      return gatherUnspentAddresses(0)
      .then(function() {
        const unspentAddressList = lookupThisBatch.join(',');
        if (unspentAddressList.length > 0) {
          const url = blockrApiBaseUrl + '/address/unspent/' + lookupThisBatch.join(',');

          // Make async call to blockr.io
          const externalGetRequest = self.bitgo.get(url);
          externalGetRequest.forceV1Auth = true;
          return externalGetRequest
          .result()
          .then(function(response) {
            let resultsWithUnspents = [];

            // blockr's api stupidly returns an object rather than an array if the only a single address's unspent is fine, so we have to deal with that here
            if (!!response.data.address) { // is object
              resultsWithUnspents = (response.data.unspent && response.data.unspent.length > 0) ? [response.data] : [];
            } else { // is array
              resultsWithUnspents = _.filter(response.data, function(singleAddressResult) { return singleAddressResult.unspent && singleAddressResult.unspent.length > 0; });
            }
            _.forEach(resultsWithUnspents, function(singleAddressResult) {
              _.forEach(singleAddressResult.unspent, function(singleUnspent) {
                const addUnspent = function() {
                  singleUnspent.address = singleAddressResult.address;
                  singleUnspent.amount = Math.round(parseFloat(singleUnspent.amount) * 1e8); // perform all handling in satoshis from here onwards
                  unspents.push(singleUnspent);
                };
                // if recovering ledger wallet, gather full transactions (needed by ledger device for signing)
                if (isLedger && !txMap[singleUnspent.tx]) {
                  const url = blockrApiBaseUrl + '/tx/raw/' + singleUnspent.tx;
                  const externalGetRequest = self.bitgo.get(url);
                  externalGetRequest.forceV1Auth = true;
                  return externalGetRequest
                  .result()
                  .then(function(response) {
                    txMap[singleUnspent.tx] = response.data.tx.hex;
                    addUnspent();
                  });
                } else {
                  addUnspent();
                }
              });
            });
            lookupThisBatch = []; // reset this in case this function will be called again
          });
        } else { // skip making the request if we don't need to
          lookupThisBatch = []; // reset this in case this function will be called again
        }
      });
    };

    return queryBlockchainUnspentsPath(keys_0_0_0, '/0/0/0')
    .then(function() {
      return queryBlockchainUnspentsPath(keys_0_0_1, '/0/0/1');
    })
    .then(function() {
      return unspents;
    });
  };

  const isLedger = false;
  const addresses = {};

  const blockrApiBaseUrl = this.getRecoveryBlockchainApiBaseUrl();
  const MAX_SEQUENTIAL_ADDRESSES_WITHOUT_TXS = 5; // 20;

  const self = this;
  return this.initiateRecovery(params)
  .then(function(keys) {
    return collectUnspents(keys);
  })
  .then(function(unspents) {
    return craftTransaction(unspents, params.recoveryDestination);
  })
  .then(function(txSigningRequest) {
    const externalPostRequest = self.bitgo.post(blockrApiBaseUrl + '/tx/decode');
    externalPostRequest.forceV1Auth = true;
    return externalPostRequest
    .send({ hex: txSigningRequest.transactionHex })
    .result()
    .then(function(response) {
      const transactionDetails = response.data;
      transactionDetails.txHex = txSigningRequest.transactionHex;
      return transactionDetails;
    });
  })
  .nodeify(callback);
};

module.exports = Btc;
