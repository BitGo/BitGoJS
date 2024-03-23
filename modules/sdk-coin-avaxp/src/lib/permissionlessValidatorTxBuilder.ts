import { TransactionBuilder } from './transactionBuilder';
import { BinTools, BN } from 'avalanche';
import { AvalancheNetwork, BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, NotSupported, TransactionType } from '@bitgo/sdk-core';
import utils from './utils';
// import { DeprecatedBaseTx, DeprecatedTx, Tx } from './iface';
import { Tx } from './iface';
// import { recoverUtxos } from './utxoEngine';
// import { BaseTx } from '@avalabs/avalanchejs/dist/serializable/avax';
// import { AddDelegatorTx, PlatformVMConstants, UnsignedTx } from 'avalanche/dist/apis/platformvm';
import { AddDelegatorTx, UnsignedTx } from 'avalanche/dist/apis/platformvm';
import { AddPermissionlessValidatorTx } from '@avalabs/avalanchejs/dist/serializable/pvm';
import { Tx as PVMTx } from 'avalanche/dist/apis/platformvm/tx';
import { TypeSymbols } from '@avalabs/avalanchejs/src/serializable/constants';

export class PermissionlessValidatorTxBuilder extends TransactionBuilder {
  protected _nodeID: string;
  protected _blsKey: string;
  protected _blsSignature: string;
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
    return TransactionType.AddPermissionlessValidator;
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
   *
   * @param blsKey
   */
  blsKey(blsKey: string): this {
    // TODO add
    // this.validateBlsKey(blsKey);
    this._blsKey = blsKey;
    return this;
  }

  /**
   *
   * @param blsSignature
   */
  blsSignature(blsSignature: string): this {
    // TODO add
    // this.validateBlsSignature(blsSignature);
    this._blsSignature = blsSignature;
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
    const oneDayLater = new BN(Date.now()).add(new BN(86400));
    if (!startTime.gt(oneDayLater)) {
      throw new BuildTransactionError('Start time needs to be one day greater than current time');
    }
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

  /** @inheritdoc */
  initBuilder(tx: Tx): this {
    // super.initBuilder(tx);
    super.initBuilder(tx.baseTx);
    // const baseTx: BaseTx = tx.getUnsignedTx().getTransaction();
    // const baseTx: BaseTx = tx.baseTx;
    if (!this.verifyTxType(tx)) {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }
    // // The StakeOuts is a {@link stakeTransferOut} result.
    // // It's expected to have only one outputs with the addresses of the sender.
    // const outputs = baseTx.getStakeOuts();
    // if (outputs.length != 1) {
    //   throw new BuildTransactionError('Transaction can have one external output');
    // }
    // const output = outputs[0];
    // if (!output.getAssetID().equals(this.transaction._assetId)) {
    //   throw new Error('The Asset ID of the output does not match the transaction');
    // }
    // const secpOut = output.getOutput();
    // this.transaction._locktime = secpOut.getLocktime();
    // this.transaction._threshold = secpOut.getThreshold();
    // // output addresses are the sender addresses
    // this.transaction._fromAddresses = secpOut.getAddresses();
    // this._nodeID = baseTx.getNodeIDString();
    // this._startTime = baseTx.getStartTime();
    // this._endTime = baseTx.getEndTime();
    // this._stakeAmount = baseTx.getStakeAmount();
    // this.transaction._utxos = recoverUtxos(baseTx.getIns());
    return this;
  }

  // static verifyTxType(baseTx: BaseTx): baseTx is AddPermissionlessValidatorTx {
  static verifyTxType(tx: Tx): tx is AddPermissionlessValidatorTx {
    // return tx.getTypeID() === PlatformVMConstants.ADDVALIDATORTX;
    return tx._type === TypeSymbols.AddPermissionlessValidatorTx;
    // return baseTx.getTypeID() === TypeSymbols.AddPermissionlessDelegatorTx;
  }

  // verifyTxType(baseTx: BaseTx): baseTx is AddPermissionlessValidatorTx {
  verifyTxType(tx: Tx): tx is AddPermissionlessValidatorTx {
    return PermissionlessValidatorTxBuilder.verifyTxType(tx);
  }

  /**
   *
   * @protected
   */
  protected buildAvaxTransaction(): void {
    this.validateStakeDuration(this._startTime, this._endTime);
    const { inputs, outputs, credentials } = this.createInputOutput();
    this.transaction.setTransaction(
      new PVMTx(
        new UnsignedTx(
          new AddDelegatorTx(
            this.transaction._networkID,
            this.transaction._blockchainID,
            outputs,
            inputs,
            undefined,
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
}
