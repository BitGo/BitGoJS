import { BuildTransactionError } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { StarknetCall, StarknetTransactionType } from './iface';
import { STRK_TOKEN_CONTRACT, MASK_128 } from './constants';
import utils from './utils';

export class TransferBuilder extends TransactionBuilder {
  protected _receiverAddress?: string;
  protected _amount?: string;
  protected _tokenContractAddress: string = STRK_TOKEN_CONTRACT;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): StarknetTransactionType {
    return StarknetTransactionType.INVOKE;
  }

  public receiverId(address: string): this {
    if (!address || !utils.isValidAddress(address)) {
      throw new BuildTransactionError('Invalid or missing receiver address, got: ' + address);
    }
    this._receiverAddress = address;
    return this;
  }

  public amount(value: string): this {
    const val = BigInt(value);
    if (val < 0n) {
      throw new BuildTransactionError(`Invalid amount: ${value}`);
    }
    this._amount = value;
    return this;
  }

  public tokenContractAddress(address: string): this {
    if (!address || !utils.isValidAddress(address)) {
      throw new BuildTransactionError('Invalid token contract address, got: ' + address);
    }
    this._tokenContractAddress = address;
    return this;
  }

  /** @inheritdoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    if (this._calls.length > 0) {
      const transfer = utils.parseTransferCall(this._calls[0]);
      if (transfer) {
        this._receiverAddress = transfer.recipient;
        this._amount = transfer.amount;
        this._tokenContractAddress = transfer.tokenContract;
      }
    }
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.validateTransfer();

    const transferCall: StarknetCall = {
      contractAddress: this._tokenContractAddress,
      entrypoint: 'transfer',
      calldata: this.compileTransferCalldata(this._receiverAddress as string, this._amount as string),
    };

    this._calls = [transferCall];

    return super.buildImplementation();
  }

  private compileTransferCalldata(recipient: string, amount: string): string[] {
    const amountBig = BigInt(amount);
    return [recipient, '0x' + (amountBig & MASK_128).toString(16), '0x' + (amountBig >> 128n).toString(16)];
  }

  private validateTransfer(): void {
    if (!this._sender) {
      throw new BuildTransactionError('Sender is required');
    }
    if (!this._receiverAddress) {
      throw new BuildTransactionError('Receiver is required');
    }
    if (!this._amount) {
      throw new BuildTransactionError('Amount is required');
    }
    if (!utils.isValidAddress(this._sender)) {
      throw new BuildTransactionError(`Invalid sender address: ${this._sender}`);
    }
    if (!utils.isValidAddress(this._receiverAddress)) {
      throw new BuildTransactionError(`Invalid receiver address: ${this._receiverAddress}`);
    }
  }
}
