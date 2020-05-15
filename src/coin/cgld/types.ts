import BigNumber from 'bignumber.js';
import { signTransaction } from '@celo/contractkit/lib/utils/signing-utils';
import { addHexPrefix, toBuffer, bufferToHex, bufferToInt, rlp } from 'ethereumjs-util';
import { TxData } from '../eth/iface';
import { EthereumTransaction, EthTransaction } from '../eth/types';
import { KeyPair } from '../eth';

export class CeloTransaction extends EthereumTransaction {
  private _from: Buffer;
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
    this.raw = [this.nonce, this.gasPrice, this.gasLimit, this.to, this.value, this.data, this.v, this.r, this.s];
  }

  //TODO: implement this method
  getSenderAddress(): Buffer {
    return new Buffer('');
  }

  serialize(): Buffer {
    return rlp.encode(this.raw);
  }

  sign(privateKey: Buffer): void {
    this.raw.splice(3, 0, toBuffer('0x'), toBuffer('0x'), toBuffer('0x'));
  }

  //TODO: implement method
  verifySignature(): boolean {
    return false;
  }
  //TODO: implement method
  getChainId(): number {
    return 0;
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
    this.tx.sign(toBuffer(this.chainId));
  }
}
