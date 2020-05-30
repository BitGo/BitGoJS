import ethUtil from 'ethereumjs-util';
import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { isValidAmount, isValidEthAddress, getRawDecoded, getBufferedByteCode } from '../eth/utils';
import { BuildTransactionError, InvalidParameterValueError, InvalidTransactionError } from '../baseCoin/errors';
import { StakingOperationTypes } from '../baseCoin';
import { StakingCall } from './stakingCall';
import { getOperationConfig, VoteMethodId } from './stakingUtils';

export class StakingBuilder {
  private _amount: string;
  private _groupToVote: string;
  private _lesser = '';
  private _greater = '';
  private _type: StakingOperationTypes;
  private _coinConfig: Readonly<CoinConfig>;

  constructor(coinConfig: Readonly<CoinConfig>, serializedData?: string) {
    this._coinConfig = coinConfig;
    if (serializedData) {
      this.decodeStakingData(serializedData);
    }
  }

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

  for(groupToVote: string): this {
    if (!isValidEthAddress(groupToVote)) {
      throw new InvalidParameterValueError('Invalid address to vote for');
    }
    this._groupToVote = groupToVote;
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

  build(): StakingCall {
    this.validateMandatoryFields();
    switch (this._type) {
      case StakingOperationTypes.LOCK:
        return this.buildLockStaking();
      case StakingOperationTypes.VOTE:
        this.validateVoteFields();
        return this.buildVoteStaking();
      default:
        throw new InvalidTransactionError('Invalid staking operation: ' + this._type);
    }
  }

  private validateMandatoryFields(): void {
    if (!(this._type !== undefined && this._coinConfig)) {
      throw new BuildTransactionError('Missing staking mandatory fields. Type and coin are required');
    }
  }

  private buildLockStaking(): StakingCall {
    const operation = getOperationConfig(this._type, this._coinConfig.network.type);
    return new StakingCall(this._amount, operation.contractAddress, operation.methodId, operation.types, []);
  }

  private validateVoteFields(): void {
    if (!this._groupToVote) {
      throw new BuildTransactionError('Missing group to vote for');
    }

    if (this._lesser === this._greater) {
      throw new BuildTransactionError('Greater and lesser values should not the same');
    }
  }

  private buildVoteStaking(): StakingCall {
    const operation = getOperationConfig(this._type, this._coinConfig.network.type);
    const params = [this._groupToVote, this._amount, this._lesser, this._greater];
    return new StakingCall('0', operation.contractAddress, operation.methodId, operation.types, params);
  }

  private decodeStakingData(data: string): void {
    if (!data.startsWith(VoteMethodId)) {
      throw new BuildTransactionError(`Invalid staking bytecode: ${data}`);
    }

    this._type = StakingOperationTypes.VOTE;
    const operation = getOperationConfig(this._type, this._coinConfig.network.type);
    const decoded = getRawDecoded(operation.types, getBufferedByteCode(operation.methodId, data));
    if (decoded.length != 4) {
      throw new BuildTransactionError(`Invalid decoded data: ${data}`);
    }
    const [groupToVote, amount, lesser, greater] = decoded;

    this._amount = ethUtil.bufferToHex(amount);
    this._groupToVote = ethUtil.bufferToHex(groupToVote);
    this._lesser = ethUtil.bufferToHex(lesser);
    this._greater = ethUtil.bufferToHex(greater);
  }
}
