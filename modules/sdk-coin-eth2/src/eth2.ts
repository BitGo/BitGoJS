/**
 * @prettier
 */
import * as _ from 'lodash';
import * as ethUtil from 'ethereumjs-util';
import * as request from 'superagent';
import BigNumber from 'bignumber.js';

import {
  BaseCoin,
  BitGoBase,
  common,
  HalfSignedAccountTransaction as BaseHalfSignedTransaction,
  IBlsKeyPair,
  KeyIndices,
  MethodNotImplementedError,
  ParsedTransaction,
  ParseTransactionOptions,
  SignTransactionOptions as BaseSignTransactionOptions,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';

import { KeyPair as Eth2KeyPair } from './lib';

interface Recipient {
  address: string;
  amount: string;
  data?: string;
}

interface SignFinalOptions {
  txPrebuild: {
    gasPrice: string;
    gasLimit: string;
    recipients: Recipient[];
    halfSigned: {
      expireTime: number;
      contractSequenceId: number;
      backupKeyNonce?: number;
      signature: string;
    };
    nextContractSequenceId?: number;
    backupKeyNonce?: number;
  };
  signingKeyNonce: number;
  walletContractAddress: string;
  prv: string;
  recipients: Recipient[];
}

export interface SignTransactionOptions extends BaseSignTransactionOptions, SignFinalOptions {
  isLastSignature?: boolean;
  expireTime: number;
  sequenceId: number;
  gasLimit: number;
  gasPrice: number;
}

export interface HalfSignedTransaction extends BaseHalfSignedTransaction {
  halfSigned: {
    recipients: Recipient[];
    expireTime: number;
    contractSequenceId: number;
    sequenceId: number;
    txHex?: never;
  };
}

export interface FullySignedTransaction {
  txHex: string;
}

export type SignedTransaction = HalfSignedTransaction | FullySignedTransaction;

interface PrecreateBitGoOptions {
  enterprise?: string;
}

interface OfflineVaultTxInfo {
  nextContractSequenceId?: string;
  contractSequenceId?: string;
  tx: string;
  userKey: string;
  backupKey: string;
  coin: string;
  gasPrice: number;
  gasLimit: number;
  recipients: Recipient[];
  walletContractAddress: string;
  amount: string;
  backupKeyNonce: number;
}

export interface RecoverOptions {
  userKey: string;
  backupKey: string;
  walletPassphrase?: string;
  walletContractAddress: string;
  recoveryDestination: string;
}

export interface RecoveryInfo {
  id: string;
  tx: string;
  backupKey?: string;
  coin?: string;
}

export class Eth2 extends BaseCoin {
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Eth2(bitgo);
  }

  /** @inheritDoc */
  supportsBlsDkg(): boolean {
    return true;
  }

  /**
   * Returns the factor between the base unit and its smallest subdivison
   * @return {number}
   */
  getBaseFactor(): string {
    // 10^18
    return '1000000000000000000';
  }

  getChain(): string {
    return 'eth2';
  }

  getFamily(): string {
    return 'eth2';
  }

  getFullName(): string {
    return 'Ethereum 2.0';
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed() {
    // false until phase 2 of eth2.0 rolled out
    return false;
  }

  /**
   * Flag for sending data along with transactions
   * @returns {boolean} True if okay to send tx data (ETH), false otherwise
   */
  transactionDataAllowed() {
    // false until phase 2 of eth2.0 rolled out
    return false;
  }

  /**
   * Evaluates whether a address string is valid for this coin
   * @param address
   */
  isValidAddress(address: string): boolean {
    return this.isValidPub(address);
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPub(pub: string): boolean {
    return Eth2KeyPair.isValidPub(pub);
  }

  /**
   * Default gas price from platform
   * @returns {BigNumber}
   */
  getRecoveryGasPrice(): any {
    throw new Error('Method not yet implemented');
  }

  /**
   * Default gas limit from platform
   * @returns {BigNumber}
   */
  getRecoveryGasLimit(): any {
    throw new Error('Method not yet implemented');
  }

  /**
   * Specifies what key we will need for signing - ETH2 needs the backup, bitgo pubs.
   */
  keyIdsForSigning(): number[] {
    return [KeyIndices.USER, KeyIndices.BACKUP, KeyIndices.BITGO];
  }

  /**
   * Query Beaconscan for the balance of an address
   * @param address {String} the ETH address
   * @returns {BigNumber} address balance
   */
  async queryAddressBalance(address: string): Promise<BigNumber> {
    const result = await this.recoveryBlockchainExplorerQuery({
      module: 'account',
      action: 'balance',
      address: address,
    });
    return new BigNumber(result.result, 10);
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   * @param params
   * - txPrebuild
   * - prv
   * @returns {Promise<SignedTransaction>}
   */
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    throw new Error('Method not yet implemented');
  }

  /**
   * Ensure either enterprise or newFeeAddress is passed, to know whether to create new key or use enterprise key
   * @param params
   * @param params.enterprise {String} the enterprise id to associate with this key
   * @param params.newFeeAddress {Boolean} create a new fee address (enterprise not needed in this case)
   */
  preCreateBitGo(params: PrecreateBitGoOptions): void {
    // We always need params object, since either enterprise or newFeeAddress is required
    if (!_.isObject(params)) {
      throw new Error(`preCreateBitGo must be passed a params object. Got ${params} (type ${typeof params})`);
    }

    if (_.isUndefined(params.enterprise)) {
      throw new Error('expecting enterprise when adding BitGo key');
    }

    if (!_.isUndefined(params.enterprise) && !_.isString(params.enterprise)) {
      throw new Error(`enterprise should be a string - got ${params.enterprise} (type ${typeof params.enterprise})`);
    }
  }

  /**
   * Queries public block explorer to get the next ETH nonce that should be used for the given ETH address
   * @param address
   * @returns Promise<number>
   */
  async getAddressNonce(address: string): Promise<number> {
    // Get nonce for backup key (should be 0)
    let nonce = 0;

    const result = await this.recoveryBlockchainExplorerQuery({
      module: 'account',
      action: 'txlist',
      address,
    });
    const backupKeyTxList = result.result;
    if (backupKeyTxList.length > 0) {
      // Calculate last nonce used
      const outgoingTxs = backupKeyTxList.filter((tx) => tx.from === address);
      nonce = outgoingTxs.length;
    }
    return nonce;
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param params
   * @param params.userKey {String} [encrypted] xprv
   * @param params.backupKey {String} [encrypted] xprv or xpub if the xprv is held by a KRS provider
   * @param params.walletPassphrase {String} used to decrypt userKey and backupKey
   * @param params.walletContractAddress {String} the ETH address of the wallet contract
   * @param params.recoveryDestination {String} target address to send recovered funds to
   */
  recover(params: RecoverOptions): Promise<RecoveryInfo | OfflineVaultTxInfo> {
    throw new Error('recover not implemented');
  }

  /**
   * Make a query to Etherscan for information such as balance, token balance, solidity calls
   * @param query {Object} key-value pairs of parameters to append after /api
   * @returns {Object} response from Etherscan
   */
  async recoveryBlockchainExplorerQuery(query: any): Promise<any> {
    const response = await request.get(common.Environments[this.bitgo.getEnv()].eth2ExplorerBaseUrl).query(query);

    if (!response.ok) {
      throw new Error('could not reach BeaconScan');
    }
    return response.body;
  }

  /**
   * Generate BLS key pair
   *
   * @param seed - byte array to generate BLS key pair from
   * @returns {Object} object with generated pub and prv
   */
  generateKeyPair(seed?: Buffer): IBlsKeyPair {
    let keyPair = new Eth2KeyPair();
    if (seed && Eth2KeyPair.isValidPrv(seed)) {
      const seedStr = Buffer.from(seed).toString('hex');
      keyPair = new Eth2KeyPair({ prv: seedStr });
    } else if (seed) {
      throw new Error('trying to generate keypair from invalid seed');
    }

    const keys = keyPair.getKeys();
    return {
      pub: keys.publicShare,
      prv: keys.prv || '',
      secretShares: keys.secretShares || [],
      seed: keys.seed,
      chaincode: keys.chaincode || '',
    };
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
   * Sign message with private key
   *
   * @param key
   * @param message
   */
  async signMessage(key: { prv: string }, message: string): Promise<Buffer> {
    const keyPair = new Eth2KeyPair({ prv: key.prv });

    let messageToSign: Buffer = Buffer.from(message);
    if (Eth2KeyPair.isValidPub(message)) {
      // if we are doing a key signature, we should decode the message as a hex string
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore BG-34579: known compatibility issue with @types/ethereumjs-util
      messageToSign = Buffer.from(ethUtil.stripHexPrefix(message), 'hex');
    }

    const signedMessage = await keyPair.sign(messageToSign);
    return ethUtil.toBuffer(signedMessage);
  }

  aggregateShares(shares: { pubShares: string[]; prvShares: string[]; chaincodes: string[] }): IBlsKeyPair {
    const commonPub = Eth2KeyPair.aggregatePubkeys(shares.pubShares);
    const prv = Eth2KeyPair.aggregatePrvkeys(shares.prvShares);
    const commonChaincode = Eth2KeyPair.aggregateChaincodes(shares.chaincodes);

    return {
      pub: commonPub,
      prv,
      secretShares: shares.prvShares,
      chaincode: commonChaincode,
    };
  }
}
