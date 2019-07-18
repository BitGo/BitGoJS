/**
 * @prettier
 */
import { BaseCoin, BaseCoinTransactionExplanation } from '../baseCoin';
import { NodeCallback } from '../types';
import { BigNumber } from 'bignumber.js';
import * as crypto from 'crypto';
import { HDNode } from 'bitgo-utxo-lib';
import * as EosJs from 'eosjs';
import * as ecc from 'eosjs-ecc';
import * as url from 'url';
import * as querystring from 'querystring';
import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import { Recipient } from '../types';
const co = Bluebird.coroutine;
import { KeyPair } from '../keychains';
import { InvalidAddressError, UnexpectedAddressError } from '../../errors';
import * as config from '../../config';
import { Environments } from '../environments';

const EOS_ADDRESS_LENGTH = 12;

interface AddressDetails {
  address: string;
  memoId: string;
}

export interface EosTx {
  signatures: string[];
  packed_trx: string;
  compression: string;
}

interface EosTransactionHeaders {
  ref_block_prefix: number;
  ref_block_num: number;
  expiration?: string;
}

interface EosTransactionAction {
  account: string;
  name: string;
  authorization: [{ actor: string; permission: string }];
  data: { from: string; to: string; quantity: string; memo?: string };
}

interface EosTransactionPrebuild {
  recipients: Recipient[];
  headers: EosTransactionHeaders;
  txHex: string; // The signable tx hex string
  transaction: EosTx;
  txid: string;
}

export interface EosSignTransactionParams {
  prv: string;
  txPrebuild: EosTransactionPrebuild;
  recipients: Recipient[];
}

export interface EosHalfSigned {
  recipients: Recipient[];
  headers: EosTransactionHeaders;
  txHex: string; // The signable tx hex string
  transaction: EosTx;
  txid: string;
}

export interface EosSignedTransaction {
  halfSigned: EosHalfSigned;
}

interface DeserializedEosTransaction extends EosTransactionHeaders {
  max_net_usage_words: number;
  max_cpu_usage_ms: number;
  delay_sec: number;
  context_free_actions: EosTransactionAction[];
  actions: EosTransactionAction[];
  transaction_extensions: object[];
  address: string;
  amount: string;
  transaction_id: string;
  memo?: string;
}

interface ExplainTransactionOptions {
  transaction: { packed_trx: string };
  headers: EosTransactionHeaders;
}

interface RecoveryTransaction {
  transaction: EosTx;
  txid: string;
  recoveryAmount: number;
}

interface RecoveryOptions {
  userKey: string; // Box A
  backupKey: string; // Box B
  bitgoKey?: string; // Box C
  recoveryDestination: string;
  krsProvider?: string;
  walletPassphrase?: string;
  rootAddress: string;
}

interface ValidateKeyOptions {
  key: string;
  source: string;
  passphrase?: string;
  isUnsignedSweep: boolean;
  isKrsRecovery: boolean;
}

export class Eos extends BaseCoin {
  static createInstance(bitgo: any): BaseCoin {
    return new Eos(bitgo);
  }

  getChainId() {
    return 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'; // mainnet chain id
  }

  getChain(): string {
    return 'eos';
  }

  getFamily(): string {
    return 'eos';
  }

  getFullName(): string {
    return 'EOS';
  }

  getBaseFactor(): number {
    return 1e4;
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    return true;
  }

