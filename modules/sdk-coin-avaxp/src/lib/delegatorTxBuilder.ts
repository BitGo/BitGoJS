import { BuildTransactionError, NotSupported, TransactionType } from '@bitgo/sdk-core';
import { AvalancheNetwork, BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import {
  AddDelegatorTx,
  BaseTx as PVMBaseTx,
  ParseableOutput,
  PlatformVMConstants,
  SECPOwnerOutput,
  SECPTransferInput,
  SECPTransferOutput,
  SelectCredentialClass,
  TransferableInput,
  TransferableOutput,
  Tx as PVMTx,
  UnsignedTx,
} from 'avalanche/dist/apis/platformvm';
import { BinTools, BN } from 'avalanche';
import { SECP256K1_Transfer_Output, Tx, BaseTx } from './iface';
import utils from './utils';
import { Credential } from 'avalanche/dist/common';
import { recoverUtxos } from './utxoEngine';

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
    return TransactionType.AddDelegator;
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
    super.initBuilder(tx);
    const baseTx: BaseTx = tx.getUnsignedTx().getTransaction();
    if (!this.verifyTxType(baseTx)) {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }
    // The StakeOuts is a {@link stakeTransferOut} result.
    // It's expected to have only one outputs with the addresses of the sender.
    const outputs = baseTx.getStakeOuts();
    if (outputs.length != 1) {
      throw new BuildTransactionError('Transaction can have one external output');
    }
    const output = outputs[0];
    if (!output.getAssetID().equals(this.transaction._assetId)) {
      throw new Error('The Asset ID of the output does not match the transaction');
    }
    const secpOut = output.getOutput();
    this.transaction._locktime = secpOut.getLocktime();
    this.transaction._threshold = secpOut.getThreshold();
    // output addresses are the sender addresses
    this.transaction._fromAddresses = secpOut.getAddresses();
    this._nodeID = baseTx.getNodeIDString();
    this._startTime = baseTx.getStartTime();
    this._endTime = baseTx.getEndTime();
    this._stakeAmount = baseTx.getStakeAmount();
    this.transaction._utxos = recoverUtxos(baseTx.getIns());
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
        this.transaction._fromAddresses,
        this.transaction._locktime,
        this.transaction._threshold
      )
    );
  }

  protected rewardOwnersOutput(): ParseableOutput {
    // if there are no reward addresses, the sender gets the rewards
    if (!this.transaction._rewardAddresses || this.transaction._rewardAddresses.length === 0) {
      this.transaction._rewardAddresses = this.transaction._fromAddresses;
    }

    return new ParseableOutput(
      new SECPOwnerOutput(this.transaction._rewardAddresses, this.transaction._locktime, this.transaction._threshold)
    );
  }

  /**
   * Threshold must be 2 and since output always get reordered we want to make sure we can always add signatures in the correct location
   * To find the correct location for the signature, we use the ouput's addresses to create the signatureIdx in the order that we desire
   * 0: user key, 1: hsm key, 2: recovery key
   * @protected
   */
  protected createInputOutput(): {
    inputs: TransferableInput[];
    outputs: TransferableOutput[];
    credentials: Credential[];
  } {
    const inputs: TransferableInput[] = [];
    const outputs: TransferableOutput[] = [];

    // amount spent so far
    let currentTotal: BN = new BN(0);

    // delegating and validating have no fees
    const totalTarget = this._stakeAmount.clone();

    const credentials: Credential[] = [];

    // convert fromAddresses to string
    // fromAddresses = bitgo order if we are in WP
    // fromAddresses = onchain order if we are in from
    const bitgoAddresses = this.transaction._fromAddresses.map((b) =>
      utils.addressToString(this.transaction._network.hrp, this.transaction._network.alias, b)
    );

    /*
    A = user key
    B = hsm key
    C = backup key
    bitgoAddresses = bitgo addresses [ A, B, C ]
    utxo.addresses = IMS addresses [ B, C, A ]
    utxo.addressesIndex = [ 2, 0, 1 ]
    we pick 0, 1 for non-recovery
    we pick 1, 2 for recovery
    */
    this.transaction._utxos.forEach((utxo) => {
      // in WP, output.addressesIndex is empty, so fill it
      if (!utxo.addressesIndex || utxo.addressesIndex.length === 0) {
        utxo.addressesIndex = bitgoAddresses.map((a) => utxo.addresses.indexOf(a));
      }
      // in OVC, output.addressesIndex is defined correctly from the previous iteration
    });

    // validate the utxos
    this.transaction._utxos.forEach((utxo) => {
      if (!utxo) {
        throw new BuildTransactionError('Utxo is undefined');
      }
      // addressesIndex should neve have a mismatch
      if (utxo.addressesIndex?.includes(-1)) {
        throw new BuildTransactionError('Addresses are inconsistent');
      }
      if (utxo.threshold !== this.transaction._threshold) {
        throw new BuildTransactionError('Threshold is inconsistent');
      }
    });

    // if we are in OVC, none of the utxos will have addresses since they come from
    // deserialized inputs (which don't have addresses), not the IMS
    const buildOutputs = this.transaction._utxos[0].addresses.length !== 0;

    this.transaction._utxos.forEach((utxo, i) => {
      if (utxo.outputID === SECP256K1_Transfer_Output) {
        const txidBuf = utils.cb58Decode(utxo.txid);
        const amt: BN = new BN(utxo.amount);
        const outputidx = utils.outputidxNumberToBuffer(utxo.outputidx);
        const addressesIndex = utxo.addressesIndex ?? [];

        // either user (0) or recovery (2)
        const firstIndex = this.recoverSigner ? 2 : 0;
        const bitgoIndex = 1;
        currentTotal = currentTotal.add(amt);

        const secpTransferInput = new SECPTransferInput(amt);

        if (!buildOutputs) {
          addressesIndex.forEach((i) => secpTransferInput.addSignatureIdx(i, this.transaction._fromAddresses[i]));
        } else {
          // if user/backup > bitgo
          if (addressesIndex[bitgoIndex] < addressesIndex[firstIndex]) {
            secpTransferInput.addSignatureIdx(addressesIndex[bitgoIndex], this.transaction._fromAddresses[bitgoIndex]);
            secpTransferInput.addSignatureIdx(addressesIndex[firstIndex], this.transaction._fromAddresses[firstIndex]);
            credentials.push(
              SelectCredentialClass(
                secpTransferInput.getCredentialID(), // 9
                ['', this.transaction._fromAddresses[firstIndex].toString('hex')].map(utils.createSig)
              )
            );
          } else {
            secpTransferInput.addSignatureIdx(addressesIndex[firstIndex], this.transaction._fromAddresses[firstIndex]);
            secpTransferInput.addSignatureIdx(addressesIndex[bitgoIndex], this.transaction._fromAddresses[bitgoIndex]);
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

    if (buildOutputs) {
      if (currentTotal.lt(totalTarget)) {
        throw new BuildTransactionError(
          `Utxo outputs get ${currentTotal.toString()} and ${totalTarget.toString()} is required`
        );
      } else if (currentTotal.gt(totalTarget)) {
        outputs.push(
          new TransferableOutput(
            this.transaction._assetId,
            new SECPTransferOutput(
              currentTotal.sub(totalTarget),
              this.transaction._fromAddresses,
              this.transaction._locktime,
              this.transaction._threshold
            )
          )
        );
      }
    }
    // get outputs and credentials from the deserialized transaction if we are in OVC
    return {
      inputs,
      outputs: !buildOutputs ? (this.transaction.avaxPTransaction as PVMBaseTx).getOuts() : outputs,
      credentials: credentials.length === 0 ? this.transaction.credentials : credentials,
    };
  }
}
