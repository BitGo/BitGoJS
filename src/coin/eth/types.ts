import BigNumber from 'bignumber.js';
import { Transaction as EthereumTx } from 'ethereumjs-tx';
import { addHexPrefix, bufferToHex, bufferToInt, toBuffer } from 'ethereumjs-util';
import { TxData } from './iface';
import { KeyPair } from './keyPair';

export abstract class EthereumTransaction {
  raw: Buffer[];
  nonce: Buffer = toBuffer([]);
  gasLimit: Buffer = toBuffer([]);
  gasPrice: Buffer = toBuffer([]);
  to: Buffer = toBuffer([]);
  value: Buffer = toBuffer([]);
  data: Buffer = toBuffer([]);
  v: Buffer = toBuffer([]);
  r: Buffer = toBuffer([]);
  s: Buffer = toBuffer([]);
  abstract verifySignature(): boolean;
  abstract getSenderAddress(): Buffer;
  abstract serialize(): Buffer;
  abstract sign(privateKey?: Buffer): void;
  abstract getChainId(): number;
}

/**
 * An Ethereum transaction with helpers for serialization and deserialization.
 */
export class EthTransaction {
  constructor(public tx: EthereumTransaction, protected chainId?: string) {}

  /**
   * Build an ethereum transaction from its JSON representation
   *
   * @param tx The JSON representation of the transaction
   */
  public static fromJson(tx: TxData): EthTransaction {
    return new EthTransaction(
      new EthereumTx({
        nonce: addHexPrefix(new BigNumber(tx.nonce).toString(16)),
        to: tx.to,
        gasPrice: addHexPrefix(new BigNumber(tx.gasPrice).toString(16)),
        gasLimit: addHexPrefix(new BigNumber(tx.gasLimit).toString(16)),
        value: addHexPrefix(new BigNumber(tx.value).toString(16)),
        data: tx.data === '0x' ? '' : tx.data,
      }),
      addHexPrefix(new BigNumber(Number(tx.chainId)).toString(16)),
    );
  }

  /**
   * Build an ethereum transaction from its string serialization
   *
   * @param tx The string serialization of the ethereum transaction
   */
  public static fromSerialized(tx: string): EthTransaction {
    return new EthTransaction(new EthereumTx(tx));
  }

  sign(keyPair: KeyPair) {
    const privateKey = Buffer.from(keyPair.getKeys().prv as string, 'hex');
    this.tx.sign(privateKey);
  }

  /**
   * Return the JSON representation of this transaction
   */
  toJson(): TxData {
    const result: TxData = {
      nonce: bufferToInt(this.tx.nonce),
      gasPrice: new BigNumber(bufferToHex(this.tx.gasPrice), 16).toString(10),
      gasLimit: new BigNumber(bufferToHex(this.tx.gasLimit), 16).toString(10),
      value: this.tx.value.length === 0 ? '0' : new BigNumber(bufferToHex(this.tx.value), 16).toString(10),
      data: addHexPrefix(new BigNumber(bufferToHex(this.tx.data).slice(2), 16).toString(16)),
    };

    if (this.tx.to && this.tx.to.length) {
      result.to = bufferToHex(this.tx.to);
    }

    if (this.tx.verifySignature()) {
      result.from = bufferToHex(this.tx.getSenderAddress());
    }

    if (this.chainId) {
      result.chainId = this.chainId;
    }

    return result;
  }

  /**
   * Return the hex string serialization of this transaction
   */
  toSerialized(): string {
    return addHexPrefix(this.tx.serialize().toString('hex'));
  }
}
