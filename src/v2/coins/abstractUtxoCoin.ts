import BaseCoin = require('../baseCoin');
const config = require('../../config');
const bitcoin = require('bitgo-utxo-lib');
const bitcoinMessage = require('bitcoinjs-message');
const Promise = require('bluebird');
const co = Promise.coroutine;
const prova = require('prova-lib');
const crypto = require('crypto');
const request = require('superagent');
const _ = require('lodash');
const RecoveryTool = require('../recovery');
const errors = require('../../errors');
const debug = require('debug')('bitgo:v2:utxo');
const { Codes, VirtualSizes } = require('@bitgo/unspents');

class AbstractUtxoCoin extends BaseCoin {

  public readonly altScriptHash;
  public readonly supportAltScriptDestination;
  private readonly _network;

  constructor(network) {
    super();
    if (!_.isObject(network)) {
      throw new Error('network must be an object');
    }
    this._network = network;
  }

  get network() {
    return this._network;
  }

  static get validAddressTypes() {
    const validAddressTypes = [];
    _.forEach(Object.keys(Codes.UnspentTypeTcomb.meta.map), function(addressType) {
      try {
        Codes.forType(addressType);
        validAddressTypes.push(addressType);
      } catch (e) {
        // Do nothing. Codes.forType will throw if the address type has no chain codes, meaning it is invalid on the
        // BitGo platform and should not be added to the validAddressTypes array.
      }
    });
    return validAddressTypes;
  }

  /**
   * Returns the factor between the base unit and its smallest subdivison
   * @return {number}
   */
  getBaseFactor() {
    return 1e8;
  }

  getCoinLibrary() {
    return bitcoin;
  }

