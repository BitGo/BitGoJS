import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { AvalancheNetwork, BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import {
  AddDelegatorTx,
  ParseableOutput,
  SECPOwnerOutput,
  SECPTransferOutput,
  TransferableOutput,
  Tx,
  UnsignedTx,
} from 'avalanche/dist/apis/platformvm';
import { BinTools, BN } from 'avalanche';
import utils from './utils';

export class DelegatorTxBuilder extends TransactionBuilder {
  protected _nodeID: string;
  protected _startTime: BN;
  protected _endTime: BN;
  protected _stakeAmount: BN;

  /**
   *
   * @param coinConfig
   */
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    const network = coinConfig.network as AvalancheNetwork;
    this._stakeAmount = new BN(network.minStake);
  }

  /**
   * get transaction type
   * @protected
   */
  protected get transactionType(): TransactionType {
    return TransactionType.addDelegator;
  }

  /**
   * Addresses where reward should be deposit
   * @param {string | string[]} address - single address or array of addresses to receive rewards
   */
  rewardAddresses(address: string | string[]): this {
    const rewardAddresses = address instanceof Array ? address : [address];
    this.transaction._rewardAddresses = rewardAddresses.map(utils.parseAddress);
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
    const bintools = BinTools.getInstance();
    if (!(bintools.b58ToBuffer(nodeID.slice(7)).length === 24)) {
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
    // Untestable:
    // const oneDayLater = new BN(Date.now()).add(new BN(86400));
    // if (!startTime.gt(oneDayLater)) {
    //  throw new BuildTransactionError('Start time needs to be one day greater than current time');
    // }
    if (endTime < startTime) {
      throw new BuildTransactionError('End date cannot be less than start date');
    }
    if (startTime.add(new BN(this.transaction._network.minStakeDuration)).gt(endTime)) {
      throw new BuildTransactionError('End date must be greater than or equal to two weeks');
    }
    if (endTime.gt(startTime.add(new BN(this.transaction._network.maxStakeDuration)))) {
      throw new BuildTransactionError('End date must be less than or equal to one year');
    }
  }

  /**
   *
   * @param amount
   */
  validateStakeAmount(amount: BN): void {
    const minStake = new BN(this.transaction._network.minStake);
    if (amount.lt(minStake)) {
      throw new BuildTransactionError('Minimum staking amount is ' + Number(minStake) / 1000000000 + ' AVAX.');
    }
  }

  // endregion

  /**
   *
   * @protected
   */
  protected buildAvaxpTransaction(): void {
    this.validateStakeDuration(this._startTime, this._endTime);
    const { inputs, credentials, amount } = this.createInput();
    if (amount.lt(this._stakeAmount)) {
      throw new BuildTransactionError(
        `Utxo outputs get ${amount.toString()} and ${this._stakeAmount.toString()} is required`
      );
    }
    const outputs = this.changeOutputs(amount.sub(this._stakeAmount));
    this.transaction.setTransaction(
      new Tx(
        new UnsignedTx(
          new AddDelegatorTx(
            this.transaction._networkID,
            this.transaction._blockchainID,
            outputs,
            inputs,
            this.transaction._memo,
            utils.NodeIDStringToBuffer(this._nodeID),
            this._startTime,
            this._endTime,
            this._stakeAmount,
            [this.stakeTransferOut()],
            this.rewardOwnersOutput()
          )
        ),
        credentials
      )
    );
  }

  /**
   * Create the StakeOut where the recipient address are the sender.
   * @protected
   *
   */
  protected stakeTransferOut(): TransferableOutput {
    return new TransferableOutput(
      this.transaction._assetId,
      new SECPTransferOutput(
        this._stakeAmount,
        this.transaction._sender,
        this.transaction._locktime,
        this.transaction._threshold
      )
    );
  }

  protected rewardOwnersOutput(): ParseableOutput {
    // if there are no reward addresses, the sender gets the rewards
    if (!this.transaction._rewardAddresses || this.transaction._rewardAddresses.length === 0) {
      this.transaction._rewardAddresses = this.transaction._sender;
    }

    return new ParseableOutput(
      new SECPOwnerOutput(this.transaction._rewardAddresses, this.transaction._locktime, this.transaction._threshold)
    );
  }
}
