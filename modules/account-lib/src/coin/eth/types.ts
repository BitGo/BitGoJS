import BigNumber from 'bignumber.js';
import { Transaction as EthereumTx } from '@ethereumjs/tx';
import EthereumCommon from '@ethereumjs/common';
import { addHexPrefix, bufferToHex, bufferToInt, toBuffer } from 'ethereumjs-utils-old';
import { EthLikeTransactionData, TxData } from './iface';
import { KeyPair } from './keyPair';

/**
 * An Ethereum transaction with helpers for serialization and deserialization.
 */
export class EthTransactionData implements EthLikeTransactionData {
  private tx: EthereumTx;
  protected args?: { deployedAddress?: string; chainId?: string };

  constructor(tx: EthereumTx, args?: { deployedAddress?: string; chainId?: string }) {
    this.tx = tx;
    this.args = args;
  }

  /**
   * Build an thereum transaction from its JSON representation
   *
   * @param {TxData} tx The JSON representation of the transaction
   * @param {EthereumCommon} common Class to access chain and hardfork parameters
   * @returns {EthTransactionData} a new ethereum transaction object
   */
  public static fromJson(tx: TxData, common: EthereumCommon): EthTransactionData {
    return new EthTransactionData(
      new EthereumTx(
        {
          nonce: addHexPrefix(new BigNumber(tx.nonce).toString(16)),
          to: tx.to,
          gasPrice: addHexPrefix(new BigNumber(tx.gasPrice).toString(16)),
          gasLimit: addHexPrefix(new BigNumber(tx.gasLimit).toString(16)),
          value: addHexPrefix(new BigNumber(tx.value).toString(16)),
          data: tx.data,
          v: tx.v,
          r: tx.r,
          s: tx.s,
        },
        { common: common },
      ),
      { deployedAddress: tx.deployedAddress, chainId: addHexPrefix(new BigNumber(Number(tx.chainId)).toString(16)) },
    );
  }

  /**
   * Build an ethereum transaction from its string serialization
   *
   * @param tx The string serialization of the ethereum transaction
   * @param common
   */
  public static fromSerialized(tx: string, common: EthereumCommon): EthTransactionData {

    return new EthTransactionData(EthereumTx.fromSerializedTx(toBuffer(tx), { common: common }));
  }

  sign(keyPair: KeyPair) {
    const privateKey = Buffer.from(keyPair.getKeys().prv as string, 'hex');
    this.tx = this.tx.sign(privateKey);
  }

  /** @inheritdoc */
  toJson(): TxData {
    const result: TxData = {
      nonce: bufferToInt(this.tx.nonce),
      gasPrice: new BigNumber(bufferToHex(this.tx.gasPrice), 16).toString(10),
      gasLimit: new BigNumber(bufferToHex(this.tx.gasLimit), 16).toString(10),
      value: this.tx.value.toString(10),
      data: bufferToHex(this.tx.data),
      id: addHexPrefix(bufferToHex(this.tx.hash())),
    };

    if (this.tx.to) {
      result.to = bufferToHex(this.tx.to.toBuffer());
    }

    if (this.tx.verifySignature()) {
      result.from = bufferToHex(this.tx.getSenderAddress().toBuffer());
      result.v = bufferToHex(this.tx.v);
      result.r = bufferToHex(this.tx.r);
      result.s = bufferToHex(this.tx.s);
    }
    result.chainId = addHexPrefix(this.tx.common.chainId().toString(16));

    if (this.args && this.args.deployedAddress) {
      result.deployedAddress = this.args.deployedAddress;
    }

    return result;
  }

  /** @inheritdoc */
  toSerialized(): string {
    return addHexPrefix(this.tx.serialize().toString('hex'));
  }
}
