/**
 * @prettier
 */
import debugLib from 'debug';
import { bip32 } from '@bitgo/utxo-lib';
import {
  BitGoBase,
  EthereumLibraryUnavailableError,
  Recipient,
  TransactionRecipient,
  TransactionPrebuild as BaseTransactionPrebuild,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, CoinFamily, EthereumNetwork as EthLikeNetwork } from '@bitgo/statics';
import type * as EthLikeTxLib from '@ethereumjs/tx';
import type * as EthLikeCommon from '@ethereumjs/common';

import { AbstractEthLikeCoin } from './abstractEthLikeCoin';

/**
 * The prebuilt hop transaction returned from the HSM
 */
interface HopPrebuild {
  tx: string;
  id: string;
  signature: string;
  paymentId: string;
  gasPrice: number;
  gasLimit: number;
  amount: number;
  recipient: string;
  nonce: number;
  userReqSig: string;
  gasPriceMax: number;
}

export interface TransactionPrebuild extends BaseTransactionPrebuild {
  hopTransaction?: HopPrebuild;
  buildParams: {
    recipients: Recipient[];
  };
  recipients: TransactionRecipient[];
  nextContractSequenceId: string;
  gasPrice: number;
  gasLimit: number;
  isBatch: boolean;
  coin: string;
  token?: string;
}

const debug = debugLib('bitgo:v2:ethlike');

export const optionalDeps = {
  get ethAbi() {
    try {
      return require('ethereumjs-abi');
    } catch (e) {
      debug('unable to load ethereumjs-abi:');
      debug(e.stack);
      throw new EthereumLibraryUnavailableError(`ethereumjs-abi`);
    }
  },

  get ethUtil() {
    try {
      return require('ethereumjs-util');
    } catch (e) {
      debug('unable to load ethereumjs-util:');
      debug(e.stack);
      throw new EthereumLibraryUnavailableError(`ethereumjs-util`);
    }
  },

  get EthTx(): typeof EthLikeTxLib {
    try {
      return require('@ethereumjs/tx');
    } catch (e) {
      debug('unable to load @ethereumjs/tx');
      debug(e.stack);
      throw new EthereumLibraryUnavailableError(`@ethereumjs/tx`);
    }
  },

  get EthCommon(): typeof EthLikeCommon {
    try {
      return require('@ethereumjs/common');
    } catch (e) {
      debug('unable to load @ethereumjs/common:');
      debug(e.stack);
      throw new EthereumLibraryUnavailableError(`@ethereumjs/common`);
    }
  },
};

export abstract class AbstractEthLikeNewCoins extends AbstractEthLikeCoin {
  protected readonly sendMethodName: 'sendMultiSig' | 'sendMultiSigToken';

  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  private static _ethLikeCoin: Readonly<StaticsBaseCoin>;

  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
    AbstractEthLikeNewCoins._ethLikeCoin = staticsCoin;
    this.sendMethodName = 'sendMultiSig';
  }

  readonly staticsCoin?: Readonly<StaticsBaseCoin>;

  getChain() {
    return this._staticsCoin.name;
  }

  /**
   * Get the base chain that the coin exists on.
   */
  getBaseChain() {
    return this.getChain();
  }

  getFamily(): CoinFamily {
    return this._staticsCoin.family;
  }

  getNetwork(): EthLikeNetwork | undefined {
    return this._staticsCoin?.network as EthLikeNetwork;
  }

  getFullName() {
    return this._staticsCoin.fullName;
  }

  getBaseFactor() {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  /** @inheritDoc */
  isEVM(): boolean {
    return true;
  }

  valuelessTransferAllowed(): boolean {
    return true;
  }

  /**
   * Evaluates whether an address string is valid for this coin
   * @param address
   */
  isValidAddress(address: string): boolean {
    return optionalDeps.ethUtil.isValidAddress(optionalDeps.ethUtil.addHexPrefix(address));
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPub(pub: string): boolean {
    try {
      return bip32.fromBase58(pub).isNeutered();
    } catch (e) {
      return false;
    }
  }

  /**
   * Flag for sending data along with transactions
   * @returns {boolean} True if okay to send tx data (ETH), false otherwise
   */
  transactionDataAllowed() {
    return true;
  }

  /**
   * Default gas price from platform
   * @returns {BigNumber}
   */
  getRecoveryGasPrice(): any {
    return new optionalDeps.ethUtil.BN('20000000000');
  }

  /**
   * Default gas limit from platform
   * @returns {BigNumber}
   */
  getRecoveryGasLimit(): any {
    return new optionalDeps.ethUtil.BN('500000');
  }

  /**
   * Default expire time for a contract call (1 week)
   * @returns {number} Time in seconds
   */
  getDefaultExpireTime(): number {
    return Math.floor(new Date().getTime() / 1000) + 60 * 60 * 24 * 7;
  }
}
