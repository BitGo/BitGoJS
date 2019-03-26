import * as _ from 'lodash';
const BigNumber = require('bignumber.js');
const querystring = require('querystring');
const url = require('url');
import * as Promise from 'bluebird';
const co = Promise.coroutine;
const request = require('superagent');

const BaseCoin = require('../baseCoin');
const config = require('../../config');
import common = require('../../common');
const stellar = require('stellar-sdk');

const maxMemoId = '0xFFFFFFFFFFFFFFFF'; // max unsigned 64-bit number = 18446744073709551615

class Xlm extends BaseCoin {

  constructor() {
    super();
    this.homeDomain = 'bitgo.com'; // used for reverse federation lookup
    stellar.Network.use(new stellar.Network(stellar.Networks.PUBLIC));
  }
  /**
   * Returns the factor between the base unit and its smallest subdivison
   * @return {number}
   */
  getBaseFactor() {
    return 1e7;
  }

  getChain() {
    return 'xlm';
  }

  getFamily() {
    return 'xlm';
  }

  getFullName() {
    return 'Stellar';
  }

  getFederationServerUrl() {
    return common.Environments[this.bitgo.env].stellarFederationServerUrl;
  }

  getHorizonUrl() {
    return 'https://horizon.stellar.org';
  }

  /**
   * Generate ed25519 key pair
   *
   * @param seed
   * @returns {Object} object with generated pub and prv
   */
  generateKeyPair(seed) {
    const pair = seed ? stellar.Keypair.fromRawEd25519Seed(seed) : stellar.Keypair.random();
    return {
      pub: pair.publicKey(),
      prv: pair.secret()
    };
  }

  /**
   * Get decoded ed25519 public key from raw data
   *
   * @param pub {String} Raw public key
   * @returns {String} Encoded public key
   */
  getPubFromRaw(pub) {
    return stellar.StrKey.encodeEd25519PublicKey(Buffer.from(pub, 'hex'));
  }

