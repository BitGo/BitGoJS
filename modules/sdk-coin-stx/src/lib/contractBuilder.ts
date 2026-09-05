import { BaseCoin as CoinConfig, StacksNetwork as BitgoStacksNetwork } from '@bitgo/statics';
import {
  bufferCV,
  bufferCVFromString,
  ClarityAbiType,
  ClarityType,
  ClarityValue,
  encodeClarityValue,
  noneCV,
  listCV,
  responseErrorCV,
  responseOkCV,
  someCV,
  contractPrincipalCV,
  standardPrincipalCV,
  tupleCV,
} from '@stacks/transactions';
import { InvalidParameterValueError } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { isValidAddress } from './utils';
import { ClarityValueJson } from './iface';
import { Utils } from '.';
import { CONTRACT_NAME_SENDMANY, VALID_STAKING_CONTRACT_NAMES } from './constants';
import { AbstractContractBuilder } from './abstractContractBuilder';

export class ContractBuilder extends AbstractContractBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    // Retro compatibility, checks parameters.
    this.contractAddress(this._contractAddress);
    this.contractName(this._contractName);
    this.functionName(this._functionName);
    this.functionArgs(this._functionArgs);
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
    if (!Utils.isValidContractAddress(address, this._coinConfig.network as BitgoStacksNetwork)) {
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
    if (!VALID_STAKING_CONTRACT_NAMES.includes(name) && name !== CONTRACT_NAME_SENDMANY) {
      throw new InvalidParameterValueError('Only pox-4, pox-5, and send-many-memo contracts supported');
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
    if (!Utils.isValidContractFunctionName(name, this._contractName)) {
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
      case 'list':
        if (arg.val instanceof Array) {
          return listCV(arg.val.map((value) => this.parseCv(value)));
        }
        throw new InvalidParameterValueError('list requires Array val');
      case 'response':
        if (arg.val && typeof arg.val === 'object' && !Array.isArray(arg.val)) {
          const response = arg.val as { type?: string; val?: ClarityValueJson };
          if (response.type === 'ok' && response.val !== undefined) {
            return responseOkCV(this.parseCv(response.val));
          }
          if (response.type === 'err' && response.val !== undefined) {
            return responseErrorCV(this.parseCv(response.val));
          }
        }
        throw new InvalidParameterValueError('response requires { type: ok|err, val }');
      case 'tuple':
        if (arg.val instanceof Array) {
          const data = {};
          arg.val.forEach((a) => {
            data[a.key] = this.parseCv({ type: a.type, val: a.val });
          });
          return tupleCV(data);
        }
        throw new InvalidParameterValueError('tuple require Array val');
      case 'contractPrincipal':
      case 'contract-principal': {
        if (typeof arg.val !== 'string') {
          throw new InvalidParameterValueError('contract principal requires string val');
        }
        const separator = arg.val.indexOf('.');
        if (separator <= 0 || separator === arg.val.length - 1 || arg.val.indexOf('.', separator + 1) !== -1) {
          throw new InvalidParameterValueError('contract principal must have address.contract-name format');
        }
        return contractPrincipalCV(arg.val.slice(0, separator), arg.val.slice(separator + 1));
      }
      case 'standardPrincipal':
      case 'standard-principal':
        if (typeof arg.val !== 'string') {
          throw new InvalidParameterValueError('standard principal requires string val');
        }
        return standardPrincipalCV(arg.val);
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
