import { Transaction } from './transaction';
import { TransferTxData } from '../iface';
import { TransactionType } from '@bitgo/sdk-core';
import {
  AccountAddress,
  AccountAuthenticatorEd25519,
  Aptos,
  AptosConfig,
  Network,
  SignedTransaction,
  TransactionAuthenticatorFeePayer,
} from '@aptos-labs/ts-sdk';
import utils from '../utils';
import { NetworkType } from '@bitgo/statics';

export class TransferTransaction extends Transaction {
  constructor(coinConfig) {
    super(coinConfig);
    this._type = TransactionType.Send;
  }

  toJson(): TransferTxData {
    return {
      id: this.id,
      sender: this.sender,
      recipient: this.recipient,
      sequenceNumber: this.sequenceNumber,
      maxGasAmount: this.maxGasAmount,
      gasUnitPrice: this.gasUnitPrice,
      gasUsed: this.gasUsed,
      expirationTime: this.expirationTime,
      feePayer: this.feePayerAddress,
    };
  }

  fromRawTransaction(rawTransaction: string): void {
    let signedTxn: SignedTransaction;
    try {
      signedTxn = utils.deserializeSignedTransaction(rawTransaction);
    } catch (e) {
      console.error('invalid raw transaction', e);
      throw new Error('invalid raw transaction');
    }
    this.fromDeserializedSignedTransaction(signedTxn);
  }

  fromDeserializedSignedTransaction(signedTxn: SignedTransaction): void {
    try {
      const rawTxn = signedTxn.raw_txn;
      this._sender = rawTxn.sender.toString();
      this._recipient = utils.getRecipientFromTransactionPayload(rawTxn.payload);
      this._sequenceNumber = utils.castToNumber(rawTxn.sequence_number);
      this._maxGasAmount = utils.castToNumber(rawTxn.max_gas_amount);
      this._gasUnitPrice = utils.castToNumber(rawTxn.gas_unit_price);
      this._expirationTime = utils.castToNumber(rawTxn.expiration_timestamp_secs);
      this._rawTransaction = rawTxn;

      this.loadInputsAndOutputs();
      const authenticator = signedTxn.authenticator as TransactionAuthenticatorFeePayer;
      this._feePayerAddress = authenticator.fee_payer.address.toString();
      const senderAuthenticator = authenticator.sender as AccountAuthenticatorEd25519;
      const senderSignature = Buffer.from(senderAuthenticator.signature.toUint8Array());
      this.addSenderSignature({ pub: senderAuthenticator.public_key.toString() }, senderSignature);

      const feePayerAuthenticator = authenticator.fee_payer.authenticator as AccountAuthenticatorEd25519;
      const feePayerSignature = Buffer.from(feePayerAuthenticator.signature.toUint8Array());
      this.addFeePayerSignature({ pub: feePayerAuthenticator.public_key.toString() }, feePayerSignature);
    } catch (e) {
      console.error('invalid signed transaction', e);
      throw new Error('invalid signed transaction');
    }
  }

  protected async buildRawTransaction(): Promise<void> {
    const network: Network = this._coinConfig.network.type === NetworkType.MAINNET ? Network.MAINNET : Network.TESTNET;
    const aptos = new Aptos(new AptosConfig({ network }));
    const senderAddress = AccountAddress.fromString(this._sender);
    const recipientAddress = AccountAddress.fromString(this._recipient.address);

    const simpleTxn = await aptos.transaction.build.simple({
      sender: senderAddress,
      data: {
        function: '0x1::aptos_account::transfer_coins',
        typeArguments: ['0x1::aptos_coin::AptosCoin'],
        functionArguments: [recipientAddress, this.recipient.amount],
      },
      options: {
        maxGasAmount: this.maxGasAmount,
        gasUnitPrice: this.gasUnitPrice,
        expireTimestamp: this.expirationTime,
        accountSequenceNumber: this.sequenceNumber,
      },
    });
    this._rawTransaction = simpleTxn.rawTransaction;
  }
}
