import { BuildTransactionError } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { StarknetTransactionType } from './iface';
import { STRK_TOKEN_CONTRACT, MASK_128 } from './constants';
import utils from './utils';

export interface StarknetTransferRecipient {
  address: string;
  amount: string;
  tokenContractAddress?: string;
}

export class TransferBuilder extends TransactionBuilder {
  protected _receiverAddress?: string;
  protected _amount?: string;
  protected _tokenContractAddress: string = STRK_TOKEN_CONTRACT;
  protected _recipients: StarknetTransferRecipient[] = [];

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
    this._recipients = [];
    this._receiverAddress = address;
    return this;
  }

  public amount(value: string): this {
    const val = BigInt(value);
    if (val < 0n) {
      throw new BuildTransactionError(`Invalid amount: ${value}`);
    }
    this._recipients = [];
    this._amount = value;
    return this;
  }

  public recipients(recipients: StarknetTransferRecipient[]): this {
    this.validateRecipients(recipients);
    this._recipients = recipients.map((recipient) => ({
      ...recipient,
      tokenContractAddress: recipient.tokenContractAddress ?? STRK_TOKEN_CONTRACT,
    }));
    this._receiverAddress = undefined;
    this._amount = undefined;
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
    const parsedRecipients = this._calls.map((call) => utils.parseTransferCall(call));
    if (parsedRecipients.every((recipient): recipient is NonNullable<typeof recipient> => recipient !== undefined)) {
      this._recipients = parsedRecipients.map((recipient) => ({
        address: recipient.recipient,
        amount: recipient.amount,
        tokenContractAddress: recipient.tokenContract,
      }));
    }
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    if (this._recipients.length === 0) {
      this.validateTransfer();
      this._recipients = [
        {
          address: this._receiverAddress as string,
          amount: this._amount as string,
          tokenContractAddress: this._tokenContractAddress,
        },
      ];
    } else {
      this.validateRecipients(this._recipients);
    }

    this._calls = this._recipients.map((recipient) => ({
      contractAddress: recipient.tokenContractAddress ?? STRK_TOKEN_CONTRACT,
      entrypoint: 'transfer',
      calldata: this.compileTransferCalldata(recipient.address, recipient.amount),
    }));

    return super.buildImplementation();
  }

  private compileTransferCalldata(recipient: string, amount: string): string[] {
    const amountBig = BigInt(amount);
    return [recipient, '0x' + (amountBig & MASK_128).toString(16), '0x' + (amountBig >> 128n).toString(16)];
  }

  private validateRecipients(recipients: StarknetTransferRecipient[]): void {
    if (!recipients || recipients.length === 0) {
      throw new BuildTransactionError('At least one recipient is required');
    }
    for (const recipient of recipients) {
      if (!recipient.address || !utils.isValidAddress(recipient.address)) {
        throw new BuildTransactionError(`Invalid receiver address: ${recipient.address}`);
      }
      if (!recipient.amount || BigInt(recipient.amount) < 0n) {
        throw new BuildTransactionError(`Invalid amount: ${recipient.amount}`);
      }
      if (recipient.tokenContractAddress && !utils.isValidAddress(recipient.tokenContractAddress)) {
        throw new BuildTransactionError(`Invalid token contract address: ${recipient.tokenContractAddress}`);
      }
    }
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
