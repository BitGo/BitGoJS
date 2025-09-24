import TonWeb from 'tonweb';
import { BN } from 'bn.js';
import { Cell } from 'tonweb/dist/types/boc/cell';
import { TransactionRecipient, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionExplanation, TxData } from './iface';
import { Transaction } from './transaction';
import { JETTON_TRANSFER_OPCODE, WALLET_ID } from './constants';

export class TokenTransaction extends Transaction {
  public forwardTonAmount: string; // for covering forward fees for notify transfer
  public senderJettonWalletAddress: string; // the sender's Jetton wallet address
  public tonAmount: string; // amount of TON sent to the sender's Jetton wallet

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  toJson(): TxData {
    const json = super.toJson();
    return {
      ...json,
      forwardTonAmount: this.forwardTonAmount,
      senderJettonWalletAddress: this.senderJettonWalletAddress,
      tonAmount: this.tonAmount,
    } as TxData;
  }

  private createJettonTransferPayload(
    jettonAmount: string,
    toAddress: string,
    forwardTonAmount: string,
    comment?: string
  ): Cell {
    const forwardPayload = new TonWeb.boc.Cell();
    if (comment) {
      forwardPayload.bits.writeUint(0, 32);
      forwardPayload.bits.writeString(comment);
    }

    const payload = new TonWeb.boc.Cell();
    payload.bits.writeUint(JETTON_TRANSFER_OPCODE, 32); // Store Jetton transfer op code
    payload.bits.writeUint(0, 64); // query_id
    payload.bits.writeCoins(new BN(jettonAmount)); // Jetton amount to transfer
    payload.bits.writeAddress(new TonWeb.Address(toAddress)); // recipient's TON wallet address
    payload.bits.writeAddress(new TonWeb.Address(this.sender)); // response_destination for sending excess TON (excess is returned back to the sender)
    payload.bits.writeBit(false); // No custom payload
    payload.bits.writeCoins(new BN(forwardTonAmount)); // forward_ton_amount to pay fees
    payload.bits.writeBit(true); // Forward payload exists as a reference
    payload.refs.push(forwardPayload); // Add forward payload as a reference

    return payload;
  }

  async build(): Promise<void> {
    const jettonTransferPayload = this.createJettonTransferPayload(
      this.recipient.amount,
      this.recipient.address,
      this.forwardTonAmount,
      this.message
    );

    const signingMessage = this.createSigningMessage(WALLET_ID, this.seqno, this.expireTime);
    const sendMode = 3;
    signingMessage.bits.writeUint8(sendMode);
    const outMsg = this.createOutMsg(this.senderJettonWalletAddress, this.tonAmount, jettonTransferPayload);

    signingMessage.refs.push(outMsg);
    this.unsignedMessage = Buffer.from(await signingMessage.hash()).toString('hex');

    const signature =
      this._signatures.length > 0 ? this._signatures[0] : Buffer.from(new Uint8Array(64)).toString('hex');
    const finalMessage = await this.createExternalMessage(signingMessage, this.seqno, signature);

    this.finalMessage = TonWeb.utils.bytesToBase64(await finalMessage.toBoc(false));

    const originalTxId = TonWeb.utils.bytesToBase64(await finalMessage.hash());
    this._id = originalTxId.replace(/\//g, '_').replace(/\+/g, '-');
  }

  fromRawTransaction(rawTransaction: string): void {
    try {
      const cell = TonWeb.boc.Cell.oneFromBoc(TonWeb.utils.base64ToBytes(rawTransaction));
      const parsed = this.parseTransaction(cell);

      this.transactionType = TransactionType.SendToken;
      this.sender = parsed.fromAddress;
      this.recipient = { address: parsed.payload.jettonRecipient, amount: parsed.payload.jettonAmount };
      this.tonAmount = parsed.value;
      this.forwardTonAmount = parsed.payload.forwardTonAmount;
      this.senderJettonWalletAddress = parsed.toAddress;
      this.seqno = parsed.seqno;
      this.publicKey = parsed.publicKey as string;
      this.expireTime = parsed.expireAt;
      this.message = parsed.payload.message;
      this._signatures.push(parsed.signature);
      this.bounceable = parsed.bounce;
    } catch (e) {
      throw new Error('invalid raw transaction');
    }
  }

  /** @inheritDoc */
  explainTransaction(): TransactionExplanation {
    const displayOrder = ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'withdrawAmount'];

    const outputs: TransactionRecipient[] = [this.recipient];
    const outputAmount = this.recipient.amount;
    const withdrawAmount = this.withdrawAmount;
    return {
      displayOrder,
      id: this.id,
      outputs,
      outputAmount,
      changeOutputs: [],
      changeAmount: '0',
      fee: { fee: 'UNKNOWN' },
      withdrawAmount,
    };
  }
}
