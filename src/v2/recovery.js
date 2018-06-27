const request = require('superagent');
const Promise = require('bluebird');
const co = Promise.coroutine;
const _ = require('lodash');
const bitcoin = require('bitgo-utxo-lib');
const config = require('../config');

/**
 * An instance of the recovery tool, which encapsulates the recovery functions
 * Instantiated with parameters:
 *   - bitgo: an instance of the bitgo SDK
 *   - sourceCoin: the coin that needs to be recovered
 *   - recoveryCoin: the type of address the faulty transaction was sent to
 */
class CrossChainRecoveryTool {
  constructor(opts) {
    this.bitgo = opts.bitgo;
    this.sourceCoin = opts.sourceCoin;
    this.recoveryCoin = opts.recoveryCoin;
    this.logging = opts.logging;

    if (!this.bitgo) {
      throw new Error('Please instantiate the recovery tool with a bitgo instance.');
    }

    // List of coins we support. Add modifiers (e.g. segwit) after the dash
    this.supportedCoins = ['btc', 'bch', 'ltc', 'btc-segwit'];

    if (!opts.sourceCoin || !this.supportedCoins.includes(opts.sourceCoin.getFamily())) {
      throw new Error('Please set a valid source coin');
    }

    if (!opts.recoveryCoin || !this.supportedCoins.includes(opts.recoveryCoin.getFamily())) {
      throw new Error('Please set a valid recovery type');
    }

    this.wallet = null;

    this.feeRates = {
      bch: 20,
      tbch: 20,
      btc: 80,
      tbtc: 80,
      ltc: 100,
      tltc: 100
    };

    this.recoveryTx = new bitcoin.TransactionBuilder(this.sourceCoin.network);
  }

  /**
   * Internal logging function (either uses provided logger or console.log, can be turned off)
   * @param args - the arguments to pass to the logger
   * @private
   */
  _log(...args) {
    if (this.logging === false) {
      return;
    }

    this.logger ? this.logger(...args) : console.log(...args);
  }

  /**
   * Sets the wallet ID of the recoveryCoin wallet. This is needed to find the private keys to sign the transaction.
   * @param walletId {String} wallet ID
   * @param callback
   */
  setWallet(walletId, callback) {
    return co(function *setWallet() {
      const coinType = this.recoveryCoin.getChain();

      if (!coinType) {
        throw new Error('Please provide coin type');
      }

      if (!walletId) {
        throw new Error('Please provide wallet id');
      }

      this._log(`Fetching ${coinType} wallet...`);

      if (this.sourceCoin.type !== coinType && this.recoveryCoin.type !== coinType) {
        throw new Error('Cannot set a wallet for this coin type - this is not a coin involved in the recovery tx.');
      }

      let wallet;
      try {
        wallet = yield this.bitgo.coin(coinType).wallets().get({ id: walletId });
      } catch (e) {
        if (e.status !== 404 && e.status !== 400) {
          throw e;
        }

        wallet = null;
      }

      if (!wallet && coinType.endsWith('btc')) {
        try {
          this._log('Could not find v2 wallet. Falling back to v1...');
          wallet = yield this.bitgo.wallets().get({ id: walletId });
          wallet.isV1 = true;
        } catch (e) {
          if (e.status !== 404) {
            throw e;
          }
        }
      }

      if (!wallet) {
        throw new Error(`Cannot find ${coinType} wallet.`);
      }

      this.wallet = wallet;

    }).call(this).asCallback(callback);
  }

