import BigNumber from 'bignumber.js';
import { signTransaction } from '@celo/contractkit/lib/utils/signing-utils';
import {
  addHexPrefix,
  toBuffer,
  bufferToHex,
  bufferToInt,
  rlp,
  rlphash,
  stripZeros,
  ecrecover,
  publicToAddress,
} from 'ethereumjs-util';
import { TxData } from '../eth/iface';
import { EthereumTransaction, EthTransaction } from '../eth/types';
import { KeyPair, Utils } from '../eth';

export class CeloTransaction extends EthereumTransaction {
  private _from: Buffer;
  private _senderPubKey?;
  private _signatures: Buffer[];
  private _feeCurrency: Buffer = toBuffer('0x');
  private _gatewayFeeRecipient: Buffer = toBuffer('0x');
  private _gatewayFee: Buffer = toBuffer('0x');

  constructor(tx: TxData) {
    super();
    this.nonce = toBuffer(tx.nonce);
    this.gasLimit = toBuffer(tx.gasLimit);
    this.gasPrice = toBuffer(tx.gasPrice);
    this.data = toBuffer(tx.data);
    this.value = toBuffer(tx.value !== '0x0' ? tx.value : '0x');
    if (tx.to) {
      this.to = toBuffer(tx.to);
    }
    if (tx.v) {
      this.v = toBuffer(tx.v);
    }
    if (tx.r) {
      this.r = toBuffer(tx.r);
    }
    if (tx.s) {
      this.s = toBuffer(tx.s);
    }
    if (tx.from) {
      this._from = toBuffer(tx.from);
    }
    this.initRaw();
  }

  private initRaw() {
    this.raw = [
      this.nonce,
      this.gasPrice,
      this.gasLimit,
      this._feeCurrency,
      this._gatewayFeeRecipient,
      this._gatewayFee,
      this.to,
      this.value,
      this.data,
      this.v,
      this.r,
      this.s,
    ];
  }

  hash(includeSignature?: boolean): Buffer {
    let items;
    if (includeSignature) {
      items = this.raw;
    } else {
      items = this.raw
        .slice(0, 9)
        .concat([toBuffer(this.getChainId()), stripZeros(toBuffer(0)), stripZeros(toBuffer(0))]);
    }

    return rlphash(items);
  }

  getSenderAddress(): Buffer {
    if (this._from) {
      return this._from;
    }
    const pubKey = this.getSenderPublicKey();
    this._from = publicToAddress(pubKey);
    return this._from;
  }

  getSenderPublicKey() {
    if (this.verifySignature()) {
      // If the signature was verified successfully the _senderPubKey field is defined
      return this._senderPubKey;
    }
    throw new Error('Invalid Signature');
  }

  serialize(): Buffer {
    return rlp.encode(this.raw);
  }

  sign(privateKey: Buffer): void {
    this._signatures = [this.v, this.r, this.s, privateKey];
  }

  verifySignature(): boolean {
    const msgHash = this.hash(false);
    try {
      const chainId = this.getChainId();
      const v = bufferToInt(this.v) - (2 * chainId + 35);
      this._senderPubKey = ecrecover(msgHash, v + 27, this.r, this.s);
    } catch (e) {
      return false;
    }
    return !!this._senderPubKey;
  }

  getChainId(): number {
    let chainId = bufferToInt(this.v);
    if (this.r.length && this.s.length) {
      chainId = (chainId - 35) >> 1;
    }
    return chainId;
  }
}

export class CgldTransaction extends EthTransaction {
  constructor(tx: CeloTransaction, chainId?: string) {
    super(tx, chainId);
  }

  public static fromJson(tx: TxData): EthTransaction {
    const chainId = addHexPrefix(new BigNumber(Number(tx.chainId)).toString(16));
    return new CgldTransaction(
      new CeloTransaction({
        nonce: addHexPrefix(new BigNumber(tx.nonce).toString(16)),
        to: tx.to,
        gasPrice: addHexPrefix(new BigNumber(tx.gasPrice).toString(16)),
        gasLimit: addHexPrefix(new BigNumber(tx.gasLimit).toString(16)),
        value: addHexPrefix(new BigNumber(tx.value).toString(16)),
        data: tx.data === '0x' ? '' : tx.data,
        from: tx.from,
        s: tx.s,
        r: tx.r,
        v: tx.v || chainId,
      }),
      chainId,
    );
  }

  async sign(keyPair: KeyPair) {
    const privateKey = addHexPrefix(keyPair.getKeys().prv as string);
    const data = this.toJson();
    const rawTransaction = await signTransaction(data, privateKey);
    rawTransaction.tx.data = data.data;
    rawTransaction.tx.gasLimit = rawTransaction.tx.gas;
    this.tx = new CeloTransaction(rawTransaction.tx);
    this.tx.sign(toBuffer(privateKey));
  }
}