  /**
   * Get URLs of some active public nodes
   */
  getPublicNodeUrls(): string[] {
    return Environments[this.bitgo.env].eosNodeUrls;
  }
  /**
   * Generate secp256k1 key pair
   *
   * @param seed - Seed from which the new keypair should be generated, otherwise a random seed is used
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    if (!seed) {
      // An extended private key has both a normal 256 bit private key and a 256
      // bit chain code, both of which must be random. 512 bits is therefore the
      // maximum entropy and gives us maximum security against cracking.
      seed = crypto.randomBytes(512 / 8);
    }
    const extendedKey = HDNode.fromSeedBuffer(seed);
    const xpub = extendedKey.neutered().toBase58();
    return {
      pub: xpub,
      prv: extendedKey.toBase58(),
    };
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param pub - the pub to be checked
   */
  isValidPub(pub: string): boolean {
    try {
      HDNode.fromBase58(pub);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Return boolean indicating whether input is valid seed for the coin
   *
   * @param prv - the prv to be checked
   */
  isValidPrv(prv: string): boolean {
    try {
      HDNode.fromBase58(prv);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Evaluates whether a memo is valid
   *
   * @param value - the memo to be checked
   */
  isValidMemo({ value }: { value: string }): boolean {
    return value && value.length <= 256;
  }

  /**
   * Return boolean indicating whether a memo id is valid
   *
   * @param memoId - the memo id to be checked
   */
  isValidMemoId(memoId: string): boolean {
    if (!this.isValidMemo({ value: memoId })) {
      return false;
    }

    let memoIdNumber;
    try {
      memoIdNumber = new BigNumber(memoId);
    } catch (e) {
      return false;
    }

    return memoIdNumber.gte(0);
  }

  /**
   * Process address into address and memo id
   * @param address - the address
   */
  getAddressDetails(address: string): AddressDetails {
    const destinationDetails = url.parse(address);
    const queryDetails = querystring.parse(destinationDetails.query);
    const destinationAddress = destinationDetails.pathname;

    // EOS addresses have to be "human readable", which means start with a letter, up to 12 characters and only a-z1-5., i.e.mtoda1.bitgo
    // source: https://developers.eos.io/eosio-cpp/docs/naming-conventions
    if (!/^[a-z][a-z1-5.]*$/.test(destinationAddress) || destinationAddress.length > EOS_ADDRESS_LENGTH) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    // address doesn't have a memo id
    if (destinationDetails.pathname === address) {
      return {
        address: address,
        memoId: null,
      };
    }

    if (!queryDetails.memoId) {
      // if there are more properties, the query details need to contain the memoId property
      throw new InvalidAddressError(`invalid property in address: ${address}`);
    }

    if (Array.isArray(queryDetails.memoId) && queryDetails.memoId.length !== 1) {
      // valid addresses can only contain one memo id
      throw new InvalidAddressError(`invalid address '${address}', must contain exactly one memoId`);
    }

    const [memoId] = _.castArray(queryDetails.memoId);
    if (!this.isValidMemoId(memoId)) {
      throw new InvalidAddressError(`invalid address: '${address}', memoId is not valid`);
    }

    return {
      address: destinationAddress,
      memoId,
    };
  }

  /**
   * Validate and return address with appended memo id
   *
   * @param address
   * @param memoId
   */
  normalizeAddress({ address, memoId }: AddressDetails): string {
    if (this.isValidMemoId(memoId)) {
      return `${address}?memoId=${memoId}`;
    }
    return address;
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin
   *
   * @param address - the address to be checked
   */
  isValidAddress(address: string): boolean {
    try {
      const addressDetails = this.getAddressDetails(address);
      return address === this.normalizeAddress(addressDetails);
    } catch (e) {
      return false;
    }
  }

  /**
   * Check if address is a valid EOS address, then verify it matches the root address.
   *
   * @param address - the address to verify
   * @param rootAddress - the wallet's root address
   */
  verifyAddress({ address, rootAddress }: { address: string; rootAddress: string }): void {
    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    const addressDetails = this.getAddressDetails(address);
    const rootAddressDetails = this.getAddressDetails(rootAddress);

    if (addressDetails.address !== rootAddressDetails.address) {
      throw new UnexpectedAddressError(
        `address validation failure: ${addressDetails.address} vs ${rootAddressDetails.address}`
      );
    }
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   *
   * @param params
   * @param params.txPrebuild {Object} prebuild object returned by platform
   * @param params.prv {String} user prv
   */
  signTransaction(params: EosSignTransactionParams): EosSignedTransaction {
    const prv: string = params.prv;
    const txHex: string = params.txPrebuild.txHex;
    const transaction: EosTx = params.txPrebuild.transaction;

    const signBuffer: Buffer = Buffer.from(txHex, 'hex');
    const privateKeyBuffer: Buffer = HDNode.fromBase58(prv)
      .getKey()
      .getPrivateKeyBuffer();
    const signature: string = ecc.Signature.sign(signBuffer, privateKeyBuffer).toString();

    transaction.signatures.push(signature);

    const txParams = {
      transaction,
      txHex,
      recipients: params.txPrebuild.recipients,
      headers: params.txPrebuild.headers,
      txid: params.txPrebuild.txid,
    };
    return { halfSigned: txParams };
  }

  /**
   * Deserialize a transaction
   * @param transaction
   * @param headers
   */
  private deserializeTransaction({
    transaction,
    headers,
  }: ExplainTransactionOptions): Bluebird<DeserializedEosTransaction> {
    return co(function*() {
      const eosClientConfig = {
        chainId: this.getChainId(),
        transactionHeaders: headers,
      };
      const eosClient = new EosJs(eosClientConfig);

      // Get tx base values
      const eosTxStruct = eosClient.fc.structs.transaction;
      const serializedTxBuffer = Buffer.from(transaction.packed_trx, 'hex');
      const tx = EosJs.modules.Fcbuffer.fromBuffer(eosTxStruct, serializedTxBuffer);

      // Get transfer action values
      // Only support transactions with one action: transfer
      if (tx.actions.length !== 1) {
        throw new Error(`invalid number of actions: ${tx.actions.length}`);
      }
      const txAction = tx.actions[0];
      if (!txAction) {
        throw new Error('missing transaction action');
      }
      if (txAction.name !== 'transfer') {
        throw new Error(`invalid action: ${txAction.name}`);
      }
      const transferStruct = eosClient.fc.abiCache.abi('eosio.token').structs.transfer;
      const serializedTransferDataBuffer = Buffer.from(txAction.data, 'hex');
      const transferActionData = EosJs.modules.Fcbuffer.fromBuffer(transferStruct, serializedTransferDataBuffer);
      tx.address = transferActionData.to;
      tx.amount = this.bigUnitsToBaseUnits(transferActionData.quantity.split(' ')[0]);
      tx.memo = transferActionData.memo;

      // Get the tx id if tx headers were provided
      if (headers) {
        const rebuiltTransaction = yield eosClient.transaction(
          { actions: tx.actions },
          { sign: false, broadcast: false }
        );
        tx.transaction_id = rebuiltTransaction.transaction_id;
      }

      return tx;
    }).call(this);
  }

  /**
   * Explain/parse transaction
   * @param params - ExplainTransactionOptions
   * @param callback
   */
  explainTransaction(
    params: ExplainTransactionOptions,
    callback?: NodeCallback<BaseCoinTransactionExplanation>
  ): Bluebird<BaseCoinTransactionExplanation> {
    return co(function*() {
      let transaction;
      try {
        transaction = yield this.deserializeTransaction(params);
      } catch (e) {
        throw new Error('invalid EOS transaction or headers');
      }
      return {
        displayOrder: ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'memo'],
        id: transaction.transaction_id,
        changeOutputs: [],
        outputAmount: transaction.amount,
        changeAmount: 0,
        outputs: [
          {
            address: transaction.address,
            amount: transaction.amount,
          },
        ],
        fee: {},
        memo: transaction.memo,
      };
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Validate a public or private key
   * If passphrase is provided, try to decrypt the key with it
   * @param key
   * @param source
   * @param passphrase
   * @param isUnsignedSweep
   * @param isKrsRecovery
   */
  validateKey({ key, source, passphrase, isUnsignedSweep, isKrsRecovery }: ValidateKeyOptions): HDNode {
    if (!key.startsWith('xprv') && !isUnsignedSweep) {
      // Try to decrypt the key
      try {
        if (source === 'user' || (source === 'backup' && !isKrsRecovery)) {
          return HDNode.fromBase58(this.bitgo.decrypt({ password: passphrase, input: key }));
        }
      } catch (e) {
        throw new Error(`Failed to decrypt ${source} key with passcode - try again!`);
      }
    }
    try {
      return HDNode.fromBase58(key);
    } catch (e) {
      throw new Error(`Failed to validate ${source} key - try again!`);
    }
  }

  /**
   * Prepare and validate all keychains from the keycard for recovery
   * @param userKey
   * @param backupKey
   * @param recoveryDestination
   * @param krsProvider
   * @param walletPassphrase
   */
  initiateRecovery({
    userKey,
    backupKey,
    recoveryDestination,
    krsProvider,
    walletPassphrase,
  }: RecoveryOptions): Bluebird<HDNode[]> {
    return co(function*() {
      const isKrsRecovery = backupKey.startsWith('xpub') && !userKey.startsWith('xpub');
      const isUnsignedSweep = backupKey.startsWith('xpub') && userKey.startsWith('xpub');

      if (isKrsRecovery) {
        const krsProviderConfig = config.krsProviders[krsProvider];
        if (_.isUndefined(krsProviderConfig)) {
          throw new Error('unknown key recovery service provider');
        }

        if (!krsProviderConfig.supportedCoins.includes(this.getFamily())) {
          throw new Error('specified key recovery service does not support recoveries for this coin');
        }
      }

      const keys = [
        this.validateKey({
          key: userKey,
          source: 'user',
          passphrase: walletPassphrase,
          isKrsRecovery,
          isUnsignedSweep,
        }),
        this.validateKey({
          key: backupKey,
          source: 'backup',
          passphrase: walletPassphrase,
          isKrsRecovery,
          isUnsignedSweep,
        }),
      ];
      if (!this.isValidAddress(recoveryDestination)) {
        throw new Error('Invalid destination address!');
      }

      return keys;
    }).call(this);
  }

  /**
   * Make a request to one of the public EOS nodes available
   * @param endpoint
   * @param payload
   */
  protected getDataFromNode({ endpoint, payload }: { endpoint: string; payload?: object }): Bluebird<any> {
    return co(function*() {
      const nodeUrls = this.getPublicNodeUrls();
      for (const nodeUrl of nodeUrls) {
        try {
          return yield this.bitgo.post(nodeUrl + endpoint).send(payload);
        } catch (e) {
          // let's hope another call succeeds
        }
      }
      throw new Error(`Unable to call endpoint: ${endpoint} from nodes: ${_.join(nodeUrls, ', ')}`);
    }).call(this);
  }

  /**
   * Get EOS chain info from a public node
   */
  protected getChainInfoFromNode(): Bluebird<any> {
    return co(function*() {
      const response = yield this.getDataFromNode({ endpoint: '/v1/chain/get_info' });
      if (response.status !== 200) {
        throw new Error('Unable to fetch chain info');
      }
      return response.body;
    }).call(this);
  }

  /**
   * Get data specific to an account from a public node
   * @param address
   */
  protected getAccountFromNode({ address }: { address: string }): Bluebird<any> {
    return co(function*() {
      const response = yield this.getDataFromNode({
        endpoint: '/v1/chain/get_account',
        payload: { account_name: address },
      });
      if (response.status !== 200) {
        throw new Error('Account not found');
      }
      return response.body;
    }).call(this);
  }

  /**
   * Get block data from a public node using its block number or block id
   * @param blockNumOrId
   */
  protected getBlockFromNode({ blockNumOrId }: { blockNumOrId: string }): Bluebird<any> {
    return co(function*() {
      const response = yield this.getDataFromNode({
        endpoint: '/v1/chain/get_block',
        payload: { block_num_or_id: blockNumOrId },
      });
      if (response.status !== 200) {
        throw new Error('Block not found');
      }
      return response.body;
    }).call(this);
  }

  /**
   * Get headers for an EOS tx from a public node
   */
  protected getTransactionHeadersFromNode(): Bluebird<any> {
    return co(function*() {
      const chainInfo = yield this.getChainInfoFromNode();
      const headBlockInfoResult = yield this.getBlockFromNode({ blockNumOrId: chainInfo.head_block_num });
      const expireSeconds = 3600; // maximum tx expire time of 1h
      const chainDate = new Date(chainInfo.head_block_time + 'Z');
      const expirationDate = new Date(chainDate.getTime() + expireSeconds * 1000);

      return {
        expiration: expirationDate.toISOString(),
        ref_block_num: chainInfo.head_block_num & 0xffff,
        ref_block_prefix: headBlockInfoResult.ref_block_prefix,
      };
    }).call(this);
  }

  protected getTransferAction({ recipient, sender, amount, memo }): EosTransactionAction {
    return {
      account: 'eosio.token',
      name: 'transfer',
      authorization: [
        {
          actor: sender,
          permission: 'active',
        },
      ],
      data: {
        from: sender,
        to: recipient,
        quantity: `${this.baseUnitsToBigUnits(amount)} EOS`,
        memo: !_.isNil(memo) ? memo : '', // Memo must be defined, set it to empty string if it is not
      },
    };
  }

  /**
   * Sign a transaction with a key
   * @param signableTx
   * @param signingKey
   */
  signTx(signableTx: string, signingKey: HDNode): string {
    const signBuffer = Buffer.from(signableTx, 'hex');
    const privateKeyBuffer = signingKey.getKey().getPrivateKeyBuffer();
    return ecc.Signature.sign(signBuffer, privateKeyBuffer).toString();
  }

  /**
   * Serialize an EOS transaction, to the format that should be signed
   * @param eosClient an offline EOSClient that has the transaction structs
   * @param transaction The EOS transaction returned from `eosClient.transaction` to serialize
   * @return {String} serialized transaction in hex format
   */
  serializeTransaction(eosClient: EosJs, transaction: EosJs.transaction): string {
    const eosTxStruct = eosClient.fc.structs.transaction;
    const txHex = transaction.transaction.transaction;
    const txObject = eosTxStruct.fromObject(txHex);

    return EosJs.modules.Fcbuffer.toBuffer(eosTxStruct, txObject).toString('hex');
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param params
   * @param callback
   */
  recover(params: RecoveryOptions, callback?: NodeCallback<RecoveryTransaction>): Bluebird<RecoveryTransaction> {
    return co(function*() {
      const isKrsRecovery = params.backupKey.startsWith('xpub') && !params.userKey.startsWith('xpub');
      const isUnsignedSweep = params.backupKey.startsWith('xpub') && params.userKey.startsWith('xpub');

      const keys = yield this.initiateRecovery(params);

      const account = yield this.getAccountFromNode({ address: params.rootAddress });

      const userPub = ecc.PublicKey.fromBuffer(keys[0].getPublicKeyBuffer()).toString();
      const backupPub = ecc.PublicKey.fromBuffer(keys[1].getPublicKeyBuffer()).toString();

      const activePermission = _.find(account.permissions, { perm_name: 'active' });
      const requiredAuth = _.get(activePermission, 'required_auth');
      if (!requiredAuth) {
        throw new Error('Required auth for active permission not found in account');
      }
      if (requiredAuth.threshold !== 2) {
        throw new Error('Unexpected active permission threshold');
      }

      const foundPubs = {};
      const requiredAuthKeys = requiredAuth.keys;
      for (const signer of requiredAuthKeys) {
        if (signer.weight !== 1) {
          throw new Error('invalid signer weight');
        }
        // if it's a dupe of a pub we already know, block
        if (foundPubs[signer.key]) {
          throw new Error('duplicate signer key');
        }
        foundPubs[signer.key] = (foundPubs[signer.key] || 0) + 1;
      }
      if (foundPubs[userPub] !== 1 || foundPubs[backupPub] !== 1) {
        throw new Error('unexpected incidence frequency of user signer key');
      }

      const accountBalance = account.core_liquid_balance.split(' ')[0];
      const recoveryAmount = this.bigUnitsToBaseUnits(new BigNumber(accountBalance));

      const destinationAddress = params.recoveryDestination;
      const destinationAddressDetails = this.getAddressDetails(destinationAddress);
      const destinationAccount = yield this.getAccountFromNode({ address: destinationAddress });
      if (!destinationAccount) {
        throw new Error('Destination account not found');
      }

      const transactionHeaders = yield this.getTransactionHeadersFromNode();
      const eosClient = new EosJs({ chainId: this.getChainId(), transactionHeaders });

      const transferAction = this.getTransferAction({
        recipient: destinationAddressDetails.address,
        sender: params.rootAddress,
        amount: new BigNumber(recoveryAmount),
        memo: destinationAddressDetails.memoId,
      });

      const transaction = yield eosClient.transaction({ actions: [transferAction] }, { sign: false, broadcast: false });

      const serializedTransaction = this.serializeTransaction(eosClient, transaction);
      const txObject = {
        transaction: {
          compression: 'none',
          packed_trx: serializedTransaction,
          signatures: [],
        },
        txid: transaction.transaction_id,
        recoveryAmount: accountBalance,
      };
      const signableTx = Buffer.concat([
        Buffer.from(this.getChainId(), 'hex'), // The ChainID representing the chain that we are on
        Buffer.from(serializedTransaction, 'hex'), // The serialized unsigned tx
        Buffer.from(new Uint8Array(32)), // Some padding
      ]).toString('hex');

      if (isUnsignedSweep) {
        return txObject;
      }

      const userSignature = this.signTx(signableTx, keys[0]);
      txObject.transaction.signatures.push(userSignature);

      if (!isKrsRecovery) {
        const backupSignature = this.signTx(signableTx, keys[1]);
        txObject.transaction.signatures.push(backupSignature);
      }

      return txObject;
    })
      .call(this)
      .asCallback(callback);
  }
}