  /**
   * Retrieves and stores the unspents from the faulty transaction
   * @param faultyTxId {String} the txid of the faulty transaction
   * @param callback
   */
  findUnspents(faultyTxId, callback) {
    return co(function *findUnspents() {
      if (!faultyTxId) {
        throw new Error('Please provide a faultyTxId');
      }

      this._log('Grabbing info for faulty tx...');

      this.faultyTxId = faultyTxId;
      const TX_INFO_URL = this.sourceCoin.url(`/public/tx/${faultyTxId}`);
      const res = yield request.get(TX_INFO_URL);
      const faultyTxInfo = res.body;

      this._log('Getting unspents on output addresses..');

      // Get output addresses that do not belong to wallet
      // These are where the 'lost coins' live
      const txOutputAddresses = faultyTxInfo.outputs.map((input) => input.address);

      let outputAddresses = [];
      for (let address of txOutputAddresses) {
        if (this.sourceCoin.getFamily() === 'ltc') {
          try {
            address = this.sourceCoin.canonicalAddress(address, 1);
          } catch (e) {
            continue;
          }
        }

        if (this.recoveryCoin.getFamily() === 'ltc') {
          try {
            address = this.recoveryCoin.canonicalAddress(address, 2);
          } catch (e) {
            continue;
          }
        }

        try {
          const methodName = this.wallet.isV1 ? 'address' : 'getAddress';
          const walletAddress = yield this.wallet[methodName]({ address: address });
          outputAddresses.push(walletAddress.address);
        } catch (e) {
          this._log(`Address ${address} not found on wallet`);
        }
      }

      if (outputAddresses.length === 0) {
        throw new Error('Could not find tx outputs belonging to the specified wallet. Please check the given parameters.');
      }

      if (this.recoveryCoin.getFamily() === 'ltc') {
        outputAddresses = outputAddresses.map((address) => this.recoveryCoin.canonicalAddress(address, 1));
      }

      if (this.sourceCoin.getFamily() === 'ltc') {
        outputAddresses = outputAddresses.map((address) => this.sourceCoin.canonicalAddress(address, 2));
      }

      this._log(`Finding unspents for these output addresses: ${outputAddresses.join(', ')}`);

      // Get unspents for addresses
      const ADDRESS_UNSPENTS_URL = this.sourceCoin.url(`/public/addressUnspents/${outputAddresses.join(',')}`);
      const addressRes = yield request.get(ADDRESS_UNSPENTS_URL);
      const unspents = addressRes.body;

      this.unspents = unspents;
      return unspents;
    }).call(this).asCallback(callback);
  }

  /**
   * Constructs transaction inputs from a set of unspents.
   * @param unspents {Object[]} array of unspents from the faulty transaction
   * @param callback
   * @returns {Object} partial txInfo object with transaction inputs
   */
  buildInputs(unspents, callback) {
    return co(function *buildInputs() {
      this._log('Building inputs for recovery transaction...');

      unspents = unspents || this.unspents;

      if (!unspents || unspents.length === 0) {
        throw new Error('Could not find unspents. Either supply an argument or call findUnspents');
      }

      const txInfo = {
        inputAmount: 0,
        outputAmount: 0,
        spendAmount: 0,
        inputs: [],
        outputs: [],
        externalOutputs: [],
        changeOutputs: [],
        minerFee: 0,
        payGoFee: 0
      };

      let totalFound = 0;
      const noSegwit = this.recoveryCoin.getFamily() === 'btc' && this.sourceCoin.getFamily() === 'bch';
      for (const unspent of unspents) {
        if (unspent.witnessScript && noSegwit) {
          throw new Error('Warning! It appears one of the unspents is on a Segwit address. The tool only recovers BCH from non-Segwit BTC addresses. Aborting.');
        }

        let searchAddress = unspent.address;

        if (this.sourceCoin.type.endsWith('ltc')) {
          searchAddress = this.sourceCoin.canonicalAddress(searchAddress, 1);
        }

        if (this.recoveryCoin.type.endsWith('ltc')) {
          searchAddress = this.recoveryCoin.canonicalAddress(searchAddress, 2);
        }

        let unspentAddress;
        try {
          const methodName = this.wallet.isV1 ? 'address' : 'getAddress';
          unspentAddress = yield this.wallet[methodName]({ address: searchAddress });
        } catch (e) {
          this._log(`Could not find address on wallet for ${searchAddress}`);
          continue;
        }

        this._log(`Found ${unspent.value * 1e-8} ${this.sourceCoin.type} at address ${unspent.address}`);

        const [txHash, index] = unspent.id.split(':');
        const inputIndex = parseInt(index, 10);
        let hash = new Buffer(txHash, 'hex');
        hash = new Buffer(Array.prototype.reverse.call(hash));

        try {
          this.recoveryTx.addInput(hash, inputIndex);
        } catch (e) {
          throw new Error(`Error adding unspent ${unspent.id}`);
        }

        let inputData = {};

        // Add v1 specific input fields
        if (this.wallet.isV1) {
          const addressInfo = yield this.wallet.address({ address: unspentAddress.address });

          unspentAddress.path = unspentAddress.path || `/${unspentAddress.chain}/${unspentAddress.index}`;
          const [txid, nOut] = unspent.id.split(':');

          inputData = {
            redeemScript: addressInfo.redeemScript,
            witnessScript: addressInfo.witnessScript,
            path: '/0/0' + unspentAddress.path,
            chainPath: unspentAddress.path,
            index: unspentAddress.index,
            chain: unspentAddress.chain,
            txHash: txid,
            txOutputN: parseInt(nOut, 10),
            txValue: unspent.value,
            value: parseInt(unspent.value, 10)
          };
        } else {
          inputData = {
            redeemScript: unspentAddress.coinSpecific.redeemScript,
            witnessScript: unspentAddress.coinSpecific.witnessScript,
            index: unspentAddress.index,
            chain: unspentAddress.chain,
            wallet: this.wallet.id(),
            fromWallet: this.wallet.id()
          };
        }

        txInfo.inputs.push(Object.assign({}, unspent, inputData));

        txInfo.inputAmount += parseInt(unspent.value, 10);
        totalFound += parseInt(unspent.value, 10);
      }

      txInfo.unspents = _.clone(txInfo.inputs);

      // Normalize total found to base unit before we print it out
      this._log(`Found lost ${totalFound * 1e-8} ${this.sourceCoin.type}.`);

      this.txInfo = txInfo;
      return txInfo;
    }).call(this).asCallback(callback);
  }

