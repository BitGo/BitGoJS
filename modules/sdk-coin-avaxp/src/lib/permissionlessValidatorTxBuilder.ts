import { avaxSerial, Credential, pvmSerial, Signature, TypeSymbols } from '@bitgo/avalanchejs';
import {
  BaseAddress,
  BaseKey,
  BuildTransactionError,
  isValidateBLSSignature,
  isValidBLSPublicKey,
  NotSupported,
  TransactionType,
} from '@bitgo/sdk-core';

import { AvalancheNetwork, BaseCoin as CoinConfig } from '@bitgo/statics';
import { BinTools } from 'avalanche';
import BigNumber from 'bignumber.js';
import { DecodedUtxoObj, SECP256K1_Transfer_Output, Tx } from './iface';
import { KeyPair } from './keyPair';
import { Transaction } from './transaction';
import utils from './utils';
// import { recoverUtxos } from './utxoEngine';
import { TransactionBuilder } from './transactionBuilder';

export class PermissionlessValidatorTxBuilder extends TransactionBuilder {
  public _signer: KeyPair[] = [];
  protected _nodeID: string;
  protected _blsPublicKey: string;
  protected _blsSignature: string;
  protected _startTime: bigint;
  protected _endTime: bigint;
  protected _stakeAmount: bigint;
  protected recoverSigner = false;
  protected _delegationFeeRate: number;

