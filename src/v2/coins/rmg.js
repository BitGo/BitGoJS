const baseCoinPrototype = require('../baseCoin').prototype;
const prova = require('../../prova');
const _ = require('lodash');

const Rmg = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away
  this.network = prova.networks.rmg;
};

Rmg.prototype = Object.create(baseCoinPrototype);
Rmg.constructor = Rmg;

/**
 * Returns the factor between the base unit and its smallest subdivison
 * @return {number}
 */
Rmg.prototype.getBaseFactor = function() {
  return 1e6;
};

Rmg.prototype.getChain = function() {
  return 'rmg';
};
Rmg.prototype.getFamily = function() {
  return 'rmg';
};

Rmg.prototype.getFullName = function() {
  return 'Royal Mint Gold';
};

Rmg.prototype.isValidAddress = function(address) {
  return prova.Address.validateBase58(address, this.network);
};

/**
 * Make sure an address is valid and throw an error if it's not.
 * @param address The address string on the network
 * @param keychains Keychain objects with xpubs
 * @param chain Derivation chain
 * @param index Derivation index
 */
Rmg.prototype.verifyAddress = function({ address, keychains, chain, index }) {
  if (!this.isValidAddress(address)) {
    throw new Error(`invalid address: ${address}`);
  }

  const expectedAddress = this.generateAddress({
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
 * @param keychains Array of objects with xpubs
 * @param threshold Minimum number of signatures
 * @param chain Derivation chain
 * @param index Derivation index
 * @returns {{chain: number, index: number, coin: number, coinSpecific: {outputScript}}}
 */
Rmg.prototype.generateAddress = function({ keychains, threshold, chain, index }) {
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
  // do not modify the original argument
  const keychainCopy = _.cloneDeep(keychains);
  const userKey = keychainCopy.shift();
  const aspKeyIds = keychainCopy.map((key) => key.aspKeyId);
  const derivedUserKey = prova.HDNode.fromBase58(userKey.pub).hdPath().deriveKey(path).getPublicKeyBuffer();

  const provaAddress = new prova.Address(derivedUserKey, aspKeyIds, this.network);
  provaAddress.signatureCount = signatureThreshold;

  const addressDetails = {
    chain: derivationChain,
    index: derivationIndex,
    coin: this.getChain(),
    coinSpecific: {
      outputScript: provaAddress.toScript().toString('hex')
    }
  };

  try {
    addressDetails.address = provaAddress.toString();
  } catch (e) {
    // non-(n-1)/n signature count
    addressDetails.address = null;
  }

  return addressDetails;
};

/**
 * Assemble keychain and half-sign prebuilt transaction
 * @param params
 * - txPrebuild
 * - prv
 * @returns {{txHex}}
 */
Rmg.prototype.signTransaction = function(params) {
  const txPrebuild = params.txPrebuild;
  const userPrv = params.prv;

  if (_.isUndefined(txPrebuild) || !_.isObject(txPrebuild)) {
    if (!_.isUndefined(txPrebuild) && !_.isObject(txPrebuild)) {
      throw new Error(`txPrebuild must be an object, got type ${typeof txPrebuild}`);
    }
    throw new Error('missing txPrebuild parameter');
  }

  let transaction = prova.Transaction.fromHex(txPrebuild.txHex);

  if (transaction.ins.length !== txPrebuild.txInfo.unspents.length) {
    throw new Error('length of unspents array should equal to the number of transaction inputs');
  }

  if (_.isUndefined(userPrv) || !_.isString(userPrv)) {
    if (!_.isUndefined(userPrv) && !_.isString(userPrv)) {
      throw new Error(`prv must be a string, got type ${typeof userPrv}`);
    }
    throw new Error('missing prv parameter to sign transaction');
  }

  const keychain = prova.HDNode.fromBase58(userPrv, this.network);
  const hdPath = keychain.hdPath();

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

    const unspentAddress = prova.Address.fromBase58(currentUnspent.address);
    const subscript = unspentAddress.toScript();
    const txb = prova.TransactionBuilder.fromTransaction(transaction, this.network);
    try {
      txb.sign(index, privKey, subscript, currentUnspent.value);
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
    txHex: transaction.toHex()
  };
};

Rmg.prototype.verifySignature = function(transaction, inputIndex, amount) {
  const currentInput = transaction.ins[inputIndex];
  const signatureScript = currentInput.script;
  const [publicKeyBuffer, signatureBuffer] = prova.script.decompile(signatureScript);
  const publicKey = prova.ECPair.fromPublicKeyBuffer(publicKeyBuffer);
  const signatureHash = transaction.hashForWitnessV0(inputIndex, null, amount, prova.Transaction.SIGHASH_ALL);
  return publicKey.verify(signatureHash, signatureBuffer);
};

Rmg.prototype.explainTransaction = function(params) {
  const self = this;
  const transaction = prova.Transaction.fromHex(params.txHex);
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
    const currentAddress = prova.Address.fromScript(currentOutput.script, self.network).toString();
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

module.exports = Rmg;