  /**
   * Sets the txInfo.minerFee field by calculating the size of the transaction and multiplying it by the fee rate for
   * the source coin.
   * @param recoveryTx {Object} recovery transaction containing inputs
   * @returns {Number} recovery fee for the transaction
   */
  setFees(recoveryTx) {
    recoveryTx = recoveryTx || this.recoveryTx;

    // Determine fee with default fee rate
    const P2SH_INPUT_SIZE = config.tx.P2SH_INPUT_SIZE;
    const OUTPUT_SIZE = config.tx.OUTPUT_SIZE;
    const TX_OVERHEAD_SIZE = config.tx.TX_OVERHEAD_SIZE;
    const feeRate = this.feeRates[this.sourceCoin.type];

    // Note that we assume one output here (all funds should be recovered to a single address)
    const txSize = P2SH_INPUT_SIZE * recoveryTx.tx.ins.length + OUTPUT_SIZE + TX_OVERHEAD_SIZE;
    const recoveryFee = feeRate * txSize;
    this.txInfo.minerFee = recoveryFee;

    return recoveryFee;
  }

  /**
   * Constructs a single output to the recovery address.
   * @param recoveryAddress {String} address to recover funds to
   * @param outputAmount {Number} amount to send to the recovery address
   * @param recoveryFee {Number} miner fee for the transaction
   */
  buildOutputs(recoveryAddress, outputAmount, recoveryFee) {
    if (!outputAmount && !this.txInfo) {
      throw new Error('Could not find transaction info. Please provide an output amount, or call buildInputs.');
    }

    this._log(`Building outputs for recovery transaction. Funds will be sent to ${recoveryAddress}...`);

    outputAmount = outputAmount || this.txInfo.inputAmount - (recoveryFee || this.txInfo.minerFee);
    this.txInfo.outputAmount = outputAmount;
    this.txInfo.spendAmount = outputAmount;

    if (outputAmount <= 0) {
      throw new Error('This recovery transaction cannot pay its own fees. Aborting.');
    }

    this.recoveryAddress = recoveryAddress;
    this.recoveryAmount = outputAmount;

    this.recoveryTx.addOutput(recoveryAddress, outputAmount);

    const outputData = {
      address: recoveryAddress,
      value: outputAmount,
      valueString: outputAmount.toString(),
      wallet: this.wallet.id(),
      change: false
    };

    this.txInfo.outputs.push(outputData);
    this.txInfo.externalOutputs.push(outputData);
  }

  /**
   * Half-signs the built transaction with the user's private key or keychain
   * @param prv {String} private key
   * @param passphrase {String} wallet passphrase
   * @param keychain {Object} wallet keychain
   * @param callback
   * @returns {Object} half-signed transaction
   */
  signTransaction({ prv, passphrase, keychain }, callback) {
    return co(function *signTransaction() {
      if (!this.txInfo) {
        throw new Error('Could not find txInfo. Please build a transaction');
      }

      this._log('Signing the transaction...');

      const transactionHex = this.recoveryTx.buildIncomplete().toHex();

      if (!prv) {
        prv = yield this.getKeys(passphrase);
      }

      const txPrebuild = { txHex: transactionHex, txInfo: this.txInfo };
      this.halfSignedRecoveryTx = this.sourceCoin.signTransaction({ txPrebuild, prv });

      return this.halfSignedRecoveryTx;
    }).call(this).asCallback(callback);
  }

