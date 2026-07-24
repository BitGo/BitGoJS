import * as ethUtil from 'ethereumjs-util';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  isValidAmount,
  isValidEthAddress,
  getRawDecoded,
  getBufferedByteCode,
  hexStringToNumber,
} from '@bitgo/sdk-coin-eth';
import {
  ActivateMethodId,
  BuildTransactionError,
  getOperationConfig,
  InvalidParameterValueError,
  InvalidTransactionError,
  StakingOperationTypes,
  UnlockMethodId,
  UnvoteMethodId,
  VoteMethodId,
  WithdrawMethodId,
} from '@bitgo/sdk-core';
import { StakingCall } from './stakingCall';

export class StakingBuilder {
  private readonly DEFAULT_ADDRESS = '0x0000000000000000000000000000000000000000';
  private _amount: string;
  private _validatorGroup: string;
  private _lesser = this.DEFAULT_ADDRESS;
  private _greater = this.DEFAULT_ADDRESS;
  private _index: number;
  private _type: StakingOperationTypes;
  private _coinConfig: Readonly<CoinConfig>;

  constructor(coinConfig: Readonly<CoinConfig>, serializedData?: string) {
    this._coinConfig = coinConfig;
    if (serializedData) {
      this.decodeStakingData(serializedData);
    }
  }

  // region Staking properties

  type(type: StakingOperationTypes): this {
    this._type = type;
    return this;
  }

  amount(value: string): this {
    if (!isValidAmount(value)) {
      throw new InvalidParameterValueError('Invalid value for stake transaction');
    }
    this._amount = value;
    return this;
  }

  group(validatorGroup: string): this {
    if (!isValidEthAddress(validatorGroup)) {
      throw new InvalidParameterValueError('Invalid validator group address');
    }
    this._validatorGroup = validatorGroup;
    return this;
  }

  lesser(lesser: string): this {
    if (!isValidEthAddress(lesser)) {
      throw new InvalidParameterValueError('Invalid address for lesser');
    }
    this._lesser = lesser;
    return this;
  }

  greater(greater: string): this {
    if (!isValidEthAddress(greater)) {
      throw new InvalidParameterValueError('Invalid address for greater');
    }
    this._greater = greater;
    return this;
  }

  index(index: number): this {
    if (index < 0) {
      throw new InvalidParameterValueError('Invalid index for staking transaction');
    }
    this._index = index;
    return this;
  }

  // endregion

  // region Staking building

  build(): StakingCall {
    this.validateMandatoryFields();
    switch (this._type) {
      case StakingOperationTypes.LOCK:
        this.validateAmount();
        return this.buildLockStaking();
      case StakingOperationTypes.VOTE:
        this.validateElectionFields();
        return this.buildVoteStaking();
      case StakingOperationTypes.ACTIVATE:
        this.validateGroup();
        return this.buildActivateStaking();
      case StakingOperationTypes.UNVOTE:
        this.validateUnvoteFields();
        return this.buildUnvoteStaking();
      case StakingOperationTypes.UNLOCK:
        this.validateAmount();
        return this.buildUnlockStaking();
      case StakingOperationTypes.WITHDRAW:
        this.validateIndex();
        return this.buildWithdrawStaking();
      default:
        throw new InvalidTransactionError('Invalid staking operation: ' + this._type);
    }
  }

  /**
   * Builds a lock gold operation sending the amount on the transaction value field
   *
   * @returns {StakingCall} a lock gold operation using the LockedGold contract
   */
  private buildLockStaking(): StakingCall {
    const operation = getOperationConfig(this._type, this._coinConfig.network.type);
    return new StakingCall(this._amount, operation.contractAddress, operation.methodId, operation.types, []);
  }

  /**
   * Builds an unlock gold operation sending the amount encoded on the data field
   *
   * params
   * amount: amount of locked gold to be unlocked
   *
   * @returns {StakingCall} an unlock gold operation using the LockedGold contract
   */
  private buildUnlockStaking(): StakingCall {
    const operation = getOperationConfig(this._type, this._coinConfig.network.type);
    const params = [this._amount];
    return new StakingCall('0', operation.contractAddress, operation.methodId, operation.types, params);
  }

  /**
   * Builds a vote operation that uses locked gold to add pending votes for a validator group.
   *
   * params
   * validatorGroup: group to vote for
   * amount: amount of votes (locked gold) for the group
   * lesser: validator group that has less votes than the validatorGroup
   * greater: validator group that has more vots than the validatorGroup
   *
   * @returns {StakingCall} an vote operation using the Election contract
   */
  private buildVoteStaking(): StakingCall {
    const operation = getOperationConfig(this._type, this._coinConfig.network.type);
    const params = [this._validatorGroup, this._amount, this._lesser, this._greater];
    return new StakingCall('0', operation.contractAddress, operation.methodId, operation.types, params);
  }

  /**
   * Builds an unvote operation to revoke active votes for a validator group.
   *
   * params
   * validatorGroup: group whose votes will be revoked
   * amount: amount of votes (locked gold) that will be revoked
   * lesser: validator group that has less votes than the validatorGroup
   * greater: validator group that has more vots than the validatorGroup
   * index: index of the validatorGroup on the list of groups the address has voted for
   *
   * @returns {StakingCall} an vote operation using the Election contract
   */
  private buildUnvoteStaking(): StakingCall {
    const operation = getOperationConfig(this._type, this._coinConfig.network.type);
    const params = [this._validatorGroup, this._amount, this._lesser, this._greater, this._index.toString()];
    return new StakingCall('0', operation.contractAddress, operation.methodId, operation.types, params);
  }

