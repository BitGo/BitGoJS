import { BaseTransaction, BuildTransactionError } from '@bitgo/sdk-core';
import { PvmTransactionBuilder } from './pvmTransactionBuilder';
import {
  AddDelegatorTx,
  ParseableOutput,
  SECPOwnerOutput,
  SECPTransferOutput,
  TransferableOutput,
  Tx,
  UnsignedTx,
} from 'avalanche/dist/apis/platformvm';
import { BN, Buffer as BufferAvax } from 'avalanche';
import utils from './utils';

export class DelegatorTxBuilder extends PvmTransactionBuilder {
  protected _nodeID: string;
  protected _startTime: BN;
  protected _endTime: BN;
  protected _stakeAmount: BN;
  protected _rewardAddresses: BufferAvax[];
  protected _expectedBroadcastDate = Date.now();

  /**
   * Broadcast date is used to validate staking duration
   * It's useful from testing and rebuilding old transactions.
   * By default date is Date.now();
   * @param date
   */
  broadcastDate(date: number): this {
    this._expectedBroadcastDate = date;
    return this;
  }
  /**
   * Addresses where reward should be deposit
   * @param {string | string[]} address - single address or array of addresses to receive rewards
   */
  rewardAddresses(address: string | string[]): this {
    const rewardAddresses = address instanceof Array ? address : [address];
    this._rewardAddresses = rewardAddresses.map(utils.parseAddress);
    return this;
  }

  /**
   *
   * @param nodeID
   */
  nodeID(value: string): this {
    this.validateNodeID(value);
    this._nodeID = value;
    return this;
  }

  /**
   * start time of staking period
   * @param value
   */
  startTime(value: string | number): this {
    this._startTime = new BN(value);
    return this;
  }

  /**
   * end time of staking period
   * @param value
   */
  endTime(value: string | number): this {
    this._endTime = new BN(value);
    return this;
  }

  /**
   *
   * @param value
   */
  stakeAmount(value: BN | string): this {
    const valueBN = BN.isBN(value) ? value : new BN(value);
    this.validateStakeAmount(valueBN);
    this._stakeAmount = valueBN;
    return this;
  }

  // region Validators
  /**
   * validates a correct NodeID is used
   * @param nodeID
   */
  validateNodeID(nodeID: string): void {
    if (!nodeID) {
      throw new BuildTransactionError('Invalid transaction: missing nodeID');
    }
    if (nodeID.slice(0, 6) !== 'NodeID') {
      throw new BuildTransactionError('Invalid transaction: invalid NodeID tag');
    }
    if (!(utils.binTools.b58ToBuffer(nodeID.slice(7)).length === 24)) {
      throw new BuildTransactionError('Invalid transaction: NodeID is not in cb58 format');
    }
  }
  /**
   *
   *   protected _startTime: Date;
   *   protected _endTime: Date;
   *   2 weeks = 1209600
   *   1 year = 31556926
   *   unix time stamp based off seconds
   */
  validateStakeDuration(startTime: BN, endTime: BN): void {
    const oneDayLater = new BN(this._expectedBroadcastDate).add(new BN(86400));
    if (!startTime.gt(oneDayLater)) {
      throw new BuildTransactionError('Start time needs to be one day greater than current time');
    }
    if (endTime < startTime) {
      throw new BuildTransactionError('End date cannot be less than start date');
    }
    if (startTime.add(new BN(this._coinConfig.network.minStakeDuration)).gt(endTime)) {
      throw new BuildTransactionError('End date must be greater than or equal to two weeks');
    }
    if (endTime.gt(startTime.add(new BN(this._coinConfig.network.maxStakeDuration)))) {
      throw new BuildTransactionError('End date must be less than or equal to one year');
    }
  }

  /**
   *
   * @param amount
   */
  validateStakeAmount(amount: BN): void {
    const minStake = new BN(this._coinConfig.network.minDelegationStake);
    if (amount.lt(minStake)) {
      throw new BuildTransactionError('Minimum staking amount is ' + Number(minStake) / 1000000000 + ' AVAX.');
    }
  }

  // endregion

  /**
   *
   * @protected
   */
  protected buildAvaxTransaction(): void {
    const { inputs, amount, credentials } = this.createInput();
    const outputs = this.createChangeOutputs(amount.sub(this._stakeAmount));
    this.transaction.tx = new Tx(
      new UnsignedTx(
        new AddDelegatorTx(
          this._coinConfig.network.networkID,
          utils.binTools.cb58Decode(this._coinConfig.network.blockchainID),
          outputs,
          inputs,
          this._memo,
          utils.NodeIDStringToBuffer(this._nodeID),
          this._startTime,
          this._endTime,
          this._stakeAmount,
          [this.stakeTransferOut()],
          this.rewardOwnersOutput()
        )
      ),
      credentials
    );
  }

  /**
   * Create the StakeOut where the recipient address are the sender.
   * @protected
   *
   */
  protected stakeTransferOut(): TransferableOutput {
    return new TransferableOutput(
      this.assetID,
      new SECPTransferOutput(this._stakeAmount, this._fromAddresses, this._locktime, this._threshold)
    );
  }

  protected rewardOwnersOutput(): ParseableOutput {
    // if there are no reward addresses, the sender gets the rewards
    if (!this._rewardAddresses || this._rewardAddresses.length === 0) {
      this._rewardAddresses = this._fromAddresses;
    }

    return new ParseableOutput(new SECPOwnerOutput(this._rewardAddresses, this._locktime, this._threshold));
  }

  validateTransaction(_?: BaseTransaction): void {
    this.validateStakeDuration(this._startTime, this._endTime);
    if (!this._nodeID) {
      throw new Error('nodeID is required');
    }
    if (!this._stakeAmount) {
      throw new Error('stakeAmount is required');
    }
  }
}