  /**
   * Gets the wallet's encrypted keychain, then decrypts it with the wallet passphrase
   * @param passphrase {String} wallet passphrase
   * @param callback
   * @returns {String} decrypted wallet private key
   */
  getKeys(passphrase, callback) {
    return co(function *getKeys() {
      let prv;

      let keychain;
      try {
        keychain = yield this.wallet.getEncryptedUserKeychain();
      } catch (e) {
        if (e.status !== 404) {
          throw e;
        }
      }

      if (!passphrase) {
        throw new Error('You have an encrypted user keychain - please provide the passphrase to decrypt it');
      }


      if (this.wallet.isV1) {
        if (!keychain) {
          throw new Error('V1 wallets need a user keychain - could not find the proper keychain. Aborting');
        }
      }

      if (keychain) {
        try {
          const encryptedPrv = this.wallet.isV1 ? keychain.encryptedXprv : keychain.encryptedPrv;
          prv = this.bitgo.decrypt({ input: encryptedPrv, password: passphrase });
        } catch (e) {
          throw new Error('Error reading private key. Please check that you have the correct wallet passphrase');
        }
      }

      return prv;
    }).call(this).asCallback(callback);
  }

  buildTransaction({ wallet, faultyTxId, recoveryAddress }, callback) {
    return co(function *buildTransaction() {
      yield this.setWallet(wallet);

      yield this.findUnspents(faultyTxId);
      yield this.buildInputs();
      this.setFees();
      this.buildOutputs(recoveryAddress);

      return this.recoveryTx;
    }).call(this).asCallback(callback);
  }

  buildUnsigned(callback) {
    return co(function *() {
      if (!this.txInfo) {
        throw new Error('Could not find txInfo. Please build a transaction');
      }
      const incomplete = this.recoveryTx.buildIncomplete();

      const txInfo = {
        nP2SHInputs: 0,
        nSegwitInputs: 0
      };

      for (const input of this.txInfo.inputs) {
        if (input.chain === 10 || input.chain === 11) {
          txInfo.nSegwitInputs++;
        } else {
          txInfo.nP2SHInputs++;
        }
      }

      txInfo.nOutputs = 1;
      txInfo.unspents = _.map(this.txInfo.inputs, _.partialRight(_.pick, ['chain', 'index', 'redeemScript', 'id', 'address', 'value']));
      txInfo.changeAddresses = [];
      txInfo.walletAddressDetails = {};

      const feeInfo = {};

      const INPUT_SIZE = config.tx.P2SH_INPUT_SIZE;
      const OUTPUT_SIZE = config.tx.OUTPUT_SIZE;
      const OVERHEAD_SIZE = config.tx.TX_OVERHEAD_SIZE;
      feeInfo.size = OVERHEAD_SIZE + (INPUT_SIZE * this.txInfo.inputs.length) + OUTPUT_SIZE;

      feeInfo.feeRate = this.feeRates[this.sourceCoin.type];
      feeInfo.fee = Math.round(feeInfo.size / 1000 * feeInfo.feeRate);
      feeInfo.payGoFee = 0;
      feeInfo.payGoFeeString = '0';

      return {
        txHex: incomplete.toHex(),
        txInfo: txInfo,
        feeInfo: feeInfo,
        walletId: this.wallet.id(),
        amount: this.recoveryAmount,
        address: this.recoveryAddress,
        coin: this.sourceCoin.type
      };
    }).call(this).asCallback(callback);
  }

  export() {
    return {
      version: this.wallet.isV1 ? 1 : 2,
      sourceCoin: this.sourceCoin.type,
      recoveryCoin: this.recoveryCoin.type,
      walletId: this.wallet.id(),
      recoveryAddress: this.recoveryAddress,
      recoveryAmount: this.recoveryAmount,
      txHex: this.halfSignedRecoveryTx.txHex || this.halfSignedRecoveryTx.tx,
      txInfo: this.txInfo
    };
  }
}

module.exports = CrossChainRecoveryTool;
