/**
 * @prettier
 */
import { BigNumber } from 'bignumber.js';
import { bip32, BIP32Interface } from '@bitgo/utxo-lib';
import { createHash, randomBytes } from 'crypto';
import { Api, ApiInterfaces, JsonRpc, RpcInterfaces } from 'eosjs';
import * as ecc from 'eosjs-ecc';
import * as _ from 'lodash';
import * as querystring from 'querystring';
import * as request from 'superagent';
import * as url from 'url';

import { OfflineAbiProvider } from './eosutil/eosabiprovider';
import { StringTextDecoder } from './lib/utils';
import {
  BaseCoin,
  BitGoBase,
  checkKrsProvider,
  Environments,
  getBip32Keys,
  getIsKrsRecovery,
  getIsUnsignedSweep,
  HalfSignedAccountTransaction as BaseHalfSignedTransaction,
  InvalidAddressError,
  KeyPair,
  ParsedTransaction,
  ParseTransactionOptions,
  RequestTracer,
  SignTransactionOptions as BaseSignTransactionOptions,
  TransactionExplanation,
  UnexpectedAddressError,
  VerificationOptions,
  VerifyAddressOptions as BaseVerifyAddressOptions,
  VerifyTransactionOptions as BaseVerifyTransactionOptions,
  Wallet,
} from '@bitgo/sdk-core';

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
  data: TransferActionData | StakeActionData | VoteActionData;
}

interface EosTransactionPrebuild {
  recipients: Recipient[];
  headers: EosTransactionHeaders;
  txHex: string; // The signable tx hex string
  transaction: EosTx;
  txid: string;
  coin: string;
  // full token name with the format, [t]eos:SYMBOL. This will only be present for token transactions. e.g. teos:CHEX.
  token?: string;
}

export interface EosSignTransactionParams extends BaseSignTransactionOptions {
  prv: string;
  txPrebuild: EosTransactionPrebuild;
  recipients: Recipient[];
}

export interface EosVerifyTransactionOptions extends BaseVerifyTransactionOptions {
  txPrebuild: EosTransactionPrebuild;
  txParams: EosSignTransactionParams;
  wallet: Wallet;
  verification?: VerificationOptions;
  reqId?: RequestTracer;
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

interface DeserializedEosTransaction {
  expiration: string;
  ref_block_num: string;
  ref_block_prefix: string;
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

interface TransferActionData {
  from: string;
  to: string;
  quantity: string;
  memo?: string;
}

interface StakeActionData {
  address: string;
  amount: string;
  from: string;
  receiver: string;
  transfer: number;
  stake_cpu_quantity: string;
}

interface UnstakeActionData {
  address: string;
  amount: string;
  from: string;
  receiver: string;
  unstake_cpu_quantity: string;
  unstake_net_quantity: string;
}

interface RefundActionData {
  address: string;
  owner: string;
}

interface VoteActionData {
  address: string;
  proxy: string;
  producers: string[];
  voter: string;
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

interface VerifyAddressOptions extends BaseVerifyAddressOptions {
  rootAddress: string;
}

class NoopJsonRpc extends JsonRpc {
  constructor() {
    super('');
  }
}

class NoopSignatureProvider implements ApiInterfaces.SignatureProvider {
  async getAvailableKeys(): Promise<string[]> {
    throw new Error('noop signature provider implementation has no available keys');
  }

  async sign(args: ApiInterfaces.SignatureProviderArgs): Promise<RpcInterfaces.PushTransactionArgs> {
    throw new Error('noop implementation is unable to sign');
  }
}

export class Eos extends BaseCoin {
  public static VALID_ADDRESS_CHARS = '12345abcdefghijklmnopqrstuvwxyz'.split('');
  public static ADDRESS_LENGTH = 12;

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Eos(bitgo);
  }

