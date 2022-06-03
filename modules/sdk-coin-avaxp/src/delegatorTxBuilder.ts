import { BaseAddress, BaseKey, BuildTransactionError, NotImplementedError, TransactionType } from '@bitgo/sdk-core';
// import { TransactionTypes } from './iface';
import { AvalancheNetwork, BaseCoin as CoinConfig } from '@bitgo/statics';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import {
  AddDelegatorTx,
  BaseTx,
  ParseableOutput,
  SECPOwnerOutput,
  SECPTransferInput,
  SECPTransferOutput,
  TransferableInput,
  TransferableOutput,
} from 'avalanche/dist/apis/platformvm';
import { BN } from 'avalanche';
import { DecodedUtxoObj } from './iface';
import utils from './utils';

export class DelegatorTxBuilder extends TransactionBuilder {
  protected _nodeID: string;
  protected _startTime: BN;
  protected _endTime: BN;
  protected _stakeAmount: BN;
  protected _rewardAddress: BaseAddress;

  /**
   *
   * @param coinConfig
   */
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    const network = coinConfig.network as AvalancheNetwork;
    this._stakeAmount = new BN(network.minStake.toString());
  }

  /**
   * @protected
   */
  protected get transactionType(): TransactionType {
    return 12;
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
   * @param startTime
   */
  startTime(value: string | number): this {
    this._startTime = new BN(value);
    return this;
  }

  /**
   *
   * @param endTime
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
    this.validateStakeAmount(new BN(value));
    this._stakeAmount = new BN(value);
    return this;
  }

  /**
   * Set the transaction source
   *
   * @param {BaseAddress} address The source account
   * @returns {TransactionBuilder} This transaction builder
   */
  rewardAddress(address: BaseAddress): this {
    this.validateAddress(address);
    this._rewardAddress = address;
    return this;
  }

  /**
   * region Validators
   */

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
    if (nodeID.length !== 40) {
      throw new BuildTransactionError('Invalid transaction: NodeID has incorrect length');
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
    if (endTime < startTime) {
      throw new BuildTransactionError('End date cannot be less than start date');
    }
    if (startTime.add(new BN(1209600)).gt(endTime)) {
      throw new BuildTransactionError('End date must be greater than or equal to two weeks');
    }
    if (endTime.gt(startTime.add(new BN(31556926)))) {
      throw new BuildTransactionError('End date must be less than or equal to one year');
    }
  }

  /**
   *
   * @param amount
   */
  validateStakeAmount(amount: BN): void {
    if (amount.lt(new BN(2000))) {
      throw new BuildTransactionError('Minimum staking amount is 2,000 AVAX');
    }
  }

  // endregion

  protected signImplementation(key: BaseKey): Transaction {
    throw new NotImplementedError('Method not implemented');
  }

  initBuilder(tx?: BaseTx): this {
    if (!tx) return this;
    const vtx = tx as AddDelegatorTx;
    this._nodeID = vtx.getNodeIDString();
    this._startTime = vtx.getStartTime();
    this._endTime = vtx.getEndTime();
    this._stakeAmount = vtx.getStakeAmount();
    this._utxos = this.recoverOtxos(vtx.getIns());

    return super.initBuilder(tx);
  }

  validateDelegationParams(buildDelegationTransactionParams: any): boolean {
    // this.validateNetworkID();
    // this.validateBlockchainID();
    // this.validateOutputs();
    // this.validateInputs();
    // this.validateMemo();
    // this.validateNodeID();
    // this.validateStakeDuration(this._startTime, this._endTime);
    // this.validateStakeAmount(this._stakeAmount.toNumber());
    // this.validateStakeTransferOutput();
    return true;
  }

  /**
   *
   * @protected
   */
  protected buildAvaxpTransaction(): BaseTx {
    const { inputs, outputs } = this.createInputOutput();
    return new AddDelegatorTx(
      this._networkID,
      this._blockchainID,
      outputs,
      inputs,
      this._memo,
      utils.NodeIDStringToBuffer(this._nodeID),
      this._startTime,
      this._endTime,
      this._stakeAmount,
      [this.stakeTransferOut()],
      this.rewardOwnersOutput()
    );
  }

  protected stakeTransferOut(): TransferableOutput {
    return new TransferableOutput(
      this._assetId,
      new SECPTransferOutput(this._stakeAmount, this._fromPubKeys, this._locktime, this._threshold)
    );
  }

  protected rewardOwnersOutput(): ParseableOutput {
    return new ParseableOutput(new SECPOwnerOutput(this._fromPubKeys, this._locktime, this._threshold));
  }
  protected recoverOtxos(inputs: TransferableInput[]): DecodedUtxoObj[] {
    return inputs.map((input) => {
      return {
        outputID: 7,
        outputidx: utils.cb58Encode(input.getOutputIdx()),
        txid: utils.cb58Encode(input.getTxID()),
        amount: (input.getInput() as SECPTransferInput).getAmount().toString(),
      };
    });
  }

  protected createInputOutput(): { inputs: TransferableInput[]; outputs: TransferableOutput[] } {
    const inputs: TransferableInput[] = [];
    const outputs: TransferableOutput[] = [];
    let total: BN = new BN(0);
    this._utxos.forEach((output, i) => {
      if (output.outputID === 7) {
        const txidBuf = utils.cb58Decode(output.txid);
        const amt: BN = new BN(output.amount);
        const outputidx = utils.cb58Decode(output.outputidx);
        total = total.add(amt);

        const secpTransferInput = new SECPTransferInput(amt);

        // TODO multisigner support
        secpTransferInput.addSignatureIdx(0, this._fromPubKeys[0]);

        const input: TransferableInput = new TransferableInput(txidBuf, outputidx, this._assetId, secpTransferInput);
        inputs.push(input);
      }
    });
    outputs.push(
      new TransferableOutput(
        this._assetId,
        new SECPTransferOutput(
          total.sub(this._txFee).sub(this._stakeAmount),
          this._fromPubKeys,
          this._locktime,
          this._threshold
        )
      )
    );

    return { inputs, outputs };
  }
}