  /**
   * Builds an activate vote operation to change all the votes casted for a validator
   * from 'pending' to 'active'
   *
   * params
   * validatorGroup: group whose votes will be activated
   *
   * @returns {StakingCall} an activate votes operation
   */
  private buildActivateStaking(): StakingCall {
    const operation = getOperationConfig(this._type, this._coinConfig.network.type);
    const params = [this._validatorGroup];
    return new StakingCall('0', operation.contractAddress, operation.methodId, operation.types, params);
  }

  /**
   * Builds a withdraw operation for locked gold that has been unlocked
   * after the unlocking period has passed.
   *
   * params
   * index: index of the unlock operation whose unlocking period has passed.
   *
   * @returns {StakingCall} an activate votes operation
   */
  private buildWithdrawStaking(): StakingCall {
    const operation = getOperationConfig(this._type, this._coinConfig.network.type);
    const params = [this._index.toString()];
    return new StakingCall('0', operation.contractAddress, operation.methodId, operation.types, params);
  }

  // endregion

  // region Validation methods

  private validateMandatoryFields(): void {
    if (!(this._type !== undefined && this._coinConfig)) {
      throw new BuildTransactionError('Missing staking mandatory fields. Type and coin are required');
    }
  }

  private validateElectionFields(): void {
    this.validateGroup();
    this.validateAmount();
    if (this._lesser === this._greater) {
      throw new BuildTransactionError('Greater and lesser values should not be the same');
    }
  }

  private validateIndex(): void {
    if (this._index === undefined) {
      throw new BuildTransactionError('Missing index for staking transaction');
    }
  }

  private validateAmount(): void {
    if (this._amount === undefined) {
      throw new BuildTransactionError('Missing amount for staking transaction');
    }
  }

  private validateUnvoteFields(): void {
    this.validateElectionFields();
    this.validateIndex();
  }

  private validateGroup(): void {
    if (!this._validatorGroup) {
      throw new BuildTransactionError('Missing validator group for staking transaction');
    }
  }

  // endregion

  // region Deserialization methods
  private decodeStakingData(data: string): void {
    this.classifyStakingType(data);

    const operation = getOperationConfig(this._type, this._coinConfig.network.type);
    const decoded = getRawDecoded(operation.types, getBufferedByteCode(operation.methodId, data));
    switch (this._type) {
      case StakingOperationTypes.VOTE:
        this.validateDecodedDataLength(decoded.length, 4, data);
        const [groupToVote, amount, lesser, greater] = decoded;
        this._amount = ethUtil.bufferToHex(amount as Buffer);
        this._validatorGroup = ethUtil.addHexPrefix(groupToVote as string);
        this._lesser = ethUtil.addHexPrefix(lesser as string);
        this._greater = ethUtil.addHexPrefix(greater as string);
        break;
      case StakingOperationTypes.UNVOTE:
        this.validateDecodedDataLength(decoded.length, 5, data);
        const [groupToUnvote, amountUnvote, lesserUnvote, greaterUnvote, indexUnvote] = decoded;
        this._validatorGroup = ethUtil.addHexPrefix(groupToUnvote as string);
        this._amount = ethUtil.bufferToHex(amountUnvote as Buffer);
        this._lesser = ethUtil.addHexPrefix(lesserUnvote as string);
        this._greater = ethUtil.addHexPrefix(greaterUnvote as string);
        this._index = hexStringToNumber(ethUtil.bufferToHex(indexUnvote as Buffer));
        break;
      case StakingOperationTypes.ACTIVATE:
        this.validateDecodedDataLength(decoded.length, 1, data);
        const [groupToActivate] = decoded;
        this._validatorGroup = ethUtil.addHexPrefix(groupToActivate as string);
        break;
      case StakingOperationTypes.UNLOCK:
        if (decoded.length !== 1) {
          throw new BuildTransactionError(`Invalid unlock decoded data: ${data}`);
        }
        const [decodedAmount] = decoded;
        this._amount = ethUtil.bufferToHex(decodedAmount as Buffer);
        break;
      case StakingOperationTypes.WITHDRAW:
        this.validateDecodedDataLength(decoded.length, 1, data);
        const [index] = decoded;
        this._index = hexStringToNumber(ethUtil.bufferToHex(index as Buffer));
        break;
      default:
        throw new BuildTransactionError(`Invalid staking data: ${this._type}`);
    }
  }

  private validateDecodedDataLength(actual: number, expected: number, data: string): void {
    if (actual !== expected) {
      throw new BuildTransactionError(`Invalid staking decoded data: ${data}`);
    }
  }

  private classifyStakingType(data: string): void {
    if (data.startsWith(VoteMethodId)) {
      this._type = StakingOperationTypes.VOTE;
    } else if (data.startsWith(UnvoteMethodId)) {
      this._type = StakingOperationTypes.UNVOTE;
    } else if (data.startsWith(ActivateMethodId)) {
      this._type = StakingOperationTypes.ACTIVATE;
    } else if (data.startsWith(UnlockMethodId)) {
      this._type = StakingOperationTypes.UNLOCK;
    } else if (data.startsWith(WithdrawMethodId)) {
      this._type = StakingOperationTypes.WITHDRAW;
    } else {
      throw new BuildTransactionError(`Invalid staking bytecode: ${data}`);
    }
  }

  // endregion
}
