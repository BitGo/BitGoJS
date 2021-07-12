/**
 * @prettier
 */
import { BitGo } from '../../bitgo';
import {
  BaseCoin,
  TransactionExplanation,
  KeyPair,
  ParseTransactionOptions,
  ParsedTransaction,
  VerifyTransactionOptions,
  VerifyAddressOptions as BaseVerifyAddressOptions,
  HalfSignedTransaction as BaseHalfSignedTransaction,
  SignTransactionOptions as BaseSignTransactionOptions,
} from '../baseCoin';
import { NodeCallback } from '../types';
import { BigNumber } from 'bignumber.js';
import { randomBytes } from 'crypto';
import { HDNode } from '@bitgo/utxo-lib';
import * as EosJs from 'eosjs';
import * as ecc from 'eosjs-ecc';
import * as url from 'url';
import * as querystring from 'querystring';
import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
const co = Bluebird.coroutine;
import { InvalidAddressError, UnexpectedAddressError } from '../../errors';
import * as config from '../../config';
import { Environments } from '../environments';
import * as request from 'superagent';

interface AddressDetails {
  address: string;
  memoId?: string;
}

export interface EosTx {
  signatures: string[];
  packed_trx: string;
  compression: string;
}

export interface Recipient {
  address: string;
  amount: string;
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

export interface EosSignTransactionParams extends BaseSignTransactionOptions {
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

export interface EosSignedTransaction extends BaseHalfSignedTransaction {
  halfSigned: EosHalfSigned;
}

interface DeserializedEosTransaction extends EosTransactionHeaders {
  max_net_usage_words: number;
  max_cpu_usage_ms: number;
  delay_sec: number;
  context_free_actions: EosTransactionAction[];
  actions: EosTransactionAction[];
  transaction_extensions: Record<string, unknown>[];
  address: string;
  amount: string;
  transaction_id: string;
  memo?: string;
  proxy?: string;
  producers?: string[];
}

interface DeserializedStakeAction {
  address: string;
  amount: string;
}

interface DeserializedVoteAction {
  address: string;
  proxy: string;
  producers: string[];
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
  rootAddress?: string;
}

interface ValidateKeyOptions {
  key: string;
  source: string;
  passphrase?: string;
  isUnsignedSweep: boolean;
  isKrsRecovery: boolean;
}
interface VerifyAddressOptions extends BaseVerifyAddressOptions {
  rootAddress: string;
}

export class Eos extends BaseCoin {
  public static VALID_ADDRESS_CHARS = '12345abcdefghijklmnopqrstuvwxyz'.split('');
  public static ADDRESS_LENGTH = 12;

