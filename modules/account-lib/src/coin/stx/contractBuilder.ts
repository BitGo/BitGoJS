import { BaseCoin as CoinConfig } from '@bitgo/statics';
import BigNum from 'bn.js';
import {
  bufferCV,
  bufferCVFromString,
  ClarityAbiType,
  ClarityType,
  ClarityValue,
  ContractCallOptions,
  encodeClarityValue,
  makeUnsignedContractCall,
  noneCV,
  PayloadType,
  someCV,
  tupleCV,
  UnsignedContractCallOptions,
  UnsignedMultiSigContractCallOptions,
} from '@stacks/transactions';
import { TransactionType } from '../baseCoin';
import { BuildTransactionError, InvalidParameterValueError, InvalidTransactionError } from '../baseCoin/errors';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { isValidAddress } from './utils';
import { ClarityValueJson } from './iface';
import { Utils } from '.';

export class ContractBuilder extends TransactionBuilder {
  private _options: UnsignedContractCallOptions | UnsignedMultiSigContractCallOptions;
  private _contractAddress: string;
  private _contractName: string;
  private _functionName: string;
  private _functionArgs: ClarityValue[];
  private _anchorMode: number;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._anchorMode = 3;
  }

  initBuilder(tx: Transaction): void {
    const txData = tx.toJson();
    if (txData.payload === undefined) {
      throw new InvalidTransactionError('payload must not be undefined');
    }
    if (txData.payload.payloadType === PayloadType.ContractCall) {
      this.contractAddress(txData.payload.contractAddress);
      this.contractName(txData.payload.contractName);
      this.functionName(txData.payload.functionName);
      this.functionArgs(txData.payload.functionArgs);
      super.initBuilder(tx);
    } else {
      throw new BuildTransactionError('Transaction should be contract call');
    }
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this._options = this.buildContractCallOptions();
    this.transaction.setTransactionType(TransactionType.ContractCall);
    this.transaction.stxTransaction = await makeUnsignedContractCall(this._options);
    return await super.buildImplementation();
  }

  private buildContractCallOptions(): UnsignedContractCallOptions | UnsignedMultiSigContractCallOptions {
    const defaultOpts: ContractCallOptions = {
      contractAddress: this._contractAddress,
      contractName: this._contractName,
      functionName: this._functionName,
      functionArgs: this._functionArgs,
      anchorMode: this._anchorMode,
      network: this._network,
      fee: new BigNum(this._fee.fee),
      nonce: new BigNum(this._nonce),
    };
    if (this._fromPubKeys.length === 1) {
      return {
        ...defaultOpts,
        publicKey: this._fromPubKeys[0],
      };
    } else if (this._fromPubKeys.length > 1) {
      return {
        ...defaultOpts,
        publicKeys: this._fromPubKeys,
        numSignatures: this._numberSignatures,
      };
    } else {
      throw new InvalidParameterValueError('supply at least 1 public key');
    }
  }

  // region Contract fields
  /**
   * Set the contract address
   *
   * @param {string} address the address deployed the contract
   * @returns {ContractBuilder} the builder with the new parameter set
   */
  contractAddress(address: string): this {
    if (!isValidAddress(address)) {
      throw new InvalidParameterValueError('Invalid address');
    }
    if (!Utils.isValidContractAddress(address, this._network)) {
      throw new InvalidParameterValueError('Invalid contract address');
    }
    this._contractAddress = address;
    return this;
  }

  /**
   * Set the contract name
   *
   * @param {string} name name of contract
   * @returns {ContractBuilder} the builder with the new parameter set
   */
  contractName(name: string): this {
    if (name.length === 0) {
      throw new InvalidParameterValueError('Invalid name');
    }
    if (name !== 'pox') {
      throw new InvalidParameterValueError('Only pox contract supported');
    }
    this._contractName = name;
    return this;
  }

  /**
   * Set the function name in contract
   *
   * @param {string} name name of function
   * @returns {ContractBuilder} the builder with the new parameter set
   */
  functionName(name: string): this {
    if (name.length === 0) {
      throw new InvalidParameterValueError('Invalid name');
    }
    if (!Utils.isValidContractFunctionName(name)) {
      throw new InvalidParameterValueError(`${name} is not supported contract function name`);
    }
    this._functionName = name;
    return this;
  }

  functionArgs(args: ClarityValueJson[] | ClarityValue[]): this {
    this._functionArgs = args.map((arg) => {
      if (!ClarityType[arg.type]) {
        return this.parseCv(arg);
      } else {
        // got direct clarity value after deserialization in fromImplementation
        return arg;
      }
    });
    return this;
  }

  private parseCv(arg: ClarityValueJson): ClarityValue {
    switch (arg.type) {
      case 'optional':
        if (arg.val === undefined) {
          return noneCV();
        } else {
          return someCV(this.parseCv(arg.val));
        }
      case 'tuple':
        if (arg.val instanceof Array) {
          const data = {};
          arg.val.forEach((a) => {
            data[a.key] = this.parseCv({ type: a.type, val: a.val });
          });
          return tupleCV(data);
        }
        throw new InvalidParameterValueError('tuple require Array val');
      case 'buffer':
        if (arg.val instanceof Buffer) {
          return bufferCV(arg.val);
        }
        const nval = Number(arg.val);
        if (nval) {
          return bufferCV(Buffer.of(nval));
        }
        return bufferCVFromString(arg.val);
      default:
        return encodeClarityValue(arg.type as ClarityAbiType, arg.val);
    }
  }
}
