import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { AtomicTransactionBuilder } from './atomicTransactionBuilder';
import { ExportTx, SECPTransferOutput, TransferableOutput, Tx, UnsignedTx } from 'avalanche/dist/apis/platformvm';
import { BN } from 'avalanche';
import utils from './utils';

export class ExportTxBuilder extends AtomicTransactionBuilder {
  private _amount: BN;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._externalChainId = utils.cb58Decode(this.transaction._network.cChainBlockchainID);
    this._fee = new BN(this.transaction._network.txFee);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Export;
  }

  /**
   * Amount is a long that specifies the quantity of the asset that this output owns. Must be positive.
   *
   * @param {BN | string} amount The withdrawal amount
   */
  amount(value: BN | string): this {
    const valueBN = BN.isBN(value) ? value : new BN(value);
    this.validateAmount(valueBN);
    this._amount = valueBN;
    return this;
  }

  /**
   * Create the internal avalanche transaction.
   * @protected
   */
  protected buildAvaxpTransaction(): void {
    const { inputs, credentials, amount } = this.createInput();
    const requiredAmmount = this._amount.add(this._fee);
    if (amount.lt(requiredAmmount)) {
      throw new BuildTransactionError(
        `Utxo outputs get ${amount.toString()} and ${requiredAmmount.toString()} is required`
      );
    }
    const outputs = this.changeOutputs(amount.sub(requiredAmmount));
    this.transaction.setTransaction(
      new Tx(
        new UnsignedTx(
          new ExportTx(
            this.transaction._networkID,
            this.transaction._blockchainID,
            outputs,
            inputs,
            this.transaction._memo,
            this._externalChainId,
            this.exportedOutputs()
          )
        ),
        credentials
      )
    );
  }

  /**
   * Create the ExportedOut where the recipient address are the sender.
   * Later a importTx should complete the operations signing with the same keys.
   * @protected
   */
  protected exportedOutputs(): TransferableOutput[] {
    return [
      new TransferableOutput(
        this.transaction._assetId,
        new SECPTransferOutput(
          this._amount,
          this.transaction._sender,
          this.transaction._locktime,
          this.transaction._threshold
        )
      ),
    ];
  }
}
