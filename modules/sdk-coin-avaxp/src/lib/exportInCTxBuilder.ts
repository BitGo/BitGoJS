import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, NotSupported, TransactionType } from '@bitgo/sdk-core';
import {
  EVMConstants,
  Tx as EMVTx,
  UnsignedTx,
  SelectCredentialClass,
  ExportTx,
  EVMInput,
  TransferableOutput,
  SECPTransferOutput,
  AmountOutput,
} from 'avalanche/dist/apis/evm';
import utils from './utils';
import { BN, Buffer as BufferAvax } from 'avalanche';
import { Transaction } from './transaction';
import { Tx, BaseTx, DecodedUtxoObj } from './iface';
import { AtomicInCTransactionBuilder } from './atomicInCTransactionBuilder';

export class ExportInCTxBuilder extends AtomicInCTransactionBuilder {
  private _amount: BN;
  private _nonce: BN;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * Utxos are not required in Export Tx in C-Chain.
   * Override utxos to prevent used by throwing a error.
   *
   * @param {DecodedUtxoObj[]} value ignored
   */
  utxos(value: DecodedUtxoObj[]): this {
    throw new BuildTransactionError('utxos are not required in Export Tx in C-Chain');
  }

  /**
   * Amount is a long that specifies the quantity of the asset that this output owns. Must be positive.
   * The transaction output amount add a fixed fee that will be paid upon import.
   *
   * @param {BN | string} amount The withdrawal amount
   */
  amount(amount: BN | string): this {
    const amountBN = BN.isBN(amount) ? amount : new BN(amount);
    this.validateAmount(amountBN);
    this._amount = amountBN;
    return this;
  }

  /**
   * Set the nonce of C-Chain sender address
   *
   * @param {number | string} nonce - number that can be only used once
   */
  nonce(nonce: number | string): this {
    const nonceBN = new BN(nonce);
    this.validateNonce(nonceBN);
    this._nonce = nonceBN;
    return this;
  }

  /**
   * Export tx target P wallet.
   *
   * @param pAddresses
   */
  to(pAddresses: string | string[]): this {
    const pubKeys = pAddresses instanceof Array ? pAddresses : pAddresses.split('~');
    this.transaction._to = pubKeys.map(utils.parseAddress);
    return this;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Export;
  }

  initBuilder(tx: Tx): this {
    const baseTx: BaseTx = tx.getUnsignedTx().getTransaction();
    if (
      baseTx.getNetworkID() !== this.transaction._networkID ||
      !baseTx.getBlockchainID().equals(this.transaction._blockchainID)
    ) {
      throw new Error('Network or blockchain is not equals');
    }

    if (!this.verifyTxType(baseTx)) {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }

    // The outputs is a multisign P-Chain address result.
    // It's expected to have only one outputs to the destination P-Chain address.
    const outputs = baseTx.getExportedOutputs();
    if (outputs.length !== 1) {
      throw new BuildTransactionError('Transaction can have one output');
    }
    const output = outputs[0];

    if (!output.getAssetID().equals(this.transaction._assetId)) {
      throw new Error('AssetID are not equals');
    }

    // The inputs is not an utxo.
    // It's expected to have only one input form C-Chain address.
    const inputs = baseTx.getInputs();
    if (inputs.length !== 1) {
      throw new BuildTransactionError('Transaction can have one inputs');
    }
    const input = inputs[0];

    this.transaction._to = output.getOutput().getAddresses();
    const inputAmount = new BN((input as any).amount);
    const outputAmount = (output.getOutput() as AmountOutput).getAmount();
    const fee = inputAmount.sub(outputAmount);
    this._amount = outputAmount;
    this.transaction._fee.feeRate = fee.toNumber() - Number(this.fixedFee);
    this.transaction._fee.fee = fee.toString();
    this.transaction._fee.size = 1;
    this.transaction._fromAddresses = [input.getAddress()];

    this._nonce = new BN((input as any).nonce);
    this.transaction.setTransaction(tx);
    return this;
  }

  static verifyTxType(baseTx: BaseTx): baseTx is ExportTx {
    return baseTx.getTypeID() === EVMConstants.EXPORTTX;
  }

  verifyTxType(baseTx: BaseTx): baseTx is ExportTx {
    return ExportInCTxBuilder.verifyTxType(baseTx);
  }

  /**
   * Build the export in C-chain transaction
   * @protected
   */
  protected buildAvaxTransaction(): void {
    // if tx has credentials, tx shouldn't change
    if (this.transaction.hasCredentials) return;
    if (this._amount === undefined) {
      throw new Error('amount is required');
    }
    if (this.transaction._fromAddresses.length !== 1) {
      throw new Error('sender is one and required');
    }
    if (this.transaction._to.length === 0) {
      throw new Error('to is required');
    }
    if (!this.transaction._fee.feeRate) {
      throw new Error('fee rate is required');
    }
    if (!this._nonce === undefined) {
      throw new Error('nonce is required');
    }
    const txFee = Number(this.fixedFee);

    const fee: number = this.transaction._fee.feeRate + txFee;
    this.transaction._fee.fee = fee.toString();
    this.transaction._fee.size = 1;

    const input = new EVMInput(
      this.transaction._fromAddresses[0],
      this._amount.addn(fee),
      this.transaction._assetId,
      this._nonce
    );
    input.addSignatureIdx(0, this.transaction._fromAddresses[0]);

    this.transaction.setTransaction(
      new EMVTx(
        new UnsignedTx(
          new ExportTx(
            this.transaction._networkID,
            this.transaction._blockchainID,
            this._externalChainId,
            [input],
            [
              new TransferableOutput(
                this.transaction._assetId,
                new SECPTransferOutput(
                  this._amount,
                  this.transaction._to,
                  this.transaction._locktime,
                  this.transaction._threshold
                )
              ),
            ]
          )
        ),
        // TODO(BG-56700):  Improve canSign by check in addresses in empty credentials match signer
        [SelectCredentialClass(input.getCredentialID(), [''].map(utils.createSig))]
      )
    );
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = new EMVTx();
    tx.fromBuffer(BufferAvax.from(rawTransaction, 'hex'));
    this.initBuilder(tx);
    return this.transaction;
  }

  /**
   * Check the amount is positive.
   * @param amount
   */
  validateNonce(nonce: BN): void {
    if (nonce.ltn(0)) {
      throw new BuildTransactionError('Nonce must be greater or equal than 0');
    }
  }
}