  static createInstance(bitgo: BitGo): BaseCoin {
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
    return Environments[this.bitgo.getEnv()].eosNodeUrls;
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
      seed = randomBytes(512 / 8);
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
    return _.isString(value) && value.length <= 256;
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
    const destinationAddress = destinationDetails.pathname;

    if (!destinationAddress) {
      throw new InvalidAddressError(`failed to parse address: ${address}`);
    }

    // EOS addresses have to be "human readable", which means up to 12 characters and only a-z1-5., i.e.mtoda1.bitgo
    // source: https://developers.eos.io/eosio-cpp/docs/naming-conventions
    if (!/^[a-z1-5.]*$/.test(destinationAddress) || destinationAddress.length > Eos.ADDRESS_LENGTH) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    // address doesn't have a memo id
    if (destinationDetails.pathname === address) {
      return {
        address: address,
        memoId: undefined,
      };
    }

    if (!destinationDetails.query) {
      throw new InvalidAddressError(`failed to parse query string: ${address}`);
    }

    const queryDetails = querystring.parse(destinationDetails.query);
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
   * Convert a currency amount represented in base units (satoshi, wei, atoms, drops, stroops)
   * to big units (btc, eth, rmg, xrp, xlm)
   */
  baseUnitsToBigUnits(baseUnits: string | number): string {
    const dividend = this.getBaseFactor();
    const bigNumber = new BigNumber(baseUnits).dividedBy(dividend);
    // set the format so commas aren't added to large coin amounts
    return bigNumber.toFormat(4, null as any, { groupSeparator: '', decimalSeparator: '.' });
  }

  /**
   * Validate and return address with appended memo id
   *
   * @param address
   * @param memoId
   */
  normalizeAddress({ address, memoId }: AddressDetails): string {
    if (memoId && this.isValidMemoId(memoId)) {
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
  verifyAddress({ address, rootAddress }: VerifyAddressOptions): boolean {
    if (!rootAddress || !_.isString(rootAddress)) {
      throw new Error('missing required string rootAddress');
    }

    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    const addressDetails = this.getAddressDetails(address);
    const rootAddressDetails = this.getAddressDetails(rootAddress);

    if (!addressDetails || !rootAddressDetails) {
      return false;
    }

    if (addressDetails.address !== rootAddressDetails.address) {
      throw new UnexpectedAddressError(
        `address validation failure: ${addressDetails.address} vs ${rootAddressDetails.address}`
      );
    }

    return true;
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   *
   * @param params
   * @param params.txPrebuild {Object} prebuild object returned by platform
   * @param params.prv {String} user prv
   * @param callback
   * @returns {Bluebird<EosSignedTransaction>}
   */
  signTransaction(
    params: EosSignTransactionParams,
    callback?: NodeCallback<EosSignedTransaction>
  ): Bluebird<EosSignedTransaction> {
    return co<EosSignedTransaction>(function* () {
      const prv: string = params.prv;
      const txHex: string = params.txPrebuild.txHex;
      const transaction: EosTx = params.txPrebuild.transaction;

      const signBuffer: Buffer = Buffer.from(txHex, 'hex');
      const privateKeyBuffer: Buffer = HDNode.fromBase58(prv).getKey().getPrivateKeyBuffer();
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
    })
      .call(this)
      .asCallback(callback);
  }

  private deserializeStakeAction(eosClient: EosJs, serializedStakeAction: string): DeserializedStakeAction {
    const eosStakeActionStruct = eosClient.fc.abiCache.abi('eosio').structs.delegatebw;
    const serializedStakeActionBuffer = Buffer.from(serializedStakeAction, 'hex');
    const stakeAction = EosJs.modules.Fcbuffer.fromBuffer(eosStakeActionStruct, serializedStakeActionBuffer);

    if (stakeAction.from !== stakeAction.receiver) {
      throw new Error(`staker (${stakeAction.from}) and receiver (${stakeAction.receiver}) must be the same`);
    }

    if (stakeAction.transfer !== 0) {
      throw new Error('cannot transfer funds as part of delegatebw action');
    }

    // stake_cpu_quantity is used as the amount because the BitGo platform only stakes cpu for voting transactions
    return {
      address: stakeAction.from,
      amount: this.bigUnitsToBaseUnits(stakeAction.stake_cpu_quantity.split(' ')[0]),
    };
  }

  private static deserializeVoteAction(eosClient: EosJs, serializedVoteAction: string): DeserializedVoteAction {
    const eosVoteActionStruct = eosClient.fc.abiCache.abi('eosio').structs.voteproducer;
    const serializedVoteActionBuffer = Buffer.from(serializedVoteAction, 'hex');
    const voteAction = EosJs.modules.Fcbuffer.fromBuffer(eosVoteActionStruct, serializedVoteActionBuffer);

    const proxyIsEmpty = _.isEmpty(voteAction.proxy);
    const producersIsEmpty = _.isEmpty(voteAction.producers);
    if ((proxyIsEmpty && producersIsEmpty) || (!proxyIsEmpty && !producersIsEmpty)) {
      throw new Error('voting transactions must specify either producers or proxy to vote for');
    }

    return { address: voteAction.voter, proxy: voteAction.proxy, producers: voteAction.producers };
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
    const self = this;
    return co<DeserializedEosTransaction>(function* () {
      const eosClientConfig = {
        chainId: self.getChainId(),
        transactionHeaders: headers,
      };
      const eosClient = new EosJs(eosClientConfig);

      // Get tx base values
      const eosTxStruct = eosClient.fc.structs.transaction;
      const serializedTxBuffer = Buffer.from(transaction.packed_trx, 'hex');
      const tx = EosJs.modules.Fcbuffer.fromBuffer(eosTxStruct, serializedTxBuffer);

      // Only support transactions with one (transfer | voteproducer) or two (delegatebw & voteproducer) actions
      if (tx.actions.length !== 1 && tx.actions.length !== 2) {
        throw new Error(`invalid number of actions: ${tx.actions.length}`);
      }

      const txAction = tx.actions[0];
      if (!txAction) {
        throw new Error('missing transaction action');
      }

      if (txAction.name === 'transfer') {
        // Transfers should only have 1 action
        if (tx.actions.length !== 1) {
          throw new Error(`transfers should only have 1 action: ${tx.actions.length} given`);
        }

        const transferStruct = eosClient.fc.abiCache.abi('eosio.token').structs.transfer;
        const serializedTransferDataBuffer = Buffer.from(txAction.data, 'hex');
        const transferActionData = EosJs.modules.Fcbuffer.fromBuffer(transferStruct, serializedTransferDataBuffer);
        tx.address = transferActionData.to;
        tx.amount = this.bigUnitsToBaseUnits(transferActionData.quantity.split(' ')[0]);
        tx.memo = transferActionData.memo;
      } else if (txAction.name === 'delegatebw') {
        // The delegatebw action should only be part of voting transactions
        if (tx.actions.length !== 2) {
          throw new Error(
            `staking transactions that include the delegatebw action should have 2 actions: ${tx.actions.length} given`
          );
        }

        const txAction2 = tx.actions[1];
        if (txAction2.name !== 'voteproducer') {
          throw new Error(`invalid staking transaction action: ${txAction2.name}, expecting: voteproducer`);
        }

        const deserializedStakeAction = self.deserializeStakeAction(eosClient, txAction.data);
        const deserializedVoteAction = Eos.deserializeVoteAction(eosClient, txAction2.data);
        if (deserializedStakeAction.address !== deserializedVoteAction.address) {
          throw new Error(
            `staker (${deserializedStakeAction.address}) and voter (${deserializedVoteAction.address}) must be the same`
          );
        }

        tx.amount = deserializedStakeAction.amount;
        tx.proxy = deserializedVoteAction.proxy;
        tx.producers = deserializedVoteAction.producers;
      } else if (txAction.name === 'voteproducer') {
        if (tx.actions.length > 2) {
          throw new Error('voting transactions should not have more than 2 actions');
        }

        let deserializedStakeAction;
        if (tx.actions.length === 2) {
          const txAction2 = tx.actions[1];
          if (txAction2.name !== 'delegatebw') {
            throw new Error(`invalid staking transaction action: ${txAction2.name}, expecting: delegatebw`);
          }

          deserializedStakeAction = self.deserializeStakeAction(eosClient, txAction2.data);
        }

        const deserializedVoteAction = Eos.deserializeVoteAction(eosClient, txAction.data);
        if (!!deserializedStakeAction && deserializedStakeAction.address !== deserializedVoteAction.address) {
          throw new Error(
            `staker (${deserializedStakeAction.address}) and voter (${deserializedVoteAction.address}) must be the same`
          );
        }

        tx.amount = !!deserializedStakeAction ? deserializedStakeAction.amount : '0';
        tx.proxy = deserializedVoteAction.proxy;
        tx.producers = deserializedVoteAction.producers;
      } else {
        throw new Error(`invalid action: ${txAction.name}`);
      }
      // Get the tx id if tx headers were provided
      if (headers) {
        const rebuiltTransaction = yield eosClient.transaction(
          { actions: tx.actions },
          { sign: false, broadcast: false }
        );
        tx.transaction_id = (rebuiltTransaction as any).transaction_id;
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
    callback?: NodeCallback<TransactionExplanation>
  ): Bluebird<TransactionExplanation> {
    const self = this;
    return co<TransactionExplanation>(function* () {
      let transaction;
      try {
        transaction = yield self.deserializeTransaction(params);
      } catch (e) {
        throw new Error('invalid EOS transaction or headers');
      }
      return {
        displayOrder: [
          'id',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
          'proxy',
          'producers',
        ],
        id: transaction.transaction_id,
        changeOutputs: [],
        outputAmount: transaction.amount,
        changeAmount: 0,
        outputs: !!transaction.address ? [{ address: transaction.address, amount: transaction.amount }] : [],
        fee: {},
        memo: transaction.memo,
        proxy: transaction.proxy,
        producers: transaction.producers,
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
    const self = this;
    return co<HDNode[]>(function* () {
      const isKrsRecovery = backupKey.startsWith('xpub') && !userKey.startsWith('xpub');
      const isUnsignedSweep = backupKey.startsWith('xpub') && userKey.startsWith('xpub');

      if (isKrsRecovery) {
        if (!krsProvider || _.isUndefined(config.krsProviders[krsProvider])) {
          throw new Error('unknown key recovery service provider');
        }
        const krsProviderConfig = config.krsProviders[krsProvider];
        if (!krsProviderConfig.supportedCoins.includes(self.getFamily())) {
          throw new Error('specified key recovery service does not support recoveries for this coin');
        }
      }

      const keys = [
        self.validateKey({
          key: userKey,
          source: 'user',
          passphrase: walletPassphrase,
          isKrsRecovery,
          isUnsignedSweep,
        }),
        self.validateKey({
          key: backupKey,
          source: 'backup',
          passphrase: walletPassphrase,
          isKrsRecovery,
          isUnsignedSweep,
        }),
      ];
      if (!self.isValidAddress(recoveryDestination)) {
        throw new Error('Invalid destination address!');
      }

      return keys;
    }).call(this);
  }

  /**
   * Make a request to one of the public EOS nodes available
   * @param params.endpoint
   * @param params.payload
   */
  protected getDataFromNode(params: { endpoint: string; payload?: Record<string, unknown> }): Bluebird<any> {
    const self = this;
    return co(function* () {
      const nodeUrls = self.getPublicNodeUrls();
      for (const nodeUrl of nodeUrls) {
        try {
          return yield request.post(nodeUrl + params.endpoint).send(params.payload);
        } catch (e) {
          // let's hope another call succeeds
        }
      }
      throw new Error(`Unable to call endpoint: ${params.endpoint} from nodes: ${_.join(nodeUrls, ', ')}`);
    }).call(this);
  }

  /**
   * Get EOS chain info from a public node
   */
  protected getChainInfoFromNode(): Bluebird<any> {
    const self = this;
    return co(function* () {
      const response = yield self.getDataFromNode({ endpoint: '/v1/chain/get_info' });
      if ((response as any).status !== 200) {
        throw new Error('Unable to fetch chain info');
      }
      return (response as any).body;
    }).call(this);
  }

  /**
   * Get data specific to an account from a public node
   * @param address
   */
  protected getAccountFromNode({ address }: { address: string }): Bluebird<any> {
    const self = this;
    return co(function* () {
      const response = yield self.getDataFromNode({
        endpoint: '/v1/chain/get_account',
        payload: { account_name: address },
      });
      if ((response as any).status !== 200) {
        throw new Error('Account not found');
      }
      return (response as any).body;
    }).call(this);
  }

  /**
   * Get block data from a public node using its block number or block id
   * @param blockNumOrId
   */
  protected getBlockFromNode({ blockNumOrId }: { blockNumOrId: string }): Bluebird<any> {
    const self = this;
    return co(function* () {
      const response = yield self.getDataFromNode({
        endpoint: '/v1/chain/get_block',
        payload: { block_num_or_id: blockNumOrId },
      });
      if ((response as any).status !== 200) {
        throw new Error('Block not found');
      }
      return (response as any).body;
    }).call(this);
  }

  /**
   * Get headers for an EOS tx from a public node
   */
  protected getTransactionHeadersFromNode(): Bluebird<any> {
    const self = this;
    return co(function* () {
      const chainInfo = (yield self.getChainInfoFromNode()) as any;
      const headBlockInfoResult = yield self.getBlockFromNode({ blockNumOrId: chainInfo.head_block_num });
      const expireSeconds = 28800; // maximum tx expire time of 8h
      const chainDate = new Date((chainInfo as any).head_block_time + 'Z');
      const expirationDate = new Date(chainDate.getTime() + expireSeconds * 1000);

      return {
        expiration: expirationDate.toISOString(),
        ref_block_num: (chainInfo as any).head_block_num & 0xffff,
        ref_block_prefix: (headBlockInfoResult as any).ref_block_prefix,
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
    const self = this;
    return co<RecoveryTransaction>(function* () {
      if (!params.rootAddress) {
        throw new Error('missing required string rootAddress');
      }
      const isKrsRecovery = params.backupKey.startsWith('xpub') && !params.userKey.startsWith('xpub');
      const isUnsignedSweep = params.backupKey.startsWith('xpub') && params.userKey.startsWith('xpub');

      const keys = (yield self.initiateRecovery(params)) as any;

      const account = (yield self.getAccountFromNode({ address: params.rootAddress })) as any;

      if (!account.core_liquid_balance) {
        throw new Error('Could not find any balance to recovery for ' + params.rootAddress);
      }

      if (!account.permissions) {
        throw new Error('Could not find permissions for ' + params.rootAddress);
      }
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
      const destinationAddressDetails = self.getAddressDetails(destinationAddress);
      const destinationAccount = yield self.getAccountFromNode({ address: destinationAddress });
      if (!destinationAccount) {
        throw new Error('Destination account not found');
      }

      const transactionHeaders = yield self.getTransactionHeadersFromNode();
      const eosClient = new EosJs({ chainId: self.getChainId(), transactionHeaders });

      const transferAction = self.getTransferAction({
        recipient: destinationAddressDetails.address,
        sender: params.rootAddress,
        amount: new BigNumber(recoveryAmount),
        memo: destinationAddressDetails.memoId,
      });

      const transaction = yield eosClient.transaction({ actions: [transferAction] }, { sign: false, broadcast: false });

      const serializedTransaction = self.serializeTransaction(eosClient, transaction);
      const txObject = {
        transaction: {
          compression: 'none',
          packed_trx: serializedTransaction,
          signatures: [] as string[],
        },
        txid: (transaction as any).transaction_id,
        recoveryAmount: accountBalance,
      };
      const signableTx = Buffer.concat([
        Buffer.from(self.getChainId(), 'hex'), // The ChainID representing the chain that we are on
        Buffer.from(serializedTransaction, 'hex'), // The serialized unsigned tx
        Buffer.from(new Uint8Array(32)), // Some padding
      ]).toString('hex');

      if (isUnsignedSweep) {
        return txObject;
      }

      const userSignature = self.signTx(signableTx, keys[0]);
      txObject.transaction.signatures.push(userSignature);

      if (!isKrsRecovery) {
        const backupSignature = self.signTx(signableTx, keys[1]);
        txObject.transaction.signatures.push(backupSignature);
      }

      return txObject;
    })
      .call(this)
      .asCallback(callback);
  }

  parseTransaction(
    params: ParseTransactionOptions,
    callback?: NodeCallback<ParsedTransaction>
  ): Bluebird<ParsedTransaction> {
    return Bluebird.resolve({}).asCallback(callback);
  }

  verifyTransaction(params: VerifyTransactionOptions, callback?: NodeCallback<boolean>): Bluebird<boolean> {
    return Bluebird.resolve(true).asCallback(callback);
  }

  /**
   * Generate a random EOS address.
   *
   * This is just a random string which abides by the EOS adddress constraints,
   * and is not actually checked for availability on the EOS blockchain.
   *
   * Current EOS address constraints are:
   * * Address must be exactly 12 characters
   * * Address must only contain lowercase letters and numbers 1-5
   * @returns a validly formatted EOS address, which may or may not actually be available on chain.
   */
  generateRandomAddress(params: Record<string, never>): string {
    const address: string[] = [];
    while (address.length < 12) {
      const char = _.sample(Eos.VALID_ADDRESS_CHARS);
      if (!char) {
        throw new Error('failed to sample valid EOS address characters');
      }
      address.push(char);
    }
    return address.join('');
  }
}
