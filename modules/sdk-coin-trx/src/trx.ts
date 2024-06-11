/**
 * @prettier
 */
import * as secp256k1 from 'secp256k1';
import { randomBytes } from 'crypto';
import { CoinFamily, BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { bip32, networks } from '@bitgo/utxo-lib';
import * as request from 'superagent';
import {
  BaseCoin,
  BitGoBase,
  common,
  getBip32Keys,
  getIsKrsRecovery,
  getIsUnsignedSweep,
  KeyPair,
  MethodNotImplementedError,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions,
  TransactionExplanation,
  TransactionFee,
  TransactionPrebuild as BaseTransactionPrebuild,
  TransactionRecipient as Recipient,
  VerifyAddressOptions,
  VerifyTransactionOptions,
  BaseTransaction,
} from '@bitgo/sdk-core';
import { Interface, Utils, WrappedBuilder } from './lib';
import { getBuilder } from './lib/builder';
import { TransactionReceipt } from './lib/iface';
import { isInteger, isUndefined } from 'lodash';

export const MINIMUM_TRON_MSIG_TRANSACTION_FEE = 1e6;
export const SAFE_TRON_TRANSACTION_FEE = 2.1 * 1e6; // TRON foundation recommends 2.1 TRX as fees for guaranteed transaction
export const SAFE_TRON_TOKEN_TRANSACTION_FEE = 100 * 1e6; // TRON foundation recommends 100 TRX as fees for guaranteed transaction
export const RECOVER_TRANSACTION_EXPIRY = 86400000; // 24 hour
export const DEFAULT_SCAN_FACTOR = 20; // default number of receive addresses to scan for funds

export interface TronSignTransactionOptions extends SignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

export interface TxInfo {
  recipients: Recipient[];
  from: string;
  txid: string;
}

export interface AddressInfo {
  address: string;
  chain: number;
  index: number;
}

export interface TronTransactionExplanation extends TransactionExplanation {
  expiration: number;
  timestamp: number;
}

export interface TransactionPrebuild extends BaseTransactionPrebuild {
  txHex: string;
  txInfo: TxInfo;
  addressInfo?: AddressInfo;
  feeInfo: TransactionFee;
}

export interface ExplainTransactionOptions {
  txHex?: string; // txHex is poorly named here; it is just a wrapped JSON object
  halfSigned?: {
    txHex: string; // txHex is poorly named here; it is just a wrapped JSON object
  };
  feeInfo: TransactionFee;
}

export interface RecoveryOptions {
  userKey: string; // Box A
  backupKey: string; // Box B
  bitgoKey: string; // Box C - this is bitgo's xpub and will be used to derive their root address
  recoveryDestination: string; // base58 address
  krsProvider?: string;
  tokenContractAddress?: string;
  walletPassphrase?: string;
  startingScanIndex?: number;
  scan?: number;
}

export interface ConsolidationRecoveryOptions {
  userKey: string;
  backupKey: string;
  bitgoKey: string;
  tokenContractAddress?: string;
  startingScanIndex?: number; // default to 1 (inclusive)
  endingScanIndex?: number; // default to startingScanIndex + 20 (exclusive)
}

export interface ConsolidationRecoveryBatch {
  transactions: RecoveryTransaction[];
}

export interface FeeInfo {
  fee: string;
}

export interface RecoveryTransaction {
  txHex?: string;
  feeInfo?: FeeInfo;
  coin?: string;
  tx?: TransactionPrebuild;
  recoveryAmount?: number;
  tokenTxs?: TransactionReceipt[];
  addressInfo?: AddressInfo;
}

export enum NodeTypes {
  Full,
  Solidity,
}

/**
 * This structure is not a complete model of the AccountResponse from a node.
 */
export interface AccountResponse {
  data: [Interface.AccountInfo];
}

export class Trx extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  getChain() {
    return this._staticsCoin.name;
  }

  getFamily(): CoinFamily {
    return this._staticsCoin.family;
  }

  getFullName() {
    return this._staticsCoin.fullName;
  }

  getBaseFactor() {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  /** @inheritdoc */
  transactionDataAllowed() {
    return true;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Trx(bitgo, staticsCoin);
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    return true;
  }

  /** @inheritDoc */
  allowsAccountConsolidations(): boolean {
    return true;
  }

  /**
   * Checks if this is a valid base58 or hex address
   * @param address
   */
  isValidAddress(address: string): boolean {
    if (!address) {
      return false;
    }

    return this.isValidHexAddress(address) || Utils.isBase58Address(address);
  }

  /**
   * Checks if this is a valid hex address
   * @param address hex address
   */
  isValidHexAddress(address: string): boolean {
    return /^41[0-9a-f]{40}$/i.test(address);
  }

  /**
   * Generate ed25519 key pair
   *
   * @param seed
   * @returns {Object} object with generated pub, prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    // TODO: move this and address creation logic to account-lib
    if (!seed) {
      // An extended private key has both a normal 256 bit private key and a 256 bit chain code, both of which must be
      // random. 512 bits is therefore the maximum entropy and gives us maximum security against cracking.
      seed = randomBytes(512 / 8);
    }
    const hd = bip32.fromSeed(seed);
    return {
      pub: hd.neutered().toBase58(),
      prv: hd.toBase58(),
    };
  }

  isValidXpub(xpub: string): boolean {
    try {
      return bip32.fromBase58(xpub).isNeutered();
    } catch (e) {
      return false;
    }
  }

  isValidPub(pub: string): boolean {
    if (this.isValidXpub(pub)) {
      // xpubs can be converted into regular pubs, so technically it is a valid pub
      return true;
    }
    return new RegExp('^04[a-zA-Z0-9]{128}$').test(pub);
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }

  async isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    throw new MethodNotImplementedError();
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    return true;
  }

  /**
   * Derive a user key using the chain path of the address
   * @param key
   * @param path
   * @returns {string} derived private key
   */
  deriveKeyWithPath({ key, path }: { key: string; path: string }): string {
    const keychain = bip32.fromBase58(key);
    const derivedKeyNode = keychain.derivePath(path);
    return derivedKeyNode.toBase58();
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   *
   * @param params
   * @param params.txPrebuild {Object} prebuild object returned by platform
   * @param params.prv {String} user prv
   * @param params.wallet.addressVersion {String} this is the version of the Algorand multisig address generation format
   * @returns Bluebird<SignedTransaction>
   */
  async signTransaction(params: TronSignTransactionOptions): Promise<SignedTransaction> {
    const txBuilder = getBuilder(this.getChain()).from(params.txPrebuild.txHex);

    let key;
    const { chain, index } = params.txPrebuild?.addressInfo ?? { chain: 0, index: 0 };
    if (chain === 0 && index === 0) {
      key = params.prv;
    } else {
      const derivationPath = `0/0/${chain}/${index}`;
      key = this.deriveKeyWithPath({ key: params.prv, path: derivationPath });
    }
    txBuilder.sign({ key });

    const transaction = await txBuilder.build();
    const response = {
      txHex: JSON.stringify(transaction.toJson()),
    };
    if (transaction.toJson().signature.length >= 2) {
      return response;
    }
    // Half signed transaction
    return {
      halfSigned: response,
    };
  }

  /**
   * Return boolean indicating whether input is valid seed for the coin
   *
   * @param prv - the prv to be checked
   */
  isValidXprv(prv: string): boolean {
    try {
      return !bip32.fromBase58(prv).isNeutered();
    } catch {
      return false;
    }
  }

  /**
   * Convert a message to string in hexadecimal format.
   *
   * @param message {Buffer|String} message to sign
   * @return the message as a hexadecimal string
   */
  toHexString(message: string | Buffer): string {
    if (typeof message === 'string') {
      return Buffer.from(message).toString('hex');
    } else if (Buffer.isBuffer(message)) {
      return message.toString('hex');
    } else {
      throw new Error('Invalid messaged passed to signMessage');
    }
  }

  /**
   * Sign message with private key
   *
   * @param key
   * @param message
   */
  async signMessage(key: KeyPair, message: string | Buffer): Promise<Buffer> {
    const toSign = this.toHexString(message);

    let prv: string | undefined = key.prv;
    if (this.isValidXprv(prv)) {
      prv = bip32.fromBase58(prv).privateKey?.toString('hex');
    }

    if (!prv) {
      throw new Error('no privateKey');
    }
    let sig = Utils.signString(toSign, prv, true);

    // remove the preceding 0x
    sig = sig.replace(/^0x/, '');

    return Buffer.from(sig, 'hex');
  }

  /**
   * Converts an xpub to a uncompressed pub
   * @param xpub
   */
  xpubToUncompressedPub(xpub: string): string {
    if (!this.isValidXpub(xpub)) {
      throw new Error('invalid xpub');
    }

    const publicKey = bip32.fromBase58(xpub, networks.bitcoin).publicKey;
    return Buffer.from(secp256k1.publicKeyConvert(publicKey, false /* compressed */)).toString('hex');
  }

  /**
   * Modify prebuild before sending it to the server.
   * @param buildParams The whitelisted parameters for this prebuild
   */
  async getExtraPrebuildParams(buildParams: any): Promise<any> {
    if (buildParams.recipients[0].data && buildParams.feeLimit) {
      buildParams.recipients[0].feeLimit = buildParams.feeLimit;
    }
  }

  pubToHexAddress(pub: string): string {
    const byteArrayAddr = Utils.getByteArrayFromHexAddress(pub);
    const rawAddress = Utils.getRawAddressFromPubKey(byteArrayAddr);
    return Utils.getHexAddressFromByteArray(rawAddress);
  }

  xprvToCompressedPrv(xprv: string): string {
    if (!this.isValidXprv(xprv)) {
      throw new Error('invalid xprv');
    }

    const hdNode = bip32.fromBase58(xprv, networks.bitcoin);
    if (!hdNode.privateKey) {
      throw new Error('no privateKey');
    }
    return hdNode.privateKey.toString('hex');
  }

  private getNodeUrl(node: NodeTypes): string {
    switch (node) {
      case NodeTypes.Full:
        return common.Environments[this.bitgo.getEnv()].tronNodes.full;
      case NodeTypes.Solidity:
        return common.Environments[this.bitgo.getEnv()].tronNodes.solidity;
      default:
        throw new Error('node type not found');
    }
  }
  /**
   * Make a query to Trongrid for information such as balance, token balance, solidity calls
   * @param query {Object} key-value pairs of parameters to append after /api
   * @returns {Object} response from Trongrid
   */
  private async recoveryPost(query: { path: string; jsonObj: any; node: NodeTypes }): Promise<any> {
    const nodeUri = this.getNodeUrl(query.node);

    const response = await request
      .post(nodeUri + query.path)
      .type('json')
      .send(query.jsonObj);

    if (!response.ok) {
      throw new Error('could not reach Tron node');
    }

    // unfortunately, it doesn't look like most TRON nodes return valid json as body
    return JSON.parse(response.text);
  }

  /**
   * Make a query to Trongrid for information such as balance, token balance, solidity calls
   * @param query {Object} key-value pairs of parameters to append after /api
   * @returns {Object} response from Trongrid
   */
  private async recoveryGet(query: { path: string; jsonObj: any; node: NodeTypes }): Promise<any> {
    const nodeUri = this.getNodeUrl(query.node);

    const response = await request
      .get(nodeUri + query.path)
      .type('json')
      .send(query.jsonObj);

    if (!response.ok) {
      throw new Error('could not reach Tron node');
    }

    // unfortunately, it doesn't look like most TRON nodes return valid json as body
    return JSON.parse(response.text);
  }

  /**
   * Query our explorer for the balance of an address
   * @param address {String} the address encoded in hex
   * @returns {BigNumber} address balance
   */
  private async getAccountBalancesFromNode(address: string): Promise<AccountResponse> {
    return await this.recoveryGet({
      path: '/v1/accounts/' + address,
      jsonObj: {},
      node: NodeTypes.Full,
    });
  }

  /**
   * Retrieves our build transaction from a node.
   * @param toAddr hex-encoded address
   * @param fromAddr hex-encoded address
   * @param amount
   */
  private async getBuildTransaction(
    toAddr: string,
    fromAddr: string,
    amount: number
  ): Promise<Interface.TransactionReceipt> {
    // our addresses should be base58, we'll have to encode to hex
    return await this.recoveryPost({
      path: '/wallet/createtransaction',
      jsonObj: {
        to_address: toAddr,
        owner_address: fromAddr,
        amount,
      },
      node: NodeTypes.Full,
    });
  }

  /**
   * Retrieves our build transaction from a node.
   * @param toAddr hex-encoded address
   * @param fromAddr hex-encoded address
   * @param amount
   */
  private async getTriggerSmartContractTransaction(
    toAddr: string,
    fromAddr: string,
    amount: string,
    contractAddr: string
  ): Promise<{ transaction: Interface.TransactionReceipt }> {
    const functionSelector = 'transfer(address,uint256)';
    const types = ['address', 'uint256'];
    const values = [toAddr, amount];
    const parameter = Utils.encodeDataParams(types, values, '');
    return await this.recoveryPost({
      path: '/wallet/triggersmartcontract',
      jsonObj: {
        owner_address: fromAddr,
        contract_address: contractAddr,
        function_selector: functionSelector,
        parameter: parameter,
        fee_limit: 100000000,
      },
      node: NodeTypes.Full,
    });
  }

  /**
   * Throws an error if any keys in the ownerKeys collection don't match the keys array we pass
   * @param ownerKeys
   * @param keys
   */
  checkPermissions(ownerKeys: { address: string; weight: number }[], keys: string[]) {
    keys = keys.map((k) => k.toUpperCase());

    ownerKeys.map((key) => {
      const hexKey = key.address.toUpperCase();
      if (!keys.includes(hexKey)) {
        throw new Error(`pub address ${hexKey} not found in account`);
      }

      if (key.weight !== 1) {
        throw new Error('owner permission is invalid for this structure');
      }
    });
  }

  /**
   * Format for offline vault signing
   * @param {BaseTransaction} tx
   * @param {number} fee
   * @param {number} recoveryAmount
   * @returns {RecoveryTransaction}
   */
  formatForOfflineVault(
    tx: BaseTransaction,
    fee: number,
    recoveryAmount: number,
    addressInfo?: AddressInfo
  ): RecoveryTransaction {
    const txJSON = tx.toJson();
    const format = {
      txHex: JSON.stringify(txJSON),
      recoveryAmount,
      feeInfo: {
        fee: `${fee}`,
      },
      tx: txJSON, // Leaving it as txJSON for backwards compatibility
      coin: this.getChain(),
    };
    return addressInfo ? { ...format, addressInfo } : format;
  }

  /**
   * Builds a funds recovery transaction without BitGo.
   * We need to do three queries during this:
   * 1) Node query - how much money is in the account
   * 2) Build transaction - build our transaction for the amount
   * 3) Send signed build - send our signed build to a public node
   *
   * Note 1: for base address recoveries, fund will be recovered to recovery destination if base address balance is
   * more than 2.1 TRX for native TRX recovery and 100 TRX for token recover. For receive addresses, fund will be
   * recovered to base address first then swept to base address(decided as the universal pattern in team meeting).
   *
   * Note 2: the function supports token sweep from base address.
   * TODO: support token sweep from receive address.
   *
   * @param params
   */
  async recover(params: RecoveryOptions): Promise<RecoveryTransaction> {
    const isKrsRecovery = getIsKrsRecovery(params);
    const isUnsignedSweep = getIsUnsignedSweep(params);

    if (!this.isValidAddress(params.recoveryDestination)) {
      throw new Error('Invalid destination address!');
    }

    let startIdx = params.startingScanIndex;
    if (isUndefined(startIdx)) {
      startIdx = 1;
    } else if (!isInteger(startIdx) || startIdx < 0) {
      throw new Error('Invalid starting index to scan for addresses');
    }
    let numIteration = params.scan;
    if (isUndefined(numIteration)) {
      numIteration = 20;
    } else if (!isInteger(numIteration) || numIteration <= 0) {
      throw new Error('Invalid scanning factor');
    }

    // get our user, backup keys
    const keys = getBip32Keys(this.bitgo, params, { requireBitGoXpub: false });

    // we need to decode our bitgoKey to a base58 address
    const bitgoHexAddr = this.pubToHexAddress(this.xpubToUncompressedPub(params.bitgoKey));
    let recoveryFromAddrHex = bitgoHexAddr;
    let recoveryToAddressHex = Utils.getHexAddressFromBase58Address(params.recoveryDestination);

    // call the node to get our account balance for base address
    let account = await this.getAccountBalancesFromNode(Utils.getBase58AddressFromHex(recoveryFromAddrHex));
    let recoveryAmount = account.data[0].balance;

    let userXPrv = keys[0].toBase58();
    let isReceiveAddress = false;
    let addressInfo: AddressInfo | undefined;
    const tokenContractAddr = params.tokenContractAddress;
    // check for possible token recovery, recover the token provide by user
    if (tokenContractAddr) {
      let rawTokenTxn: any | undefined;
      for (const token of account.data[0].trc20) {
        if (token[tokenContractAddr]) {
          const amount = token[tokenContractAddr];
          const tokenContractAddrHex = Utils.getHexAddressFromBase58Address(tokenContractAddr);
          rawTokenTxn = (
            await this.getTriggerSmartContractTransaction(
              recoveryToAddressHex,
              recoveryFromAddrHex,
              amount,
              tokenContractAddrHex
            )
          ).transaction;
          recoveryAmount = parseInt(amount, 10);
          break;
        }
      }

      // build and sign token txns
      if (rawTokenTxn) {
        // Check there is sufficient of the native asset to cover fees
        const trxBalance = account.data[0].balance;
        if (trxBalance < SAFE_TRON_TOKEN_TRANSACTION_FEE) {
          throw new Error(
            `Amount of funds to recover ${trxBalance} is less than ${SAFE_TRON_TOKEN_TRANSACTION_FEE} and wouldn't be able to fund a trc20 send`
          );
        }

        const txBuilder = getBuilder(this.getChain()).from(rawTokenTxn);
        // Default expiry is 1 minute which is too short for recovery purposes
        // extend the expiry to 1 day
        txBuilder.extendValidTo(RECOVER_TRANSACTION_EXPIRY);
        // this tx should be enough to drop into a node
        if (isUnsignedSweep) {
          return this.formatForOfflineVault(await txBuilder.build(), SAFE_TRON_TOKEN_TRANSACTION_FEE, recoveryAmount);
        }

        const userPrv = this.xprvToCompressedPrv(userXPrv);

        txBuilder.sign({ key: userPrv });

        // krs recoveries don't get signed
        if (!isKrsRecovery && !isReceiveAddress) {
          const backupXPrv = keys[1].toBase58();
          const backupPrv = this.xprvToCompressedPrv(backupXPrv);

          txBuilder.sign({ key: backupPrv });
        }
        return this.formatForOfflineVault(await txBuilder.build(), SAFE_TRON_TOKEN_TRANSACTION_FEE, recoveryAmount);
      } else {
        throw Error('Not found token to recover, please check token balance');
      }
    }
    // let us recover the native Tron
    if (recoveryAmount > SAFE_TRON_TRANSACTION_FEE) {
      const userXPub = keys[0].neutered().toBase58();
      const backupXPub = keys[1].neutered().toBase58();

      // check multisig permissions
      const keyHexAddresses = [
        this.pubToHexAddress(this.xpubToUncompressedPub(userXPub)),
        this.pubToHexAddress(this.xpubToUncompressedPub(backupXPub)),
        bitgoHexAddr,
      ];
      // run checks to ensure this is a valid tx - permissions match our signer keys
      const ownerKeys: { address: string; weight: number }[] = [];
      for (const key of account.data[0].owner_permission.keys) {
        const address = Utils.getHexAddressFromBase58Address(key.address);
        const weight = key.weight;
        ownerKeys.push({ address, weight });
      }
      const activePermissionKeys: { address: string; weight: number }[] = [];
      for (const key of account.data[0].active_permission[0].keys) {
        const address = Utils.getHexAddressFromBase58Address(key.address);
        const weight = key.weight;
        activePermissionKeys.push({ address, weight });
      }
      this.checkPermissions(ownerKeys, keyHexAddresses);
      this.checkPermissions(activePermissionKeys, keyHexAddresses);
    } else {
      // Check receive addresses for funds
      // Check for first derived wallet with funds
      // Receive addresses are derived from the user key
      for (let i = startIdx; i < numIteration + startIdx; i++) {
        const derivationPath = `0/0/0/${i}`;
        const userKey = keys[0].derivePath(derivationPath);
        const xpub = userKey.neutered();
        const receiveAddress = this.pubToHexAddress(this.xpubToUncompressedPub(xpub.toBase58()));
        const address = Utils.getBase58AddressFromHex(receiveAddress);
        // call the node to get our account balance
        const accountInfo = await this.getAccountBalancesFromNode(address);

        if (accountInfo.data[0] && accountInfo.data[0].balance > SAFE_TRON_TRANSACTION_FEE) {
          account = accountInfo;
          recoveryAmount = accountInfo.data[0].balance;
          userXPrv = userKey.toBase58(); // assign derived userXPrx
          isReceiveAddress = true;
          recoveryFromAddrHex = receiveAddress;
          recoveryToAddressHex = bitgoHexAddr;
          addressInfo = {
            address,
            chain: 0,
            index: i,
          };
          break;
        }
      }
    }

    // a sweep potentially needs to pay for multi-sig transfer, destination account activation and bandwidth
    // TRON foundation recommends 2.1 TRX for guaranteed confirmation
    if (!recoveryAmount || SAFE_TRON_TRANSACTION_FEE >= recoveryAmount) {
      throw new Error(
        `Amount of funds to recover ${recoveryAmount} is less than ${SAFE_TRON_TRANSACTION_FEE} and wouldn't be able to fund a send`
      );
    }

    const recoveryAmountMinusFees = recoveryAmount - SAFE_TRON_TRANSACTION_FEE;
    const buildTx = await this.getBuildTransaction(recoveryToAddressHex, recoveryFromAddrHex, recoveryAmountMinusFees);

    // construct our tx
    const txBuilder = (getBuilder(this.getChain()) as WrappedBuilder).from(buildTx);
    // Default expiry is 1 minute which is too short for recovery purposes
    // extend the expiry to 1 day
    txBuilder.extendValidTo(RECOVER_TRANSACTION_EXPIRY);
    const tx = await txBuilder.build();

    // this tx should be enough to drop into a node
    if (isUnsignedSweep) {
      return this.formatForOfflineVault(tx, SAFE_TRON_TRANSACTION_FEE, recoveryAmountMinusFees, addressInfo);
    }

    const userPrv = this.xprvToCompressedPrv(userXPrv);

    txBuilder.sign({ key: userPrv });

    // krs recoveries don't get signed
    if (!isKrsRecovery && !isReceiveAddress) {
      const backupXPrv = keys[1].toBase58();
      const backupPrv = this.xprvToCompressedPrv(backupXPrv);

      txBuilder.sign({ key: backupPrv });
    }
    const txSigned = await txBuilder.build();
    return this.formatForOfflineVault(txSigned, SAFE_TRON_TRANSACTION_FEE, recoveryAmountMinusFees, addressInfo);
  }

  /**
   * Builds native TRX recoveries of receive addresses in batch without BitGo.
   * Funds will be recovered to base address first. You need to initiate another sweep txn after that.
   * Note: there will be another recoverTokenConsolidations function to support token recover from receive addresses.
   *
   * @param {ConsolidationRecoveryOptions} params - options for consolidation recovery.
   * @param {string} [params.startingScanIndex] - receive address index to start scanning from. default to 1 (inclusive).
   * @param {string} [params.endingScanIndex] - receive address index to end scanning at. default to startingScanIndex + 20 (exclusive).
   */
  async recoverConsolidations(params: ConsolidationRecoveryOptions): Promise<ConsolidationRecoveryBatch> {
    const isUnsignedConsolidations = getIsUnsignedSweep(params);
    const startIdx = params.startingScanIndex || 1;
    const endIdx = params.endingScanIndex || startIdx + DEFAULT_SCAN_FACTOR;

    if (startIdx < 1 || endIdx <= startIdx || endIdx - startIdx > 10 * DEFAULT_SCAN_FACTOR) {
      throw new Error(
        `Invalid starting or ending index to scan for addresses. startingScanIndex: ${startIdx}, endingScanIndex: ${endIdx}.`
      );
    }

    const keys = getBip32Keys(this.bitgo, params, { requireBitGoXpub: false });
    const baseAddrHex = this.pubToHexAddress(this.xpubToUncompressedPub(params.bitgoKey));

    const txnsBatch: RecoveryTransaction[] = [];
    for (let i = startIdx; i < endIdx; i++) {
      const derivationPath = `0/0/0/${i}`;
      const userKey = keys[0].derivePath(derivationPath);
      const userKeyXPub = userKey.neutered();
      const receiveAddressHex = this.pubToHexAddress(this.xpubToUncompressedPub(userKeyXPub.toBase58()));
      const receiveAddress = Utils.getBase58AddressFromHex(receiveAddressHex);
      // call the node to get our account balance
      const accountInfo = await this.getAccountBalancesFromNode(receiveAddress);

      if (accountInfo.data[0] && accountInfo.data[0].balance > SAFE_TRON_TRANSACTION_FEE) {
        let recoveryAmount = 0;
        // Tokens must be consolidate before the native asset. First construct token txns
        let rawTokenTxn: any | undefined;

        // check for possible token recovery, recover the token provide by user
        if (params.tokenContractAddress) {
          if (accountInfo.data[0].balance > SAFE_TRON_TOKEN_TRANSACTION_FEE && accountInfo.data[0].trc20[0]) {
            const tokenDataArray = accountInfo.data[0].trc20;
            for (const tokenData of tokenDataArray) {
              const contractAddress = Object.keys(tokenData) as Array<string>;
              if (params.tokenContractAddress === contractAddress[0]) {
                const amount = tokenData[contractAddress[0]];
                const tokenContractAddrHex = Utils.getHexAddressFromBase58Address(contractAddress[0]);
                rawTokenTxn = (
                  await this.getTriggerSmartContractTransaction(
                    baseAddrHex,
                    receiveAddressHex,
                    amount,
                    tokenContractAddrHex
                  )
                ).transaction;
                recoveryAmount = parseInt(amount, 10);
                break;
              }
            }
          }
          // build and sign token txns
          if (rawTokenTxn) {
            const addressInfo = {
              address: receiveAddress,
              chain: 0,
              index: i,
            };
            const txBuilder = getBuilder(this.getChain()).from(rawTokenTxn);
            // Default expiry is 1 minute which is too short for recovery purposes
            // extend the expiry to 1 day
            txBuilder.extendValidTo(RECOVER_TRANSACTION_EXPIRY);
            // this tx should be enough to drop into a node
            if (!isUnsignedConsolidations) {
              const userPrv = this.xprvToCompressedPrv(userKey.toBase58());
              // receive address only needs to be signed by user key
              txBuilder.sign({ key: userPrv });
            }
            const tx = await txBuilder.build();
            txnsBatch.push(
              this.formatForOfflineVault(tx, SAFE_TRON_TOKEN_TRANSACTION_FEE, recoveryAmount, addressInfo)
            );
          }
        } else {
          const addressBalance = accountInfo.data[0].balance;
          const addressInfo = {
            address: receiveAddress,
            chain: 0,
            index: i,
          };
          const recoveryAmount = addressBalance - SAFE_TRON_TRANSACTION_FEE;
          const buildTx = await this.getBuildTransaction(baseAddrHex, receiveAddressHex, recoveryAmount);
          // construct our tx
          const txBuilder = (getBuilder(this.getChain()) as WrappedBuilder).from(buildTx);
          // Default expiry is 1 minute which is too short for recovery purposes
          // extend the expiry to 1 day
          txBuilder.extendValidTo(RECOVER_TRANSACTION_EXPIRY);

          if (!isUnsignedConsolidations) {
            const userPrv = this.xprvToCompressedPrv(userKey.toBase58());
            // receive address only needs to be signed by user key
            txBuilder.sign({ key: userPrv });
          }
          const tx = await txBuilder.build();
          txnsBatch.push(this.formatForOfflineVault(tx, SAFE_TRON_TRANSACTION_FEE, recoveryAmount, addressInfo));
        }
      }
    }

    return {
      transactions: txnsBatch,
    };
  }

  /**
   * Explain a Tron transaction from txHex
   * @param params
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<TronTransactionExplanation> {
    const txHex = params.txHex || (params.halfSigned && params.halfSigned.txHex);
    if (!txHex || !params.feeInfo) {
      throw new Error('missing explain tx parameters');
    }
    const txBuilder = getBuilder(this.getChain()).from(txHex);
    const tx = await txBuilder.build();
    const outputs = [
      {
        amount: tx.outputs[0].value.toString(),
        address: tx.outputs[0].address, // Should turn it into a readable format, aka base58
      },
    ];

    const displayOrder = [
      'id',
      'outputAmount',
      'changeAmount',
      'outputs',
      'changeOutputs',
      'fee',
      'timestamp',
      'expiration',
    ];

    return {
      displayOrder,
      id: tx.id,
      outputs,
      outputAmount: outputs[0].amount,
      changeOutputs: [], // account based does not use change outputs
      changeAmount: '0', // account base does not make change
      fee: params.feeInfo,
      timestamp: tx.validFrom,
      expiration: tx.validTo,
    };
  }
}
