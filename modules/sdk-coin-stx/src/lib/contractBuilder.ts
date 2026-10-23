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
  tupleCV,
} from '@stacks/transactions';
import { InvalidParameterValueError } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { contractPrincipalCVFromString, isValidAddress, standardPrincipalCVFromString } from './utils';
import { ClarityValueJson } from './iface';
import { Utils } from '.';
import { CONTRACT_NAME_SENDMANY, VALID_POX5_CONTRACT_FUNCTION_NAMES, VALID_STAKING_CONTRACT_NAMES } from './constants';
import { AbstractContractBuilder } from './abstractContractBuilder';

export class ContractBuilder extends AbstractContractBuilder {
  private static readonly CLARITY_TYPE_VALUES = new Set<string>(Object.values(ClarityType));
  /** Clarity values that carry no `value` property in v7. */
  private static readonly VALUELESS_CLARITY_TYPES = new Set<string>([
    ClarityType.OptionalNone,
    ClarityType.BoolTrue,
    ClarityType.BoolFalse,
  ]);

  /**
   * Caller-supplied staking contracts this builder accepts **in addition to** the canonical ones
   * (pox-4 / pox-5 / send-many-memo). Empty by default, so behaviour is unchanged unless a caller
   * opts in. Lets a deployment target a different staking contract (e.g. a test/dummy pox-5, or a
   * future pox version) without an SDK change — the caller passes the name/address it is configured
   * with. Threaded in via the constructor so every path that rebuilds a transaction
   * (`factory.from(hex, { allowedStakingContracts })`) re-validates against the same rules.
   */
  private _allowedStakingContracts: ReadonlyArray<{ name: string; address: string }>;

  constructor(
    _coinConfig: Readonly<CoinConfig>,
    allowedStakingContracts: ReadonlyArray<{ name: string; address: string }> = []
  ) {
    super(_coinConfig);
    this._allowedStakingContracts = allowedStakingContracts;
  }

  allowedStakingContracts(contracts: ReadonlyArray<{ name: string; address: string }>): this {
    const list = contracts ?? [];
    const names = new Set<string>();
    for (const contract of list) {
      if (names.has(contract.name)) {
        throw new InvalidParameterValueError(`Duplicate staking contract name: ${contract.name}`);
      }
      names.add(contract.name);
    }
    this._allowedStakingContracts = list;
    return this;
  }

  /** True when the current (name, address) is a canonical pair or an explicitly allowlisted pair. */
  private isContractPairValid(): boolean {
    const isCanonicalName =
      VALID_STAKING_CONTRACT_NAMES.includes(this._contractName) || this._contractName === CONTRACT_NAME_SENDMANY;
    const isCanonicalAddress = Utils.isValidContractAddress(
      this._contractAddress,
      this._coinConfig.network as BitgoStacksNetwork
    );
    if (isCanonicalName && isCanonicalAddress) {
      return true;
    }
    return this._allowedStakingContracts.some(
      (contract) => contract.name === this._contractName && contract.address === this._contractAddress
    );
  }

  /** True when the name belongs to an allowlisted staking contract. */
  private isAllowedStakingContractName(name: string): boolean {
    return this._allowedStakingContracts.some((contract) => contract.name === name);
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    // Retro compatibility, checks parameters — run unchanged on every path. The allowlist is threaded
    // into this builder (constructor / `factory.from(hex, { allowedStakingContracts })`), so an
    // allowlisted contract re-validates against the same rules as on the build path, and a
    // non-allowlisted one is still rejected (no relaxation).
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
    const isCanonicalAddress = Utils.isValidContractAddress(address, this._coinConfig.network as BitgoStacksNetwork);
    const isAllowedAddress = this._allowedStakingContracts.some((contract) => contract.address === address);
    if (!isCanonicalAddress && !isAllowedAddress) {
      throw new InvalidParameterValueError('Invalid contract address');
    }
    this._contractAddress = address;
    // Order-independent: if the name is already set, the (name, address) pair must be valid.
    if (this._contractName && !this.isContractPairValid()) {
      throw new InvalidParameterValueError('Contract name and address are not an allowlisted pair');
    }
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
    const isCanonicalName = VALID_STAKING_CONTRACT_NAMES.includes(name) || name === CONTRACT_NAME_SENDMANY;
    if (!isCanonicalName && !this.isAllowedStakingContractName(name)) {
      throw new InvalidParameterValueError('Only pox-4, pox-5, and send-many-memo contracts supported');
    }
    this._contractName = name;
    // Order-independent: if the address is already set, the (name, address) pair must be valid.
    if (this._contractAddress && !this.isContractPairValid()) {
      throw new InvalidParameterValueError('Contract name and address are not an allowlisted pair');
    }
    // A caller-allowlisted contract (e.g. the dummy pox-5) is ABI-identical to the canonical pox-5,
    // so its functions are validated against the pox-5 set instead of being skipped. (A contract
    // with a genuinely different ABI would need to carry its own function list.)
    if (this._functionName) {
      const validFunction = this.isAllowedStakingContractName(name)
        ? VALID_POX5_CONTRACT_FUNCTION_NAMES.includes(this._functionName)
        : Utils.isValidContractFunctionName(this._functionName, name);
      if (!validFunction) {
        throw new InvalidParameterValueError(`${this._functionName} is not supported contract function name`);
      }
    }
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
    if (this.isAllowedStakingContractName(this._contractName)) {
      // Caller-allowlisted contract: validate against the canonical pox-5 function set (ABI-identical
      // copy) rather than skipping the check.
      if (!VALID_POX5_CONTRACT_FUNCTION_NAMES.includes(name)) {
        throw new InvalidParameterValueError(`${name} is not supported contract function name`);
      }
    } else if (!Utils.isValidContractFunctionName(name, this._contractName)) {
      throw new InvalidParameterValueError(`${name} is not supported contract function name`);
    }
    this._functionName = name;
    return this;
  }

  functionArgs(args: ClarityValueJson[] | ClarityValue[]): this {
    this._functionArgs = args.map((arg) => {
      if (this.isClarityValue(arg)) {
        // got direct clarity value after deserialization in fromImplementation
        return arg;
      }
      return this.parseCv(arg);
    });
    return this;
  }

  /**
   * Positive shape check: a fully-formed `ClarityValue` vs a JSON `ClarityValueJson` descriptor.
   *
   * In `@stacks/transactions` v7 the `ClarityType` values are lower-case strings (`'uint'`,
   * `'contract'`, `'address'`, ...). A raw clarity value carries a `type` that is one of those values
   * AND a `value` property (except the valueless `none` / `true` / `false`), and never a `val` field.
   * JSON descriptors use `type` names (e.g. `optional`, `list`, `response`, `tuple`, `buffer`,
   * `contractPrincipal`) and always carry `val` — a malformed descriptor like `{ type: 'list' }`
   * therefore falls through to `parseCv` so its validation errors still surface.
   */
  private isClarityValue(arg: ClarityValueJson | ClarityValue): arg is ClarityValue {
    if (typeof arg.type !== 'string' || !ContractBuilder.CLARITY_TYPE_VALUES.has(arg.type)) {
      return false;
    }
    if ('val' in arg) {
      return false;
    }
    return 'value' in arg || ContractBuilder.VALUELESS_CLARITY_TYPES.has(arg.type);
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
        return contractPrincipalCVFromString(arg.val);
      }
      case 'standardPrincipal':
      case 'standard-principal':
        if (typeof arg.val !== 'string') {
          throw new InvalidParameterValueError('standard principal requires string val');
        }
        return standardPrincipalCVFromString(arg.val);
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
