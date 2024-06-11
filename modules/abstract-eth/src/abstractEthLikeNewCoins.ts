/**
 * @prettier
 */
import {
  AddressCoinSpecific,
  BitGoBase,
  BuildNftTransferDataOptions,
  common,
  ECDSA,
  Ecdsa,
  ECDSAMethodTypes,
  EthereumLibraryUnavailableError,
  FeeEstimateOptions,
  FullySignedTransaction,
  getIsUnsignedSweep,
  HalfSignedTransaction,
  hexToBigInt,
  InvalidAddressError,
  InvalidAddressVerificationObjectPropertyError,
  IWallet,
  KeyPair,
  ParsedTransaction,
  ParseTransactionOptions,
  PrebuildTransactionResult,
  PresignTransactionOptions as BasePresignTransactionOptions,
  Recipient,
  SignTransactionOptions as BaseSignTransactionOptions,
  TransactionParams,
  TransactionPrebuild as BaseTransactionPrebuild,
  TransactionRecipient,
  TypedData,
  UnexpectedAddressError,
  Util,
  VerifyAddressOptions as BaseVerifyAddressOptions,
  VerifyTransactionOptions,
  Wallet,
} from '@bitgo/sdk-core';
import { DklsDsg, DklsTypes, DklsUtils, EcdsaPaillierProof, EcdsaRangeProof, EcdsaTypes } from '@bitgo/sdk-lib-mpc';
import {
  BaseCoin as StaticsBaseCoin,
  CoinMap,
  coins,
  EthereumNetwork as EthLikeNetwork,
  ethGasConfigs,
} from '@bitgo/statics';
import { bip32 } from '@bitgo/utxo-lib';
import type * as EthLikeCommon from '@ethereumjs/common';
import type * as EthLikeTxLib from '@ethereumjs/tx';
import { FeeMarketEIP1559Transaction, Transaction as LegacyTransaction } from '@ethereumjs/tx';
import { SignTypedDataVersion, TypedDataUtils, TypedMessage } from '@metamask/eth-sig-util';
import { BigNumber } from 'bignumber.js';
import BN from 'bn.js';
import { randomBytes } from 'crypto';
import debugLib from 'debug';
import { addHexPrefix, stripHexPrefix } from 'ethereumjs-util';
import Keccak from 'keccak';
import _ from 'lodash';
import secp256k1 from 'secp256k1';

import { AbstractEthLikeCoin } from './abstractEthLikeCoin';
import { EthLikeToken } from './ethLikeToken';
import {
  calculateForwarderV1Address,
  ERC1155TransferBuilder,
  ERC721TransferBuilder,
  getCommon,
  getProxyInitcode,
  getToken,
  KeyPair as KeyPairLib,
  TransactionBuilder,
  TransferBuilder,
} from './lib';

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

/**
 * The extra parameters to send to platform build route for hop transactions
 */
interface HopParams {
  hopParams: {
    gasPriceMax: number;
    userReqSig: string;
    paymentId: string;
  };
  gasLimit: number;
}

export interface EIP1559 {
  maxPriorityFeePerGas: number;
  maxFeePerGas: number;
}

export interface ReplayProtectionOptions {
  chain: string | number;
  hardfork: string;
}

export interface TransactionPrebuild extends BaseTransactionPrebuild {
  hopTransaction?: HopPrebuild;
  buildParams: {
    recipients: Recipient[];
  };
  recipients: TransactionRecipient[];
  nextContractSequenceId: number;
  gasPrice: number;
  gasLimit: number;
  isBatch: boolean;
  coin: string;
  token?: string;
}

export interface SignFinalOptions {
  txPrebuild: {
    eip1559?: EIP1559;
    replayProtectionOptions?: ReplayProtectionOptions;
    gasPrice?: string;
    gasLimit?: string;
    recipients?: Recipient[];
    halfSigned?: {
      expireTime: number;
      contractSequenceId: number;
      backupKeyNonce?: number;
      signature: string;
      txHex?: string;
    };
    nextContractSequenceId?: number;
    hopTransaction?: string;
    backupKeyNonce?: number;
    isBatch?: boolean;
    txHex?: string;
    expireTime?: number;
  };
  signingKeyNonce?: number;
  walletContractAddress?: string;
  prv: string;
  recipients?: Recipient[];
  common?: EthLikeCommon.default;
}

export interface SignTransactionOptions extends BaseSignTransactionOptions, SignFinalOptions {
  isLastSignature?: boolean;
  expireTime?: number;
  sequenceId?: number;
  gasLimit?: number;
  gasPrice?: number;
  custodianTransactionId?: string;
  common?: EthLikeCommon.default;
}

export type SignedTransaction = HalfSignedTransaction | FullySignedTransaction;

export interface FeesUsed {
  gasPrice: number;
  gasLimit: number;
}

interface PrecreateBitGoOptions {
  enterprise?: string;
  newFeeAddress?: string;
}

export interface OfflineVaultTxInfo {
  nextContractSequenceId?: string;
  contractSequenceId?: string;
  tx?: string;
  txHex?: string;
  userKey?: string;
  backupKey?: string;
  coin: string;
  gasPrice: number;
  gasLimit: number;
  recipients: Recipient[];
  walletContractAddress: string;
  amount: string;
  backupKeyNonce: number;
  // For Eth Specific Coins
  eip1559?: EIP1559;
  replayProtectionOptions?: ReplayProtectionOptions;
  // For Hot Wallet EvmBasedCrossChainRecovery Specific
  halfSigned?: HalfSignedTransaction;
  feesUsed?: FeesUsed;
  isEvmBasedCrossChainRecovery?: boolean;
}

interface UnformattedTxInfo {
  recipient: Recipient;
}

export interface RecoverOptions {
  userKey: string;
  backupKey: string;
  walletPassphrase?: string;
  walletContractAddress: string; // use this as walletBaseAddress for TSS
  recoveryDestination: string;
  krsProvider?: string;
  gasPrice?: number;
  gasLimit?: number;
  eip1559?: EIP1559;
  replayProtectionOptions?: ReplayProtectionOptions;
  isTss?: boolean;
  bitgoFeeAddress?: string;
  bitgoDestinationAddress?: string;
  tokenContractAddress?: string;
  intendedChain?: string;
  common?: EthLikeCommon.default;
}

export type GetBatchExecutionInfoRT = {
  values: [string[], string[]];
  totalAmount: string;
};

export interface BuildTransactionParams {
  to: string;
  nonce?: number;
  value: number;
  data?: Buffer;
  gasPrice?: number;
  gasLimit?: number;
  eip1559?: EIP1559;
  replayProtectionOptions?: ReplayProtectionOptions;
}

export interface RecoveryInfo {
  id: string;
  tx: string;
  backupKey?: string;
  coin?: string;
}

export interface RecoverTokenTransaction {
  halfSigned: {
    recipient: Recipient;
    expireTime: number;
    contractSequenceId: number;
    operationHash: string;
    signature: string;
    gasLimit: number;
    gasPrice: number;
    tokenContractAddress: string;
    walletId: string;
  };
}

export interface RecoverTokenOptions {
  tokenContractAddress: string;
  wallet: Wallet;
  recipient: string;
  broadcast?: boolean;
  walletPassphrase?: string;
  prv?: string;
}

export interface GetSendMethodArgsOptions {
  recipient: Recipient;
  expireTime: number;
  contractSequenceId: number;
  signature: string;
}

export interface SendMethodArgs {
  name: string;
  type: string;
  value: any;
}

interface HopTransactionBuildOptions {
  wallet: Wallet;
  recipients: Recipient[];
  walletPassphrase: string;
}

export interface BuildOptions {
  hop?: boolean;
  wallet?: Wallet;
  recipients?: Recipient[];
  walletPassphrase?: string;
  [index: string]: unknown;
}

interface FeeEstimate {
  gasLimitEstimate: number;
  feeEstimate: number;
}

// TODO: This interface will need to be updated for the new fee model introduced in the London Hard Fork
interface EthTransactionParams extends TransactionParams {
  gasPrice?: number;
  gasLimit?: number;
  hopParams?: HopParams;
  hop?: boolean;
  prebuildTx?: PrebuildTransactionResult;
}

interface VerifyEthTransactionOptions extends VerifyTransactionOptions {
  txPrebuild: TransactionPrebuild;
  txParams: EthTransactionParams;
}

interface PresignTransactionOptions extends TransactionPrebuild, BasePresignTransactionOptions {
  wallet: Wallet;
}

interface EthAddressCoinSpecifics extends AddressCoinSpecific {
  forwarderVersion: number;
  salt?: string;
}

export interface VerifyEthAddressOptions extends BaseVerifyAddressOptions {
  baseAddress: string;
  coinSpecific: EthAddressCoinSpecifics;
  forwarderVersion: number;
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
  static hopTransactionSalt = 'bitgoHopAddressRequestSalt';
  protected readonly sendMethodName: 'sendMultiSig' | 'sendMultiSigToken';

