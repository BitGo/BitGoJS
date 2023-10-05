import {
  BaseKey,
  BaseTransaction,
  Entry,
  Recipient,
  TransactionRecipient,
  TransactionType,
  TransactionExplanation,
} from '@bitgo/sdk-core';
import { TxData } from './iface';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import TonWeb from 'tonweb';
import { BN } from 'bn.js';
import { Cell } from 'tonweb/dist/types/boc/cell';

const WALLET_ID = 698983191;

export class Transaction extends BaseTransaction {
  public recipient: Recipient;
  public message: string;
  seqno: number;
  expireTime: number;
  sender: string;
  publicKey: string;
  private unsignedMessage: string;
  private finalMessage: string;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  canSign(key: BaseKey): boolean {
    return false;
  }

  toBroadcastFormat(): string {
    return this.finalMessage;
  }

  toJson(): TxData {
    return {
      id: this._id as string,
      sender: this.sender,
      destination: this.recipient.address,
      amount: this.recipient.amount,
      seqno: this.seqno,
      expirationTime: this.expireTime,
      publicKey: this.publicKey,
      signature: this._signatures[0],
    };
  }

  get signablePayload(): Buffer {
    return Buffer.from(this.unsignedMessage, 'hex');
  }

  async build(): Promise<void> {
    this._type = TransactionType.Send;
    const signingMessage = this.createSigningMessage(WALLET_ID, this.seqno, this.expireTime);
    const sendMode = 3;
    signingMessage.bits.writeUint8(sendMode);
    signingMessage.refs.push(this.createOutMsg(this.recipient.address, this.recipient.amount, this.message));
    this.unsignedMessage = Buffer.from(await signingMessage.hash()).toString('hex');

    const signature =
      this._signatures.length > 0 ? this._signatures[0] : Buffer.from(new Uint8Array(64)).toString('hex');
    const finalMessage = await this.createExternalMessage(signingMessage, this.seqno, signature);
    this.finalMessage = TonWeb.utils.bytesToBase64(await finalMessage.toBoc(false));

    this._id = TonWeb.utils.bytesToBase64(await finalMessage.hash());
  }

  private createSigningMessage(walletId, seqno, expireAt) {
    const message = new TonWeb.boc.Cell();
    message.bits.writeUint(walletId, 32);
    if (seqno === 0) {
      for (let i = 0; i < 32; i++) {
        message.bits.writeBit(1);
      }
    } else {
      message.bits.writeUint(expireAt, 32);
    }
    message.bits.writeUint(seqno, 32);
    message.bits.writeUint(0, 8); // op
    return message;
  }

  private createOutMsg(address, amount, payload) {
    let payloadCell = new TonWeb.boc.Cell();
    if (payload) {
      if (payload.refs) {
        // is Cell
        payloadCell = payload;
      } else if (typeof payload === 'string') {
        if (payload.length > 0) {
          payloadCell.bits.writeUint(0, 32);
          payloadCell.bits.writeString(payload);
        }
      } else {
        payloadCell.bits.writeBytes(payload);
      }
    }

    const orderHeader = TonWeb.Contract.createInternalMessageHeader(new TonWeb.Address(address), new BN(amount));
    return TonWeb.Contract.createCommonMsgInfo(orderHeader, undefined, payloadCell);
  }

  async createExternalMessage(signingMessage: Cell, seqno: number, signature: string): Promise<Cell> {
    const body = new TonWeb.boc.Cell();

    body.bits.writeBytes(Buffer.from(signature, 'hex'));
    body.writeCell(signingMessage);

    let stateInit;
    if (seqno === 0) {
      const WalletClass = TonWeb.Wallets.all['v4R2'];
      const wallet = new WalletClass(new TonWeb.HttpProvider(), {
        publicKey: TonWeb.utils.hexToBytes(this.publicKey),
        wc: 0,
      });
      const deploy = await wallet.createStateInit();
      stateInit = deploy.stateInit;
    }

    const header = TonWeb.Contract.createExternalMessageHeader(this.sender);
    const resultMessage = TonWeb.Contract.createCommonMsgInfo(header, stateInit, body);
    return resultMessage;
  }

  loadInputsAndOutputs(): void {
    const outputs: Entry[] = [];
    const inputs: Entry[] = [];
    inputs.push({
      address: this.sender,
      value: this.recipient.amount,
      coin: this._coinConfig.name,
    });
    outputs.push({
      address: this.recipient.address,
      value: this.recipient.amount,
      coin: this._coinConfig.name,
    });
    this._outputs = outputs;
    this._inputs = inputs;
  }

  fromRawTransaction(rawTransaction: string): void {
    try {
      const cell = TonWeb.boc.Cell.oneFromBoc(TonWeb.utils.base64ToBytes(rawTransaction));

      const parsed = this.parseTransfer(cell);
      parsed.value = parsed.value.toString();
      parsed.fromAddress = parsed.fromAddress.toString(true, true, true);
      parsed.toAddress = parsed.toAddress.toString(true, true, true);
      this.sender = parsed.fromAddress;
      this.recipient = { address: parsed.toAddress, amount: parsed.value };
      this.seqno = parsed.seqno;
      this.publicKey = parsed.publicKey as string;
      this.expireTime = parsed.expireAt;
      this.message = parsed.payload;
      this._signatures.push(parsed.signature);
    } catch (e) {
      throw new Error('invalid raw transaction');
    }
  }