  isValidAddress(address, forceAltScriptSupport = false) {
    const validVersions = [
      this.network.pubKeyHash,
      this.network.scriptHash
    ];
    if (this.altScriptHash && (forceAltScriptSupport || this.supportAltScriptDestination)) {
      validVersions.push(this.altScriptHash);
    }

    let addressDetails;
    try {
      addressDetails = this.getCoinLibrary().address.fromBase58Check(address);
    } catch (e) {
      if (!this.supportsP2wsh()) {
        return false;
      }

      try {
        addressDetails = bitcoin.address.fromBech32(address);
        return addressDetails.prefix === this.network.bech32;
      } catch (e) {
        return false;
      }
    }

    // the address version needs to be among the valid ones
    return validVersions.includes(addressDetails.version);
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPub(pub) {
    try {
      bitcoin.HDNode.fromBase58(pub);
      return true;
    } catch (e) {
      return false;
    }
  }

  getLatestBlockHeight(reqId, callback) {
    return co(function *() {
      if (reqId) {
        this.bitgo._reqId = reqId;
      }
      const chainhead = yield this.bitgo.get(this.url('/public/block/latest')).result();
      return chainhead.height;
    }).call(this).asCallback(callback);
  }

  postProcessPrebuild(prebuild, callback) {
    return co(function *() {
      if (_.isUndefined(prebuild.blockHeight)) {
        prebuild.blockHeight = yield this.getLatestBlockHeight();
      }
      const transaction = bitcoin.Transaction.fromHex(prebuild.txHex, this.network);
      transaction.locktime = prebuild.blockHeight + 1;
      return _.extend({}, prebuild, { txHex: transaction.toHex() });
    }).call(this).asCallback(callback);
  }

  /**
   * Find outputs that are within expected outputs but not within actual outputs, including duplicates
   * @param expectedOutputs
   * @param actualOutputs
   * @returns {Array}
   */
  static findMissingOutputs(expectedOutputs, actualOutputs) {
    const keyFunc = ({ address, amount }) => `${address}:${Number(amount)}`;
    const groupedOutputs = _.groupBy(expectedOutputs, keyFunc);

    actualOutputs.forEach((output) => {
      const group = groupedOutputs[keyFunc(output)];
      if (group) {
        group.pop();
      }
    });

    return _.flatten(_.values(groupedOutputs));
  }

  /**
   * Determine an address' type based on its witness and redeem script presence
   * @param addressDetails
   */
  static inferAddressType(addressDetails) {
    if (_.isObject(addressDetails.coinSpecific)) {
      if (_.isString(addressDetails.coinSpecific.redeemScript) && _.isString(addressDetails.coinSpecific.witnessScript)) {
        return Codes.UnspentTypeTcomb('p2shP2wsh');
      } else if (_.isString(addressDetails.coinSpecific.redeemScript)) {
        return Codes.UnspentTypeTcomb('p2sh');
      } else if (_.isString(addressDetails.coinSpecific.witnessScript)) {
        return Codes.UnspentTypeTcomb('p2wsh');
      }
    }
    return null;
  }

  /**
   * Extract and fill transaction details such as internal/change spend, external spend (explicit vs. implicit), etc.
   * @param txParams
   * @param txPrebuild
   * @param wallet
   * @param verification
   * @param callback
   * @returns {*}
   */
  parseTransaction({ txParams, txPrebuild, wallet, verification = {} as any, reqId }, callback) {

    return co(function *() {
      if (!_.isUndefined(verification.disableNetworking) && !_.isBoolean(verification.disableNetworking)) {
        throw new Error('verification.disableNetworking must be a boolean');
      }
      const disableNetworking = !!verification.disableNetworking;

      // obtain the keychains and key signatures
      let keychains = verification.keychains;
      if (!keychains && disableNetworking) {
        throw new Error('cannot fetch keychains without networking');
      } else if (!keychains) {
        keychains = yield Promise.props({
          user: this.keychains().get({ id: wallet._wallet.keys[0], reqId }),
          backup: this.keychains().get({ id: wallet._wallet.keys[1], reqId }),
          bitgo: this.keychains().get({ id: wallet._wallet.keys[2], reqId })
        });
      }
      const keychainArray = [keychains.user, keychains.backup, keychains.bitgo];

      const keySignatures = _.get(wallet, '_wallet.keySignatures');

      // obtain all outputs
      const explanation = this.explainTransaction({
        txHex: txPrebuild.txHex,
        txInfo: txPrebuild.txInfo,
        keychains: keychains
      });

      const allOutputs = [...explanation.outputs, ...explanation.changeOutputs];

      // verify that each recipient from txParams has their own output
      const expectedOutputs = _.get(txParams, 'recipients', []);
      const missingOutputs = this.constructor.findMissingOutputs(expectedOutputs, allOutputs);

      /**
       * Loop through all the outputs and classify each of them as either internal spends
       * or external spends by setting the "external" property to true or false on the output object.
       */
      const allOutputDetails = yield Promise.map(allOutputs, co(function *(currentOutput) {
        const currentAddress = currentOutput.address;

        // attempt to grab the address details from either the prebuilt tx, or the verification params.
        // If both of these are empty, then we will try to get the address details from bitgo instead
        const addressDetailsPrebuild = _.get(txPrebuild, `txInfo.walletAddressDetails.${currentAddress}`, {});
        const addressDetailsVerification = _.get(verification, `addresses.${currentAddress}`, {});
        debug('Parsing address details for %s', currentAddress);
        try {
          /**
           * The only way to determine whether an address is known on the wallet is to initiate a network request and
           * fetch it. Should the request fail and return a 404, it will throw and therefore has to be caught. For that
           * reason, address wallet ownership detection is wrapped in a try/catch. Additionally, once the address
           * details are fetched on the wallet, a local address validation is run, whose errors however are generated
           * client-side and can therefore be analyzed with more granularity and type checking.
           */
          let addressDetails = _.extend({}, addressDetailsPrebuild, addressDetailsVerification);
          debug('Locally available address %s details: %O', currentAddress, addressDetails);
          if (_.isEmpty(addressDetails) && !disableNetworking) {
            addressDetails = yield wallet.getAddress({ address: currentAddress, reqId });
            debug('Downloaded address %s details: %O', currentAddress, addressDetails);
          }
          // verify that the address is on the wallet. verifyAddress throws if
          // it fails to correctly rederive the address, meaning it's external
          const addressType = this.constructor.inferAddressType(addressDetails);
          this.verifyAddress(_.extend({ addressType }, addressDetails, {
            keychains: keychainArray,
            address: currentAddress
          }));
          debug('Address %s verification passed', currentAddress);

          // verify address succeeded without throwing, so the address was
          // correctly rederived from the wallet keychains, making it not external
          return _.extend({}, currentOutput, addressDetails, { external: false });
        } catch (e) {
          // verify address threw an exception
          debug('Address %s verification threw an error:', currentAddress, e);
          // Todo: name server-side errors to avoid message-based checking [BG-5124]
          const walletAddressNotFound = e.message.includes('wallet address not found');
          const unexpectedAddress = (e instanceof errors.UnexpectedAddressError);
          if (walletAddressNotFound || unexpectedAddress) {
            if (unexpectedAddress && !walletAddressNotFound) {
              /**
               * this could be a migrated SafeHD BCH wallet, and the transaction we are currently
               * parsing is trying to spend change back to the v1 wallet base address.
               * It does this since we don't allow new address creation for these wallets,
               * and instead return the base address from the v1 wallet when a new address is requested.
               * If this new address is requested for the purposes of spending change back to the wallet,
               * the change will go to the v1 wallet base address. This address *is* on the wallet,
               * but it will still cause an error to be thrown by verifyAddress, since the derivation path
               * used for this address is non-standard. (I have seen these addresses derived using paths m/0/0 and m/101,
               * whereas the v2 addresses are derived using path  m/0/0/${chain}/${index}).
               *
               * This means we need to check for this case explicitly in this catch block, and classify
               * these types of outputs as internal instead of external. Failing to do so would cause the
               * transaction's implicit external outputs (ie, outputs which go to addresses not specified in
               * the recipients array) to add up to more than the 150 basis point limit which we enforce on
               * pay-as-you-go outputs (which should be the only implicit external outputs on our transactions).
               *
               * The 150 basis point limit for implicit external sends is enforced in verifyTransaction,
               * which calls this function to get information on the total external/internal spend amounts
               * for a transaction. The idea here is to protect from the transaction being maliciously modified
               * to add more implicit external spends (eg, to an attacker-controlled wallet).
               *
               * See verifyTransaction for more information on how transaction prebuilds are verified before signing.
               */

              if (_.isString(wallet._wallet.migratedFrom) && wallet._wallet.migratedFrom === currentAddress) {
                debug('found address %s which was migrated from v1 wallet, address is not external', currentAddress);
                return _.extend({}, currentOutput, { external: false });
              }

              debug('Address %s was found on wallet but could not be reconstructed', currentAddress);
            }

            // the address was found, but not on the wallet, which simply means it's external
            debug('Address %s presumed external', currentAddress);
            return _.extend({}, currentOutput, { external: true });
          } else if (e instanceof errors.InvalidAddressDerivationPropertyError && currentAddress === txParams.changeAddress) {
            // expect to see this error when passing in a custom changeAddress with no chain or index
            return _.extend({}, currentOutput, { external: false });
          }

          debug('Address %s verification failed', currentAddress);
          /**
           * It might be a completely invalid address or a bad validation attempt or something else completely, in
           * which case we do not proceed and rather rethrow the error, which is safer than assuming that the address
           * validation failed simply because it's external to the wallet.
           */
          throw e;
        }
      }).bind(this));

      const changeOutputs = _.filter(allOutputDetails, { external: false });

      // these are all the outputs that were not originally explicitly specified in recipients
      const implicitOutputs = this.constructor.findMissingOutputs(allOutputDetails, expectedOutputs);

      const explicitOutputs = this.constructor.findMissingOutputs(allOutputDetails, implicitOutputs);

      // these are all the non-wallet outputs that had been originally explicitly specified in recipients
      const explicitExternalOutputs = _.filter(explicitOutputs, { external: true });

      // this is the sum of all the originally explicitly specified non-wallet output values
      const explicitExternalSpendAmount = _.sumBy(explicitExternalOutputs, 'amount');

      /**
       * The calculation of the implicit external spend amount pertains to verifying the pay-as-you-go-fee BitGo
       * automatically applies to transactions sending money out of the wallet. The logic is fairly straightforward
       * in that we compare the external spend amount that was specified explicitly by the user to the portion
       * that was specified implicitly. To protect customers from people tampering with the transaction outputs, we
       * define a threshold for the maximum percentage of the implicit external spend in relation to the explicit
       * external spend.
       */

      // make sure that all the extra addresses are change addresses
      // get all the additional external outputs the server added and calculate their values
      const implicitExternalOutputs = _.filter(implicitOutputs, { external: true });
      const implicitExternalSpendAmount = _.sumBy(implicitExternalOutputs, 'amount');

      return {
        keychains,
        keySignatures,
        outputs: allOutputDetails,
        missingOutputs,
        explicitExternalOutputs,
        implicitExternalOutputs,
        changeOutputs,
        explicitExternalSpendAmount,
        implicitExternalSpendAmount
      };

    }).call(this).asCallback(callback);
  }

  /**
   * Verify that a transaction prebuild complies with the original intention
   * @param txParams params object passed to send
   * @param txPrebuild prebuild object returned by server
   * @param txPrebuild.txHex prebuilt transaction's txHex form
   * @param wallet Wallet object to obtain keys to verify against
   * @param verification Object specifying some verification parameters
   * @param verification.disableNetworking Disallow fetching any data from the internet for verification purposes
   * @param verification.keychains Pass keychains manually rather than fetching them by id
   * @param verification.addresses Address details to pass in for out-of-band verification
   * @param callback
   * @returns {boolean}
   */
  verifyTransaction({ txParams, txPrebuild, wallet, verification = {} as any, reqId }, callback) {
    return co(function *() {
      const disableNetworking = !!verification.disableNetworking;
      const parsedTransaction = yield this.parseTransaction({ txParams, txPrebuild, wallet, verification, reqId });

      const keychains = parsedTransaction.keychains;

      // let's verify these keychains
      const keySignatures = parsedTransaction.keySignatures;
      if (!_.isEmpty(keySignatures)) {
        // first, let's verify the integrity of the user key, whose public key is used for subsequent verifications
        const userPub = keychains.user.pub;
        const userKey = bitcoin.HDNode.fromBase58(userPub);
        let userPrv = keychains.user.prv;
        if (_.isEmpty(userPrv)) {
          const encryptedPrv = keychains.user.encryptedPrv;
          if (!_.isEmpty(encryptedPrv)) {
            // if the decryption fails, it will throw an error
            userPrv = this.bitgo.decrypt({
              input: encryptedPrv,
              password: txParams.walletPassphrase
            });
          }
        }
        if (_.isEmpty(userPrv)) {
          const errorMessage = 'user private key unavailable for verification';
          if (disableNetworking) {
            console.log(errorMessage);
          } else {
            throw new Error(errorMessage);
          }
        } else {
          const userPrivateKey = bitcoin.HDNode.fromBase58(userPrv);
          if (userPrivateKey.toBase58() === userPrivateKey.neutered().toBase58()) {
            throw new Error('user private key is only public');
          }
          if (userPrivateKey.neutered().toBase58() !== userPub) {
            throw new Error('user private key does not match public key');
          }
        }

        const backupPubSignature = keySignatures.backupPub;
        const bitgoPubSignature = keySignatures.bitgoPub;

        // verify the signatures against the user public key
        const signingAddress = userKey.keyPair.getAddress();

        // BG-5703: use BTC mainnet prefix for all key signature operations
        // (this means do not pass a prefix parameter, and let it use the default prefix instead)
        const isValidBackupSignature = bitcoinMessage.verify(keychains.backup.pub, signingAddress, Buffer.from(backupPubSignature, 'hex'));
        const isValidBitgoSignature = bitcoinMessage.verify(keychains.bitgo.pub, signingAddress, Buffer.from(bitgoPubSignature, 'hex'));

        if (!isValidBackupSignature || !isValidBitgoSignature) {
          throw new Error('secondary public key signatures invalid');
        }
      } else if (!disableNetworking) {
        // these keys were obtained online and their signatures were not verified
        // this could be dangerous
        console.log('unsigned keys obtained online are being used for address verification');
      }

      const missingOutputs = parsedTransaction.missingOutputs;
      if (missingOutputs.length !== 0) {
        // there are some outputs in the recipients list that have not made it into the actual transaction
        throw new Error('expected outputs missing in transaction prebuild');
      }

      const intendedExternalSpend = parsedTransaction.explicitExternalSpendAmount;

      // this is a limit we impose for the total value that is amended to the transaction beyond what was originally intended
      const payAsYouGoLimit = intendedExternalSpend * 0.015; // 150 basis points is the absolute permitted maximum

      /*
      Some explanation for why we're doing what we're doing:
      Some customers will have an output to BitGo's PAYGo wallet added to their transaction, and we need to account for
      it here. To protect someone tampering with the output to make it send more than it should to BitGo, we define a
      threshold for the output's value above which we'll throw an error, because the paygo output should never be that
      high.
       */

      // make sure that all the extra addresses are change addresses
      // get all the additional external outputs the server added and calculate their values
      const nonChangeAmount = parsedTransaction.implicitExternalSpendAmount;

      // the additional external outputs can only be BitGo's pay-as-you-go fee, but we cannot verify the wallet address
      if (nonChangeAmount > payAsYouGoLimit) {
        // there are some addresses that are outside the scope of intended recipients that are not change addresses
        throw new Error('prebuild attempts to spend to unintended external recipients');
      }

      const allOutputs = parsedTransaction.outputs;
      const transaction = bitcoin.Transaction.fromHex(txPrebuild.txHex, this.network);
      const transactionCache = {};
      const inputs = yield Promise.map(transaction.ins, co(function *(currentInput) {
        const transactionId = Buffer.from(currentInput.hash).reverse().toString('hex');
        const txHex = _.get(txPrebuild, `txInfo.txHexes.${transactionId}`);
        if (txHex) {
          const localTx = bitcoin.Transaction.fromHex(txHex, this.network);
          if (localTx.getId() !== transactionId) {
            throw new Error('input transaction hex does not match id');
          }
          const currentOutput = localTx.outs[currentInput.index];
          const address = bitcoin.address.fromOutputScript(currentOutput.script, this.network);
          return {
            address,
            value: currentOutput.value
          };
        } else if (!transactionCache[transactionId]) {
          if (disableNetworking) {
            throw new Error('attempting to retrieve transaction details externally with networking disabled');
          }
          if (reqId) {
            this.bitgo._reqId = reqId;
          }
          transactionCache[transactionId] = yield this.bitgo.get(this.url(`/public/tx/${transactionId}`)).result();
        }
        const transactionDetails = transactionCache[transactionId];
        return transactionDetails.outputs[currentInput.index];
      }).bind(this));

      const inputAmount = _.sumBy(inputs, 'value');
      const outputAmount = _.sumBy(allOutputs, 'amount');
      const fee = inputAmount - outputAmount;

      if (fee < 0) {
        throw new Error(`attempting to spend ${outputAmount} satoshis, which exceeds the input amount (${inputAmount} satoshis) by ${-fee}`);
      }

      return true;
    }).call(this).asCallback(callback);
  }

  /**
   * Make sure an address is valid and throw an error if it's not.
   * @param address The address string on the network
   * @param addressType
   * @param keychains Keychain objects with xpubs
   * @param coinSpecific Coin-specific details for the address such as a witness script
   * @param chain Derivation chain
   * @param index Derivation index
   */
  verifyAddress({ address, addressType, keychains, coinSpecific, chain, index }) {
    if (!this.isValidAddress(address)) {
      throw new errors.InvalidAddressError(`invalid address: ${address}`);
    }

    if ((_.isUndefined(chain) && _.isUndefined(index)) || (!(_.isFinite(chain) && _.isFinite(index)))) {
      throw new errors.InvalidAddressDerivationPropertyError(`address validation failure: invalid chain (${chain}) or index (${index})`);
    }

    if (!_.isObject(coinSpecific)) {
      throw new errors.InvalidAddressVerificationObjectPropertyError('address validation failure: coinSpecific field must be an object');
    }


    const expectedAddress: any = this.generateAddress({
      addressType,
      keychains,
      threshold: 2,
      chain: chain,
      index: index
    });

    if (expectedAddress.address !== address) {
      throw new errors.UnexpectedAddressError(`address validation failure: expected ${expectedAddress.address} but got ${address}`);
    }
  }

  /**
   * Indicates whether coin supports a block target
   * @returns {boolean}
   */
  supportsBlockTarget() {
    return true;
  }

  /**
   * Indicates whether a coin supports wrapped segwit outputs
   * @returns {boolean}
   */
  supportsP2shP2wsh() {
    return false;
  }

  /**
   * Indicates whether a coin supports native segwit outputs
   * @returns {boolean}
   */
  supportsP2wsh() {
    return false;
  }

  /**
   * TODO(BG-11487): Remove addressType, segwit, and bech32 params in SDKv6
   * Generate an address for a wallet based on a set of configurations
   * @param addressType {string}   Deprecated
   * @param keychains   {[object]} Array of objects with xpubs
   * @param threshold   {number}   Minimum number of signatures
   * @param chain       {number}   Derivation chain (see https://github.com/BitGo/unspents/blob/master/src/codes.ts for
   *                                                 the corresponding address type of a given chain code)
   * @param index       {number}   Derivation index
   * @param segwit      {boolean}  Deprecated
   * @param bech32      {boolean}  Deprecated
   * @returns {{chain: number, index: number, coin: number, coinSpecific: {outputScript, redeemScript}}}
   */
  generateAddress({ addressType, keychains, threshold, chain, index, segwit = false, bech32 = false }) {
    let derivationChain = 0;
    if (_.isInteger(chain) && chain > 0) {
      derivationChain = chain;
    }

    if (_.isUndefined(addressType)) {
      addressType = Codes.UnspentTypeTcomb('p2sh');
      if (_.isBoolean(segwit) && segwit) {
        addressType = Codes.UnspentTypeTcomb('p2shP2wsh');
      }
      if (_.isBoolean(bech32) && bech32) {
        addressType = Codes.UnspentTypeTcomb('p2wsh');
      }
    }

    switch (addressType) {
      case Codes.UnspentTypeTcomb('p2sh'):
        if (!Codes.isP2sh(derivationChain)) {
          throw new errors.AddressTypeChainMismatchError(addressType, derivationChain);
        }
        break;
      case Codes.UnspentTypeTcomb('p2shP2wsh'):
        if (!this.supportsP2shP2wsh()) {
          throw new errors.P2shP2wshUnsupportedError();
        }

        if (!Codes.isP2shP2wsh(derivationChain)) {
          throw new errors.AddressTypeChainMismatchError(addressType, derivationChain);
        }
        break;
      case Codes.UnspentTypeTcomb('p2wsh'):
        if (!this.supportsP2wsh()) {
          throw new errors.P2wshUnsupportedError();
        }

        if (!Codes.isP2wsh(derivationChain)) {
          throw new errors.AddressTypeChainMismatchError(addressType, derivationChain);
        }
        break;
      default:
        throw new errors.UnsupportedAddressTypeError();
    }

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

    let derivationIndex = 0;
    if (_.isInteger(index) && index > 0) {
      derivationIndex = index;
    }

    const path = 'm/0/0/' + derivationChain + '/' + derivationIndex;
    const hdNodes = keychains.map(({ pub }) => prova.HDNode.fromBase58(pub));
    const derivedKeys = hdNodes.map(hdNode => hdNode.hdPath().deriveKey(path).getPublicKeyBuffer());

    const addressDetails: any = {
      chain: derivationChain,
      index: derivationIndex,
      coin: this.getChain(),
      coinSpecific: {},
      addressType
    };

    const { outputScript, redeemScript, witnessScript, address } =
      this.createMultiSigAddress(addressType, signatureThreshold, derivedKeys);
    addressDetails.coinSpecific.outputScript = outputScript.toString('hex');
    addressDetails.coinSpecific.redeemScript = redeemScript && redeemScript.toString('hex');
    addressDetails.coinSpecific.witnessScript = witnessScript && witnessScript.toString('hex');
    addressDetails.address = address;

    return addressDetails;
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   * @param params
   * - txPrebuild
   * - prv
   * @param params.isLastSignature Ture if txb.build() should be called and not buildIncomplete()
   * @returns {{txHex}}
   */
  signTransaction(params) {
    const txPrebuild = params.txPrebuild;
    const userPrv = params.prv;

    if (_.isUndefined(txPrebuild) || !_.isObject(txPrebuild)) {
      if (!_.isUndefined(txPrebuild) && !_.isObject(txPrebuild)) {
        throw new Error(`txPrebuild must be an object, got type ${typeof txPrebuild}`);
      }
      throw new Error('missing txPrebuild parameter');
    }
    let transaction = bitcoin.Transaction.fromHex(txPrebuild.txHex, this.network);

    if (transaction.ins.length !== txPrebuild.txInfo.unspents.length) {
      throw new Error('length of unspents array should equal to the number of transaction inputs');
    }

    let isLastSignature = false;
    if (_.isBoolean(params.isLastSignature)) {
      // if build is called instead of buildIncomplete, no signature placeholders are left in the sig script
      isLastSignature = params.isLastSignature;
    }

    if (_.isUndefined(userPrv) || !_.isString(userPrv)) {
      if (!_.isUndefined(userPrv) && !_.isString(userPrv)) {
        throw new Error(`prv must be a string, got type ${typeof userPrv}`);
      }
      throw new Error('missing prv parameter to sign transaction');
    }

    const keychain = bitcoin.HDNode.fromBase58(userPrv);
    const hdPath = bitcoin.hdPath(keychain);
    const txb = bitcoin.TransactionBuilder.fromTransaction(transaction, this.network);
    this.prepareTransactionBuilder(txb);

    const getSignatureContext = (txPrebuild, index) => {
      const currentUnspent = txPrebuild.txInfo.unspents[index];
      return {
        inputIndex: index,
        unspent: currentUnspent,
        path: 'm/0/0/' + currentUnspent.chain + '/' + currentUnspent.index,
        isP2wsh: !currentUnspent.redeemScript,
        isBitGoTaintedUnspent: this.isBitGoTaintedUnspent(currentUnspent),
        error: undefined
      };
    };

    const signatureIssues = [];
    // Sign inputs
    for (let index = 0; index < transaction.ins.length; ++index) {
      debug('Signing input %d of %d', index + 1, transaction.ins.length);
      const signatureContext = getSignatureContext(txPrebuild, index);
      if (signatureContext.isBitGoTaintedUnspent) {
        debug(
          'Skipping input %d of %d (unspent from replay protection address which is platform signed only)',
          index + 1, transaction.ins.length
        );
        continue;
      }
      const privKey = hdPath.deriveKey(signatureContext.path);
      privKey.network = this.network;

      debug('Input details: %O', signatureContext);

      const sigHashType = this.defaultSigHashType;
      try {
        if (signatureContext.isP2wsh) {
          debug('Signing p2wsh input');
          const witnessScript = Buffer.from(signatureContext.unspent.witnessScript, 'hex');
          const witnessScriptHash = bitcoin.crypto.sha256(witnessScript);
          const prevOutScript = bitcoin.script.witnessScriptHash.output.encode(witnessScriptHash);
          txb.sign(index, privKey, prevOutScript, sigHashType, signatureContext.unspent.value, witnessScript);
        } else {
          const subscript = new Buffer(signatureContext.unspent.redeemScript, 'hex');
          const isP2shP2wsh = !!signatureContext.unspent.witnessScript;
          if (isP2shP2wsh) {
            debug('Signing p2shP2wsh input');
            const witnessScript = Buffer.from(signatureContext.unspent.witnessScript, 'hex');
            txb.sign(index, privKey, subscript, sigHashType, signatureContext.unspent.value, witnessScript);
          } else {
            debug('Signing p2sh input');
            txb.sign(index, privKey, subscript, sigHashType, signatureContext.unspent.value);
          }
        }

      } catch (e) {
        debug('Failed to sign input:', e);
        signatureContext.error = e;
        signatureIssues.push(signatureContext);
        continue;
      }
    }

    if (isLastSignature) {
      transaction = txb.build();
    } else {
      transaction = txb.buildIncomplete();
    }

    // Verify input signatures
    for (let index = 0; index < transaction.ins.length; ++index) {
      debug('Verifying input signature %d of %d', index + 1, transaction.ins.length);
      const signatureContext = getSignatureContext(txPrebuild, index);
      if (signatureContext.isBitGoTaintedUnspent) {
        debug(
          'Skipping input signature %d of %d (unspent from replay protection address which is platform signed only)',
          index + 1, transaction.ins.length
        );
        continue;
      }

      if (signatureContext.isP2wsh) {
        transaction.setInputScript(index, Buffer.alloc(0));
      }

      const isValidSignature = this.verifySignature(transaction, index, signatureContext.unspent.value);
      if (!isValidSignature) {
        debug('Invalid signature');
        signatureContext.error = new Error('invalid signature');
        signatureIssues.push(signatureContext);
      }
    }

    if (signatureIssues.length > 0) {
      const failedIndices = signatureIssues.map(currentIssue => currentIssue.inputIndex);
      const error: any = new Error(`Failed to sign inputs at indices ${failedIndices.join(', ')}`);
      error.code = 'input_signature_failure';
      error.signingErrors = signatureIssues;
      throw error;
    }

    return {
      txHex: transaction.toBuffer().toString('hex')
    };
  }

  /**
   * Always false for coins other than BCH and TBCH.
   * @param unspent
   * @returns {boolean}
   */
  isBitGoTaintedUnspent(unspent) {
    return false;
  }

  /**
   * Modify the transaction builder to comply with the specific coin's requirements such as version and branch id
   * @param txBuilder
   * @returns {*}
   */
  prepareTransactionBuilder(txBuilder) {
    return txBuilder;
  }

  /**
   *
   * @returns {number}
   */
  get defaultSigHashType() {
    return bitcoin.Transaction.SIGHASH_ALL;
  }

  /**
   * Parse a transaction's signature script to obtain public keys, signatures, the sig script, and other properties
   * @param transaction
   * @param inputIndex
   * @returns { isSegwitInput: boolean, inputClassification: string, signatures: [Buffer], publicKeys: [Buffer], pubScript: Buffer }
   */
  parseSignatureScript(transaction, inputIndex) {
    const currentInput = transaction.ins[inputIndex];
    const isSegwitInput = currentInput.witness.length > 0;
    const isNativeSegwitInput = currentInput.script.length === 0;
    let decompiledSigScript, inputClassification;
    if (isSegwitInput) {
      // The decompiledSigScript is the script containing the signatures, public keys, and the script that was committed
      // to (pubScript). If this is a segwit input the decompiledSigScript is in the witness, regardless of whether it
      // is native or not. The inputClassification is determined based on whether or not the input is native to give an
      // accurate classification. Note that p2shP2wsh inputs will be classified as p2sh and not p2wsh.
      decompiledSigScript = currentInput.witness;
      if (isNativeSegwitInput) {
        inputClassification = bitcoin.script.classifyWitness(bitcoin.script.compile(decompiledSigScript), true);
      } else {
        inputClassification = bitcoin.script.classifyInput(currentInput.script, true);
      }
    } else {
      inputClassification = bitcoin.script.classifyInput(currentInput.script, true);
      decompiledSigScript = bitcoin.script.decompile(currentInput.script);

    }

    if (inputClassification === bitcoin.script.types.P2PKH) {
      const [signature, publicKey] = decompiledSigScript;
      const publicKeys = [publicKey];
      const signatures = [signature];
      const pubScript = bitcoin.script.pubKeyHash.output.encode(bitcoin.crypto.hash160(publicKey));

      return { isSegwitInput, inputClassification, signatures, publicKeys, pubScript };
    } else if (inputClassification === bitcoin.script.types.P2SH
        || inputClassification === bitcoin.script.types.P2WSH) {
      // Note the assumption here that if we have a p2sh or p2wsh input it will be multisig (appropriate because the
      // BitGo platform only supports multisig within these types of inputs). Signatures are all but the last entry in
      // the decompiledSigScript. The redeemScript/witnessScript (depending on which type of input this is) is the last
      // entry in the decompiledSigScript (denoted here as the pubScript). The public keys are the second through
      // antepenultimate entries in the decompiledPubScript. See below for a visual representation of the typical 2-of-3
      // multisig setup:
      //
      // decompiledSigScript = 0 <sig1> <sig2> <pubScript>
      // decompiledPubScript = 2 <pub1> <pub2> <pub3> 3 OP_CHECKMULTISIG
      const signatures = decompiledSigScript.slice(0, -1);
      const pubScript = _.last(decompiledSigScript);
      const decompiledPubScript = bitcoin.script.decompile(pubScript);
      const publicKeys = decompiledPubScript.slice(1, -2);

      // Op codes 81 through 96 represent numbers 1 through 16 (see https://en.bitcoin.it/wiki/Script#Opcodes), which is
      // why we subtract by 80 to get the number of signatures (n) and the number of public keys (m) in an n-of-m setup.
      const len = decompiledPubScript.length;
      const nSignatures = decompiledPubScript[0] - 80;
      const nPubKeys = decompiledPubScript[len - 2] - 80;

      // Due to a bug in the implementation of multisignature in the bitcoin protocol, a 0 is added to the signature
      // script, so we add 1 when asserting the number of signatures matches the number of signatures expected by the
      // pub script. Also, note that we consider a signature script with the the same number of signatures as public
      // keys (+1 as noted above) valid because we use placeholder signatures when parsing a half-signed signature
      // script.
      if (signatures.length !== nSignatures + 1 && signatures.length !== nPubKeys + 1) {
        throw new Error(`expected ${nSignatures} or ${nPubKeys} signatures, got ${signatures.length - 1}`);
      }

      if (publicKeys.length !== nPubKeys) {
        throw new Error(`expected ${nPubKeys} public keys, got ${publicKeys.length}`);
      }

      const lastOpCode = decompiledPubScript[len - 1];
      if (lastOpCode !== bitcoin.opcodes.OP_CHECKMULTISIG) {
        throw new Error(`expected opcode #${bitcoin.opcodes.OP_CHECKMULTISIG}, got opcode #${lastOpCode}`);
      }

      return { isSegwitInput, inputClassification, signatures, publicKeys, pubScript };
    } else {
      return { isSegwitInput, inputClassification };
    }


  }

  /**
   * Calculate the hash to verify the signature against
   * @param transaction Transaction object
   * @param inputIndex
   * @param pubScript
   * @param amount The previous output's amount
   * @param hashType
   * @param isSegwitInput
   * @returns {*}
   */
  calculateSignatureHash(transaction, inputIndex, pubScript, amount, hashType, isSegwitInput) {
    if (isSegwitInput) {
      return transaction.hashForWitnessV0(inputIndex, pubScript, amount, hashType);
    } else {
      return transaction.hashForSignature(inputIndex, pubScript, hashType);
    }
  }

  /**
   * Verify the signature on a (half-signed) transaction
   * @param transaction bitcoinjs-lib tx object
   * @param inputIndex The input whererfore to check the signature
   * @param amount For segwit and BCH, the input amount needs to be known for signature verification
   * @param verificationSettings
   * @param verificationSettings.signatureIndex The index of the signature to verify (only iterates over non-empty signatures)
   * @param verificationSettings.publicKey The hex of the public key to verify (will verify all signatures)
   * @returns {boolean}
   */
  verifySignature(transaction, inputIndex, amount, verificationSettings = {} as any) {

    const { signatures, publicKeys, isSegwitInput, inputClassification, pubScript } =
        this.parseSignatureScript(transaction, inputIndex);

    if (![bitcoin.script.types.P2WSH, bitcoin.script.types.P2SH, bitcoin.script.types.P2PKH]
        .includes(inputClassification)) {
      return false;
    }

    if (isSegwitInput && !amount) {
      return false;
    }

    // get the first non-empty signature and verify it against all public keys
    const nonEmptySignatures = _.filter(signatures, s => !_.isEmpty(s));

    /*
    We either want to verify all signature/pubkey combinations, or do an explicit combination

    If a signature index is specified, only that signature is checked. It's verified against all public keys.
    If a single public key is found to be valid, the function returns true.

    If a public key is specified, we iterate over all signatures. If a single one matches the public key, the function
    returns true.

    If neither is specified, all signatures are checked against all public keys. Each signature must have its own distinct
    public key that it matches for the function to return true.
     */
    let signaturesToCheck = nonEmptySignatures;
    if (!_.isUndefined(verificationSettings.signatureIndex)) {
      signaturesToCheck = [nonEmptySignatures[verificationSettings.signatureIndex]];
    }

    const publicKeyHex = verificationSettings.publicKey;
    const matchedPublicKeyIndices = {};
    let areAllSignaturesValid = true;

    // go over all signatures
    for (const signatureBuffer of signaturesToCheck) {

      let isSignatureValid = false;

      if (Buffer.isBuffer(signatureBuffer) && signatureBuffer.length > 0) {
        // slice the last byte from the signature hash input because it's the hash type
        const signature = bitcoin.ECSignature.fromDER(signatureBuffer.slice(0, -1));
        const hashType = _.last(signatureBuffer);
        const signatureHash = this.calculateSignatureHash(transaction, inputIndex, pubScript, amount, hashType, isSegwitInput);

        for (let publicKeyIndex = 0; publicKeyIndex < publicKeys.length; publicKeyIndex++) {

          const publicKeyBuffer = publicKeys[publicKeyIndex];
          if (!_.isUndefined(publicKeyHex) && publicKeyBuffer.toString('hex') !== publicKeyHex) {
            // we are only looking to verify one specific public key's signature (publicKeyHex)
            // this particular public key is not the one whose signature we're trying to verify
            continue;
          }

          if (matchedPublicKeyIndices[publicKeyIndex]) {
            continue;
          }

          const publicKey = bitcoin.ECPair.fromPublicKeyBuffer(publicKeyBuffer);
          if (publicKey.verify(signatureHash, signature)) {
            isSignatureValid = true;
            matchedPublicKeyIndices[publicKeyIndex] = true;
            break;
          }
        }
      }

      if (!_.isUndefined(publicKeyHex) && isSignatureValid) {
        // We were trying to see if any of the signatures was valid for the given public key. Evidently yes.
        return true;
      }

      if (!isSignatureValid && _.isUndefined(publicKeyHex)) {
        return false;
      }

      areAllSignaturesValid = isSignatureValid && areAllSignaturesValid;
    }

    return areAllSignaturesValid;
  }

  explainTransaction(params = {} as any) {
    const { txHex, txInfo } = params;

    if (!txHex || !_.isString(txHex) || !txHex.match(/^([a-f0-9]{2})+$/i)) {
      throw new Error('invalid transaction hex, must be a valid hex string');
    }

    let transaction;
    try {
      transaction = bitcoin.Transaction.fromHex(txHex, this.network);
    } catch (e) {
      throw new Error('failed to parse transaction hex');
    }

    const id = transaction.getId();
    let changeAddresses = [];
    let spendAmount = 0;
    let changeAmount = 0;
    if (txInfo && txInfo.changeAddresses) {
      changeAddresses = txInfo.changeAddresses;
    }
    const explanation: any = {
      displayOrder: ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs'],
      id: id,
      outputs: [],
      changeOutputs: []
    };

    transaction.outs.forEach((currentOutput) => {
      const currentAddress = this.getCoinLibrary().address.fromOutputScript(currentOutput.script, this.network);
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

    if (_.isInteger(transaction.locktime) && transaction.locktime > 0) {
      explanation.locktime = transaction.locktime;
      explanation.displayOrder.push('locktime');
    }

    const unspentValues = {};

    // get information on tx inputs
    const inputSignatures = transaction.ins.map((input, idx) => {
      const hasSigScript = !_.isEmpty(input.script);
      const hasWitnessScript = !_.isEmpty(input.witness);

      if (!hasSigScript && !hasWitnessScript) {
        // no sig script or witness data for this input
        debug('no signature script or witness script data for input %s', idx);
        return 0;
      }

      let parsedSigScript;
      try {
        parsedSigScript = this.parseSignatureScript(transaction, idx);
      } catch (e) {
        return false;
      }

      if (hasWitnessScript) {
        if (!txInfo || !txInfo.unspents) {
          // segwit txs require input values, cannot validate signatures
          debug('unable to retrieve input amounts from unspents - cannot validate segwit input signatures');
          return 0;
        }

        // lazily populate unspent values
        if (_.isEmpty(unspentValues)) {
          txInfo.unspents.forEach((unspent) => {
            unspentValues[unspent.id] = unspent.value;
          });
        }
      }

      const nonEmptySignatures = parsedSigScript.signatures.filter((sig) => !_.isEmpty(sig));
      const validSignatures = nonEmptySignatures.map((sig, sigIndex) => {
        if (_.isEmpty(sig)) {
          return false;
        }

        const parentTxId = Buffer.from(input.hash).reverse().toString('hex');
        const inputId = `${parentTxId}:${input.index}`;
        const amount = unspentValues[inputId];

        try {
          return this.verifySignature(transaction, idx, amount, { signatureIndex: sigIndex });
        } catch (e) {
          return false;
        }
      });

      return validSignatures.reduce((validCount, isValid) => isValid ? validCount + 1 : validCount, 0);
    });

    explanation.inputSignatures = inputSignatures;
    explanation.signatures = _.max(inputSignatures);
    return explanation;
  }

  createMultiSigAddress(addressType, signatureThreshold, keys) {
    function createWitnessProgram(inputScript) {
      const witnessScriptHash = bitcoin.crypto.sha256(inputScript);
      return bitcoin.script.witnessScriptHash.output.encode(witnessScriptHash);
    }

    const multiSigScript = bitcoin.script.multisig.output.encode(signatureThreshold, keys);
    let outputScript, redeemScript, witnessScript;
    switch (addressType) {
      case Codes.UnspentTypeTcomb('p2sh'):
        const multisigScriptHash = bitcoin.crypto.hash160(multiSigScript);
        outputScript = bitcoin.script.scriptHash.output.encode(multisigScriptHash);
        redeemScript = multiSigScript;
        break;
      case Codes.UnspentTypeTcomb('p2shP2wsh'):
        const witnessProgram = createWitnessProgram(multiSigScript);
        const witnessProgramHash = bitcoin.crypto.hash160(witnessProgram);
        outputScript = bitcoin.script.scriptHash.output.encode(witnessProgramHash);
        redeemScript = witnessProgram;
        witnessScript = multiSigScript;
        break;
      case Codes.UnspentTypeTcomb('p2wsh'):
        outputScript = createWitnessProgram(multiSigScript);
        witnessScript = multiSigScript;
        break;
      default:
        throw new Error(`unexpected addressType ${addressType}`);
    }

    return {
      outputScript,
      redeemScript,
      witnessScript,
      address: bitcoin.address.fromOutputScript(outputScript, this.network)
    };
  }

  // TODO(BG-11638): remove in next SDK major version release
  calculateRecoveryAddress(scriptHashScript) {
    return this.getCoinLibrary().address.fromOutputScript(scriptHashScript, this.network);
  }

  getRecoveryFeePerBytes() {
    return Promise.resolve(100);
  }

  getRecoveryFeeRecommendationApiBaseUrl() {
    return Promise.reject(new Error('AbtractUtxoCoin method not implemented'));
  }

  getRecoveryMarketPrice() {
    return co(function *getRecoveryMarketPrice() {
      const bitcoinAverageUrl = config.bitcoinAverageBaseUrl + this.getFamily().toUpperCase() + 'USD';
      const response = yield request.get(bitcoinAverageUrl).retry(2).result();

      if (response === null || typeof response.last !== 'number') {
        throw new Error('unable to reach BitcoinAverage for price data');
      }

      return response.last;
    }).call(this);
  }


  /**
   * Helper function for recover()
   * This transforms the txInfo from recover into the format that offline-signing-tool expects
   * @param txInfo
   * @param txHex
   * @returns {{txHex: *, txInfo: {unspents: *}, feeInfo: {}, coin: void}}
   */
  formatForOfflineVault(txInfo, txHex) {
    const response = {
      txHex,
      txInfo: {
        unspents: txInfo.inputs
      },
      feeInfo: {},
      coin: this.getChain()
    };
    _.map(response.txInfo.unspents, function(unspent) {
      const pathArray = unspent.chainPath.split('/');
      // Note this code works because we assume our chainPath is m/0/0/chain/index - this will be incorrect for custom derivation schemes
      unspent.index = pathArray[4];
      unspent.chain = pathArray[3];
    });
    return response;
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param params
   * - userKey: [encrypted] xprv, or xpub
   * - backupKey: [encrypted] xprv, or xpub if the xprv is held by a KRS provider
   * - walletPassphrase: necessary if one of the xprvs is encrypted
   * - bitgoKey: xpub
   * - krsProvider: necessary if backup key is held by KRS
   * - recoveryDestination: target address to send recovered funds to
   * - scan: the amount of consecutive addresses without unspents to scan through before stopping
   * - ignoreAddressTypes: (optional) array of AddressTypes to ignore, these are strings defined in Codes.UnspentTypeTcomb
   *        for example: ['p2shP2wsh', 'p2wsh'] will prevent code from checking for wrapped-segwit and native-segwit chains on the public block explorers
   * @param callback
   */
  recover(params, callback) {
    return co(function *recover() {
      const self = this;

      // ============================HELPER FUNCTIONS============================
      function deriveKeys(keyArray, index) {
        return keyArray.map((k) => k.derive(index));
      }

      const queryBlockchainUnspentsPath = co(function *queryBlockchainUnspentsPath(keyArray, basePath, addressesById) {
        const MAX_SEQUENTIAL_ADDRESSES_WITHOUT_TXS = params.scan || 20;
        let numSequentialAddressesWithoutTxs = 0;

        // get unspents for these addresses
        const gatherUnspents = co(function *coGatherUnspents(addrIndex) {
          const derivedKeys = deriveKeys(keyArray, addrIndex);

          const chain = Number(basePath.split('/').pop()); // extracts the chain from the basePath
          const keys = derivedKeys.map(k => k.getPublicKeyBuffer());
          const address: any = self.createMultiSigAddress(Codes.typeForCode(chain), 2, keys);

          const addrInfo = yield self.getAddressInfoFromExplorer(address.address);

          if (addrInfo.txCount === 0) {
            numSequentialAddressesWithoutTxs++;
          } else {
            numSequentialAddressesWithoutTxs = 0;

            if (addrInfo.totalBalance > 0) {
              // This address has a balance.
              address.chainPath = basePath + '/' + addrIndex;
              address.userKey = derivedKeys[0];
              address.backupKey = derivedKeys[1];
              addressesById[address.address] = address;

              // Try to find unspents on it.
              const addressUnspents = yield self.getUnspentInfoFromExplorer(address.address);

              addressUnspents.forEach(function addAddressToUnspent(unspent) {
                unspent.address = address.address;
                walletUnspents.push(unspent);
              });
            }
          }

          if (numSequentialAddressesWithoutTxs >= MAX_SEQUENTIAL_ADDRESSES_WITHOUT_TXS) {
            // stop searching for addresses with unspents in them, we've found 5 in a row with none
            // we are done
            return;
          }

          return gatherUnspents(addrIndex + 1);
        });

        const walletUnspents = [];
        // This will populate walletAddresses
        yield gatherUnspents(0);

        if (walletUnspents.length === 0) {
          // Couldn't find any addresses with funds
          return [];
        }

        return walletUnspents;
      });

      // ============================LOGIC============================
      if (_.isUndefined(params.userKey)) {
        throw new Error('missing userKey');
      }

      if (_.isUndefined(params.backupKey)) {
        throw new Error('missing backupKey');
      }

      if (_.isUndefined(params.recoveryDestination) || !this.isValidAddress(params.recoveryDestination)) {
        throw new Error('invalid recoveryDestination');
      }

      if (!_.isUndefined(params.scan) && (!_.isInteger(params.scan) || params.scan < 0)) {
        throw new Error('scan must be a positive integer');
      }

      const isKrsRecovery = params.backupKey.startsWith('xpub') && !params.userKey.startsWith('xpub');
      const isUnsignedSweep = params.backupKey.startsWith('xpub') && params.userKey.startsWith('xpub');
      const krsProvider = config.krsProviders[params.krsProvider];

      if (isKrsRecovery && _.isUndefined(krsProvider)) {
        throw new Error('unknown key recovery service provider');
      }

      if (isKrsRecovery && !(krsProvider.supportedCoins.includes(this.getFamily()))) {
        throw new Error('specified key recovery service does not support recoveries for this coin');
      }

      const keys = yield this.initiateRecovery(params);

      const baseKeyPath = deriveKeys(deriveKeys(keys, 0), 0);

      const queries = [];
      const addressesById = {};

      _.forEach(Object.keys(Codes.UnspentTypeTcomb.meta.map), function(addressType) {
        // If we aren't ignoring the address type, we derive the public key and construct the query for the external and
        // internal indices
        if (!_.includes(params.ignoreAddressTypes, addressType)) {
          if (addressType === Codes.UnspentTypeTcomb('p2shP2wsh') && !self.supportsP2shP2wsh()) {
            // P2shP2wsh is not supported. Skip.
            return;
          }

          if (addressType === Codes.UnspentTypeTcomb('p2wsh') && !self.supportsP2wsh()) {
            // P2wsh is not supported. Skip.
            return;
          }

          let codes;
          try {
            codes = Codes.forType(Codes.UnspentTypeTcomb(addressType));
          } catch (e) {
            // The unspent type is not supported by bitgo so attempting to get its chain codes throws. Catch that error
            // and continue.
            return;
          }
          const externalChainCode = codes.external;
          const internalChainCode = codes.internal;
          const externalKey = deriveKeys(baseKeyPath, externalChainCode);
          const internalKey = deriveKeys(baseKeyPath, internalChainCode);
          queries.push(queryBlockchainUnspentsPath(externalKey, '/0/0/' + externalChainCode, addressesById));
          queries.push(queryBlockchainUnspentsPath(internalKey, '/0/0/' + internalChainCode, addressesById));
        }
      });

      // Execute the queries and gather the unspents
      const queryResponses = yield Promise.all(queries);
      const unspents = _.flatten(queryResponses); // this flattens the array (turns an array of arrays into just one array)
      const totalInputAmount = _.sumBy(unspents, 'amount');
      if (totalInputAmount <= 0) {
        throw new Error('No input to recover - aborting!');
      }

      // Build the transaction
      const transactionBuilder = new bitcoin.TransactionBuilder(this.network);
      this.prepareTransactionBuilder(transactionBuilder);
      const txInfo: any = {};

      const feePerByte = yield this.getRecoveryFeePerBytes();

      // KRS recovery transactions have a 2nd output to pay the recovery fee, like paygo fees. Use p2wsh outputs because
      // they are the largest outputs and thus the most conservative estimate to use in calculating fees. Also use
      // segwit overhead size and p2sh inputs for the same reason.
      const outputSize = (isKrsRecovery ? 2 : 1) * VirtualSizes.txP2wshOutputSize;
      const approximateSize =
        VirtualSizes.txSegOverheadVSize + outputSize + (VirtualSizes.txP2shInputSize * unspents.length);
      const approximateFee = approximateSize * feePerByte;

      // Construct a transaction
      txInfo.inputs = unspents.map(function addInputForUnspent(unspent) {
        const address = addressesById[unspent.address];

        transactionBuilder.addInput(unspent.txid, unspent.n, 0xffffffff, address.outputScript);

        return {
          chainPath: address.chainPath,
          redeemScript: address.redeemScript && address.redeemScript.toString('hex'),
          witnessScript: address.witnessScript && address.witnessScript.toString('hex'),
          value: unspent.amount
        };
      });

      let recoveryAmount = totalInputAmount - approximateFee;
      let krsFee;
      if (isKrsRecovery) {
        krsFee = yield this.calculateFeeAmount({ provider: params.krsProvider, amount: recoveryAmount });
        recoveryAmount -= krsFee;
      }

      if (recoveryAmount < 0) {
        throw new Error('this wallet\'s balance is too low to pay the fees specified by the KRS provider');
      }

      transactionBuilder.addOutput(params.recoveryDestination, recoveryAmount);

      if (isKrsRecovery && krsFee > 0) {
        const krsFeeAddress = krsProvider.feeAddresses[this.getChain()];

        if (!krsFeeAddress) {
          throw new Error('this KRS provider has not configured their fee structure yet - recovery cannot be completed');
        }

        transactionBuilder.addOutput(krsFeeAddress, krsFee);
      }

      if (isUnsignedSweep) {
        const txHex = transactionBuilder.buildIncomplete().toBuffer().toString('hex');
        return this.formatForOfflineVault(txInfo, txHex);
      } else {
        const signedTx = this.signRecoveryTransaction(transactionBuilder, unspents, addressesById, !isKrsRecovery);
        txInfo.transactionHex = signedTx.build().toBuffer().toString('hex');
        try {
          txInfo.tx = yield this.verifyRecoveryTransaction(txInfo);
        } catch (e) {

          if (!(e instanceof errors.MethodNotImplementedError)) {
            // some coins don't have a reliable third party verification endpoint, so we continue without verification for those coins
            throw new Error('could not verify recovery transaction');
          }
        }
      }

      if (isKrsRecovery) {
        txInfo.coin = this.getChain();
        txInfo.backupKey = params.backupKey;
        txInfo.recoveryAmount = recoveryAmount;
      }

      return txInfo;
    }).call(this).asCallback(callback);
  }

  /**
   * Apply signatures to a funds recovery transaction using user + backup key
   * @param txb {Object} a transaction builder object (with inputs and outputs)
   * @param unspents {Array} the unspents to use in the transaction
   * @param addresses {Array} the address and redeem script info for the unspents
   * @param cosign {Boolean} whether to cosign this transaction with the user's backup key (false if KRS recovery)
   */
  signRecoveryTransaction(txb, unspents, addresses, cosign) {
    // sign the inputs
    const signatureIssues = [];
    unspents.forEach((unspent, i) => {
      const address = addresses[unspent.address];
      const backupPrivateKey = address.backupKey.keyPair;
      const userPrivateKey = address.userKey.keyPair;
      // force-override networks
      backupPrivateKey.network = this.network;
      userPrivateKey.network = this.network;

      const currentSignatureIssue: any = {
        inputIndex: i,
        unspent: unspent
      };

      if (cosign) {
        try {
          txb.sign(i, backupPrivateKey, address.redeemScript, this.defaultSigHashType, unspent.amount, address.witnessScript);
        } catch (e) {
          currentSignatureIssue.error = e;
          signatureIssues.push(currentSignatureIssue);
        }
      }

      try {
        txb.sign(i, userPrivateKey, address.redeemScript, this.defaultSigHashType, unspent.amount, address.witnessScript);
      } catch (e) {
        currentSignatureIssue.error = e;
        signatureIssues.push(currentSignatureIssue);
      }
    });

    if (signatureIssues.length > 0) {
      const failedIndices = signatureIssues.map(currentIssue => currentIssue.inputIndex);
      const error: any = new Error(`Failed to sign inputs at indices ${failedIndices.join(', ')}`);
      error.code = 'input_signature_failure';
      error.signingErrors = signatureIssues;
      throw error;
    }

    return txb;
  }

  /**
   * Calculates the amount (in base units) to pay a KRS provider when building a recovery transaction
   * @param params
   * @param params.provider {String} the KRS provider that holds the backup key
   * @param params.amount {Number} amount (in base units) to be recovered
   * @param callback
   * @returns {*}
   */
  calculateFeeAmount(params, callback) {
    return co(function *calculateFeeAmount() {
      const krsProvider = config.krsProviders[params.provider];

      if (krsProvider === undefined) {
        throw new Error(`no fee structure specified for provider ${params.provider}`);
      }

      if (krsProvider.feeType === 'flatUsd') {
        const feeAmountUsd = krsProvider.feeAmount;
        const currentPrice = yield this.getRecoveryMarketPrice();

        return Math.round(feeAmountUsd / currentPrice * this.getBaseFactor());
      } else {
        // we can add more fee structures here as needed for different providers, such as percentage of recovery amount
        throw new Error('Fee structure not implemented');
      }
    }).call(this).asCallback(callback);
  }

  /**
   * Recover BTC that was sent to the wrong chain
   * @param params
   * @param params.txid {String} The txid of the faulty transaction
   * @param params.recoveryAddress {String} address to send recovered funds to
   * @param params.wallet {Wallet} the wallet that received the funds
   * @param params.recoveryCoin {Coin} the coin type of the wallet that received the funds
   * @param params.signed {Boolean} return a half-signed transaction (default=true)
   * @param params.walletPassphrase {String} the wallet passphrase
   * @param params.xprv {String} the unencrypted xprv (used instead of wallet passphrase)
   * @param callback
   * @returns {*}
   */
  recoverFromWrongChain(params, callback) {
    return co(function *recoverFromWrongChain() {
      const {
        txid,
        recoveryAddress,
        wallet,
        walletPassphrase,
        xprv
      } = params;

      // params.recoveryCoin used to be params.coin, backwards compatibility
      const recoveryCoin = params.coin || params.recoveryCoin;
      // signed should default to true, and only be disabled if explicitly set to false (not undefined)
      const signed = params.signed !== false;

      const sourceCoinFamily = this.getFamily();
      const recoveryCoinFamily = recoveryCoin.getFamily();
      const supportedRecoveryCoins = config.supportedCrossChainRecoveries[sourceCoinFamily];

      if (_.isUndefined(supportedRecoveryCoins) || !supportedRecoveryCoins.includes(recoveryCoinFamily)) {
        throw new Error(`Recovery of ${sourceCoinFamily} balances from ${recoveryCoinFamily} wallets is not supported.`);
      }

      const recoveryTool = new RecoveryTool({
        bitgo: this.bitgo,
        sourceCoin: this,
        recoveryCoin: recoveryCoin,
        logging: false
      });

      yield recoveryTool.buildTransaction({
        wallet: wallet,
        faultyTxId: txid,
        recoveryAddress: recoveryAddress
      });

      if (signed) {
        yield recoveryTool.signTransaction({ passphrase: walletPassphrase, prv: xprv });
        return recoveryTool.export();
      } else {
        return yield recoveryTool.buildUnsigned();
      }
    }).call(this).asCallback(callback);
  }

  /**
   * Generate secp256k1 key pair
   *
   * @param seed
   * @returns {Object} object with generated pub and prv
   */
  generateKeyPair(seed) {
    if (!seed) {
      // An extended private key has both a normal 256 bit private key and a 256
      // bit chain code, both of which must be random. 512 bits is therefore the
      // maximum entropy and gives us maximum security against cracking.
      seed = crypto.randomBytes(512 / 8);
    }
    const extendedKey = prova.HDNode.fromSeedBuffer(seed);
    const xpub = extendedKey.neutered().toBase58();
    return {
      pub: xpub,
      prv: extendedKey.toBase58()
    };
  }

}

export = AbstractUtxoCoin;

