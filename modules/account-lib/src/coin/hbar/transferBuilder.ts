import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { proto } from '../../../resources/hbar/protobuf/hedera';
import { NotImplementedError } from '../baseCoin/errors';
import { BaseKey } from '../baseCoin/iface';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';

export class TransferBuilder extends TransactionBuilder {
  private _txBody: proto.TransactionBody;
  private _txBodyData: proto.CryptoTransferTransactionBody;
  private readonly _duration: proto.Duration = new proto.Duration({ seconds: 120 });

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._txBody = new proto.TransactionBody();
    this._txBody.transactionValidDuration = this._duration;
    this._txBodyData = new proto.CryptoTransferTransactionBody();
    this._txBody.cryptoTransfer = this._txBodyData;
  }

  /** @inheritdoc */
  protected buildImplementation(): Promise<import('../baseCoin').BaseTransaction> {
    throw new NotImplementedError('buildImplementation not implemented');
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    throw new NotImplementedError('signImplementation not implemented');
  }

  //region Validators
  validateMandatoryFields(): void {
    throw new NotImplementedError('signImplementation not implemented');
    // TODO: Implement validations and add super.validateMandatoryFields()
  }
  //endregion
}
