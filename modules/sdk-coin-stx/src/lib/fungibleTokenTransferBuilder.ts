import { BaseCoin as CoinConfig, NetworkType } from '@bitgo/statics';
import { AbstractContractBuilder } from './abstractContractBuilder';
import { Transaction } from './transaction';
import {
  functionArgsToTokenTransferParams,
  getSTXAddressFromPubKeys,
  isValidAddress,
  isValidContractFunctionName,
} from './utils';
import { InvalidParameterValueError } from '@bitgo/sdk-core';
import {
  AddressHashMode,
  AddressVersion,
  ClarityValue,
  ContractCallPayload,
  FungibleConditionCode,
  makeStandardFungiblePostCondition,
  PostCondition,
  PostConditionMode,
} from '@stacks/transactions';
import { TokenTransferParams } from './iface';
import BigNum from 'bn.js';
import { FUNCTION_NAME_TRANSFER } from './constants';

export class FungibleTokenTransferBuilder extends AbstractContractBuilder {
  private _fungibleTokenTransferParams: TokenTransferParams;
  private _tokenName: string;
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    this._fungibleTokenTransferParams = functionArgsToTokenTransferParams(
      (tx.stxTransaction.payload as ContractCallPayload).functionArgs
    );
    this.contractAddress(this._contractAddress);
    this.contractName(this._contractName);
    this.functionName(this._functionName);
    this.functionArgs(this._functionArgs);
    this._postConditionMode = PostConditionMode.Deny;
    this._postConditions = this.tokenTransferParamsToPostCondition(this._fungibleTokenTransferParams);
  }

  /**
   * Function to check if a transaction is a fungible token contract call
   *
   * @param {ContractCallPayload} payload
   * @returns {Boolean}
   */
  public static isFungibleTokenTransferContractCall(payload: ContractCallPayload): boolean {
    return FUNCTION_NAME_TRANSFER === payload.functionName.content;
  }

  /**
   * Set the token name
   *
   * @param {String} tokenName name of the token (@define-fungible-token value)
   * @returns {FungibleTokenTransferBuilder} This token transfer builder
   */
  tokenName(tokenName: string): this {
    this._tokenName = tokenName;
    return this;
  }

  /**
   * Validate contract address
   *
   * @param {String} address contract address
   * @returns {FungibleTokenTransferBuilder} This token transfer builder
   */
  contractAddress(address: string): this {
    if (!isValidAddress(address)) {
      throw new InvalidParameterValueError('Invalid address');
    }
    this._contractAddress = address;
    return this;
  }

  /**
   * Validate contract name
   *
   * @param {String} name contract name
   * @returns {FungibleTokenTransferBuilder} This token transfer builder
   */
  contractName(name: string): this {
    if (name.length === 0) {
      throw new InvalidParameterValueError('Invalid name');
    }
    this._contractName = name;
    return this;
  }

  /**
   * Validate function name
   *
   * @param {String} name function name
   * @returns {FungibleTokenTransferBuilder} This token transfer builder
   */
  functionName(name: string): this {
    if (name.length === 0) {
      throw new InvalidParameterValueError('Invalid name');
    }
    if (!isValidContractFunctionName(name)) {
      throw new InvalidParameterValueError(`${name} is not supported contract function name`);
    }
    this._functionName = name;
    return this;
  }

  /**
   * Validate function arguments
   *
   * @param {ClarityValue[]} args array of clarity value as arguments
   * @returns {FungibleTokenTransferBuilder} This token transfer builder
   */
  functionArgs(args: ClarityValue[]): this {
    if (args.length < 4) {
      throw new InvalidParameterValueError('Invalid number of arguments');
    }
    this._functionArgs = args;
    return this;
  }

  /**
   * Function to convert token transfer params to post condition
   *
   * @param {TokenTransferParams} tokenTransferParams
   * @returns {PostCondition[]} returns stx fungible post condition
   */
  private tokenTransferParamsToPostCondition(tokenTransferParams: TokenTransferParams): PostCondition[] {
    const amount: BigNum = new BigNum(tokenTransferParams.amount);
    return [
      makeStandardFungiblePostCondition(
        getSTXAddressFromPubKeys(
          this._fromPubKeys,
          this._coinConfig.network.type === NetworkType.MAINNET
            ? AddressVersion.MainnetMultiSig
            : AddressVersion.TestnetMultiSig,
          this._fromPubKeys.length > 1 ? AddressHashMode.SerializeP2SH : AddressHashMode.SerializeP2PKH,
          this._numberSignatures
        ).address,
        FungibleConditionCode.Equal,
        amount,
        `${this._contractAddress}.${this._contractName}::${this._tokenName}`
      ),
    ];
  }
}
