import { BaseAddress, BuildTransactionError, NotSupported, TransactionType } from '@bitgo/sdk-core';
import { AvalancheNetwork, BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import {
  AddDelegatorTx,
  BaseTx,
  ParseableOutput,
  PlatformVMConstants,
  SECPOwnerOutput,
  SECPTransferInput,
  SECPTransferOutput,
  SelectCredentialClass,
  TransferableInput,
  TransferableOutput,
  Tx,
  UnsignedTx,
} from 'avalanche/dist/apis/platformvm';
import { BinTools, BN } from 'avalanche';
import { DecodedUtxoObj } from './iface';
import utils from './utils';
import { Credential } from 'avalanche/dist/common';

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

  initBuilder(tx: Tx): this {
    super.initBuilder(tx);
    const baseTx: BaseTx = tx.getUnsignedTx().getTransaction();
    if (!this.verifyTxType(baseTx)) {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }
    this._nodeID = baseTx.getNodeIDString();
    this._startTime = baseTx.getStartTime();
    this._endTime = baseTx.getEndTime();
    this._stakeAmount = baseTx.getStakeAmount();
    this.transaction._utxos = this.recoverUtxos(baseTx.getIns());
    return this;
  }

  static verifyTxType(baseTx: BaseTx): baseTx is AddDelegatorTx {
    return baseTx.getTypeID() === PlatformVMConstants.ADDVALIDATORTX;
  }

  verifyTxType(baseTx: BaseTx): baseTx is AddDelegatorTx {
    return DelegatorTxBuilder.verifyTxType(baseTx);
  }

  /**
   *
   * @protected
   */
  protected buildAvaxpTransaction(): void {
    this.validateStakeDuration(this._startTime, this._endTime);
    const { inputs, outputs, credentials } = this.createInputOutput();
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

  protected stakeTransferOut(): TransferableOutput {
    return new TransferableOutput(
      this.transaction._assetId,
      new SECPTransferOutput(
        this._stakeAmount,
        this.transaction._fromAddresses,
        this.transaction._locktime,
        this.transaction._threshold
      )
    );
  }

  protected rewardOwnersOutput(): ParseableOutput {
    return new ParseableOutput(
      new SECPOwnerOutput(this.transaction._fromAddresses, this.transaction._locktime, this.transaction._threshold)
    );
  }

  /**
   * Inputs can be controlled but outputs get reordered in transactions
   * In order to make sure that the mapping is always correct we create an addressIndx which matches to the appropiate
   * signatureIdx
   * @param inputs
   * @protected
   */
  protected recoverUtxos(inputs: TransferableInput[]): DecodedUtxoObj[] {
    return inputs.map((input) => {
      const secpInput: SECPTransferInput = input.getInput() as SECPTransferInput;
      // Order Addresses as output was defined.
      const addressesIndex: number[] = secpInput.getSigIdxs().map((s) => s.toBuffer().readUInt32BE(0));

      return {
        outputID: 7,
        outputidx: utils.cb58Encode(input.getOutputIdx()),
        txid: utils.cb58Encode(input.getTxID()),
        amount: secpInput.getAmount().toString(),
        threshold: this.transaction._threshold,
        addresses: [],
        addressesIndex,
      };
    });
  }

  /**
   * Threshold must be 2 and since output always get reordered we want to make sure we can always add signatures in the correct location
   * To find the correct location for the signature, we use the ouput's addresses to create the signatureIdx in the order that we desire
   * 0: user key, 1: recovery key, 2: hsm key
   * @protected
   */
  protected createInputOutput(): {
    inputs: TransferableInput[];
    outputs: TransferableOutput[];
    credentials: Credential[];
  } {
    const inputs: TransferableInput[] = [];
    const outputs: TransferableOutput[] = [];
    const addresses = this.transaction._fromAddresses.map((b) =>
      utils.addressToString(this.transaction._network.hrp, this.transaction._network.alias, b)
    );
    let total: BN = new BN(0);
    const totalTarget = this._stakeAmount.clone().add(this.transaction._txFee);
    const credentials: Credential[] = [];

    this.transaction._utxos.forEach((outputs) => {
      if (!outputs.addressesIndex || outputs.addressesIndex.length == 0) {
        outputs.addressesIndex = addresses.map((a) => outputs.addresses.indexOf(a));
      }
    });

    this.transaction._utxos
      .filter(
        (output) =>
          output.threshold === this.transaction._threshold &&
          (output.addressesIndex?.length == 3 || !output.addressesIndex?.includes(-1))
      )
      .forEach((output, i) => {
        if (output.outputID === 7 && total.lte(totalTarget)) {
          const txidBuf = utils.cb58Decode(output.txid);
          const amt: BN = new BN(output.amount);
          const outputidx = utils.cb58Decode(output.outputidx);
          const addressesIndex = output.addressesIndex ?? [];
          const isRawUtxos = output.addresses.length == 0;
          const firstIndex = this.recoverSigner ? 1 : 0;
          total = total.add(amt);

          const secpTransferInput = new SECPTransferInput(amt);

          if (isRawUtxos) {
            addressesIndex.forEach((i) => secpTransferInput.addSignatureIdx(i, this.transaction._fromAddresses[i]));
          } else {
            if (addressesIndex[firstIndex] > addressesIndex[2]) {
              secpTransferInput.addSignatureIdx(addressesIndex[2], this.transaction._fromAddresses[2]);
              secpTransferInput.addSignatureIdx(
                addressesIndex[firstIndex],
                this.transaction._fromAddresses[firstIndex]
              );
              credentials.push(
                SelectCredentialClass(
                  secpTransferInput.getCredentialID(),
                  ['', this.transaction._fromAddresses[firstIndex].toString('hex')].map(utils.createSig)
                )
              );
            } else {
              secpTransferInput.addSignatureIdx(
                addressesIndex[firstIndex],
                this.transaction._fromAddresses[firstIndex]
              );
              secpTransferInput.addSignatureIdx(addressesIndex[2], this.transaction._fromAddresses[2]);
              credentials.push(
                SelectCredentialClass(
                  secpTransferInput.getCredentialID(),
                  [this.transaction._fromAddresses[firstIndex].toString('hex'), ''].map(utils.createSig)
                )
              );
            }
          }

          const input: TransferableInput = new TransferableInput(
            txidBuf,
            outputidx,
            this.transaction._assetId,
            secpTransferInput
          );
          inputs.push(input);
        }
      });
    if (total.lt(totalTarget)) {
      throw new BuildTransactionError(`Utxo outputs get ${total.toString()} and ${totalTarget.toString()} is required`);
    }
    outputs.push(
      new TransferableOutput(
        this.transaction._assetId,
        new SECPTransferOutput(
          total.sub(totalTarget),
          this.transaction._fromAddresses,
          this.transaction._locktime,
          this.transaction._threshold
        )
      )
    );
    return { inputs, outputs, credentials: credentials.length == 0 ? this.transaction.credentials : credentials };
  }
}