  readonly staticsCoin?: Readonly<StaticsBaseCoin>;

  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this.staticsCoin = staticsCoin;
    this.sendMethodName = 'sendMultiSig';
  }

  /**
   * Method to return the coin's network object
   * @returns {EthLikeNetwork | undefined}
   */
  getNetwork(): EthLikeNetwork | undefined {
    return this.staticsCoin?.network as EthLikeNetwork;
  }

  /**
   * Evaluates whether an address string is valid for this coin
   * @param {string} address
   * @returns {boolean} True if address is the valid ethlike adderss
   */
  isValidAddress(address: string): boolean {
    return optionalDeps.ethUtil.isValidAddress(optionalDeps.ethUtil.addHexPrefix(address));
  }

  /**
   * Flag for sending data along with transactions
   * @returns {boolean} True if okay to send tx data (ETH), false otherwise
   */
  transactionDataAllowed() {
    return true;
  }

  /**
   * Default expire time for a contract call (1 week)
   * @returns {number} Time in seconds
   */
  getDefaultExpireTime(): number {
    return Math.floor(new Date().getTime() / 1000) + 60 * 60 * 24 * 7;
  }

  /**
   * Method to get the custom chain common object based on params from recovery
   * @param {number} chainId - the chain id of the custom chain
   * @returns {EthLikeCommon.default}
   */
  static getCustomChainCommon(chainId: number): EthLikeCommon.default {
    const coinName = CoinMap.coinNameFromChainId(chainId);
    const coin = coins.get(coinName);
    const ethLikeCommon = getCommon(coin.network as EthLikeNetwork);
    return ethLikeCommon;
  }

  /**
   * Gets correct Eth Common object based on params from either recovery or tx building
   * @param {EIP1559} eip1559 - configs that specify whether we should construct an eip1559 tx
   * @param {ReplayProtectionOptions} replayProtectionOptions - check if chain id supports replay protection
   * @returns {EthLikeCommon.default}
   */
  private static getEthLikeCommon(
    eip1559?: EIP1559,
    replayProtectionOptions?: ReplayProtectionOptions
  ): EthLikeCommon.default {
    // if eip1559 params are specified, default to london hardfork, otherwise,
    // default to tangerine whistle to avoid replay protection issues
    const defaultHardfork = !!eip1559 ? 'london' : optionalDeps.EthCommon.Hardfork.TangerineWhistle;
    const ethLikeCommon = AbstractEthLikeNewCoins.getCustomChainCommon(replayProtectionOptions?.chain as number);
    ethLikeCommon.setHardfork(replayProtectionOptions?.hardfork ?? defaultHardfork);
    return ethLikeCommon;
  }

  /**
   * Method to build the tx object
   * @param {BuildTransactionParams} params - params to build transaction
   * @returns {EthLikeTxLib.FeeMarketEIP1559Transaction | EthLikeTxLib.Transaction}
   */
  static buildTransaction(
    params: BuildTransactionParams
  ): EthLikeTxLib.FeeMarketEIP1559Transaction | EthLikeTxLib.Transaction {
    // if eip1559 params are specified, default to london hardfork, otherwise,
    // default to tangerine whistle to avoid replay protection issues
    const ethLikeCommon = AbstractEthLikeNewCoins.getEthLikeCommon(params.eip1559, params.replayProtectionOptions);
    const baseParams = {
      to: params.to,
      nonce: params.nonce,
      value: params.value,
      data: params.data,
      gasLimit: new optionalDeps.ethUtil.BN(params.gasLimit),
    };

    const unsignedEthTx = !!params.eip1559
      ? optionalDeps.EthTx.FeeMarketEIP1559Transaction.fromTxData(
          {
            ...baseParams,
            maxFeePerGas: new optionalDeps.ethUtil.BN(params.eip1559.maxFeePerGas),
            maxPriorityFeePerGas: new optionalDeps.ethUtil.BN(params.eip1559.maxPriorityFeePerGas),
          },
          { common: ethLikeCommon }
        )
      : optionalDeps.EthTx.Transaction.fromTxData(
          {
            ...baseParams,
            gasPrice: new optionalDeps.ethUtil.BN(params.gasPrice),
          },
          { common: ethLikeCommon }
        );

    return unsignedEthTx;
  }

  /**
   * Query explorer for the balance of an address
   * @param {String} address - the ETHLike address
   * @returns {BigNumber} address balance
   */
  async queryAddressBalance(address: string): Promise<any> {
    const result = await this.recoveryBlockchainExplorerQuery({
      module: 'account',
      action: 'balance',
      address: address,
    });
    // throw if the result does not exist or the result is not a valid number
    if (!result || !result.result || isNaN(result.result)) {
      throw new Error(`Could not obtain address balance for ${address} from the explorer, got: ${result.result}`);
    }
    return new optionalDeps.ethUtil.BN(result.result, 10);
  }

  /**
   * @param {Recipient[]} recipients - the recipients of the transaction
   * @param {number} expireTime - the expire time of the transaction
   * @param {number} contractSequenceId - the contract sequence id of the transaction
   * @returns {string}
   */
  getOperationSha3ForExecuteAndConfirm(
    recipients: Recipient[],
    expireTime: number,
    contractSequenceId: number
  ): string {
    if (!recipients || !Array.isArray(recipients)) {
      throw new Error('expecting array of recipients');
    }

    // Right now we only support 1 recipient
    if (recipients.length !== 1) {
      throw new Error('must send to exactly 1 recipient');
    }

    if (!_.isNumber(expireTime)) {
      throw new Error('expireTime must be number of seconds since epoch');
    }

    if (!_.isNumber(contractSequenceId)) {
      throw new Error('contractSequenceId must be number');
    }

    // Check inputs
    recipients.forEach(function (recipient) {
      if (
        !_.isString(recipient.address) ||
        !optionalDeps.ethUtil.isValidAddress(optionalDeps.ethUtil.addHexPrefix(recipient.address))
      ) {
        throw new Error('Invalid address: ' + recipient.address);
      }

      let amount: BigNumber;
      try {
        amount = new BigNumber(recipient.amount);
      } catch (e) {
        throw new Error('Invalid amount for: ' + recipient.address + ' - should be numeric');
      }

      recipient.amount = amount.toFixed(0);

      if (recipient.data && !_.isString(recipient.data)) {
        throw new Error('Data for recipient ' + recipient.address + ' - should be of type hex string');
      }
    });

    const recipient = recipients[0];
    return optionalDeps.ethUtil.bufferToHex(
      optionalDeps.ethAbi.soliditySHA3(...this.getOperation(recipient, expireTime, contractSequenceId))
    );
  }

  /**
   * Get transfer operation for coin
   * @param {Recipient} recipient - recipient info
   * @param {number} expireTime - expiry time
   * @param {number} contractSequenceId - sequence id
   * @returns {Array} operation array
   */
  getOperation(recipient: Recipient, expireTime: number, contractSequenceId: number): (string | Buffer)[][] {
    const network = this.getNetwork() as EthLikeNetwork;
    return [
      ['string', 'address', 'uint', 'bytes', 'uint', 'uint'],
      [
        network.nativeCoinOperationHashPrefix,
        new optionalDeps.ethUtil.BN(optionalDeps.ethUtil.stripHexPrefix(recipient.address), 16),
        recipient.amount,
        Buffer.from(optionalDeps.ethUtil.stripHexPrefix(optionalDeps.ethUtil.padToEven(recipient.data || '')), 'hex'),
        expireTime,
        contractSequenceId,
      ],
    ];
  }

  /**
   * Queries the contract (via explorer API) for the next sequence ID
   * @param {String} address - address of the contract
   * @returns {Promise<Number>} sequence ID
   */
  async querySequenceId(address: string): Promise<number> {
    // Get sequence ID using contract call
    const sequenceIdMethodSignature = optionalDeps.ethAbi.methodID('getNextSequenceId', []);
    const sequenceIdArgs = optionalDeps.ethAbi.rawEncode([], []);
    const sequenceIdData = Buffer.concat([sequenceIdMethodSignature, sequenceIdArgs]).toString('hex');
    const result = await this.recoveryBlockchainExplorerQuery({
      module: 'proxy',
      action: 'eth_call',
      to: address,
      data: sequenceIdData,
      tag: 'latest',
    });
    if (!result || !result.result) {
      throw new Error('Could not obtain sequence ID from explorer, got: ' + result.result);
    }
    const sequenceIdHex = result.result;
    return new optionalDeps.ethUtil.BN(sequenceIdHex.slice(2), 16).toNumber();
  }

  /**
   * Recover an unsupported token from a BitGo multisig wallet
   * This builds a half-signed transaction, for which there will be an admin route to co-sign and broadcast. Optionally
   * the user can set params.broadcast = true and the half-signed tx will be sent to BitGo for cosigning and broadcasting
   * @param {RecoverTokenOptions} params
   * @param {Wallet} params.wallet - the wallet to recover the token from
   * @param {string} params.tokenContractAddress - the contract address of the unsupported token
   * @param {string} params.recipient - the destination address recovered tokens should be sent to
   * @param {string} params.walletPassphrase - the wallet passphrase
   * @param {string} params.prv - the xprv
   * @param {boolean} params.broadcast - if true, we will automatically submit the half-signed tx to BitGo for cosigning and broadcasting
   * @returns {Promise<RecoverTokenTransaction>}
   */
  async recoverToken(params: RecoverTokenOptions): Promise<RecoverTokenTransaction> {
    const network = this.getNetwork() as EthLikeNetwork;
    if (!_.isObject(params)) {
      throw new Error(`recoverToken must be passed a params object. Got ${params} (type ${typeof params})`);
    }

    if (_.isUndefined(params.tokenContractAddress) || !_.isString(params.tokenContractAddress)) {
      throw new Error(
        `tokenContractAddress must be a string, got ${
          params.tokenContractAddress
        } (type ${typeof params.tokenContractAddress})`
      );
    }

    if (!this.isValidAddress(params.tokenContractAddress)) {
      throw new Error('tokenContractAddress not a valid address');
    }

    if (_.isUndefined(params.wallet) || !(params.wallet instanceof Wallet)) {
      throw new Error(`wallet must be a wallet instance, got ${params.wallet} (type ${typeof params.wallet})`);
    }

    if (_.isUndefined(params.recipient) || !_.isString(params.recipient)) {
      throw new Error(`recipient must be a string, got ${params.recipient} (type ${typeof params.recipient})`);
    }

    if (!this.isValidAddress(params.recipient)) {
      throw new Error('recipient not a valid address');
    }

    if (!optionalDeps.ethUtil.bufferToHex || !optionalDeps.ethAbi.soliditySHA3) {
      throw new Error('ethereum not fully supported in this environment');
    }

    // Get token balance from external API
    const coinSpecific = params.wallet.coinSpecific();
    if (!coinSpecific || !_.isString(coinSpecific.baseAddress)) {
      throw new Error('missing required coin specific property baseAddress');
    }
    const recoveryAmount = await this.queryAddressTokenBalance(params.tokenContractAddress, coinSpecific.baseAddress);

    if (params.broadcast) {
      // We're going to create a normal ETH transaction that sends an amount of 0 ETH to the
      // tokenContractAddress and encode the unsupported-token-send data in the data field
      // #tricksy
      const sendMethodArgs = [
        {
          name: '_to',
          type: 'address',
          value: params.recipient,
        },
        {
          name: '_value',
          type: 'uint256',
          value: recoveryAmount.toString(10),
        },
      ];
      const methodSignature = optionalDeps.ethAbi.methodID('transfer', _.map(sendMethodArgs, 'type'));
      const encodedArgs = optionalDeps.ethAbi.rawEncode(_.map(sendMethodArgs, 'type'), _.map(sendMethodArgs, 'value'));
      const sendData = Buffer.concat([methodSignature, encodedArgs]);

      const broadcastParams: any = {
        address: params.tokenContractAddress,
        amount: '0',
        data: sendData.toString('hex'),
      };

      if (params.walletPassphrase) {
        broadcastParams.walletPassphrase = params.walletPassphrase;
      } else if (params.prv) {
        broadcastParams.prv = params.prv;
      }

      return await params.wallet.send(broadcastParams);
    }

    const recipient = {
      address: params.recipient,
      amount: recoveryAmount.toString(10),
    };

    // This signature will be valid for one week
    const expireTime = Math.floor(new Date().getTime() / 1000) + 60 * 60 * 24 * 7;

    // Get sequence ID. We do this by building a 'fake' eth transaction, so the platform will increment and return us the new sequence id
    // This _does_ require the user to have a non-zero wallet balance
    const { nextContractSequenceId, gasPrice, gasLimit } = (await params.wallet.prebuildTransaction({
      recipients: [
        {
          address: params.recipient,
          amount: '1',
        },
      ],
    })) as any;

    // these recoveries need to be processed by support, but if the customer sends any transactions before recovery is
    // complete the sequence ID will be invalid. artificially inflate the sequence ID to allow more time for processing
    const safeSequenceId = nextContractSequenceId + 1000;

    // Build sendData for ethereum tx
    const operationTypes = ['string', 'address', 'uint', 'address', 'uint', 'uint'];
    const operationArgs = [
      // Token operation has prefix has been added here so that ether operation hashes, signatures cannot be re-used for tokenSending
      network.tokenOperationHashPrefix,
      new optionalDeps.ethUtil.BN(optionalDeps.ethUtil.stripHexPrefix(recipient.address), 16),
      recipient.amount,
      new optionalDeps.ethUtil.BN(optionalDeps.ethUtil.stripHexPrefix(params.tokenContractAddress), 16),
      expireTime,
      safeSequenceId,
    ];

    const operationHash = optionalDeps.ethUtil.bufferToHex(
      optionalDeps.ethAbi.soliditySHA3(operationTypes, operationArgs)
    );

    const userPrv = await params.wallet.getPrv({
      prv: params.prv,
      walletPassphrase: params.walletPassphrase,
    });

    const signature = Util.ethSignMsgHash(operationHash, Util.xprvToEthPrivateKey(userPrv));

    return {
      halfSigned: {
        recipient: recipient,
        expireTime: expireTime,
        contractSequenceId: safeSequenceId,
        operationHash: operationHash,
        signature: signature,
        gasLimit: gasLimit,
        gasPrice: gasPrice,
        tokenContractAddress: params.tokenContractAddress,
        walletId: params.wallet.id(),
      },
    };
  }

  /**
   * Ensure either enterprise or newFeeAddress is passed, to know whether to create new key or use enterprise key
   * @param {PrecreateBitGoOptions} params
   * @param {string} params.enterprise {String} the enterprise id to associate with this key
   * @param {string} params.newFeeAddress {Boolean} create a new fee address (enterprise not needed in this case)
   * @returns {void}
   */
  preCreateBitGo(params: PrecreateBitGoOptions): void {
    // We always need params object, since either enterprise or newFeeAddress is required
    if (!_.isObject(params)) {
      throw new Error(`preCreateBitGo must be passed a params object. Got ${params} (type ${typeof params})`);
    }

    if (_.isUndefined(params.enterprise) && _.isUndefined(params.newFeeAddress)) {
      throw new Error(
        'expecting enterprise when adding BitGo key. If you want to create a new ETH bitgo key, set the newFeeAddress parameter to true.'
      );
    }

    // Check whether key should be an enterprise key or a BitGo key for a new fee address
    if (!_.isUndefined(params.enterprise) && !_.isUndefined(params.newFeeAddress)) {
      throw new Error(`Incompatible arguments - cannot pass both enterprise and newFeeAddress parameter.`);
    }

    if (!_.isUndefined(params.enterprise) && !_.isString(params.enterprise)) {
      throw new Error(`enterprise should be a string - got ${params.enterprise} (type ${typeof params.enterprise})`);
    }

    if (!_.isUndefined(params.newFeeAddress) && !_.isBoolean(params.newFeeAddress)) {
      throw new Error(
        `newFeeAddress should be a boolean - got ${params.newFeeAddress} (type ${typeof params.newFeeAddress})`
      );
    }
  }

  /**
   * Queries public block explorer to get the next ETHLike coin's nonce that should be used for the given ETH address
   * @param {string} address
   * @returns {Promise<number>}
   */
  async getAddressNonce(address: string): Promise<number> {
    // Get nonce for backup key (should be 0)
    let nonce = 0;

    const result = await this.recoveryBlockchainExplorerQuery({
      module: 'account',
      action: 'txlist',
      address,
    });
    if (!result || !Array.isArray(result.result)) {
      throw new Error('Unable to find next nonce from Etherscan, got: ' + JSON.stringify(result));
    }
    const backupKeyTxList = result.result;
    if (backupKeyTxList.length > 0) {
      // Calculate last nonce used
      const outgoingTxs = backupKeyTxList.filter((tx) => tx.from === address);
      nonce = outgoingTxs.length;
    }
    return nonce;
  }

  /**
   * Helper function for recover()
   * This transforms the unsigned transaction information into a format the BitGo offline vault expects
   * @param {UnformattedTxInfo} txInfo - tx info
   * @param {EthLikeTxLib.Transaction | EthLikeTxLib.FeeMarketEIP1559Transaction} ethTx - the ethereumjs tx object
   * @param {string} userKey - the user's key
   * @param {string} backupKey - the backup key
   * @param {Buffer} gasPrice - gas price for the tx
   * @param {number} gasLimit - gas limit for the tx
   * @param {EIP1559} eip1559 - eip1559 params
   * @param {ReplayProtectionOptions} replayProtectionOptions - replay protection options
   * @returns {Promise<OfflineVaultTxInfo>}
   */
  async formatForOfflineVault(
    txInfo: UnformattedTxInfo,
    ethTx: EthLikeTxLib.Transaction | EthLikeTxLib.FeeMarketEIP1559Transaction,
    userKey: string,
    backupKey: string,
    gasPrice: Buffer,
    gasLimit: number,
    eip1559?: EIP1559,
    replayProtectionOptions?: ReplayProtectionOptions
  ): Promise<OfflineVaultTxInfo> {
    if (!ethTx.to) {
      throw new Error('Eth tx must have a `to` address');
    }
    const backupHDNode = bip32.fromBase58(backupKey);
    const backupSigningKey = backupHDNode.publicKey;
    const response: OfflineVaultTxInfo = {
      tx: ethTx.serialize().toString('hex'),
      userKey,
      backupKey,
      coin: this.getChain(),
      gasPrice: optionalDeps.ethUtil.bufferToInt(gasPrice).toFixed(),
      gasLimit,
      recipients: [txInfo.recipient],
      walletContractAddress: ethTx.to.toString(),
      amount: txInfo.recipient.amount as string,
      backupKeyNonce: await this.getAddressNonce(
        `0x${optionalDeps.ethUtil.publicToAddress(backupSigningKey, true).toString('hex')}`
      ),
      eip1559,
      replayProtectionOptions,
    };
    _.extend(response, txInfo);
    response.nextContractSequenceId = response.contractSequenceId;
    return response;
  }

  /**
   * Helper function for recover()
   * This transforms the unsigned transaction information into a format the BitGo offline vault expects
   * @param {UnformattedTxInfo} txInfo - tx info
   * @param {EthLikeTxLib.Transaction | EthLikeTxLib.FeeMarketEIP1559Transaction} ethTx - the ethereumjs tx object
   * @param {string} userKey - the user's key
   * @param {string} backupKey - the backup key
   * @param {Buffer} gasPrice - gas price for the tx
   * @param {number} gasLimit - gas limit for the tx
   * @param {number} backupKeyNonce - the nonce of the backup key address
   * @param {EIP1559} eip1559 - eip1559 params
   * @param {ReplayProtectionOptions} replayProtectionOptions - replay protection options
   * @returns {Promise<OfflineVaultTxInfo>}
   */
  formatForOfflineVaultTSS(
    txInfo: UnformattedTxInfo,
    ethTx: EthLikeTxLib.Transaction | EthLikeTxLib.FeeMarketEIP1559Transaction,
    userKey: string,
    backupKey: string,
    gasPrice: Buffer,
    gasLimit: number,
    backupKeyNonce: number,
    eip1559?: EIP1559,
    replayProtectionOptions?: ReplayProtectionOptions
  ): OfflineVaultTxInfo {
    if (!ethTx.to) {
      throw new Error('Eth tx must have a `to` address');
    }
    const response: OfflineVaultTxInfo = {
      tx: ethTx.serialize().toString('hex'),
      txHex: ethTx.getMessageToSign(false).toString(),
      userKey,
      backupKey,
      coin: this.getChain(),
      gasPrice: optionalDeps.ethUtil.bufferToInt(gasPrice).toFixed(),
      gasLimit,
      recipients: [txInfo.recipient],
      walletContractAddress: ethTx.to.toString(),
      amount: txInfo.recipient.amount as string,
      backupKeyNonce: backupKeyNonce,
      eip1559,
      replayProtectionOptions,
    };
    _.extend(response, txInfo);
    return response;
  }

  /**
   * Check whether the gas price passed in by user are within our max and min bounds
   * If they are not set, set them to the defaults
   * @param {number} userGasPrice - user defined gas price
   * @returns {number} the gas price to use for this transaction
   */
  setGasPrice(userGasPrice?: number): number {
    if (!userGasPrice) {
      return ethGasConfigs.defaultGasPrice;
    }

    const gasPriceMax = ethGasConfigs.maximumGasPrice;
    const gasPriceMin = ethGasConfigs.minimumGasPrice;
    if (userGasPrice < gasPriceMin || userGasPrice > gasPriceMax) {
      throw new Error(`Gas price must be between ${gasPriceMin} and ${gasPriceMax}`);
    }
    return userGasPrice;
  }
  /**
   * Check whether gas limit passed in by user are within our max and min bounds
   * If they are not set, set them to the defaults
   * @param {number} userGasLimit user defined gas limit
   * @returns {number} the gas limit to use for this transaction
   */
  setGasLimit(userGasLimit?: number): number {
    if (!userGasLimit) {
      return ethGasConfigs.defaultGasLimit;
    }
    const gasLimitMax = ethGasConfigs.maximumGasLimit;
    const gasLimitMin = ethGasConfigs.minimumGasLimit;
    if (userGasLimit < gasLimitMin || userGasLimit > gasLimitMax) {
      throw new Error(`Gas limit must be between ${gasLimitMin} and ${gasLimitMax}`);
    }
    return userGasLimit;
  }

  /**
   * Helper function for signTransaction for the rare case that SDK is doing the second signature
   * Note: we are expecting this to be called from the offline vault
   * @param {SignFinalOptions.txPrebuild} params.txPrebuild
   * @param {string} params.prv
   * @returns {{txHex: string}}
   */
  async signFinalEthLike(params: SignFinalOptions): Promise<FullySignedTransaction> {
    const signingKey = new KeyPairLib({ prv: params.prv }).getKeys().prv;
    if (_.isUndefined(signingKey)) {
      throw new Error('missing private key');
    }
    const txBuilder = this.getTransactionBuilder(params.common);
    try {
      txBuilder.from(params.txPrebuild.halfSigned?.txHex);
    } catch (e) {
      throw new Error('invalid half-signed transaction');
    }
    txBuilder.sign({ key: signingKey });
    const tx = await txBuilder.build();
    return {
      txHex: tx.toBroadcastFormat(),
    };
  }

  /**
   * Assemble half-sign prebuilt transaction
   * @param {SignTransactionOptions} params
   */
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    // Normally the SDK provides the first signature for an EthLike tx, but occasionally it provides the second and final one.
    if (params.isLastSignature) {
      // In this case when we're doing the second (final) signature, the logic is different.
      return await this.signFinalEthLike(params);
    }
    const txBuilder = this.getTransactionBuilder(params.common);
    txBuilder.from(params.txPrebuild.txHex);
    txBuilder
      .transfer()
      .coin(this.staticsCoin?.name as string)
      .key(new KeyPairLib({ prv: params.prv }).getKeys().prv!);
    const transaction = await txBuilder.build();

    const recipients = transaction.outputs.map((output) => ({ address: output.address, amount: output.value }));

    const txParams = {
      eip1559: params.txPrebuild.eip1559,
      txHex: transaction.toBroadcastFormat(),
      recipients: recipients,
      expiration: params.txPrebuild.expireTime,
      hopTransaction: params.txPrebuild.hopTransaction,
      custodianTransactionId: params.custodianTransactionId,
      expireTime: params.expireTime,
      contractSequenceId: params.txPrebuild.nextContractSequenceId as number,
      sequenceId: params.sequenceId,
    };

    return { halfSigned: txParams };
  }

  /**
   * Method to validate recovery params
   * @param {RecoverOptions} params
   * @returns {void}
   */
  validateRecoveryParams(params: RecoverOptions): void {
    if (_.isUndefined(params.userKey)) {
      throw new Error('missing userKey');
    }

    if (_.isUndefined(params.backupKey)) {
      throw new Error('missing backupKey');
    }

    if (_.isUndefined(params.walletPassphrase) && !params.userKey.startsWith('xpub') && !params.isTss) {
      throw new Error('missing wallet passphrase');
    }

    if (_.isUndefined(params.walletContractAddress) || !this.isValidAddress(params.walletContractAddress)) {
      throw new Error('invalid walletContractAddress');
    }

    if (_.isUndefined(params.recoveryDestination) || !this.isValidAddress(params.recoveryDestination)) {
      throw new Error('invalid recoveryDestination');
    }
  }

  /**
   * Method to sign tss recovery transaction
   * @param {ECDSA.KeyCombined} userKeyCombined
   * @param {ECDSA.KeyCombined} backupKeyCombined
   * @param {string} txHex
   * @param {Object} options
   * @param {EcdsaTypes.SerializedNtilde} options.rangeProofChallenge
   * @returns {Promise<ECDSAMethodTypes.Signature>}
   */
  private async signRecoveryTSS(
    userKeyCombined: ECDSA.KeyCombined,
    backupKeyCombined: ECDSA.KeyCombined,
    txHex: string,
    {
      rangeProofChallenge,
    }: {
      rangeProofChallenge?: EcdsaTypes.SerializedNtilde;
    } = {}
  ): Promise<ECDSAMethodTypes.Signature> {
    if (!userKeyCombined || !backupKeyCombined) {
      throw new Error('Missing key combined shares for user or backup');
    }

    const MPC = new Ecdsa();
    const signerOneIndex = userKeyCombined.xShare.i;
    const signerTwoIndex = backupKeyCombined.xShare.i;

    rangeProofChallenge =
      rangeProofChallenge ?? EcdsaTypes.serializeNtildeWithProofs(await EcdsaRangeProof.generateNtilde());

    const userToBackupPaillierChallenge = await EcdsaPaillierProof.generateP(
      hexToBigInt(userKeyCombined.yShares[signerTwoIndex].n)
    );
    const backupToUserPaillierChallenge = await EcdsaPaillierProof.generateP(
      hexToBigInt(backupKeyCombined.yShares[signerOneIndex].n)
    );

    const userXShare = MPC.appendChallenge(
      userKeyCombined.xShare,
      rangeProofChallenge,
      EcdsaTypes.serializePaillierChallenge({ p: userToBackupPaillierChallenge })
    );
    const userYShare = MPC.appendChallenge(
      userKeyCombined.yShares[signerTwoIndex],
      rangeProofChallenge,
      EcdsaTypes.serializePaillierChallenge({ p: backupToUserPaillierChallenge })
    );
    const backupXShare = MPC.appendChallenge(
      backupKeyCombined.xShare,
      rangeProofChallenge,
      EcdsaTypes.serializePaillierChallenge({ p: backupToUserPaillierChallenge })
    );
    const backupYShare = MPC.appendChallenge(
      backupKeyCombined.yShares[signerOneIndex],
      rangeProofChallenge,
      EcdsaTypes.serializePaillierChallenge({ p: userToBackupPaillierChallenge })
    );

    const signShares: ECDSA.SignShareRT = await MPC.signShare(userXShare, userYShare);

    const signConvertS21 = await MPC.signConvertStep1({
      xShare: backupXShare,
      yShare: backupYShare, // YShare corresponding to the other participant signerOne
      kShare: signShares.kShare,
    });
    const signConvertS12 = await MPC.signConvertStep2({
      aShare: signConvertS21.aShare,
      wShare: signShares.wShare,
    });
    const signConvertS21_2 = await MPC.signConvertStep3({
      muShare: signConvertS12.muShare,
      bShare: signConvertS21.bShare,
    });

    const [signCombineOne, signCombineTwo] = [
      MPC.signCombine({
        gShare: signConvertS12.gShare,
        signIndex: {
          i: signConvertS12.muShare.i,
          j: signConvertS12.muShare.j,
        },
      }),
      MPC.signCombine({
        gShare: signConvertS21_2.gShare,
        signIndex: {
          i: signConvertS21_2.signIndex.i,
          j: signConvertS21_2.signIndex.j,
        },
      }),
    ];

    const MESSAGE = Buffer.from(txHex, 'hex');

    const [signA, signB] = [
      MPC.sign(MESSAGE, signCombineOne.oShare, signCombineTwo.dShare, Keccak('keccak256')),
      MPC.sign(MESSAGE, signCombineTwo.oShare, signCombineOne.dShare, Keccak('keccak256')),
    ];

    return MPC.constructSignature([signA, signB]);
  }

  /**
   * Helper which combines key shares of user and backup
   * @param {string} userPublicOrPrivateKeyShare
   * @param {string} backupPrivateOrPublicKeyShare
   * @param {string} walletPassphrase
   * @returns {[ECDSAMethodTypes.KeyCombined, ECDSAMethodTypes.KeyCombined]}
   */
  private getKeyCombinedFromTssKeyShares(
    userPublicOrPrivateKeyShare: string,
    backupPrivateOrPublicKeyShare: string,
    walletPassphrase?: string
  ): [ECDSAMethodTypes.KeyCombined, ECDSAMethodTypes.KeyCombined] {
    let backupPrv;
    let userPrv;
    try {
      backupPrv = this.bitgo.decrypt({
        input: backupPrivateOrPublicKeyShare,
        password: walletPassphrase,
      });
      userPrv = this.bitgo.decrypt({
        input: userPublicOrPrivateKeyShare,
        password: walletPassphrase,
      });
    } catch (e) {
      throw new Error(`Error decrypting backup keychain: ${e.message}`);
    }

    const userSigningMaterial = JSON.parse(userPrv) as ECDSAMethodTypes.SigningMaterial;
    const backupSigningMaterial = JSON.parse(backupPrv) as ECDSAMethodTypes.SigningMaterial;

    if (!userSigningMaterial.backupNShare) {
      throw new Error('Invalid user key - missing backupNShare');
    }

    if (!backupSigningMaterial.userNShare) {
      throw new Error('Invalid backup key - missing userNShare');
    }

    const MPC = new Ecdsa();

    const userKeyCombined = MPC.keyCombine(userSigningMaterial.pShare, [
      userSigningMaterial.bitgoNShare,
      userSigningMaterial.backupNShare,
    ]);
    const userSigningKeyDerived = MPC.keyDerive(
      userSigningMaterial.pShare,
      [userSigningMaterial.bitgoNShare, userSigningMaterial.backupNShare],
      'm/0'
    );
    const userKeyDerivedCombined = {
      xShare: userSigningKeyDerived.xShare,
      yShares: userKeyCombined.yShares,
    };
    const backupKeyCombined = MPC.keyCombine(backupSigningMaterial.pShare, [
      userSigningKeyDerived.nShares[2],
      backupSigningMaterial.bitgoNShare,
    ]);
    if (
      userKeyDerivedCombined.xShare.y !== backupKeyCombined.xShare.y ||
      userKeyDerivedCombined.xShare.chaincode !== backupKeyCombined.xShare.chaincode
    ) {
      throw new Error('Common keychains do not match');
    }
    return [userKeyDerivedCombined, backupKeyCombined];
  }

  /**
   * Helper which Adds signatures to tx object and re-serializes tx
   * @param {EthLikeCommon.default} ethCommon
   * @param {EthLikeTxLib.FeeMarketEIP1559Transaction | EthLikeTxLib.Transaction} tx
   * @param {ECDSAMethodTypes.Signature} signature
   * @returns {EthLikeTxLib.FeeMarketEIP1559Transaction | EthLikeTxLib.Transaction}
   */
  private getSignedTxFromSignature(
    ethCommon: EthLikeCommon.default,
    tx: EthLikeTxLib.FeeMarketEIP1559Transaction | EthLikeTxLib.Transaction,
    signature: ECDSAMethodTypes.Signature
  ) {
    // get signed Tx from signature
    const txData = tx.toJSON();
    const yParity = signature.recid;
    const baseParams = {
      to: txData.to,
      nonce: new BN(stripHexPrefix(txData.nonce!), 'hex'),
      value: new BN(stripHexPrefix(txData.value!), 'hex'),
      gasLimit: new BN(stripHexPrefix(txData.gasLimit!), 'hex'),
      data: txData.data,
      r: addHexPrefix(signature.r),
      s: addHexPrefix(signature.s),
    };

    let finalTx;
    if (txData.maxFeePerGas && txData.maxPriorityFeePerGas) {
      finalTx = FeeMarketEIP1559Transaction.fromTxData(
        {
          ...baseParams,
          maxPriorityFeePerGas: new BN(stripHexPrefix(txData.maxPriorityFeePerGas!), 'hex'),
          maxFeePerGas: new BN(stripHexPrefix(txData.maxFeePerGas!), 'hex'),
          v: new BN(yParity.toString()),
        },
        { common: ethCommon }
      );
    } else if (txData.gasPrice) {
      const v = BigInt(35) + BigInt(yParity) + BigInt(ethCommon.chainIdBN().toNumber()) * BigInt(2);
      finalTx = LegacyTransaction.fromTxData(
        {
          ...baseParams,
          v: new BN(v.toString()),
          gasPrice: new BN(stripHexPrefix(txData.gasPrice!.toString()), 'hex'),
        },
        { common: ethCommon }
      );
    }

    return finalTx;
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param params
   * @param {string} params.userKey - [encrypted] xprv
   * @param {string} params.backupKey - [encrypted] xprv or xpub if the xprv is held by a KRS provider
   * @param {string} params.walletPassphrase - used to decrypt userKey and backupKey
   * @param {string} params.walletContractAddress - the ETH address of the wallet contract
   * @param {string} params.krsProvider - necessary if backup key is held by KRS
   * @param {string} params.recoveryDestination - target address to send recovered funds to
   * @param {string} params.bitgoFeeAddress - wrong chain wallet fee address for evm based cross chain recovery txn
   * @param {string} params.bitgoDestinationAddress - target bitgo address where fee will be sent for evm based cross chain recovery txn
   */
  async recover(params: RecoverOptions): Promise<RecoveryInfo | OfflineVaultTxInfo> {
    if (params.isTss) {
      return this.recoverTSS(params);
    }
    return this.recoverEthLike(params);
  }

  /**
   * Builds a funds recovery transaction without BitGo for non-TSS transaction
   * @param params
   * @param {string} params.userKey [encrypted] xprv or xpub
   * @param {string} params.backupKey [encrypted] xprv or xpub if the xprv is held by a KRS provider
   * @param {string} params.walletPassphrase used to decrypt userKey and backupKey
   * @param {string} params.walletContractAddress the EthLike address of the wallet contract
   * @param {string} params.krsProvider necessary if backup key is held by KRS
   * @param {string} params.recoveryDestination target address to send recovered funds to
   * @param {string} params.bitgoFeeAddress wrong chain wallet fee address for evm based cross chain recovery txn
   * @param {string} params.bitgoDestinationAddress target bitgo address where fee will be sent for evm based cross chain recovery txn
   * @returns {Promise<RecoveryInfo | OfflineVaultTxInfo>}
   */
  protected async recoverEthLike(params: RecoverOptions): Promise<RecoveryInfo | OfflineVaultTxInfo> {
    // bitgoFeeAddress is only defined when it is a evm cross chain recovery
    // as we use fee from this wrong chain address for the recovery txn on the correct chain.
    if (params.bitgoFeeAddress) {
      return this.recoverEthLikeforEvmBasedRecovery(params);
    }

    this.validateRecoveryParams(params);
    const isUnsignedSweep = getIsUnsignedSweep(params);

    // Clean up whitespace from entered values
    let userKey = params.userKey.replace(/\s/g, '');
    const backupKey = params.backupKey.replace(/\s/g, '');
    const gasLimit = new optionalDeps.ethUtil.BN(this.setGasLimit(params.gasLimit));
    const gasPrice = params.eip1559
      ? new optionalDeps.ethUtil.BN(params.eip1559.maxFeePerGas)
      : new optionalDeps.ethUtil.BN(this.setGasPrice(params.gasPrice));

    if (!userKey.startsWith('xpub') && !userKey.startsWith('xprv')) {
      try {
        userKey = this.bitgo.decrypt({
          input: userKey,
          password: params.walletPassphrase,
        });
      } catch (e) {
        throw new Error(`Error decrypting user keychain: ${e.message}`);
      }
    }
    let backupKeyAddress;
    let backupSigningKey;
    if (isUnsignedSweep) {
      const backupHDNode = bip32.fromBase58(backupKey);
      backupSigningKey = backupHDNode.publicKey;
      backupKeyAddress = `0x${optionalDeps.ethUtil.publicToAddress(backupSigningKey, true).toString('hex')}`;
    } else {
      // Decrypt backup private key and get address
      let backupPrv;

      try {
        backupPrv = this.bitgo.decrypt({
          input: backupKey,
          password: params.walletPassphrase,
        });
      } catch (e) {
        throw new Error(`Error decrypting backup keychain: ${e.message}`);
      }

      const keyPair = new KeyPairLib({ prv: backupPrv });
      backupSigningKey = keyPair.getKeys().prv;
      if (!backupSigningKey) {
        throw new Error('no private key');
      }
      backupKeyAddress = keyPair.getAddress();
    }

    const backupKeyNonce = await this.getAddressNonce(backupKeyAddress);
    // get balance of backupKey to ensure funds are available to pay fees
    const backupKeyBalance = await this.queryAddressBalance(backupKeyAddress);
    let totalGasNeeded = gasPrice.mul(gasLimit);

    // On optimism chain, L1 fees is to be paid as well apart from L2 fees
    // So we are adding the amount that can be used up as l1 fees
    if (this.staticsCoin?.family === 'opeth') {
      totalGasNeeded = totalGasNeeded.add(new optionalDeps.ethUtil.BN(ethGasConfigs.opethGasL1Fees));
    }

    const weiToGwei = 10 ** 9;
    if (backupKeyBalance.lt(totalGasNeeded)) {
      throw new Error(
        `Backup key address ${backupKeyAddress} has balance ${(backupKeyBalance / weiToGwei).toString()} Gwei.` +
          `This address must have a balance of at least ${(totalGasNeeded / weiToGwei).toString()}` +
          ` Gwei to perform recoveries. Try sending some funds to this address then retry.`
      );
    }

    // get balance of wallet
    const txAmount = await this.queryAddressBalance(params.walletContractAddress);
    if (new BigNumber(txAmount).isLessThanOrEqualTo(0)) {
      throw new Error('Wallet does not have enough funds to recover');
    }

    // build recipients object
    const recipients = [
      {
        address: params.recoveryDestination,
        amount: txAmount.toString(10),
      },
    ];

    // Get sequence ID using contract call
    // we need to wait between making two explorer api calls to avoid getting banned
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const sequenceId = await this.querySequenceId(params.walletContractAddress);

    let operationHash, signature;
    // Get operation hash and sign it
    if (!isUnsignedSweep) {
      operationHash = this.getOperationSha3ForExecuteAndConfirm(recipients, this.getDefaultExpireTime(), sequenceId);
      signature = Util.ethSignMsgHash(operationHash, Util.xprvToEthPrivateKey(userKey));

      try {
        Util.ecRecoverEthAddress(operationHash, signature);
      } catch (e) {
        throw new Error('Invalid signature');
      }
    }

    const txInfo = {
      recipient: recipients[0],
      expireTime: this.getDefaultExpireTime(),
      contractSequenceId: sequenceId,
      operationHash: operationHash,
      signature: signature,
      gasLimit: gasLimit.toString(10),
    };

    const txBuilder = this.getTransactionBuilder(params.common) as TransactionBuilder;
    txBuilder.counter(backupKeyNonce);
    txBuilder.contract(params.walletContractAddress);
    let txFee;
    if (params.eip1559) {
      txFee = {
        eip1559: {
          maxPriorityFeePerGas: params.eip1559.maxPriorityFeePerGas,
          maxFeePerGas: params.eip1559.maxFeePerGas,
        },
      };
    } else {
      txFee = { fee: gasPrice.toString() };
    }
    txBuilder.fee({
      ...txFee,
      gasLimit: gasLimit.toString(),
    });
    const transferBuilder = txBuilder.transfer() as TransferBuilder;
    transferBuilder
      .coin(this.staticsCoin?.name as string)
      .amount(recipients[0].amount)
      .contractSequenceId(sequenceId)
      .expirationTime(this.getDefaultExpireTime())
      .to(params.recoveryDestination);

    const tx = await txBuilder.build();
    if (isUnsignedSweep) {
      const response: OfflineVaultTxInfo = {
        txHex: tx.toBroadcastFormat(),
        userKey,
        backupKey,
        coin: this.getChain(),
        gasPrice: optionalDeps.ethUtil.bufferToInt(gasPrice).toFixed(),
        gasLimit,
        recipients: [txInfo.recipient],
        walletContractAddress: tx.toJson().to,
        amount: txInfo.recipient.amount,
        backupKeyNonce,
        eip1559: params.eip1559,
      };
      _.extend(response, txInfo);
      response.nextContractSequenceId = response.contractSequenceId;
      return response;
    }

    txBuilder
      .transfer()
      .coin(this.staticsCoin?.name as string)
      .key(new KeyPairLib({ prv: userKey }).getKeys().prv as string);
    txBuilder.sign({ key: backupSigningKey });

    const signedTx = await txBuilder.build();

    return {
      id: signedTx.toJson().id,
      tx: signedTx.toBroadcastFormat(),
    };
  }

  /**
   * Builds a unsigned (for cold, custody wallet) or
   * half-signed (for hot wallet) evm cross chain recovery transaction with
   * same expected arguments as recover method.
   * This helps recover funds from evm based wrong chain.
   * @param {RecoverOptions} params
   * @returns {Promise<RecoveryInfo | OfflineVaultTxInfo>}
   */
  protected async recoverEthLikeforEvmBasedRecovery(
    params: RecoverOptions
  ): Promise<RecoveryInfo | OfflineVaultTxInfo> {
    this.validateEvmBasedRecoveryParams(params);

    // Clean up whitespace from entered values
    const userKey = params.userKey.replace(/\s/g, '');
    const bitgoFeeAddress = params.bitgoFeeAddress?.replace(/\s/g, '').toLowerCase() as string;
    const bitgoDestinationAddress = params.bitgoDestinationAddress?.replace(/\s/g, '').toLowerCase() as string;
    const recoveryDestination = params.recoveryDestination?.replace(/\s/g, '').toLowerCase() as string;
    const walletContractAddress = params.walletContractAddress?.replace(/\s/g, '').toLowerCase() as string;
    const tokenContractAddress = params.tokenContractAddress?.replace(/\s/g, '').toLowerCase() as string;

    let userSigningKey;
    let userKeyPrv;
    if (params.walletPassphrase) {
      if (!userKey.startsWith('xpub') && !userKey.startsWith('xprv')) {
        try {
          userKeyPrv = this.bitgo.decrypt({
            input: userKey,
            password: params.walletPassphrase,
          });
        } catch (e) {
          throw new Error(`Error decrypting user keychain: ${e.message}`);
        }
      }

      const keyPair = new KeyPairLib({ prv: userKeyPrv });
      userSigningKey = keyPair.getKeys().prv;
      if (!userSigningKey) {
        throw new Error('no private key');
      }
    }

    const gasLimit = new optionalDeps.ethUtil.BN(this.setGasLimit(params.gasLimit));
    const gasPrice = params.eip1559
      ? new optionalDeps.ethUtil.BN(params.eip1559.maxFeePerGas)
      : new optionalDeps.ethUtil.BN(this.setGasPrice(params.gasPrice));

    const bitgoFeeAddressNonce = await this.getAddressNonce(bitgoFeeAddress);

    // get balance of bitgoFeeAddress to ensure funds are available to pay fees
    const bitgoFeeAddressBalance = await this.queryAddressBalance(bitgoFeeAddress);
    const totalGasNeeded = gasPrice.mul(gasLimit);
    const weiToGwei = 10 ** 9;
    if (bitgoFeeAddressBalance.lt(totalGasNeeded)) {
      throw new Error(
        `Fee address ${bitgoFeeAddress} has balance ${(bitgoFeeAddressBalance / weiToGwei).toString()} Gwei.` +
          `This address must have a balance of at least ${(totalGasNeeded / weiToGwei).toString()}` +
          ` Gwei to perform recoveries. Try sending some ${this.getChain()} to this address then retry.`
      );
    }

    if (tokenContractAddress) {
      return this.recoverEthLikeTokenforEvmBasedRecovery(
        params,
        bitgoFeeAddressNonce,
        gasLimit,
        gasPrice,
        userKey,
        userSigningKey
      );
    }

    // get balance of wallet
    const txAmount = await this.queryAddressBalance(walletContractAddress);

    const bitgoFeePercentage = 0; // TODO: BG-71912 can change the fee% here.
    const bitgoFeeAmount = txAmount * (bitgoFeePercentage / 100);

    // build recipients object
    const recipients: Recipient[] = [
      {
        address: recoveryDestination,
        amount: new BigNumber(txAmount).minus(bitgoFeeAmount).toFixed(),
      },
    ];

    if (bitgoFeePercentage > 0) {
      if (_.isUndefined(bitgoDestinationAddress) || !this.isValidAddress(bitgoDestinationAddress)) {
        throw new Error('invalid bitgoDestinationAddress');
      }

      recipients.push({
        address: bitgoDestinationAddress,
        amount: bitgoFeeAmount.toString(10),
      });
    }

    // calculate batch data
    const BATCH_METHOD_NAME = 'batch';
    const BATCH_METHOD_TYPES = ['address[]', 'uint256[]'];
    const batchExecutionInfo = this.getBatchExecutionInfo(recipients);
    const batchData = optionalDeps.ethUtil.addHexPrefix(
      this.getMethodCallData(BATCH_METHOD_NAME, BATCH_METHOD_TYPES, batchExecutionInfo.values).toString('hex')
    );

    // Get sequence ID using contract call
    // we need to wait between making two explorer api calls to avoid getting banned
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const sequenceId = await this.querySequenceId(walletContractAddress);

    const txInfo = {
      recipients: recipients,
      expireTime: this.getDefaultExpireTime(),
      contractSequenceId: sequenceId,
      gasLimit: gasLimit.toString(10),
      isEvmBasedCrossChainRecovery: true,
    };

    const network = this.getNetwork();
    const batcherContractAddress = network?.batcherContractAddress as string;

    const txBuilder = this.getTransactionBuilder(params.common) as TransactionBuilder;
    txBuilder.counter(bitgoFeeAddressNonce);
    txBuilder.contract(walletContractAddress);
    let txFee;
    if (params.eip1559) {
      txFee = {
        eip1559: {
          maxPriorityFeePerGas: params.eip1559.maxPriorityFeePerGas,
          maxFeePerGas: params.eip1559.maxFeePerGas,
        },
      };
    } else {
      txFee = { fee: gasPrice.toString() };
    }
    txBuilder.fee({
      ...txFee,
      gasLimit: gasLimit.toString(),
    });

    const transferBuilder = txBuilder.transfer() as TransferBuilder;
    if (!batcherContractAddress) {
      transferBuilder
        .coin(this.staticsCoin?.name as string)
        .amount(batchExecutionInfo.totalAmount)
        .contractSequenceId(sequenceId)
        .expirationTime(this.getDefaultExpireTime())
        .to(recoveryDestination);
    } else {
      transferBuilder
        .coin(this.staticsCoin?.name as string)
        .amount(batchExecutionInfo.totalAmount)
        .contractSequenceId(sequenceId)
        .expirationTime(this.getDefaultExpireTime())
        .to(batcherContractAddress)
        .data(batchData);
    }

    if (params.walletPassphrase) {
      transferBuilder.key(userSigningKey);
    }

    // If the intended chain is arbitrum or optimism, we need to use wallet version 4
    // since these contracts construct operationHash differently
    if (params.intendedChain && ['arbeth', 'opeth'].includes(coins.get(params.intendedChain).family)) {
      txBuilder.walletVersion(4);
    }

    const tx = await txBuilder.build();

    const response: OfflineVaultTxInfo = {
      txHex: tx.toBroadcastFormat(),
      userKey,
      coin: this.getChain(),
      gasPrice: optionalDeps.ethUtil.bufferToInt(gasPrice).toFixed(),
      gasLimit,
      recipients: txInfo.recipients,
      walletContractAddress: tx.toJson().to,
      amount: batchExecutionInfo.totalAmount,
      backupKeyNonce: bitgoFeeAddressNonce,
      eip1559: params.eip1559,
    };
    _.extend(response, txInfo);
    response.nextContractSequenceId = response.contractSequenceId;

    if (params.walletPassphrase) {
      const halfSignedTxn: HalfSignedTransaction = {
        halfSigned: {
          txHex: tx.toBroadcastFormat(),
          recipients: txInfo.recipients,
          expireTime: txInfo.expireTime,
        },
      };
      _.extend(response, halfSignedTxn);

      const feesUsed: FeesUsed = {
        gasPrice: optionalDeps.ethUtil.bufferToInt(gasPrice).toFixed(),
        gasLimit: optionalDeps.ethUtil.bufferToInt(gasLimit).toFixed(),
      };
      response['feesUsed'] = feesUsed;
    }

    return response;
  }

  /**
   * Query explorer for the balance of an address for a token
   * @param {string} tokenContractAddress - address where the token smart contract is hosted
   * @param {string} walletContractAddress - address of the wallet
   * @returns {BigNumber} token balaance in base units
   */
  async queryAddressTokenBalance(tokenContractAddress: string, walletContractAddress: string): Promise<any> {
    if (!optionalDeps.ethUtil.isValidAddress(tokenContractAddress)) {
      throw new Error('cannot get balance for invalid token address');
    }
    if (!optionalDeps.ethUtil.isValidAddress(walletContractAddress)) {
      throw new Error('cannot get token balance for invalid wallet address');
    }

    const result = await this.recoveryBlockchainExplorerQuery({
      module: 'account',
      action: 'tokenbalance',
      contractaddress: tokenContractAddress,
      address: walletContractAddress,
      tag: 'latest',
    });
    // throw if the result does not exist or the result is not a valid number
    if (!result || !result.result || isNaN(result.result)) {
      throw new Error(
        `Could not obtain token address balance for ${tokenContractAddress} from Etherscan, got: ${result.result}`
      );
    }
    return new optionalDeps.ethUtil.BN(result.result, 10);
  }

  async recoverEthLikeTokenforEvmBasedRecovery(
    params: RecoverOptions,
    bitgoFeeAddressNonce: number,
    gasLimit,
    gasPrice,
    userKey,
    userSigningKey
  ) {
    // get token balance of wallet
    const txAmount = await this.queryAddressTokenBalance(
      params.tokenContractAddress as string,
      params.walletContractAddress
    );

    // build recipients object
    const recipients: Recipient[] = [
      {
        address: params.recoveryDestination,
        amount: new BigNumber(txAmount).toFixed(),
      },
    ];

    // Get sequence ID using contract call
    // we need to wait between making two explorer api calls to avoid getting banned
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const sequenceId = await this.querySequenceId(params.walletContractAddress);

    const txInfo = {
      recipients: recipients,
      expireTime: this.getDefaultExpireTime(),
      contractSequenceId: sequenceId,
      gasLimit: gasLimit.toString(10),
      isEvmBasedCrossChainRecovery: true,
    };

    const txBuilder = this.getTransactionBuilder(params.common) as TransactionBuilder;
    txBuilder.counter(bitgoFeeAddressNonce);
    txBuilder.contract(params.walletContractAddress as string);
    let txFee;
    if (params.eip1559) {
      txFee = {
        eip1559: {
          maxPriorityFeePerGas: params.eip1559.maxPriorityFeePerGas,
          maxFeePerGas: params.eip1559.maxFeePerGas,
        },
      };
    } else {
      txFee = { fee: gasPrice.toString() };
    }
    txBuilder.fee({
      ...txFee,
      gasLimit: gasLimit.toString(),
    });

    const transferBuilder = txBuilder.transfer() as TransferBuilder;

    const network = this.getNetwork();
    const token = getToken(
      params.tokenContractAddress as string,
      network as EthLikeNetwork,
      this.staticsCoin?.family as string
    )?.name as string;

    transferBuilder
      .amount(txAmount)
      .contractSequenceId(sequenceId)
      .expirationTime(this.getDefaultExpireTime())
      .to(params.recoveryDestination);

    if (token) {
      transferBuilder.coin(token);
    } else {
      transferBuilder
        .coin(this.staticsCoin?.name as string)
        .tokenContractAddress(params.tokenContractAddress as string);
    }

    if (params.walletPassphrase) {
      txBuilder.transfer().key(userSigningKey);
    }
    // If the intended chain is arbitrum or optimism, we need to use wallet version 4
    // since these contracts construct operationHash differently
    if (params.intendedChain && ['arbeth', 'opeth'].includes(coins.get(params.intendedChain).family)) {
      txBuilder.walletVersion(4);
    }

    const tx = await txBuilder.build();

    const response: OfflineVaultTxInfo = {
      txHex: tx.toBroadcastFormat(),
      userKey,
      coin: token ? token : this.getChain(),
      gasPrice: optionalDeps.ethUtil.bufferToInt(gasPrice).toFixed(),
      gasLimit,
      recipients: txInfo.recipients,
      walletContractAddress: tx.toJson().to,
      amount: txAmount.toString(),
      backupKeyNonce: bitgoFeeAddressNonce,
      eip1559: params.eip1559,
    };
    _.extend(response, txInfo);
    response.nextContractSequenceId = response.contractSequenceId;

    if (params.walletPassphrase) {
      const halfSignedTxn: HalfSignedTransaction = {
        halfSigned: {
          txHex: tx.toBroadcastFormat(),
          recipients: txInfo.recipients,
          expireTime: txInfo.expireTime,
        },
      };
      _.extend(response, halfSignedTxn);

      const feesUsed: FeesUsed = {
        gasPrice: optionalDeps.ethUtil.bufferToInt(gasPrice).toFixed(),
        gasLimit: optionalDeps.ethUtil.bufferToInt(gasLimit).toFixed(),
      };
      response['feesUsed'] = feesUsed;
    }

    return response;
  }

  /**
   * Validate evm based cross chain recovery params
   * @param params {RecoverOptions}
   * @returns {void}
   */
  validateEvmBasedRecoveryParams(params: RecoverOptions): void {
    if (_.isUndefined(params.bitgoFeeAddress) || !this.isValidAddress(params.bitgoFeeAddress)) {
      throw new Error('invalid bitgoFeeAddress');
    }

    if (_.isUndefined(params.walletContractAddress) || !this.isValidAddress(params.walletContractAddress)) {
      throw new Error('invalid walletContractAddress');
    }

    if (_.isUndefined(params.recoveryDestination) || !this.isValidAddress(params.recoveryDestination)) {
      throw new Error('invalid recoveryDestination');
    }
  }

  /**
   * Return types, values, and total amount in wei to send in a batch transaction, using the method signature
   * `distributeBatch(address[], uint256[])`
   * @param {Recipient[]} recipients - transaction recipients
   * @returns {GetBatchExecutionInfoRT} information needed to execute the batch transaction
   */
  getBatchExecutionInfo(recipients: Recipient[]): GetBatchExecutionInfoRT {
    const addresses: string[] = [];
    const amounts: string[] = [];
    let sum = new BigNumber('0');
    _.forEach(recipients, ({ address, amount }) => {
      addresses.push(address);
      amounts.push(amount as string);
      sum = sum.plus(amount);
    });

    return {
      values: [addresses, amounts],
      totalAmount: sum.toFixed(),
    };
  }

  /**
   * Get the data required to make an ETH function call defined by the given types and values
   *
   * @param {string} functionName - The name of the function being called, e.g. transfer
   * @param types The types of the function call in order
   * @param values The values of the function call in order
   * @return {Buffer} The combined data for the function call
   */
  getMethodCallData = (functionName, types, values) => {
    return Buffer.concat([
      // function signature
      optionalDeps.ethAbi.methodID(functionName, types),
      // function arguments
      optionalDeps.ethAbi.rawEncode(types, values),
    ]);
  };

  /**
   * Build arguments to call the send method on the wallet contract
   * @param txInfo
   */
  getSendMethodArgs(txInfo: GetSendMethodArgsOptions): SendMethodArgs[] {
    // Method signature is
    // sendMultiSig(address toAddress, uint value, bytes data, uint expireTime, uint sequenceId, bytes signature)
    return [
      {
        name: 'toAddress',
        type: 'address',
        value: txInfo.recipient.address,
      },
      {
        name: 'value',
        type: 'uint',
        value: txInfo.recipient.amount,
      },
      {
        name: 'data',
        type: 'bytes',
        value: optionalDeps.ethUtil.toBuffer(optionalDeps.ethUtil.addHexPrefix(txInfo.recipient.data || '')),
      },
      {
        name: 'expireTime',
        type: 'uint',
        value: txInfo.expireTime,
      },
      {
        name: 'sequenceId',
        type: 'uint',
        value: txInfo.contractSequenceId,
      },
      {
        name: 'signature',
        type: 'bytes',
        value: optionalDeps.ethUtil.toBuffer(optionalDeps.ethUtil.addHexPrefix(txInfo.signature)),
      },
    ];
  }

  /**
   * Recovers a tx with TSS key shares
   * same expected arguments as recover method, but with TSS key shares
   */
  protected async recoverTSS(params: RecoverOptions): Promise<RecoveryInfo | OfflineVaultTxInfo> {
    this.validateRecoveryParams(params);
    // Clean up whitespace from entered values
    const userPublicOrPrivateKeyShare = params.userKey.replace(/\s/g, '');
    const backupPrivateOrPublicKeyShare = params.backupKey.replace(/\s/g, '');

    const gasLimit = new optionalDeps.ethUtil.BN(this.setGasLimit(params.gasLimit));
    const gasPrice = params.eip1559
      ? new optionalDeps.ethUtil.BN(params.eip1559.maxFeePerGas)
      : new optionalDeps.ethUtil.BN(this.setGasPrice(params.gasPrice));

    if (
      getIsUnsignedSweep({
        userKey: userPublicOrPrivateKeyShare,
        backupKey: backupPrivateOrPublicKeyShare,
        isTss: params.isTss,
      })
    ) {
      const backupKeyPair = new KeyPairLib({ pub: backupPrivateOrPublicKeyShare });
      const baseAddress = backupKeyPair.getAddress();
      const { txInfo, tx, nonce } = await this.buildTssRecoveryTxn(baseAddress, gasPrice, gasLimit, params);
      return this.formatForOfflineVaultTSS(
        txInfo,
        tx,
        userPublicOrPrivateKeyShare,
        backupPrivateOrPublicKeyShare,
        gasPrice,
        gasLimit,
        nonce,
        params.eip1559,
        params.replayProtectionOptions
      );
    } else {
      const isGG18SigningMaterial = this.isGG18SigningMaterial(userPublicOrPrivateKeyShare, params.walletPassphrase);
      let signature: ECDSAMethodTypes.Signature;
      let unsignedTx: EthLikeTxLib.Transaction | EthLikeTxLib.FeeMarketEIP1559Transaction;
      if (isGG18SigningMaterial) {
        const [userKeyCombined, backupKeyCombined] = this.getKeyCombinedFromTssKeyShares(
          userPublicOrPrivateKeyShare,
          backupPrivateOrPublicKeyShare,
          params.walletPassphrase
        );
        const backupKeyPair = new KeyPairLib({ pub: backupKeyCombined.xShare.y });
        const baseAddress = backupKeyPair.getAddress();

        unsignedTx = (await this.buildTssRecoveryTxn(baseAddress, gasPrice, gasLimit, params)).tx;

        signature = await this.signRecoveryTSS(
          userKeyCombined,
          backupKeyCombined,
          unsignedTx.getMessageToSign(false).toString('hex')
        );
      } else {
        const { userKeyShare, backupKeyShare, commonKeyChain, baseAddress } = await this.getMpcV2RecoveryKeyShares(
          userPublicOrPrivateKeyShare,
          backupPrivateOrPublicKeyShare,
          params.walletPassphrase
        );

        unsignedTx = (await this.buildTssRecoveryTxn(baseAddress, gasPrice, gasLimit, params)).tx;

        signature = await AbstractEthLikeNewCoins.signRecoveryMpcV2(
          unsignedTx,
          userKeyShare,
          backupKeyShare,
          commonKeyChain
        );
      }

      const ethCommmon = AbstractEthLikeNewCoins.getEthLikeCommon(params.eip1559, params.replayProtectionOptions);
      const signedTx = this.getSignedTxFromSignature(ethCommmon, unsignedTx, signature);

      return {
        id: addHexPrefix(signedTx.hash().toString('hex')),
        tx: addHexPrefix(signedTx.serialize().toString('hex')),
      };
    }
  }

  private static async signRecoveryMpcV2(
    tx: EthLikeTxLib.FeeMarketEIP1559Transaction | EthLikeTxLib.Transaction,
    userKeyShare: Buffer,
    backupKeyShare: Buffer,
    commonKeyChain: string
  ) {
    const messageHash = tx.getMessageToSign(true);
    const userDsg = new DklsDsg.Dsg(userKeyShare, 0, 'm/0', messageHash);
    const backupDsg = new DklsDsg.Dsg(backupKeyShare, 1, 'm/0', messageHash);

    const signatureString = DklsUtils.verifyAndConvertDklsSignature(
      messageHash,
      (await DklsUtils.executeTillRound(5, userDsg, backupDsg)) as DklsTypes.DeserializedDklsSignature,
      commonKeyChain,
      'm/0',
      undefined,
      false
    );
    const sigParts = signatureString.split(':');

    return {
      recid: parseInt(sigParts[0], 10),
      r: sigParts[1],
      s: sigParts[2],
      y: sigParts[3],
    };
  }

  private async getMpcV2RecoveryKeyShares(
    userPublicOrPrivateKeyShare: string,
    backupPrivateOrPublicKeyShare: string,
    walletPassphrase?: string
  ) {
    const userCompressedPrv = Buffer.from(
      this.bitgo.decrypt({
        input: userPublicOrPrivateKeyShare,
        password: walletPassphrase,
      }),
      'base64'
    );
    const bakcupCompressedPrv = Buffer.from(
      this.bitgo.decrypt({
        input: backupPrivateOrPublicKeyShare,
        password: walletPassphrase,
      }),
      'base64'
    );

    const userPrvJSON: DklsTypes.ReducedKeyShare = DklsTypes.getDecodedReducedKeyShare(userCompressedPrv);
    const backupPrvJSON: DklsTypes.ReducedKeyShare = DklsTypes.getDecodedReducedKeyShare(bakcupCompressedPrv);
    const userKeyRetrofit: DklsTypes.RetrofitData = {
      xShare: {
        x: Buffer.from(userPrvJSON.prv).toString('hex'),
        y: Buffer.from(userPrvJSON.pub).toString('hex'),
        chaincode: Buffer.from(userPrvJSON.rootChainCode).toString('hex'),
      },
      bigSiList: [Buffer.from(userPrvJSON.bigSList[1]).toString('hex')],
      xiList: userPrvJSON.xList.slice(0, 2),
    };
    const backupKeyRetrofit: DklsTypes.RetrofitData = {
      xShare: {
        x: Buffer.from(backupPrvJSON.prv).toString('hex'),
        y: Buffer.from(backupPrvJSON.pub).toString('hex'),
        chaincode: Buffer.from(backupPrvJSON.rootChainCode).toString('hex'),
      },
      bigSiList: [Buffer.from(backupPrvJSON.bigSList[0]).toString('hex')],
      xiList: backupPrvJSON.xList.slice(0, 2),
    };
    const [user, backup] = await DklsUtils.generate2of2KeyShares(userKeyRetrofit, backupKeyRetrofit);
    const userKeyShare = user.getKeyShare();
    const backupKeyShare = backup.getKeyShare();
    const commonKeyChain = DklsTypes.getCommonKeychain(userKeyShare);
    const MPC = new Ecdsa();
    const derivedCommonKeyChain = MPC.deriveUnhardened(commonKeyChain, 'm');
    const backupKeyPair = new KeyPairLib({ pub: derivedCommonKeyChain.slice(0, 66) });
    const baseAddress = backupKeyPair.getAddress();
    return { userKeyShare, backupKeyShare, commonKeyChain, baseAddress };
  }

  private isGG18SigningMaterial(keyShare: string, walletPassphrase: string | undefined): boolean {
    const prv = this.bitgo.decrypt({
      input: keyShare,
      password: walletPassphrase,
    });
    try {
      const signingMaterial = JSON.parse(prv);
      return (
        signingMaterial.pShare &&
        signingMaterial.bitgoNShare &&
        (signingMaterial.userNShare || signingMaterial.backupNShare)
      );
    } catch (error) {
      return false;
    }
  }

  private async buildTssRecoveryTxn(baseAddress: string, gasPrice: any, gasLimit: any, params: RecoverOptions) {
    const nonce = await this.getAddressNonce(baseAddress);
    const txAmount = await this.validateBalanceAndGetTxAmount(baseAddress, gasPrice, gasLimit);
    const recipients = [
      {
        address: params.recoveryDestination,
        amount: txAmount.toString(10),
      },
    ];

    const txInfo = {
      recipient: recipients[0],
      expireTime: this.getDefaultExpireTime(),
      gasLimit: gasLimit.toString(10),
    };

    const txParams = {
      to: params.recoveryDestination,
      nonce: nonce,
      value: txAmount,
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      data: Buffer.from('0x'),
      eip1559: params.eip1559,
      replayProtectionOptions: params.replayProtectionOptions,
    };

    const tx = AbstractEthLikeNewCoins.buildTransaction(txParams);
    return { txInfo, tx, nonce };
  }

  async validateBalanceAndGetTxAmount(baseAddress: string, gasPrice: BN, gasLimit: BN) {
    const baseAddressBalance = await this.queryAddressBalance(baseAddress);

    const totalGasNeeded = gasPrice.mul(gasLimit);
    const weiToGwei = new BN(10 ** 9);
    if (baseAddressBalance.lt(totalGasNeeded)) {
      throw new Error(
        `Backup key address ${baseAddress} has balance ${baseAddressBalance.div(weiToGwei).toString()} Gwei.` +
          `This address must have a balance of at least ${totalGasNeeded.div(weiToGwei).toString()}` +
          ` Gwei to perform recoveries. Try sending some ETH to this address then retry.`
      );
    }

    const txAmount = baseAddressBalance.sub(totalGasNeeded);
    return txAmount;
  }

  async recoveryBlockchainExplorerQuery(query: Record<string, string>): Promise<any> {
    throw new Error('method not implemented');
  }

  /**
   * Creates the extra parameters needed to build a hop transaction
   * @param buildParams The original build parameters
   * @returns extra parameters object to merge with the original build parameters object and send to the platform
   */
  async createHopTransactionParams(buildParams: HopTransactionBuildOptions): Promise<HopParams> {
    const wallet = buildParams.wallet;
    const recipients = buildParams.recipients;
    const walletPassphrase = buildParams.walletPassphrase;

    const userKeychain = await this.keychains().get({ id: wallet.keyIds()[0] });
    const userPrv = wallet.getUserPrv({ keychain: userKeychain, walletPassphrase });
    const userPrvBuffer = bip32.fromBase58(userPrv).privateKey;
    if (!userPrvBuffer) {
      throw new Error('invalid userPrv');
    }
    if (!recipients || !Array.isArray(recipients)) {
      throw new Error('expecting array of recipients');
    }

    // Right now we only support 1 recipient
    if (recipients.length !== 1) {
      throw new Error('must send to exactly 1 recipient');
    }
    const recipientAddress = recipients[0].address;
    const recipientAmount = recipients[0].amount as string;
    const feeEstimateParams = {
      recipient: recipientAddress,
      amount: recipientAmount,
      hop: true,
    };
    const feeEstimate: FeeEstimate = await this.feeEstimate(feeEstimateParams);

    const gasLimit = feeEstimate.gasLimitEstimate;
    const gasPrice = Math.round(feeEstimate.feeEstimate / gasLimit);
    const gasPriceMax = gasPrice * 5;
    // Payment id a random number so its different for every tx
    const paymentId = Math.floor(Math.random() * 10000000000).toString();
    const hopDigest: Buffer = AbstractEthLikeNewCoins.getHopDigest([
      recipientAddress,
      recipientAmount,
      gasPriceMax.toString(),
      gasLimit.toString(),
      paymentId,
    ]);

    const userReqSig = optionalDeps.ethUtil.addHexPrefix(
      Buffer.from(secp256k1.ecdsaSign(hopDigest, userPrvBuffer).signature).toString('hex')
    );

    return {
      hopParams: {
        gasPriceMax,
        userReqSig,
        paymentId,
      },
      gasLimit,
    };
  }

  /**
   * Validates that the hop prebuild from the HSM is valid and correct
   * @param {IWallet} wallet - The wallet that the prebuild is for
   * @param {HopPrebuild} hopPrebuild - The prebuild to validate
   * @param {Object} originalParams - The original parameters passed to prebuildTransaction
   * @param {Recipient[]} originalParams.recipients - The original recipients array
   * @returns {void}
   * @throws Error if The prebuild is invalid
   */
  async validateHopPrebuild(
    wallet: IWallet,
    hopPrebuild: HopPrebuild,
    originalParams?: { recipients: Recipient[] }
  ): Promise<void> {
    const { tx, id, signature } = hopPrebuild;

    // first, validate the HSM signature
    const serverXpub = common.Environments[this.bitgo.getEnv()].hsmXpub;
    const serverPubkeyBuffer: Buffer = bip32.fromBase58(serverXpub).publicKey;
    const signatureBuffer: Buffer = Buffer.from(optionalDeps.ethUtil.stripHexPrefix(signature), 'hex');
    const messageBuffer: Buffer = Buffer.from(
      optionalDeps.ethUtil.padToEven(optionalDeps.ethUtil.stripHexPrefix(id)),
      'hex'
    );

    const sig = new Uint8Array(signatureBuffer.slice(1));
    const isValidSignature: boolean = secp256k1.ecdsaVerify(sig, messageBuffer, serverPubkeyBuffer);
    if (!isValidSignature) {
      throw new Error(
        `Hop txid signature invalid - pub: ${serverXpub}, msg: ${messageBuffer?.toString()}, sig: ${signatureBuffer?.toString()}`
      );
    }

    const builtHopTx = optionalDeps.EthTx.TransactionFactory.fromSerializedData(optionalDeps.ethUtil.toBuffer(tx));
    // If original params are given, we can check them against the transaction prebuild params
    if (!_.isNil(originalParams)) {
      const { recipients } = originalParams;

      // Then validate that the tx params actually equal the requested params
      const originalAmount = new BigNumber(recipients[0].amount);
      const originalDestination: string = recipients[0].address;

      const hopAmount = new BigNumber(optionalDeps.ethUtil.bufferToHex(builtHopTx.value));
      if (!builtHopTx.to) {
        throw new Error(`Transaction does not have a destination address`);
      }
      const hopDestination = builtHopTx.to.toString();
      if (!hopAmount.eq(originalAmount)) {
        throw new Error(`Hop amount: ${hopAmount} does not equal original amount: ${originalAmount}`);
      }
      if (hopDestination.toLowerCase() !== originalDestination.toLowerCase()) {
        throw new Error(`Hop destination: ${hopDestination} does not equal original recipient: ${hopDestination}`);
      }
    }

    if (!builtHopTx.verifySignature()) {
      // We dont want to continue at all in this case, at risk of ETH being stuck on the hop address
      throw new Error(`Invalid hop transaction signature, txid: ${id}`);
    }
    if (optionalDeps.ethUtil.addHexPrefix(builtHopTx.hash().toString('hex')) !== id) {
      throw new Error(`Signed hop txid does not equal actual txid`);
    }
  }

  /**
   * Gets the hop digest for the user to sign. This is validated in the HSM to prove that the user requested this tx
   * @param {string[]} paramsArr - The parameters to hash together for the digest
   * @returns {Buffer}
   */
  private static getHopDigest(paramsArr: string[]): Buffer {
    const hash = Keccak('keccak256');
    hash.update([AbstractEthLikeNewCoins.hopTransactionSalt, ...paramsArr].join('$'));
    return hash.digest();
  }

  /**
   * Modify prebuild before sending it to the server. Add things like hop transaction params
   * @param {BuildOptions} buildParams - The whitelisted parameters for this prebuild
   * @param {boolean} buildParams.hop - True if this should prebuild a hop tx, else false
   * @param {Recipient[]} buildParams.recipients - The recipients array of this transaction
   * @param {Wallet} buildParams.wallet - The wallet sending this tx
   * @param {string} buildParams.walletPassphrase - the passphrase for this wallet
   * @returns {Promise<BuildOptions>}
   */
  async getExtraPrebuildParams(buildParams: BuildOptions): Promise<BuildOptions> {
    if (
      !_.isUndefined(buildParams.hop) &&
      buildParams.hop &&
      !_.isUndefined(buildParams.wallet) &&
      !_.isUndefined(buildParams.recipients) &&
      !_.isUndefined(buildParams.walletPassphrase)
    ) {
      if (this instanceof EthLikeToken) {
        throw new Error(
          `Hop transactions are not enabled for ERC-20 tokens, nor are they necessary. Please remove the 'hop' parameter and try again.`
        );
      }
      return (await this.createHopTransactionParams({
        wallet: buildParams.wallet,
        recipients: buildParams.recipients,
        walletPassphrase: buildParams.walletPassphrase,
      })) as any;
    }
    return {};
  }

  /**
   * Modify prebuild after receiving it from the server. Add things like nlocktime
   * @param {TransactionPrebuild} params - The prebuild to modify
   * @returns {TransactionPrebuild} The modified prebuild
   */
  async postProcessPrebuild(params: TransactionPrebuild): Promise<TransactionPrebuild> {
    if (!_.isUndefined(params.hopTransaction) && !_.isUndefined(params.wallet) && !_.isUndefined(params.buildParams)) {
      await this.validateHopPrebuild(params.wallet, params.hopTransaction, params.buildParams);
    }
    return params;
  }

  /**
   * Coin-specific things done before signing a transaction, i.e. verification
   * @param {PresignTransactionOptions} params
   * @returns {Promise<PresignTransactionOptions>}
   */
  async presignTransaction(params: PresignTransactionOptions): Promise<PresignTransactionOptions> {
    if (!_.isUndefined(params.hopTransaction) && !_.isUndefined(params.wallet) && !_.isUndefined(params.buildParams)) {
      await this.validateHopPrebuild(params.wallet, params.hopTransaction);
    }
    return params;
  }

  /**
   * Fetch fee estimate information from the server
   * @param {Object} params - The params passed into the function
   * @param {boolean} [params.hop] - True if we should estimate fee for a hop transaction
   * @param {string} [params.recipient] - The recipient of the transaction to estimate a send to
   * @param {string} [params.data] - The ETH tx data to estimate a send for
   * @returns {Object} The fee info returned from the server
   */
  async feeEstimate(params: FeeEstimateOptions): Promise<FeeEstimate> {
    const query: FeeEstimateOptions = {};
    if (params && params.hop) {
      query.hop = params.hop;
    }
    if (params && params.recipient) {
      query.recipient = params.recipient;
    }
    if (params && params.data) {
      query.data = params.data;
    }
    if (params && params.amount) {
      query.amount = params.amount;
    }

    return await this.bitgo.get(this.url('/tx/fee')).query(query).result();
  }

  /**
   * Generate secp256k1 key pair
   *
   * @param {Buffer} seed
   * @returns {KeyPair} object with generated pub and prv
   */
  generateKeyPair(seed: Buffer): KeyPair {
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

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }

  /**
   * Make sure an address is a wallet address and throw an error if it's not.
   * @param {Object} params
   * @param {string} params.address - The derived address string on the network
   * @param {Object} params.coinSpecific - Coin-specific details for the address such as a forwarderVersion
   * @param {string} params.baseAddress - The base address of the wallet on the network
   * @throws {InvalidAddressError}
   * @throws {InvalidAddressVerificationObjectPropertyError}
   * @throws {UnexpectedAddressError}
   * @returns {boolean} True iff address is a wallet address
   */
  async isWalletAddress(params: VerifyEthAddressOptions): Promise<boolean> {
    const ethUtil = optionalDeps.ethUtil;

    let expectedAddress;
    let actualAddress;

    const { address, coinSpecific, baseAddress, impliedForwarderVersion = coinSpecific?.forwarderVersion } = params;

    if (address && !this.isValidAddress(address)) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    // base address is required to calculate the salt which is used in calculateForwarderV1Address method
    if (_.isUndefined(baseAddress) || !this.isValidAddress(baseAddress)) {
      throw new InvalidAddressError('invalid base address');
    }

    if (!_.isObject(coinSpecific)) {
      throw new InvalidAddressVerificationObjectPropertyError(
        'address validation failure: coinSpecific field must be an object'
      );
    }

    if (impliedForwarderVersion === 0 || impliedForwarderVersion === 3) {
      return true;
    } else {
      const ethNetwork = this.getNetwork();
      const forwarderFactoryAddress = ethNetwork?.forwarderFactoryAddress as string;
      const forwarderImplementationAddress = ethNetwork?.forwarderImplementationAddress as string;

      const initcode = getProxyInitcode(forwarderImplementationAddress);
      const saltBuffer = ethUtil.setLengthLeft(
        Buffer.from(ethUtil.padToEven(ethUtil.stripHexPrefix(coinSpecific.salt || '')), 'hex'),
        32
      );

      // Hash the wallet base address with the given salt, so the address directly relies on the base address
      const calculationSalt = optionalDeps.ethUtil.bufferToHex(
        optionalDeps.ethAbi.soliditySHA3(['address', 'bytes32'], [baseAddress, saltBuffer])
      );

      expectedAddress = calculateForwarderV1Address(forwarderFactoryAddress, calculationSalt, initcode);
      actualAddress = address;
    }

    if (expectedAddress !== actualAddress) {
      throw new UnexpectedAddressError(`address validation failure: expected ${expectedAddress} but got ${address}`);
    }

    return true;
  }

  /**
   *
   * @param {TransactionPrebuild} txPrebuild
   * @returns {boolean}
   */
  verifyCoin(txPrebuild: TransactionPrebuild): boolean {
    return txPrebuild.coin === this.getChain();
  }

  /**
   * Verify if a tss transaction is valid
   *
   * @param {VerifyEthTransactionOptions} params
   * @param {TransactionParams} params.txParams - params object passed to send
   * @param {TransactionPrebuild} params.txPrebuild - prebuild object returned by server
   * @param {Wallet} params.wallet - Wallet object to obtain keys to verify against
   * @returns {boolean}
   */
  verifyTssTransaction(params: VerifyEthTransactionOptions): boolean {
    const { txParams, txPrebuild, wallet } = params;
    if (
      !txParams?.recipients &&
      !(
        txParams.prebuildTx?.consolidateId ||
        (txParams.type && ['acceleration', 'fillNonce', 'transferToken'].includes(txParams.type))
      )
    ) {
      throw new Error(`missing txParams`);
    }
    if (!wallet || !txPrebuild) {
      throw new Error(`missing params`);
    }
    if (txParams.hop && txParams.recipients && txParams.recipients.length > 1) {
      throw new Error(`tx cannot be both a batch and hop transaction`);
    }
    return true;
  }

  /**
   * Verify that a transaction prebuild complies with the original intention
   *
   * @param {VerifyEthTransactionOptions} params
   * @param {TransactionParams} params.txParams - params object passed to send
   * @param {TransactionPrebuild} params.txPrebuild - prebuild object returned by server
   * @param {Wallet} params.wallet - Wallet object to obtain keys to verify against
   * @returns {boolean}
   */
  async verifyTransaction(params: VerifyEthTransactionOptions): Promise<boolean> {
    const ethNetwork = this.getNetwork();
    const { txParams, txPrebuild, wallet, walletType } = params;

    if (walletType === 'tss') {
      return this.verifyTssTransaction(params);
    }

    if (!txParams?.recipients || !txPrebuild?.recipients || !wallet) {
      throw new Error(`missing params`);
    }
    if (txParams.hop && txParams.recipients.length > 1) {
      throw new Error(`tx cannot be both a batch and hop transaction`);
    }
    if (txPrebuild.recipients.length !== 1) {
      throw new Error(`txPrebuild should only have 1 recipient but ${txPrebuild.recipients.length} found`);
    }
    if (txParams.hop && txPrebuild.hopTransaction) {
      // Check recipient amount for hop transaction
      if (txParams.recipients.length !== 1) {
        throw new Error(`hop transaction only supports 1 recipient but ${txParams.recipients.length} found`);
      }

      // Check tx sends to hop address
      const decodedHopTx = optionalDeps.EthTx.TransactionFactory.fromSerializedData(
        optionalDeps.ethUtil.toBuffer(txPrebuild.hopTransaction.tx)
      );
      const expectedHopAddress = optionalDeps.ethUtil.stripHexPrefix(decodedHopTx.getSenderAddress().toString());
      const actualHopAddress = optionalDeps.ethUtil.stripHexPrefix(txPrebuild.recipients[0].address);
      if (expectedHopAddress.toLowerCase() !== actualHopAddress.toLowerCase()) {
        throw new Error('recipient address of txPrebuild does not match hop address');
      }

      // Convert TransactionRecipient array to Recipient array
      const recipients: Recipient[] = txParams.recipients.map((r) => {
        return {
          address: r.address,
          amount: typeof r.amount === 'number' ? r.amount.toString() : r.amount,
        };
      });

      // Check destination address and amount
      await this.validateHopPrebuild(wallet, txPrebuild.hopTransaction, { recipients });
    } else if (txParams.recipients.length > 1) {
      // Check total amount for batch transaction
      let expectedTotalAmount = new BigNumber(0);
      for (let i = 0; i < txParams.recipients.length; i++) {
        expectedTotalAmount = expectedTotalAmount.plus(txParams.recipients[i].amount);
      }
      if (!expectedTotalAmount.isEqualTo(txPrebuild.recipients[0].amount)) {
        throw new Error(
          'batch transaction amount in txPrebuild received from BitGo servers does not match txParams supplied by client'
        );
      }

      // Check batch transaction is sent to the batcher contract address for the chain
      const batcherContractAddress = ethNetwork?.batcherContractAddress;
      if (
        !batcherContractAddress ||
        batcherContractAddress.toLowerCase() !== txPrebuild.recipients[0].address.toLowerCase()
      ) {
        throw new Error('recipient address of txPrebuild does not match batcher address');
      }
    } else {
      // Check recipient address and amount for normal transaction
      if (txParams.recipients.length !== 1) {
        throw new Error(`normal transaction only supports 1 recipient but ${txParams.recipients.length} found`);
      }
      const expectedAmount = new BigNumber(txParams.recipients[0].amount);
      if (!expectedAmount.isEqualTo(txPrebuild.recipients[0].amount)) {
        throw new Error(
          'normal transaction amount in txPrebuild received from BitGo servers does not match txParams supplied by client'
        );
      }
      if (
        this.isETHAddress(txParams.recipients[0].address) &&
        txParams.recipients[0].address !== txPrebuild.recipients[0].address
      ) {
        throw new Error('destination address in normal txPrebuild does not match that in txParams supplied by client');
      }
    }
    // Check coin is correct for all transaction types
    if (!this.verifyCoin(txPrebuild)) {
      throw new Error(`coin in txPrebuild did not match that in txParams supplied by client`);
    }
    return true;
  }

  /**
   * Check if address is valid eth address
   * @param address
   * @returns {boolean}
   */
  private isETHAddress(address: string): boolean {
    return !!address.match(/0x[a-fA-F0-9]{40}/);
  }

  /**
   * Transform message to accommodate specific blockchain requirements.
   * @param {string} message - the message to prepare
   * @return {string} the prepared message.
   */
  encodeMessage(message: string): string {
    const prefix = `\u0019Ethereum Signed Message:\n${message.length}`;
    return prefix.concat(message);
  }

  /**
   * Transform the Typed data to accomodate the blockchain requirements (EIP-712)
   * @param {TypedData} typedData - the typed data to prepare
   * @return {Buffer} a buffer of the result
   */
  encodeTypedData(typedData: TypedData): Buffer {
    const version = typedData.version;
    if (version === SignTypedDataVersion.V1) {
      throw new Error('SignTypedData v1 is not supported due to security concerns');
    }
    const typedDataRaw = JSON.parse(typedData.typedDataRaw);
    const sanitizedData = TypedDataUtils.sanitizeData(typedDataRaw as unknown as TypedMessage<any>);
    const parts = [Buffer.from('1901', 'hex')];
    const eip712Domain = 'EIP712Domain';
    parts.push(TypedDataUtils.hashStruct(eip712Domain, sanitizedData.domain, sanitizedData.types, version));

    if (sanitizedData.primaryType !== eip712Domain) {
      parts.push(
        TypedDataUtils.hashStruct(
          sanitizedData.primaryType as string,
          sanitizedData.message,
          sanitizedData.types,
          version
        )
      );
    }
    return Buffer.concat(parts);
  }

  /**
   * Build the data to transfer an ERC-721 or ERC-1155 token to another address
   * @param params
   */
  buildNftTransferData(params: BuildNftTransferDataOptions): string {
    const { tokenContractAddress, recipientAddress, fromAddress } = params;
    switch (params.type) {
      case 'ERC721': {
        const tokenId = params.tokenId;
        const contractData = new ERC721TransferBuilder()
          .tokenContractAddress(tokenContractAddress)
          .to(recipientAddress)
          .from(fromAddress)
          .tokenId(tokenId)
          .build();
        return contractData;
      }

      case 'ERC1155': {
        const entries = params.entries;
        const transferBuilder = new ERC1155TransferBuilder()
          .tokenContractAddress(tokenContractAddress)
          .to(recipientAddress)
          .from(fromAddress);

        for (const entry of entries) {
          transferBuilder.entry(parseInt(entry.tokenId, 10), entry.amount);
        }

        return transferBuilder.build();
      }
    }
  }
}
