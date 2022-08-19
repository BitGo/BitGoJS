import { BaseCoin as CoinConfig } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import {
  BaseAddress,
  BaseKey,
  BaseTransactionBuilder,
  TransactionType,
  BuildTransactionError,
  BaseTransaction,
} from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { KeyPair } from './keyPair';
import { BN, Buffer as BufferAvax } from 'avalanche';
import utils from './utils';
import { DecodedUtxoObj } from './iface';
import {
  SECPTransferInput,
  SECPTransferOutput,
  SelectCredentialClass,
  TransferableInput,
  TransferableOutput,
  Tx,
} from 'avalanche/dist/apis/platformvm';
import { Credential } from 'avalanche/dist/common';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  private _transaction: Transaction;
  public _signer: KeyPair[] = [];
  protected recoverSigner = false;

  /**
   * When using recovery key must be set here
   * TODO: STLX-17317 recovery key signing
   * @param recoverSigner
   */
  public recoverMode(recoverSigner = true): this {
    this.recoverSigner = recoverSigner;
    return this;
  }

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
  }

  threshold(value: number): this {
    this.validateThreshold(value);
    this._transaction._threshold = value;
    return this;
  }

  locktime(value: string | number): this {
    this.validateLocktime(new BN(value));
    this._transaction._locktime = new BN(value);
    return this;
  }

  fromPubKey(senderPubKey: string | string[]): this {
    const pubKeys = senderPubKey instanceof Array ? senderPubKey : [senderPubKey];
    this._transaction._fromAddresses = pubKeys.map(utils.parseAddress);
    return this;
  }

  rewardAddresses(address: string | string[]): this {
    const rewardAddresses = address instanceof Array ? address : [address];
    this._transaction._rewardAddresses = rewardAddresses.map(utils.parseAddress);
    return this;
  }

  utxos(value: DecodedUtxoObj[]): this {
    this.validateUtxos(value);
    this._transaction._utxos = value;
    return this;
  }
  /**
   *
   * @param value Optional Buffer for the memo
   * @returns value Buffer for the memo
   * set using Buffer.from("message")
   */
  memo(value: string): this {
    this._transaction._memo = utils.stringToBuffer(value);
    return this;
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Tx): this {
    const baseTx = tx.getUnsignedTx().getTransaction();
    if (
      baseTx.getNetworkID() !== this._transaction._networkID ||
      !baseTx.getBlockchainID().equals(this._transaction._blockchainID)
    ) {
      throw new Error('Network or blockchain is not equals');
    }
    this._transaction._memo = baseTx.getMemo();

    // good assumption: addresses that unlock the outputs, will also be used to sign the transaction
    // so pick the first utxo as the from address
    const utxo = baseTx.getOuts()[0];

    if (!utxo.getAssetID().equals(this._transaction._assetId)) {
      throw new Error('AssetID are not equals');
    }
    const secpOut = utxo.getOutput();
    this._transaction._locktime = secpOut.getLocktime();
    this._transaction._threshold = secpOut.getThreshold();
    this._transaction._fromAddresses = secpOut.getAddresses();
    this._transaction._utxos = this.recoverUtxos(baseTx.getIns());
    this._transaction.setTransaction(tx);
    return this;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = new Tx();
    tx.fromBuffer(BufferAvax.from(rawTransaction, 'hex'));
    this.initBuilder(tx);
    return this.transaction;
  }

  get hasSigner(): boolean {
    return this._signer !== undefined && this._signer.length > 0;
  }
  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.buildAvaxpTransaction();
    this.transaction.setTransactionType(this.transactionType);
    if (this.hasSigner) {
      this._signer.forEach((keyPair) => this.transaction.sign(keyPair));
    }
    return this.transaction;
  }

  /**
   * Builds the avaxp transaction. transaction field is changed.
   */
  protected abstract buildAvaxpTransaction(): void;

  // region Getters and Setters
  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }
  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }

  protected signImplementation({ key }: BaseKey): BaseTransaction {
    this._signer.push(new KeyPair({ prv: key }));
    return this.transaction;
  }

  protected abstract get transactionType(): TransactionType;

  /**
   * Threshold must be 2 and since output always get reordered we want to make sure we can always add signatures in the correct location
   * To find the correct location for the signature, we use the ouput's addresses to create the signatureIdx in the order that we desire
   * 0: user key, 1: hsm key, 2: recovery key
   * @protected
   */
  protected createInputOutput(amount: BN): {
    inputs: TransferableInput[];
    outputs: TransferableOutput[];
    credentials: Credential[];
  } {
    const inputs: TransferableInput[] = [];
    const outputs: TransferableOutput[] = [];

    // amount spent so far
    let currentTotal: BN = new BN(0);

    // delegating and validating have no fees
    const totalTarget = amount.clone();

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
        throw new BuildTransactionError('Addresses are inconsistent: ' + utxo.txid);
      }
      if (utxo.threshold !== this.transaction._threshold) {
        throw new BuildTransactionError('Threshold is inconsistent');
      }
    });

    // if we are in OVC, none of the utxos will have addresses since they come from
    // deserialized inputs (which don't have addresses), not the IMS
    const buildOutputs = this.transaction._utxos[0].addresses.length !== 0;

    this.transaction._utxos.forEach((utxo, i) => {
      if (utxo.outputID === 7) {
        const txidBuf = utils.cb58Decode(utxo.txid);
        const amt: BN = new BN(utxo.amount);
        const outputidx = utils.cb58Decode(utxo.outputidx);
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
      outputs: outputs.length === 0 ? this.transaction.avaxPTransaction.getOuts() : outputs,
      credentials: credentials.length === 0 ? this.transaction.credentials : credentials,
    };
  }

  /**
   * Inputs can be controlled but outputs get reordered in transactions
   * In order to make sure that the mapping is always correct we create an addressIndx which matches to the appropiate
   * signatureIdx
   * @param inputs
   * @protected
   */
  protected recoverUtxos(utxos: TransferableInput[]): DecodedUtxoObj[] {
    return utxos.map((utxo) => {
      const secpInput: SECPTransferInput = utxo.getInput() as SECPTransferInput;

      // use the same addressesIndex as existing ones in the inputs
      const addressesIndex: number[] = secpInput.getSigIdxs().map((s) => s.toBuffer().readUInt32BE(0));

      return {
        outputID: 7,
        outputidx: utils.cb58Encode(utxo.getOutputIdx()),
        txid: utils.cb58Encode(utxo.getTxID()),
        amount: secpInput.getAmount().toString(),
        threshold: this.transaction._threshold,
        addresses: [], // this is empty since the inputs from deserialized transaction don't contain addresses
        addressesIndex,
      };
    });
  }
  // endregion

  // region Validators

  /**
   * Validates the threshold
   * @param threshold
   */
  validateThreshold(threshold: number): void {
    if (!threshold || threshold !== 2) {
      throw new BuildTransactionError('Invalid transaction: threshold must be set to 2');
    }
  }

  /**
   * Validates locktime
   * @param locktime
   */
  validateLocktime(locktime: BN): void {
    if (!locktime || locktime.lt(new BN(0))) {
      throw new BuildTransactionError('Invalid transaction: locktime must be 0 or higher');
    }
  }

  /** @inheritdoc */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    if (!utils.isValidAddress(address.address)) {
      throw new BuildTransactionError('Invalid address');
    }
  }

  /** @inheritdoc */
  validateKey({ key }: BaseKey): void {
    if (!new KeyPair({ prv: key })) {
      throw new BuildTransactionError('Invalid key');
    }
  }

  /**
   * Check the raw transaction has a valid format in the blockchain context, throw otherwise.
   * It overrides abstract method from BaseTransactionBuilder
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

  validateUtxos(values: DecodedUtxoObj[]): void {
    if (values.length === 0) {
      throw new BuildTransactionError("Utxos can't be empty array");
    }
    values.forEach(this.validateUtxo);
  }

  validateUtxo(value: DecodedUtxoObj): void {
    ['outputID', 'amount', 'txid', 'outputidx'].forEach((field) => {
      if (!value.hasOwnProperty(field)) throw new BuildTransactionError(`Utxos required ${field}`);
    });
  }

  // endregion
}