  /**
   *
   * @param coinConfig
   */
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    const network = coinConfig.network as AvalancheNetwork;
    this._stakeAmount = BigInt(network.minStake);
  }

  /**
   * get transaction type
   * @protected
   */
  protected get transactionType(): TransactionType {
    return TransactionType.AddPermissionlessValidator;
  }

  // region Validators
  /**
   * Validates locktime
   * @param locktime
   */
  validateLocktime(locktime: bigint): void {
    if (locktime < BigInt(0)) {
      throw new BuildTransactionError('Invalid transaction: locktime must be 0 or higher');
    }
  }

  /**
   * Validate that the delegation fee is at least the minDelegationFee
   * @param delegationFeeRate number
   */
  validateDelegationFeeRate(delegationFeeRate: number): void {
    if (delegationFeeRate < Number(this.transaction._network.minDelegationFee)) {
      throw new BuildTransactionError(
        `Delegation fee cannot be less than ${this.transaction._network.minDelegationFee}`
      );
    }
  }

  /**
   * Check the UTXO has expected fields.
   * @param UTXO
   */
  validateUtxo(value: DecodedUtxoObj): void {
    ['outputID', 'amount', 'txid', 'outputidx'].forEach((field) => {
      if (!value.hasOwnProperty(field)) throw new BuildTransactionError(`Utxos required ${field}`);
    });
  }
  // endregion

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
  nodeID(nodeID: string): this {
    this.validateNodeID(nodeID);
    this._nodeID = nodeID;
    return this;
  }

  /**
   *
   * @param blsPublicKey
   */
  blsPublicKey(blsPublicKey: string): this {
    isValidBLSPublicKey(blsPublicKey);
    this._blsPublicKey = blsPublicKey;
    return this;
  }

  /**
   *
   * @param blsSignature
   */
  blsSignature(blsSignature: string): this {
    isValidateBLSSignature(blsSignature);
    this._blsSignature = blsSignature;
    return this;
  }

  /**
   * Locktime is a long that contains the unix timestamp that this output can be spent after.
   * The unix timestamp is specific to the second.
   * @param value
   */
  locktime(value: string | number): this {
    this.validateLocktime(BigInt(value));
    this._transaction._locktime = BigInt(value);
    return this;
  }

  /**
   * set the delegationFeeRate
   * @param value number
   */
  delegationFeeRate(value: number): this {
    this.validateDelegationFeeRate(value);
    this._delegationFeeRate = value;
    return this;
  }

  /**
   * start time of staking period
   * @param value
   */
  startTime(value: string | number): this {
    this._startTime = BigInt(value);
    return this;
  }

  /**
   * end time of staking period
   * @param value
   */
  endTime(value: string | number): this {
    this._endTime = BigInt(value);
    return this;
  }

  /**
   *
   * @param value
   */
  stakeAmount(value: bigint | string): this {
    const valueBigInt = typeof value === 'bigint' ? value : BigInt(value);
    this.validateStakeAmount(valueBigInt);
    this._stakeAmount = valueBigInt;
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
  validateStakeDuration(startTime: bigint, endTime: bigint): void {
    const nextDay = BigInt(Date.now()) + BigInt(86400);
    if (startTime < nextDay) {
      throw new BuildTransactionError('Start time needs to be one day greater than current time');
    }
    if (endTime < startTime) {
      throw new BuildTransactionError('End date cannot be less than start date');
    }
  }

  /**
   * Validate stake amount
   * @param amount
   */
  validateStakeAmount(amount: bigint): void {
    const minStake = BigInt(this.transaction._network.minStake);
    if (amount < minStake) {
      throw new BuildTransactionError('Minimum staking amount is ' + Number(minStake) / 1000000000 + ' AVAX.');
    }
    return;
  }

  // endregion

  // TODO Implement
  /** @inheritdoc */
  initBuilder(tx: Tx): this {
    super.initBuilder(tx);
    // const baseTx: BaseTx = tx.baseTx;

    if (!this.verifyTxType(tx)) {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }

    const outputs = tx.baseTx.outputs;
    if (outputs.length !== 1) {
      throw new BuildTransactionError('Transaction can have one external output');
    }

    // The StakeOuts is a {@link stakeTransferOut} result.
    // It's expected to have only one outputs with the addresses of the sender.
    // const outputs = baseTx.getStakeOuts();
    // if (outputs.length != 1) {
    //   throw new BuildTransactionError('Transaction can have one external output');
    // }
    const output = outputs[0];
    // if (!output.getAssetID().equals(this.transaction._assetId)) {
    if (output.assetId.toString() !== this.transaction._assetId) {
      throw new Error('The Asset ID of the output does not match the transaction');
    }
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

  static verifyTxType(tx: Tx): tx is pvmSerial.AddPermissionlessValidatorTx {
    tx.baseTx._type === TypeSymbols.AddPermissionlessDelegatorTx;
    return true;
  }

  verifyTxType(tx: Tx): tx is pvmSerial.AddPermissionlessValidatorTx {
    return PermissionlessValidatorTxBuilder.verifyTxType(tx);
  }

  /**
   * Threshold must be 2 and since output always get reordered we want to make sure we can always add signatures in the correct location
   * To find the correct location for the signature, we use the ouput's addresses to create the signatureIdx in the order that we desire
   * 0: user key, 1: hsm key, 2: recovery key
   * @protected
   */
  protected createInputOutput(): {
    inputs: avaxSerial.TransferableInput[];
    outputs: avaxSerial.TransferableOutput[];
    credentials: Credential[];
  } {
    const inputs: avaxSerial.TransferableInput[] = [];
    const outputs: avaxSerial.TransferableOutput[] = [];

    // amount spent so far
    let currentTotal = BigInt(0);

    // delegating and validating have no fees
    const totalTarget = this._stakeAmount.valueOf();

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
      // addressesIndex should never mismatch
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
      // TODO(CR - 1073): Check the below implementation
      if (utxo.outputID === SECP256K1_Transfer_Output) {
        // const txidBuf = utils.cb58Decode(utxo.txid);
        const amt = BigInt(utxo.amount);
        // const outputidx = utils.outputidxNumberToBuffer(utxo.outputidx);
        const addressesIndex = utxo.addressesIndex ?? [];

        // either user (0) or recovery (2)
        const firstIndex = this.recoverSigner ? 2 : 0;
        const bitgoIndex = 1;
        currentTotal = currentTotal + amt;

        // TODO(CR-1073): How do we find sigIndices here ?
        // const secpTransferInput = TransferInput.fromNative(amt, []);

        // TODO(CR-1073): Need to identify what is the replacement for addSignatureIdx in the new library
        if (!buildOutputs) {
          // addressesIndex.forEach((i) => secpTransferInput.addSignatureIdx(i, this.transaction._fromAddresses[i]));
        } else {
          // if user/backup > bitgo
          if (addressesIndex[bitgoIndex] < addressesIndex[firstIndex]) {
            // secpTransferInput.addSignatureIdx(addressesIndex[bitgoIndex], this.transaction._fromAddresses[bitgoIndex]);
            // secpTransferInput.addSignatureIdx(addressesIndex[firstIndex], this.transaction._fromAddresses[firstIndex]);
            credentials.push(
              new Credential(
                ['', this.transaction._fromAddresses[firstIndex].toString('hex')].map(
                  utils.createSig
                ) as unknown as Signature[]
              )
            );
          } else {
            // secpTransferInput.addSignatureIdx(addressesIndex[firstIndex], this.transaction._fromAddresses[firstIndex]);
            // secpTransferInput.addSignatureIdx(addressesIndex[bitgoIndex], this.transaction._fromAddresses[bitgoIndex]);
            credentials.push(
              new Credential(
                [this.transaction._fromAddresses[firstIndex].toString('hex'), ''].map(
                  utils.createSig
                ) as unknown as Signature[]
              )
            );
          }
        }

        // const input: avaxSerial.TransferableInput = new avaxSerial.TransferableInput(
        //   UTXOID, // TODO(CR-1073): how do we get this ? For this we need UTXO not decodedUTXO obj
        //   Id.fromHex(Buffer.from(this.transaction._assetId).toString('hex')),
        //   secpTransferInput
        // );
        // inputs.push(input);
      }
    });

    if (buildOutputs) {
      if (currentTotal < totalTarget) {
        throw new BuildTransactionError(
          `Utxo outputs get ${currentTotal.toString()} and ${totalTarget.toString()} is required`
        );
      } else if (currentTotal > totalTarget) {
        outputs.push(
          avaxSerial.TransferableOutput.fromNative(
            this.transaction._assetId,
            currentTotal - totalTarget,
            this.transaction._fromAddresses,
            this.transaction._locktime,
            this.transaction._threshold
          )
        );
      }
    }
    // get outputs and credentials from the deserialized transaction if we are in OVC
    return {
      inputs,
      // TODO(CR-1073): check this
      outputs: !buildOutputs ? this.transaction.avaxPTransaction.outputs : outputs,
      credentials: credentials.length === 0 ? this.transaction.credentials : credentials,
    };
  }

  /**
   * Build the add validator transaction
   * @protected
   */
  // TODO(CR-1073): implement
  protected buildAvaxTransaction(): void {
    // const { inputs, outputs, credentials } = this.createInputOutput();
    // this.transaction.setTransaction(
    //   new AddPermissionlessValidatorTx(
    //     avaxSerial.BaseTx.fromNative(
    //       this.transaction._networkID,
    //       this.transaction._blockchainID,
    //       changeOutputs,
    //       inputs,
    //       defaultedOptions.memo,
    //     ),
    //     SubnetValidator.fromNative(
    //       nodeID,
    //       start,
    //       end,
    //       weight,
    //       Id.fromString(subnetID),
    //     ),
    //   )
    // );
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.buildAvaxTransaction();
    this.transaction.setTransactionType(this.transactionType);
    if (this.hasSigner()) {
      this._signer.forEach((keyPair) => this.transaction.sign(keyPair));
    }
    return this.transaction;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    // TODO Implement
    return this.transaction;
  }

  /** @inheritdoc */
  protected signImplementation({ key }: BaseKey): Transaction {
    // TODO Implement
    return this.transaction;
  }

  /** @inheritdoc */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    if (!utils.isValidAddress(address.address)) {
      throw new BuildTransactionError('Invalid address');
    }
  }

  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }

  hasSigner(): boolean {
    return this._signer !== undefined && this._signer.length > 0;
  }

  /** @inheritdoc */
  validateKey({ key }: BaseKey): void {
    if (!new KeyPair({ prv: key })) {
      throw new BuildTransactionError('Invalid key');
    }
  }

  /**
   * Check the raw transaction has a valid format in the blockchain context, throw otherwise.
   *
   * @param rawTransaction Transaction in any format
   */
  validateRawTransaction(rawTransaction: string): void {
    utils.validateRawTransaction(rawTransaction);
  }

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    // throw new NotImplementedError('validateTransaction not implemented');
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }
}