  /**
   * Get decoded ed25519 private key from raw data
   *
   * @param prv {String} Raw private key
   * @returns {String} Encoded private key
   */
  getPrvFromRaw(prv) {
    return stellar.StrKey.encodeEd25519SecretSeed(Buffer.from(prv, 'hex'));
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPub(pub) {
    return stellar.StrKey.isValidEd25519PublicKey(pub);
  }

  /**
   * Return boolean indicating whether input is valid private key for the coin
   *
   * @param {String} prv the prv to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPrv(prv) {
    return stellar.StrKey.isValidEd25519SecretSeed(prv);
  }

  /**
   * Return boolean indicating whether a memo id is valid
   *
   * @param memoId {String} memo id
   * @returns {boolean} true if memo id is valid
   */
  isValidMemoId(memoId) {
    try {
      stellar.Memo.id(memoId); // throws if the value is not valid memo id
      memoId = new BigNumber(memoId);
    } catch (e) {
      return false;
    }

    return (memoId.gte(0) && memoId.lt(maxMemoId));
  }

  /**
   * Evaluates whether a memo is valid
   *
   * @param value {String} value of the memo
   * @param type {String} type of the memo
   * @returns {Boolean} true if value and type are a valid
   */
  isValidMemo({ value, type }) {
    if (!value || !type) {
      return false;
    }
    try {
      // throws if the value is not valid for the type
      // valid types are: 'id', 'text', 'hash', 'return'
      // See https://www.stellar.org/developers/guides/concepts/transactions.html#memo
      stellar.Memo[type](value);
    } catch (e) {
      return false;
    }
    return true;
  }

  /**
   * Minimum balance of a 2-of-3 multisig wallet
   * @returns {number} minimum balance in stroops
   */
  getMinimumReserve() {
    return co(function *() {
      const server = new stellar.Server(this.getHorizonUrl());

      const horizonLedgerInfo = yield server
      .ledgers()
      .order('desc')
      .limit(1)
      .call();

      if (!horizonLedgerInfo) {
        throw new Error('unable to connect to Horizon for reserve requirement data');
      }

      const baseReserve = horizonLedgerInfo.records[0].base_reserve_in_stroops;

      // 2-of-3 wallets have a minimum reserve of 5x the base reserve
      return 5 * baseReserve;
    }).call(this);
  }

  /**
   * Transaction fee for each operation
   * @returns {number} transaction fee in stroops
   */
  getBaseTransactionFee() {
    return co(function *() {
      const server = new stellar.Server(this.getHorizonUrl());

      const horizonLedgerInfo = yield server
      .ledgers()
      .order('desc')
      .limit(1)
      .call();

      if (!horizonLedgerInfo) {
        throw new Error('unable to connect to Horizon for reserve requirement data');
      }

      return horizonLedgerInfo.records[0].base_fee_in_stroops;
    }).call(this);
  }

  /**
   * Process address into address and memo id
   *
   * @param address {String} the address
   * @returns {Object} object containing address and memo id
   */
  getAddressDetails(address) {
    const destinationDetails = url.parse(address);
    const queryDetails = querystring.parse(destinationDetails.query);
    const destinationAddress = destinationDetails.pathname;
    if (!stellar.StrKey.isValidEd25519PublicKey(destinationAddress)) {
      throw new Error(`invalid address: ${address}`);
    }
    // address doesn't have a memo id
    if (destinationDetails.pathname === address) {
      return {
        address: address,
        memoId: null
      };
    }

    if (!queryDetails.memoId) {
      // if there are more properties, the query details need to contain the memo id property
      throw new Error(`invalid address: ${address}`);
    }

    try {
      new BigNumber(queryDetails.memoId);
    } catch (e) {
      throw new Error(`invalid address: ${address}`);
    }

    if (!this.isValidMemoId(queryDetails.memoId)) {
      throw new Error(`invalid address: ${address}`);
    }

    return {
      address: destinationAddress,
      memoId: queryDetails.memoId
    };
  }

  /**
   * Validate and return address with appended memo id
   *
   * @param address {String} address
   * @param memoId {String} memo id
   * @returns {String} address with memo id
   */
  normalizeAddress({ address, memoId }) {
    if (!stellar.StrKey.isValidEd25519PublicKey(address)) {
      throw new Error(`invalid address details: ${address}`);
    }
    if (this.isValidMemoId(memoId)) {
      return `${address}?memoId=${memoId}`;
    }
    return address;
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin
   *
   * @param {String} address the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidAddress(address) {
    try {
      const addressDetails = this.getAddressDetails(address);
      return address === this.normalizeAddress(addressDetails);
    } catch (e) {
      return false;
    }
  }

  /**
   * Evaluate whether a stellar username has valid format
   * This method is used by the client when a stellar address is being added to a wallet
   * Example of a common stellar username: foo@bar.baz
   * The above example would result in the Stellar address: foo@bar.baz*bitgo.com
   *
   * @param {String} username - stellar username
   * @return {boolean} true if stellar username is valid
   */
  isValidStellarUsername(username) {
    return /^[a-z0-9\-\_\.\+\@]+$/.test(username);
  }

  /**
   * Get an instance of FederationServer for BitGo lookups
   *
   * @returns {FederationServer} instance of BitGo Federation Server
   */
  getBitGoFederationServer() {
    // Identify the URI scheme in case we need to allow connecting to HTTP server.
    const isNonSecureEnv = !_.startsWith(common.Environments[this.bitgo.env].uri, 'https');
    const federationServerOptions = { allowHttp: isNonSecureEnv };
    return new stellar.FederationServer(this.getFederationServerUrl(), 'bitgo.com', federationServerOptions);
  }

  /**
   * Attempt to resolve a stellar address into a stellar account
   * If address domain matches bitgo's then resolve on our federation server
   * Else, make the request to the federation server hosting the address
   *
   * @param {String} address - stellar address to look for
   * @return {Promise}
   */
  federationLookupByName(address) {
    return co(function *() {
      const addressParts = _.split(address, '*');
      if (addressParts.length !== 2) {
        throw new Error(`invalid stellar address: ${address}`);
      }
      const [, homeDomain] = addressParts;
      try {
        if (homeDomain === this.homeDomain) {
          const federationServer = this.getBitGoFederationServer();
          return yield federationServer.resolveAddress(address);
        } else {
          return yield stellar.FederationServer.resolve(address);
        }
      } catch (e) {
        if (e.message === 'Network Error') {
          throw e;
        } else {
          throw new Error('account not found');
        }
      }
    }).call(this);
  }

  /**
   * Attempt to resolve an account id into a stellar account
   * Only works for accounts that can be resolved by our federation server
   *
   * @param {String} accountId - stellar account id
   * @return {Promise}
   */
  federationLookupByAccountId(accountId) {
    return co(function *() {
      try {
        const federationServer = this.getBitGoFederationServer();
        return yield federationServer.resolveAccountId(accountId);
      } catch (e) {
        throw new Error(e.response.data.detail);
      }
    }).call(this);
  }

  /**
   * Check if address is a valid XLM address, and then make sure it matches the root address.
   *
   * @param address {String} the address to verify
   * @param rootAddress {String} the wallet's root address
   */
  verifyAddress({ address, rootAddress }) {
    if (!this.isValidAddress(address)) {
      throw new Error(`invalid address: ${address}`);
    }

    const addressDetails = this.getAddressDetails(address);
    const rootAddressDetails = this.getAddressDetails(rootAddress);

    if (addressDetails.address !== rootAddressDetails.address) {
      throw new Error(`address validation failure: ${addressDetails.address} vs ${rootAddressDetails.address}`);
    }
  }

  /**
   * Generates Stellar keypairs from the user key and backup key
   * @param params
   *  - userKey: user keypair private key (encrypted or plaintext)
   *  - backupKey: backup keypair public key (plaintext) or private key (encrypted or plaintext)
   * @returns {stellar.Keypair[]} array of user and backup keypairs
   */
  initiateRecovery(params) {
    const keys = [];
    let userKey = params.userKey;
    let backupKey = params.backupKey;

    // Stellar's Ed25519 public keys start with a G, while private keys start with an S
    const isKrsRecovery = backupKey.startsWith('G') && !userKey.startsWith('G');
    const isUnsignedSweep = backupKey.startsWith('G') && userKey.startsWith('G');


    if (isKrsRecovery && _.isUndefined(config.krsProviders[params.krsProvider])) {
      throw new Error(`Unknown key recovery service provider - ${params.krsProvider}`);
    }

    if (isKrsRecovery && !config.krsProviders[params.krsProvider].supportedCoins.includes(this.getFamily())) {
      throw new Error(`Specified key recovery service does not support recoveries for ${this.getChain()}`);
    }

    if (!this.isValidAddress(params.recoveryDestination)) {
      throw new Error('Invalid destination address!');
    }

    try {
      if (!userKey.startsWith('S') && !userKey.startsWith('G')) {
        userKey = this.bitgo.decrypt({
          input: userKey,
          password: params.walletPassphrase
        });
      }

      const userKeyPair = isUnsignedSweep ? stellar.Keypair.fromPublicKey(userKey) : stellar.Keypair.fromSecret(userKey);
      keys.push(userKeyPair);
    } catch (e) {
      throw new Error('Failed to decrypt user key with passcode - try again!');
    }

    try {
      if (!backupKey.startsWith('S') && !isKrsRecovery && !isUnsignedSweep) {
        backupKey = this.bitgo.decrypt({
          input: backupKey,
          password: params.walletPassphrase
        });
      }

      if (isKrsRecovery || isUnsignedSweep) {
        keys.push(stellar.Keypair.fromPublicKey(backupKey));
      } else {
        keys.push(stellar.Keypair.fromSecret(backupKey));
      }
    } catch (e) {
      throw new Error('Failed to decrypt backup key with passcode - try again!');
    }

    return keys;
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param params
   * - userKey: [encrypted] Stellar private key
   * - backupKey: [encrypted] Stellar private key, or public key if the private key is held by a KRS provider
   * - walletPassphrase: necessary if one of the private keys is encrypted
   * - rootAddress: base address of the wallet to recover funds from
   * - krsProvider: necessary if backup key is held by KRS
   * - recoveryDestination: target address to send recovered funds to
   * @param callback
   * @returns {Function|*}
   */
  recover(params, callback) {
    return co(function *() {
      const [userKey, backupKey] = this.initiateRecovery(params);
      const isKrsRecovery = params.backupKey.startsWith('G') && !params.userKey.startsWith('G');
      const isUnsignedSweep = params.backupKey.startsWith('G') && params.userKey.startsWith('G');

      if (!stellar.StrKey.isValidEd25519PublicKey(params.rootAddress)) {
        throw new Error(`Invalid wallet address: ${ params.rootAddress }`);
      }

      const accountDataUrl = `${ this.getHorizonUrl() }/accounts/${ params.rootAddress }`;
      const destinationUrl = `${ this.getHorizonUrl() }/accounts/${ params.recoveryDestination }`;

      let accountData;
      try {
        accountData = yield request.get(accountDataUrl).result();
      } catch (e) {
        throw new Error('Unable to reach the Stellar network via Horizon.');
      }

      // Now check if the destination account is empty or not
      let unfundedDestination = false;
      try {
        yield request.get(destinationUrl);
      } catch (e) {
        if (e.status === 404) {
          // If the destination account does not yet exist, horizon responds with 404
          unfundedDestination = true;
        }
      }

      if (!accountData.sequence || !accountData.balances) {
        throw new Error('Horizon server error - unable to retrieve sequence ID or account balance');
      }

      const account = new stellar.Account(params.rootAddress, accountData.sequence);

      // Stellar supports multiple assets on chain, we're only interested in the balances entry whose type is "native" (XLM)
      const nativeBalanceInfo = accountData.balances.find(assetBalance => assetBalance['asset_type'] === 'native');

      if (!nativeBalanceInfo) {
        throw new Error('Provided wallet has a balance of 0 XLM, recovery aborted');
      }

      const walletBalance = this.bigUnitsToBaseUnits(nativeBalanceInfo.balance);
      const minimumReserve = yield this.getMinimumReserve();
      const baseTxFee = yield this.getBaseTransactionFee();
      const recoveryAmount = walletBalance - minimumReserve - baseTxFee;
      const formattedRecoveryAmount = (this.baseUnitsToBigUnits(recoveryAmount)).toString();

      let txBuilder = new stellar.TransactionBuilder(account);
      let operation;
      if (unfundedDestination) { // In this case, we need to create the account
        operation = stellar.Operation.createAccount({
          destination: params.recoveryDestination,
          startingBalance: formattedRecoveryAmount
        });
      } else { // Otherwise if the account already exists, we do a normal send
        operation = stellar.Operation.payment({
          destination: params.recoveryDestination,
          asset: stellar.Asset.native(),
          amount: formattedRecoveryAmount
        });
      }
      txBuilder = txBuilder.addOperation(operation).build();

      if (!isUnsignedSweep) {
        txBuilder.sign(userKey);
      }

      if (!isKrsRecovery && !isUnsignedSweep) {
        txBuilder.sign(backupKey);
      }

      const transaction: any = {
        tx: txBuilder.toEnvelope().toXDR('base64'),
        recoveryAmount
      };

      if (isKrsRecovery) {
        transaction.backupKey = params.backupKey;
        transaction.coin = this.getChain();
      }

      return transaction;
    }).call(this);
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   *
   * @param params
   * @param params.txPrebuild {Object} prebuild object returned by platform
   * @param params.prv {String} user prv
   */
  signTransaction(params) {
    const { txPrebuild, prv } = params;

    if (_.isUndefined(txPrebuild)) {
      throw new Error('missing txPrebuild parameter');
    }
    if (!_.isObject(txPrebuild)) {
      throw new Error(`txPrebuild must be an object, got type ${typeof txPrebuild}`);
    }

    if (_.isUndefined(prv)) {
      throw new Error('missing prv parameter to sign transaction');
    }
    if (!_.isString(prv)) {
      throw new Error(`prv must be a string, got type ${typeof prv}`);
    }

    const keyPair = stellar.Keypair.fromSecret(prv);
    const tx = new stellar.Transaction(txPrebuild.txBase64);
    tx.sign(keyPair);

    return {
      halfSigned: {
        txBase64: tx.toEnvelope().toXDR('base64')
      }
    };
  }

  /**
   * Extend walletParams with extra params required for generating an XLM wallet
   *
   * @param walletParams {Object}
   */
  supplementGenerateWallet(walletParams) {
    return co(function *() {
      // The wallet will have 3 keychains on it, usually 2 of those are generated by the platform, and 1 is generated by the user.
      // Initially, we need a root prv to generate the account, which has to be distinct from all three keychains on the wallet.
      // If a root prv is not provided, we generate a random one.
      let seed;
      const rootPrv = walletParams.rootPrivateKey;
      if (rootPrv) {
        if (!this.isValidPrv(rootPrv)) {
          throw new Error('rootPrivateKey needs to be valid ed25519 secret seed');
        }
        seed = stellar.StrKey.decodeEd25519SecretSeed(rootPrv);
      }
      const keyPair = this.generateKeyPair(seed);
      // extend the wallet initialization params
      walletParams.rootPrivateKey = keyPair.prv;
      return walletParams;
    }).call(this);
  }

  /**
   * Sign message with private key
   *
   * @param key
   * @param message
   */
  signMessage(key, message) {
    if (!this.isValidPrv(key.prv)) {
      throw new Error(`invalid prv: ${key.prv}`);
    }
    if (!Buffer.isBuffer(message)) {
      message = Buffer.from(message);
    }
    const keypair = stellar.Keypair.fromSecret(key.prv);
    return keypair.sign(message);
  }

  /**
   * Verifies if signature for message is valid.
   *
   * @param pub {String} public key
   * @param message {Buffer|String} signed message
   * @param signature {Buffer} signature to verify
   * @returns {Boolean} true if signature is valid.
   */
  verifySignature(pub, message, signature) {
    if (!this.isValidPub(pub)) {
      throw new Error(`invalid pub: ${pub}`);
    }
    if (!Buffer.isBuffer(message)) {
      message = Buffer.from(message);
    }
    const keyPair = stellar.Keypair.fromPublicKey(pub);
    return keyPair.verify(message, signature);
  }

  /**
   * Explain/parse transaction
   * @param params
   * - txBase64: transaction encoded as base64 string
   * @returns {{displayOrder: [string,string,string,string,string], id: *, outputs: Array, changeOutputs: Array}}
   */
  explainTransaction(params) {
    const { txBase64 } = params;
    let tx;

    try {
      tx = new stellar.Transaction(txBase64);
    } catch (e) {
      throw new Error('txBase64 needs to be a valid tx encoded as base64 string');
    }
    const id = tx.hash().toString('hex');
    const explanation: any = {
      displayOrder: ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'memo'],
      id,
      outputs: [],
      changeOutputs: [],
      memo: {}
    };

    // In a Stellar tx, the _memo property is an object with the methods:
    // value() and arm() that provide memo value and type, respectively.
    if (_.result(tx, '_memo.value') && _.result(tx, '_memo.arm')) {
      explanation.memo = {
        value: _.result(tx, '_memo.value').toString(),
        type: _.result(tx, '_memo.arm')
      };
    }

    let spendAmount = new BigNumber(0);
    // Process only operations of the native asset (XLM)
    const operations = _.filter(tx.operations, operation => !operation.asset || operation.asset.getCode() === 'XLM');
    if (_.isEmpty(operations)) {
      throw new Error('missing operations');
    }
    explanation.outputs = _.map(operations, operation => {
      // Get memo to attach to address, if type is 'id'
      const memoId = (_.get(explanation, 'memo.type') === 'id' && ! _.get(explanation, 'memo.value') ? `?memoId=${explanation.memo.value}` : '');
      const output = {
        amount: this.bigUnitsToBaseUnits(operation.startingBalance || operation.amount),
        address: operation.destination + memoId
      };
      spendAmount = spendAmount.plus(output.amount);
      return output;
    });

    explanation.outputAmount = spendAmount.toFixed(0);
    explanation.changeAmount = '0';

    explanation.fee = {
      fee: tx.fee.toFixed(0),
      feeRate: null,
      size: null
    };
    return explanation;
  }

  /**
   * Verify that a transaction prebuild complies with the original intention
   *
   * @param txParams {Object} params object passed to send
   * @param txPrebuild {Object} prebuild object returned by platform
   * @param txPrebuild.txBase64 {String} prebuilt transaction encoded as base64 string
   * @param wallet {Wallet} wallet object to obtain keys to verify against
   * @param verification Object specifying some verification parameters
   * @param verification.disableNetworking Disallow fetching any data from the internet for verification purposes
   * @param verification.keychains Pass keychains manually rather than fetching them by id
   * @param callback
   * @returns {boolean}
   */
  verifyTransaction({ txParams, txPrebuild, wallet, verification = {} }: any, callback) {
    // TODO BG-5600 Add parseTransaction / improve verification
    return co(function *() {
      const disableNetworking = !!verification.disableNetworking;

      const tx = new stellar.Transaction(txPrebuild.txBase64);

      if (txParams.recipients.length !== 1) {
        throw new Error('cannot specify more than 1 recipient');
      }

      // Stellar txs are made up of operations. We only care about Create Account and Payment for sending funds.
      const outputOperations = _.filter(tx.operations, operation =>
        operation.type === 'createAccount' || operation.type === 'payment'
      );

      if (_.isEmpty(outputOperations)) {
        throw new Error('transaction prebuild does not have any operations');
      }

      _.forEach(txParams.recipients, (expectedOutput, index) => {
        const expectedOutputAddress = this.getAddressDetails(expectedOutput.address);
        const output = outputOperations[index];
        if (output.destination !== expectedOutputAddress.address) {
          throw new Error('transaction prebuild does not match expected recipient');
        }

        const expectedOutputAmount = new BigNumber(expectedOutput.amount);
        // The output amount is expressed as startingBalance in createAccount operations and as amount in payment operations.
        let outputAmount = (output.type === 'createAccount') ? output.startingBalance : output.amount;
        outputAmount = new BigNumber(this.bigUnitsToBaseUnits(outputAmount));

        if (!outputAmount.eq(expectedOutputAmount)) {
          throw new Error('transaction prebuild does not match expected amount');
        }
      });

      // Verify the user signature, if the tx is half-signed
      if (!_.isEmpty(tx.signatures)) {
        const userSignature = tx.signatures[0].signature();

        // obtain the keychains and key signatures
        let keychains = verification.keychains;
        if (!keychains && disableNetworking) {
          throw new Error('cannot fetch keychains without networking');
        } else if (!keychains) {
          keychains = yield Promise.props({
            user: this.keychains().get({ id: wallet._wallet.keys[0] }),
            backup: this.keychains().get({ id: wallet._wallet.keys[1] }),
            bitgo: this.keychains().get({ id: wallet._wallet.keys[2] })
          });
        }

        if (this.verifySignature(keychains.backup.pub, tx.hash(), userSignature)) {
          throw new Error('transaction signed with wrong key');
        }
        if (!this.verifySignature(keychains.user.pub, tx.hash(), userSignature)) {
          throw new Error('transaction signature invalid');
        }
      }

      return true;
    }).call(this).asCallback(callback);
  }
}

export = Xlm;
