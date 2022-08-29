import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, NotSupported, TransactionType } from '@bitgo/sdk-core';
import {
  EVMConstants,
  Tx as EVMTx,
  ImportTx,
  UnsignedTx,
  SECPTransferInput,
  SelectCredentialClass,
  TransferableInput,
  EVMOutput,
  AmountInput,
} from 'avalanche/dist/apis/evm';
import { costImportTx } from 'avalanche/dist/utils';
import { BN } from 'avalanche';
import { Credential } from 'avalanche/dist/common';
import { recoverUtxos, utxoToInput } from './utxoEngine';
import { BaseTx, Tx } from './iface';
import { AtomicInCTransactionBuilder } from './atomicInCTransactionBuilder';
import utils from './utils';

export class ImportInCTxBuilder extends AtomicInCTransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * C-chain address who is target of the import.
   * Address format is eth like
   * @param {string} cAddress
   */
  to(cAddress: string): this {
    this.transaction._to = [utils.parseAddress(cAddress)];
    return this;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Import;
  }

  /** @inheritdoc */
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

    // The outputs is a signler C-Chain address result.
    // It's expected to have only one outputs to the destination C-Chain address.
    const outputs = baseTx.getOuts();
    if (outputs.length !== 1) {
      throw new BuildTransactionError('Transaction can have one output');
    }
    const output = outputs[0];

    if (!output.getAssetID().equals(this.transaction._assetId)) {
      throw new Error('AssetID are not equals');
    }
    this.transaction._to = [output.getAddress()];

    const input = baseTx.getImportInputs();

    this.transaction._utxos = recoverUtxos(input);

    const totalInputAmount = input.reduce((t, i) => t.add((i.getInput() as AmountInput).getAmount()), new BN(0));
    // it should be (output as AmountOutput).getAmount(), but it's not working.
    const totalOutputAmount = new BN((output as any).amount);
    const feeSize = costImportTx(tx.getUnsignedTx() as UnsignedTx);
    const fee = totalInputAmount.sub(totalOutputAmount);
    const feeRate = fee.divn(feeSize);
    this.transaction._fee = {
      fee: fee.toString(),
      feeRate: feeRate.toNumber(),
      size: feeSize,
    };
    this.transaction.setTransaction(tx);
    return this;
  }

  static verifyTxType(baseTx: BaseTx): baseTx is ImportTx {
    return baseTx.getTypeID() === EVMConstants.IMPORTTX;
  }

  verifyTxType(baseTx: BaseTx): baseTx is ImportTx {
    return ImportInCTxBuilder.verifyTxType(baseTx);
  }

  /**
   * Build the import in C-chain transaction
   * @protected
   */
  protected buildAvaxTransaction(): void {
    // if tx has credentials, tx shouldn't change
    if (this.transaction.hasCredentials) return;
    if (this.transaction._to.length !== 1) {
      throw new Error('to is required');
    }
    if (!this.transaction._fee.feeRate) {
      throw new Error('fee rate is required');
    }
    const { inputs, amount, credentials } = this.createInputs();

    const feeRate = new BN(this.transaction._fee.feeRate);
    const feeSize = costImportTx(
      new UnsignedTx(
        new ImportTx(this.transaction._networkID, this.transaction._blockchainID, this._externalChainId, inputs, [
          new EVMOutput(this.transaction._to[0], amount, this.transaction._assetId),
        ])
      )
    );
    const fee = feeRate.muln(feeSize);
    this.transaction._fee.fee = fee.toString();
    this.transaction._fee.size = feeSize;
    this.transaction.setTransaction(
      new EVMTx(
        new UnsignedTx(
          new ImportTx(
            this.transaction._networkID,
            this.transaction._blockchainID,
            this._externalChainId,
            inputs,
            [new EVMOutput(this.transaction._to[0], amount.sub(fee), this.transaction._assetId)],
            fee
          )
        ),
        credentials
      )
    );
  }

  /**
   * Create inputs by mapping {@see utxoEngine.utxoToInput} result.
   * Reorder sender to handle recover signer.
   * TransferableInput is a EVM Tx.
   * @return {
   *     inputs: TransferableInput[];
   *     credentials: Credential[];
   *     amount: BN;
   *   } where amount is the sum of inputs amount and credentials has signer address to be replaced with correct signature.
   * @protected
   *
   */
  protected createInputs(): {
    inputs: TransferableInput[];
    credentials: Credential[];
    amount: BN;
  } {
    const sender = this.transaction._fromAddresses.slice();
    if (this.recoverSigner) {
      // switch first and last signer.
      const tmp = sender.pop();
      sender.push(sender[0]);
      if (tmp) {
        sender[0] = tmp;
      }
    }
    const { inputs, amount } = utxoToInput(this.transaction._utxos, sender);
    const result: {
      inputs: TransferableInput[];
      credentials: Credential[];
    } = { inputs: [], credentials: [] };

    inputs.forEach((input) => {
      const secpTransferInput = new SECPTransferInput(input.amount);
      input.signaturesIdx.forEach((signatureIdx, arrayIndex) =>
        secpTransferInput.addSignatureIdx(signatureIdx, sender[arrayIndex])
      );
      result.inputs.push(
        new TransferableInput(input.txidBuf, input.outputIdx, this.transaction._assetId, secpTransferInput)
      );

      result.credentials.push(SelectCredentialClass(secpTransferInput.getCredentialID(), input.signatures));
    });

    return { ...result, amount };
  }
}