  getChainId(): string {
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

  get decimalPlaces() {
    return 4;
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
    const extendedKey = bip32.fromSeed(seed);
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
      return bip32.fromBase58(pub).isNeutered();
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
      return !bip32.fromBase58(prv).isNeutered();
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
    return this.isValidMemo({ value: memoId });
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
   * to big units (btc, eth, xrp, xlm)
   */
  baseUnitsToBigUnits(baseUnits: string | number): string {
    const dividend = this.getBaseFactor();
    const bigNumber = new BigNumber(baseUnits).dividedBy(dividend);
    // set the format so commas aren't added to large coin amounts
    return bigNumber.toFormat(this.decimalPlaces, null as any, { groupSeparator: '', decimalSeparator: '.' });
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
   * @param address - the address to verify
   * @param rootAddress - the wallet's root address
   * @return true iff address is a wallet address (based on rootAddress)
   */
  async isWalletAddress({ address, rootAddress }: VerifyAddressOptions): Promise<boolean> {
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
   * @returns {Promise<EosSignedTransaction>}
   */
  async signTransaction(params: EosSignTransactionParams): Promise<EosSignedTransaction> {
    const prv: string = params.prv;
    const txHex: string = params.txPrebuild.txHex;
    const transaction: EosTx = params.txPrebuild.transaction;

    const signBuffer: Buffer = Buffer.from(txHex, 'hex');
    const privateKeyBuffer = bip32.fromBase58(prv).privateKey;
    if (!privateKeyBuffer) {
      throw new Error('no privateKey');
    }
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

  private validateStakeActionData(stakeActionData: StakeActionData): any {
    if (stakeActionData.from !== stakeActionData.receiver) {
      throw new Error(`staker (${stakeActionData.from}) and receiver (${stakeActionData.receiver}) must be the same`);
    }

    if (stakeActionData.transfer !== 0) {
      throw new Error('cannot transfer funds as part of delegatebw action');
    }

    // stake_cpu_quantity is used as the amount because the BitGo platform only stakes cpu for voting transactions
    return {
      address: stakeActionData.from,
      amount: this.bigUnitsToBaseUnits(stakeActionData.stake_cpu_quantity.split(' ')[0]),
    };
  }

  private validateUnstakeActionData(unstakeActionData: UnstakeActionData): any {
    if (unstakeActionData.from !== unstakeActionData.receiver) {
      throw new Error(
        `unstaker (${unstakeActionData.from}) and receiver (${unstakeActionData.receiver}) must be the same`
      );
    }
    const cpuAmount = new BigNumber(unstakeActionData.unstake_cpu_quantity.split(' ')[0]);
    const netAmount = new BigNumber(unstakeActionData.unstake_net_quantity.split(' ')[0]);
    const totalAmount = cpuAmount.plus(netAmount).toNumber();

    return {
      address: unstakeActionData.receiver,
      amount: this.bigUnitsToBaseUnits(totalAmount),
    };
  }

  private static validateVoteActionData(voteActionData: VoteActionData) {
    const proxyIsEmpty = _.isEmpty(voteActionData.proxy);
    const producersIsEmpty = _.isEmpty(voteActionData.producers);
    if ((proxyIsEmpty && producersIsEmpty) || (!proxyIsEmpty && !producersIsEmpty)) {
      throw new Error('voting transactions must specify either producers or proxy to vote for');
    }

    return {
      address: voteActionData.voter,
      proxy: voteActionData.proxy,
      producers: voteActionData.producers,
    };
  }

  private static createTransactionIdHex(serializedTransactionBuffer: Buffer): string {
    return createHash('sha256').update(serializedTransactionBuffer).digest().toString('hex');
  }

  /**
   * Deserialize a transaction
   * @param transaction
   * @param headers
   */
  private async deserializeTransaction({
    transaction,
    headers,
  }: ExplainTransactionOptions): Promise<DeserializedEosTransaction> {
    // create an eosjs API client
    const api = new Api({
      abiProvider: new OfflineAbiProvider(),
      rpc: new NoopJsonRpc(),
      signatureProvider: new NoopSignatureProvider(),
      chainId: this.getChainId(),
      // Use a custom TextDecoder as the global TextDecoder leads to crashes in OVC / Electron.
      textDecoder: new StringTextDecoder(),
      textEncoder: new TextEncoder(),
    });

    // type guards
    const isTransferActionData = (txActionData: any): txActionData is TransferActionData => {
      return (
        (txActionData as TransferActionData).from !== undefined &&
        (txActionData as TransferActionData).to !== undefined &&
        (txActionData as TransferActionData).quantity !== undefined
      );
    };
    const isStakeActionData = (txActionData: any): txActionData is StakeActionData => {
      return (
        (txActionData as StakeActionData).from !== undefined &&
        (txActionData as StakeActionData).receiver !== undefined &&
        (txActionData as StakeActionData).transfer !== undefined &&
        (txActionData as StakeActionData).stake_cpu_quantity !== undefined
      );
    };
    const isUnstakeActionData = (txActionData: any): txActionData is UnstakeActionData => {
      return (
        (txActionData as UnstakeActionData).from !== undefined &&
        (txActionData as UnstakeActionData).receiver !== undefined &&
        (txActionData as UnstakeActionData).unstake_cpu_quantity !== undefined &&
        (txActionData as UnstakeActionData).unstake_net_quantity !== undefined
      );
    };
    const isVoteActionData = (txActionData: any): txActionData is VoteActionData => {
      return (txActionData as VoteActionData).voter !== undefined;
    };
    const isRefundActionData = (txActionData: any): txActionData is RefundActionData => {
      return (txActionData as RefundActionData).owner !== undefined;
    };

    // deserializeTransaction
    const serializedTxBuffer = Buffer.from(transaction.packed_trx, 'hex');
    const deserializedTxJsonFromPackedTrx = await api.deserializeTransactionWithActions(serializedTxBuffer);

    if (!deserializedTxJsonFromPackedTrx) {
      throw new Error('could not process transaction from txHex');
    }
    const tx: DeserializedEosTransaction = deserializedTxJsonFromPackedTrx;

    // validate context free actions
    if (tx.context_free_actions.length !== 0) {
      if (tx.context_free_actions.length !== 1) {
        throw new Error('number of context free actions must be 1');
      }

      if (
        !_.isEqual(_.pick(tx.context_free_actions[0], ['account', 'authorization', 'name']), {
          account: 'eosio.null',
          authorization: [],
          name: 'nonce',
        }) ||
        _.isEmpty(tx.context_free_actions[0].data)
      ) {
        throw new Error('the context free action is invalid');
      }
    }

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

      if (!isTransferActionData(txAction.data)) {
        throw new Error('Invalid or incomplete transfer action data');
      }
      const transferActionData = txAction.data;

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

      if (!isStakeActionData(txAction.data) || !isVoteActionData(txAction2.data)) {
        throw new Error('Invalid or incomplete stake or vote action data');
      }
      const stakeActionData = txAction.data;
      const voteActionData = txAction2.data;

      const deserializedStakeAction = this.validateStakeActionData(stakeActionData);
      const deserializedVoteAction = Eos.validateVoteActionData(voteActionData);
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
        if (!isStakeActionData(txAction.data)) {
          throw new Error('Invalid or incomplete stake action data');
        }
        const stakeActionData = txAction.data;
        deserializedStakeAction = this.validateStakeActionData(stakeActionData);
      }

      if (!isVoteActionData(txAction.data)) {
        throw new Error('Invalid or incomplete vote action data');
      }
      const voteActionData = txAction.data;
      const deserializedVoteAction = Eos.validateVoteActionData(voteActionData);

      if (!!deserializedStakeAction && deserializedStakeAction.address !== deserializedVoteAction.address) {
        throw new Error(
          `staker (${deserializedStakeAction.address}) and voter (${deserializedVoteAction.address}) must be the same`
        );
      }

      tx.amount = !!deserializedStakeAction ? deserializedStakeAction.amount : '0';
      tx.proxy = deserializedVoteAction.proxy;
      tx.producers = deserializedVoteAction.producers;
    } else if (txAction.name === 'undelegatebw') {
      if (tx.actions.length !== 1) {
        throw new Error(`unstake should only have 1 action: ${tx.actions.length} given`);
      }

      if (!isUnstakeActionData(txAction.data)) {
        throw new Error('Invalid or incomplete unstake action data');
      }
      const unstakeActionData = txAction.data;
      const deserializedUnstakeAction = this.validateUnstakeActionData(unstakeActionData);

      tx.amount = deserializedUnstakeAction.amount;
      tx.address = deserializedUnstakeAction.address;
    } else if (txAction.name === 'refund') {
      if (tx.actions.length !== 1) {
        throw new Error(`refund should only have 1 action: ${tx.actions.length} given`);
      }

      if (!isRefundActionData(txAction.data)) {
        throw new Error('Invalid or incomplete refund action data');
      }

      const refundActionData = txAction.data;
      tx.address = refundActionData.owner;
      tx.amount = '0';
    } else {
      throw new Error(`invalid action: ${txAction.name}`);
    }

    // Get the tx id if tx headers were provided
    if (headers) {
      let rebuiltTransaction;
      try {
        // remove Z at the end
        if ((headers.expiration as string).endsWith('Z')) {
          headers.expiration = (headers.expiration as string).slice(0, -1);
        }
        rebuiltTransaction = await api.transact({ ...tx, ...headers }, { sign: false, broadcast: false });
      } catch (e) {
        throw new Error(
          'Could not build transaction to get transaction_id. Please check transaction or headers format.'
        );
      }

      tx.transaction_id = Eos.createTransactionIdHex((rebuiltTransaction as any).serializedTransaction);
    }

    return tx;
  }

  /**
   * Explain/parse transaction
   * @param params - ExplainTransactionOptions
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<TransactionExplanation> {
    let transaction;
    try {
      transaction = await this.deserializeTransaction(params);
    } catch (e) {
      throw new Error('invalid EOS transaction or headers: ' + e.toString());
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
    } as any;
  }

  /**
   * @deprecated
   */
  initiateRecovery(params: RecoveryOptions): never {
    throw new Error('deprecated method');
  }

  /**
   * Make a request to one of the public EOS nodes available
   * @param params.endpoint
   * @param params.payload
   */
  protected async getDataFromNode(params: {
    endpoint: string;
    payload?: Record<string, unknown>;
  }): Promise<request.Response> {
    const nodeUrls = this.getPublicNodeUrls();
    for (const nodeUrl of nodeUrls) {
      try {
        return await request.post(nodeUrl + params.endpoint).send(params.payload);
      } catch (e) {
        // let's hope another call succeeds
      }
    }
    throw new Error(`Unable to call endpoint: ${params.endpoint} from nodes: ${_.join(nodeUrls, ', ')}`);
  }

  /**
   * Get EOS chain info from a public node
   */
  protected async getChainInfoFromNode(): Promise<any> {
    const response = await this.getDataFromNode({ endpoint: '/v1/chain/get_info' });
    if (response.status !== 200) {
      throw new Error('Unable to fetch chain info');
    }
    return response.body;
  }

  /**
   * Get data specific to an account from a public node
   * @param address
   */
  protected async getAccountFromNode({ address }: { address: string }): Promise<any> {
    const response = await this.getDataFromNode({
      endpoint: '/v1/chain/get_account',
      payload: { account_name: address },
    });
    if (response.status !== 200) {
      throw new Error('Account not found');
    }
    return response.body;
  }

  /**
   * Get block data from a public node using its block number or block id
   * @param blockNumOrId
   */
  protected async getBlockFromNode({ blockNumOrId }: { blockNumOrId: string }): Promise<any> {
    const response = await this.getDataFromNode({
      endpoint: '/v1/chain/get_block',
      payload: { block_num_or_id: blockNumOrId },
    });
    if (response.status !== 200) {
      throw new Error('Block not found');
    }
    return response.body;
  }

  /**
   * Get headers for an EOS tx from a public node
   */
  protected async getTransactionHeadersFromNode(): Promise<any> {
    const chainInfo = await this.getChainInfoFromNode();
    const headBlockInfoResult = await this.getBlockFromNode({ blockNumOrId: chainInfo.head_block_num });
    const expireSeconds = 28800; // maximum tx expire time of 8h
    const chainDate = new Date(chainInfo.head_block_time + 'Z').getTime();
    const expirationDate = new Date(chainDate + expireSeconds * 1000);

    return {
      expiration: expirationDate.toISOString(),
      ref_block_num: chainInfo.head_block_num & 0xffff,
      ref_block_prefix: headBlockInfoResult.ref_block_prefix,
    };
  }

  protected getTransferAction({ recipient, sender, amount, memo }: any): EosTransactionAction {
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
  signTx(signableTx: string, signingKey: BIP32Interface): string {
    const signBuffer = Buffer.from(signableTx, 'hex');
    const privateKeyBuffer = signingKey.privateKey;
    return ecc.Signature.sign(signBuffer, privateKeyBuffer).toString();
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param params
   */
  async recover(params: RecoveryOptions): Promise<RecoveryTransaction> {
    if (!params.rootAddress) {
      throw new Error('missing required string rootAddress');
    }

    const isKrsRecovery = getIsKrsRecovery(params);
    const isUnsignedSweep = getIsUnsignedSweep(params);

    const { krsProvider } = params;
    if (getIsKrsRecovery(params)) {
      checkKrsProvider(this, krsProvider);
    }

    if (!this.isValidAddress(params.recoveryDestination)) {
      throw new Error('Invalid destination address!');
    }

    const keys = getBip32Keys(this.bitgo, params, { requireBitGoXpub: false });

    const rootAddressDetails = this.getAddressDetails(params.rootAddress);
    const account = await this.getAccountFromNode({ address: rootAddressDetails.address });

    if (!account.core_liquid_balance) {
      throw new Error('Could not find any balance to recovery for ' + params.rootAddress);
    }

    if (!account.permissions) {
      throw new Error('Could not find permissions for ' + params.rootAddress);
    }
    const userPub = ecc.PublicKey.fromBuffer(keys[0].publicKey).toString();
    const backupPub = ecc.PublicKey.fromBuffer(keys[1].publicKey).toString();

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
    const recoveryAmount = this.bigUnitsToBaseUnits(new BigNumber(accountBalance).toFixed());

    const destinationAddress = params.recoveryDestination;
    const destinationAddressDetails = this.getAddressDetails(destinationAddress);
    const destinationAccount = await this.getAccountFromNode({ address: destinationAddressDetails.address });
    if (!destinationAccount) {
      throw new Error('Destination account not found');
    }

    const transactionHeaders = await this.getTransactionHeadersFromNode();
    if (!transactionHeaders) {
      throw new Error('Could not get transaction headers from node');
    }
    const headers: EosTransactionHeaders = transactionHeaders;
    const nativeDate = new Date(headers.expiration as string);
    // drop milliseconds and trailing Z from expiration
    nativeDate.setMilliseconds(0);
    const expiration = nativeDate.toISOString();
    if (expiration.endsWith('Z')) {
      headers.expiration = expiration.slice(0, -1);
    }

    // create an offline eosjs API client
    const api = new Api({
      rpc: new NoopJsonRpc(),
      signatureProvider: new NoopSignatureProvider(),
      abiProvider: new OfflineAbiProvider(),
      chainId: this.getChainId(),
      textDecoder: new TextDecoder(),
      textEncoder: new TextEncoder(),
    });

    const transferAction = this.getTransferAction({
      recipient: destinationAddressDetails.address,
      sender: rootAddressDetails.address,
      amount: new BigNumber(recoveryAmount),
      memo: destinationAddressDetails.memoId,
    });

    let serializedTransaction;
    const tx = { actions: [transferAction] };
    try {
      serializedTransaction = await api.transact({ ...tx, ...headers }, { sign: false, broadcast: false });
    } catch (e) {
      throw new Error('Eos API error: Could not build transaction');
    }

    // create transaction object
    const serializedTransactionHex = Buffer.from(serializedTransaction.serializedTransaction).toString('hex');
    const transactionId = Eos.createTransactionIdHex(serializedTransaction.serializedTransaction);
    const txObject = {
      transaction: {
        compression: 'none',
        packed_trx: serializedTransactionHex,
        signatures: [] as string[],
      },
      txid: transactionId,
      recoveryAmount: accountBalance,
      coin: this.getChain(),
      txHex: '',
    };

    const signableTx = Buffer.concat([
      Buffer.from(this.getChainId(), 'hex'), // The ChainID representing the chain that we are on
      Buffer.from(serializedTransaction.serializedTransaction), // The serialized unsigned tx
      Buffer.from(new Uint8Array(32)), // Some padding
    ]).toString('hex');

    if (isUnsignedSweep) {
      txObject.txHex = signableTx;
      return txObject;
    }

    const userSignature = this.signTx(signableTx, keys[0]);
    txObject.transaction.signatures.push(userSignature);

    if (!isKrsRecovery) {
      const backupSignature = this.signTx(signableTx, keys[1]);
      txObject.transaction.signatures.push(backupSignature);
    }

    return txObject;
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }

  /**
   * Verify that a transaction prebuild complies with the original intention
   *
   * @param params
   * @param params.txParams params used to build the transaction
   * @param params.txPrebuild the prebuilt transaction
   */
  async verifyTransaction(params: EosVerifyTransactionOptions): Promise<any> {
    const { txParams: txParams, txPrebuild: txPrebuild } = params;

    // check if the transaction has a txHex
    if (!txPrebuild.txHex) {
      throw new Error('missing required tx prebuild property txHex');
    }

    // construct transaction from txHex
    const txFromHex = Buffer.from(txPrebuild.txHex, 'hex');
    const txDataWithPadding = txFromHex.slice(32);
    const txData = txDataWithPadding.slice(0, txDataWithPadding.length - 32);
    const deserializedTxJson = await this.deserializeTransaction({
      transaction: { packed_trx: txData.toString('hex') },
      headers: txPrebuild.headers,
    });
    if (!deserializedTxJson) {
      throw new Error('could not process transaction from txHex');
    }
    const txJsonFromHex: DeserializedEosTransaction = deserializedTxJson;

    // check that if txParams has a txPrebuild, it should be the same as txPrebuild
    if (txParams.txPrebuild && !_.isEqual(txParams.txPrebuild, txPrebuild)) {
      throw new Error('inputs txParams.txPrebuild and txPrebuild expected to be equal but were not');
    }

    // check if prebuild has a transaction
    if (!txPrebuild.transaction) {
      throw new Error('missing required transaction in txPrebuild');
    }

    // check if transaction has a packed_trx
    if (!txPrebuild.transaction?.packed_trx) {
      throw new Error('missing required transaction.packed_trx in txPrebuild');
    }

    // construct transaction using packed_trx
    const deserializedTxJsonFromPackedTrx = await this.deserializeTransaction({
      transaction: { packed_trx: txPrebuild.transaction.packed_trx },
      headers: txPrebuild.headers,
    });
    if (!deserializedTxJsonFromPackedTrx) {
      throw new Error('could not process transaction from packed_trx');
    }
    const txJsonFromPackedTrx: DeserializedEosTransaction = deserializedTxJsonFromPackedTrx;

    // deep check of object from packed_trx and txHex
    if (!_.isEqual(txJsonFromPackedTrx, txJsonFromHex)) {
      throw new Error('unpacked packed_trx and unpacked txHex are not equal');
    }

    if (txParams.recipients.length > 1) {
      throw new Error('only 0 or 1 recipients are supported');
    }

    // check the amounts, recipient, and coin name for transfers
    if (txParams.recipients.length === 1) {
      const expectedOutput = txParams.recipients[0];

      // check output address and memoId
      const expectedOutputAddressAndMemoId = this.getAddressDetails(expectedOutput.address);
      const txHexAction = txJsonFromHex.actions[0];
      const txHexTransferAction = txHexAction.data as TransferActionData;

      if (txHexTransferAction.to !== expectedOutputAddressAndMemoId.address) {
        throw new Error('txHex receive address does not match expected recipient address');
      }
      // check if txaction memoid is equal to address memo id only if address also has memoid present
      if (!_.isUndefined(expectedOutputAddressAndMemoId.memoId)) {
        if (txHexTransferAction.memo !== expectedOutputAddressAndMemoId.memoId) {
          throw new Error('txHex receive memoId does not match expected recipient memoId');
        }
      }

      // check amount and coin
      const expectedOutputAmount = expectedOutput.amount;
      const actualAmountAndCoin = txHexTransferAction.quantity.split(' ');
      const actualOutputAmount = this.bigUnitsToBaseUnits(actualAmountAndCoin[0]);
      if (expectedOutputAmount !== actualOutputAmount) {
        throw new Error('txHex receive amount does not match expected recipient amount');
      }

      if (txPrebuild.coin === 'eos' || txPrebuild.coin === 'teos') {
        const expectedSymbol = _.isNil(txPrebuild.token) ? 'EOS' : txPrebuild.token.split(':')[1];

        if (actualAmountAndCoin[1] !== expectedSymbol) {
          throw new Error('txHex receive symbol does not match expected recipient symbol');
        }
      } else {
        // this should never happen
        throw new Error('txHex coin name does not match expected coin name');
      }
    }

    return true;
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
