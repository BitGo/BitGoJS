/**
 * @prettier
 */
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as request from 'superagent';
import { Eth2 as Eth2AccountLib } from '@bitgo/account-lib';
import BigNumber from 'bignumber.js';

import {
  BaseCoin,
  FeeEstimateOptions,
  KeyPair,
  ParsedTransaction,
  ParseTransactionOptions,
  VerifyAddressOptions,
  VerifyTransactionOptions,
  HalfSignedTransaction as BaseHalfSignedTransaction,
} from '../baseCoin';
import { BitGo } from '../../bitgo';
import { NodeCallback } from '../types';
import * as common from '../../common';

const co = Bluebird.coroutine;

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

export interface SignTransactionOptions extends SignFinalOptions {
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

interface FeeEstimate {
  gasLimitEstimate: number;
  feeEstimate: number;
}

export class Eth2 extends BaseCoin {
  static createInstance(bitgo: BitGo): BaseCoin {
    return new Eth2(bitgo);
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
    return Eth2AccountLib.KeyPair.isValidPub(pub);
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
   * Query Beaconscan for the balance of an address
   * @param address {String} the ETH address
   * @param callback
   * @returns {BigNumber} address balance
   */
  queryAddressBalance(address: string, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co(function*() {
      const result = yield self.recoveryBlockchainExplorerQuery({
        module: 'account',
        action: 'balance',
        address: address,
      });
      return new BigNumber(result.result, 10);
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   * @param params
   * - txPrebuild
   * - prv
   * @param callback
   * @returns {Bluebird<SignedTransaction>}
   */
  signTransaction(params: SignTransactionOptions): Bluebird<SignedTransaction> {
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
   * @param callback
   * @returns {*}
   */
  getAddressNonce(address: string, callback?: NodeCallback<number>): Bluebird<number> {
    const self = this;
    return co<number>(function*() {
      // Get nonce for backup key (should be 0)
      let nonce = 0;

      const result = yield self.recoveryBlockchainExplorerQuery({
        module: 'account',
        action: 'txlist',
        address,
      });
      const backupKeyTxList = result.result;
      if (backupKeyTxList.length > 0) {
        // Calculate last nonce used
        const outgoingTxs = backupKeyTxList.filter(tx => tx.from === address);
        nonce = outgoingTxs.length;
      }
      return nonce;
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param params
   * @param params.userKey {String} [encrypted] xprv
   * @param params.backupKey {String} [encrypted] xprv or xpub if the xprv is held by a KRS provider
   * @param params.walletPassphrase {String} used to decrypt userKey and backupKey
   * @param params.walletContractAddress {String} the ETH address of the wallet contract
   * @param params.recoveryDestination {String} target address to send recovered funds to
   * @param callback
   */
  recover(
    params: RecoverOptions,
    callback?: NodeCallback<RecoveryInfo | OfflineVaultTxInfo>
  ): Bluebird<RecoveryInfo | OfflineVaultTxInfo> {
    throw new Error('recover not implemented');
  }

  /**
   * Make a query to Etherscan for information such as balance, token balance, solidity calls
   * @param query {Object} key-value pairs of parameters to append after /api
   * @param callback
   * @returns {Object} response from Etherscan
   */
  recoveryBlockchainExplorerQuery(query: any, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co(function*() {
      const response = yield request.get(common.Environments[self.bitgo.getEnv()].eth2ExplorerBaseUrl).query(query);

      if (!response.ok) {
        throw new Error('could not reach BeaconScan');
      }
      return response.body;
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Generate BLS key pair
   *
   * @param seed - byte array to generate BLS key pair from
   * @returns {Object} object with generated pub and prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = new Eth2AccountLib.KeyPair();
    if (seed && Eth2AccountLib.KeyPair.isValidPrv(seed)) {
      const seedStr = '0x' + Buffer.from(seed).toString('hex');
      keyPair.recordKeysFromPrivateKey(seedStr);
    } else if (seed) {
      throw new Error('trying to generate keypair from invalid seed');
    }

    return {
      pub: keyPair.getKeys().pub,
      prv: keyPair.getKeys().prv || '',
    };
  }

  parseTransaction(
    params: ParseTransactionOptions,
    callback?: NodeCallback<ParsedTransaction>
  ): Bluebird<ParsedTransaction> {
    return Bluebird.resolve({}).asCallback(callback);
  }

  verifyAddress(params: VerifyAddressOptions): boolean {
    return true;
  }

  verifyTransaction(params: VerifyTransactionOptions, callback?: NodeCallback<boolean>): Bluebird<boolean> {
    return Bluebird.resolve(true).asCallback(callback);
  }
}