  /** @inheritDoc */
  explainTransaction(): TransactionExplanation {
    const displayOrder = ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee'];

    const outputs: TransactionRecipient[] = [this.recipient];
    const outputAmount = this.recipient.amount;
    return {
      displayOrder,
      id: this.id,
      outputs,
      outputAmount,
      changeOutputs: [],
      changeAmount: '0',
      fee: { fee: 'UNKNOWN' },
    };
  }

  private parseTransfer(cell: Cell): any {
    const slice = (cell as any).beginParse();

    // header

    if (slice.loadUint(2).toNumber() !== 2) throw Error('invalid header');

    const externalSourceAddress = slice.loadAddress();
    if (externalSourceAddress !== null) throw Error('invalid externalSourceAddress');

    const externalDestAddress = slice.loadAddress();

    const externalImportFee = slice.loadCoins();
    if (!externalImportFee.eq(new BN(0))) throw new Error('invalid externalImportFee');

    // stateInit

    let publicKey;
    if (slice.loadBit()) {
      if (slice.loadBit()) {
        const stateInit = slice.loadRef();
        stateInit.loadRef();
        const data = stateInit.loadRef();
        const seqno = data.loadUint(32).toNumber();
        if (seqno !== 0) throw new Error('invalid seqno');
        const walletId = data.loadUint(32).toNumber();
        if (walletId !== WALLET_ID) throw new Error('invalid wallet id');
        const publicKeyBuf = new Uint8Array(32);
        for (let i = 0; i < publicKeyBuf.length; i++) {
          publicKeyBuf[i] = data.loadUint(8);
        }
        publicKey = Buffer.from(publicKeyBuf).toString('hex');
      }
    }

    // body
    const bodySlice = slice.loadBit() ? slice.loadRef() : slice;

    return {
      fromAddress: externalDestAddress,
      publicKey,
      ...this.parseTransferBody(bodySlice),
    };
  }

  private parseTransferBody(slice: any): any {
    const signature = Buffer.from(slice.loadBits(512)).toString('hex');
    // signing message

    const walletId = slice.loadUint(32).toNumber();
    if (walletId !== WALLET_ID) throw new Error('invalid walletId');

    const expireAt = slice.loadUint(32).toNumber();

    const seqno = slice.loadUint(32).toNumber();

    const op = slice.loadUint(8).toNumber();
    if (op !== 0) throw new Error('invalid op');

    const sendMode = slice.loadUint(8).toNumber();
    if (sendMode !== 3) throw new Error('invalid sendMode');

    let order = slice.loadRef();

    if (order.loadBit()) throw Error('invalid internal header');
    if (!order.loadBit()) throw Error('invalid ihrDisabled');
    const bounce = order.loadBit();
    if (order.loadBit()) throw Error('invalid bounced');
    const sourceAddress = order.loadAddress();
    if (sourceAddress !== null) throw Error('invalid externalSourceAddress');
    const destAddress = order.loadAddress();
    const value = order.loadCoins();

    if (order.loadBit()) throw Error('invalid currencyCollection');
    const ihrFees = order.loadCoins();
    if (!ihrFees.eq(new BN(0))) throw new Error('invalid ihrFees');
    const fwdFees = order.loadCoins();
    if (!fwdFees.eq(new BN(0))) throw new Error('invalid fwdFees');
    const createdLt = order.loadUint(64);
    if (!createdLt.eq(new BN(0))) throw new Error('invalid createdLt');
    const createdAt = order.loadUint(32);
    if (!createdAt.eq(new BN(0))) throw new Error('invalid createdAt');

    // order stateInit
    if (order.loadBit()) {
      order.loadRef(); // don't parse stateInit
    }

    // order body
    let payload;

    if (order.getFreeBits() > 0) {
      if (order.loadBit()) {
        order = order.loadRef();
      }

      if (order.getFreeBits() > 32) {
        const op = order.loadUint(32);
        const payloadBytes = order.loadBits(order.getFreeBits());
        payload = op.eq(new BN(0)) ? new TextDecoder().decode(payloadBytes) : '';
      }
    }
    return {
      toAddress: destAddress,
      value,
      bounce,
      seqno,
      expireAt,
      payload,
      signature,
      walletId,
    };
  }

  private parseTransferStateInit(slice: any): any {
    if (slice === null) return {};
    slice.loadRef();
    const data = slice.loadRef();
    const seqno = data.loadUint(32).toNumber();
    if (seqno !== 0) throw new Error('invalid seqno');
    const walletId = data.loadUint(32).toNumber();
    if (walletId !== WALLET_ID) throw new Error('invalid wallet id');
    const publicKey = new Uint8Array(32);
    for (let i = 0; i < publicKey.length; i++) {
      publicKey[i] = data.loadUint(8);
    }
    return {
      publicKey: Buffer.from(publicKey).toString('hex'),
    };
  }
}
