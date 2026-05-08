import assert from 'assert';
import BigNumber from 'bignumber.js';
import {
  TransactionFactory,
  TypedTransaction,
  Transaction as LegacyTransaction,
  FeeMarketEIP1559Transaction,
  AccessListEIP2930Transaction,
} from '@ethereumjs/tx';
import EthereumCommon from '@ethereumjs/common';
import { bufferToHex, bufferToInt, toBuffer, toUnsigned, addHexPrefix } from 'ethereumjs-util';
import { BaseTxData, EIP1559TxData, EthLikeTransactionData, LegacyTxData, ETHTransactionType, TxData } from './iface';
import { KeyPair } from './keyPair';

// https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/tx/src/transactionFactory.ts#L31
const LEGACY_TX_TYPE = 0;
const EIP1559_TX_TYPE = 2;

/**
 * An Ethereum transaction with helpers for serialization and deserialization.
 */
export class EthTransactionData implements EthLikeTransactionData {
  private tx: TypedTransaction;
  protected args?: { deployedAddress?: string; chainId?: string };

  constructor(tx: TypedTransaction, args?: { deployedAddress?: string; chainId?: string }) {
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
    const nonce = addHexPrefix(new BigNumber(tx.nonce).toString(16));
    const value = addHexPrefix(new BigNumber(tx.value).toString(16));
    const gasLimit = addHexPrefix(new BigNumber(tx.gasLimit).toString(16));
    const chainId = tx.chainId ? addHexPrefix(new BigNumber(tx.chainId).toString(16)) : undefined;

    const gasPrice = isLegacyTx(tx) ? addHexPrefix(new BigNumber(tx.gasPrice).toString(16)) : undefined;

    const maxFeePerGas = isEIP1559Txn(tx) ? addHexPrefix(new BigNumber(tx.maxFeePerGas).toString(16)) : undefined;
    const maxPriorityFeePerGas = isEIP1559Txn(tx)
      ? addHexPrefix(new BigNumber(tx.maxPriorityFeePerGas).toString(16))
      : undefined;

    return new EthTransactionData(
      TransactionFactory.fromTxData(
        {
          type: isLegacyTx(tx) ? LEGACY_TX_TYPE : EIP1559_TX_TYPE,
          chainId,
          nonce,
          to: tx.to,
          gasPrice,
          gasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas,
          value,
          data: tx.data,
          v: tx.v,
          r: tx.r,
          s: tx.s,
        },
        { common: common }
      ),
      {
        deployedAddress: tx.deployedAddress,
        chainId: addHexPrefix(new BigNumber(Number(tx.chainId)).toString(16)),
      }
    );
  }

  /**
   * Build an ethereum transaction from its string serialization
   *
   * @param tx The string serialization of the ethereum transaction
   * @param common
   */
  public static fromSerialized(tx: string, common: EthereumCommon): EthTransactionData {
    return new EthTransactionData(
      TransactionFactory.fromSerializedData(toBuffer(addHexPrefix(tx)), { common: common })
    );
  }

  sign(keyPair: KeyPair) {
    const privateKey = Buffer.from(keyPair.getKeys().prv as string, 'hex');
    this.tx = this.tx.sign(privateKey);
  }

  /** @inheritdoc */
  toJson(): TxData {
    const result: BaseTxData = {
      nonce: bufferToInt(toUnsigned(this.tx.nonce)),
      gasLimit: new BigNumber(bufferToHex(toUnsigned(this.tx.gasLimit)), 16).toString(10),
      value: this.tx.value.toString(10),
      data: bufferToHex(this.tx.data),
    };

    if (this.tx.isSigned()) {
      result.id = addHexPrefix(bufferToHex(this.tx.hash()));
    } else {
      result.id = addHexPrefix(bufferToHex(this.tx.getMessageToSign()));
    }

    if (this.tx.to) {
      result.to = bufferToHex(this.tx.to.toBuffer());
    }

    if (this.tx.verifySignature()) {
      result.from = bufferToHex(this.tx.getSenderAddress().toBuffer());
      assert(this.tx.r != undefined);
      result.r = bufferToHex(toUnsigned(this.tx.r));
      assert(this.tx.s != undefined);
      result.s = bufferToHex(toUnsigned(this.tx.s));
    }
    if (this.tx.v) {
      result.v = bufferToHex(toUnsigned(this.tx.v));
    }
    result.chainId = addHexPrefix(this.tx.common.chainIdBN().toString(16));

    if (this.args && this.args.deployedAddress) {
      result.deployedAddress = this.args.deployedAddress;
    }

    if (this.tx instanceof LegacyTransaction) {
      const gasPrice = new BigNumber(bufferToHex(toUnsigned(this.tx.gasPrice)), 16).toString(10);

      return {
        ...result,
        _type: ETHTransactionType.LEGACY,
        gasPrice,
      };
    } else if (this.tx instanceof FeeMarketEIP1559Transaction) {
      const maxFeePerGas = new BigNumber(bufferToHex(toUnsigned(this.tx.maxFeePerGas)), 16).toString(10);
      const maxPriorityFeePerGas = new BigNumber(bufferToHex(toUnsigned(this.tx.maxPriorityFeePerGas)), 16).toString(
        10
      );

      return {
        ...result,
        _type: ETHTransactionType.EIP1559,
        maxFeePerGas,
        maxPriorityFeePerGas,
      };
    } else {
      throw new Error(`Unsupported tx type: ${AccessListEIP2930Transaction.name}`);
    }
  }

  /** @inheritdoc */
  toSerialized(): string {
    return addHexPrefix(this.tx.serialize().toString('hex'));
  }
}

function isLegacyTx(tx: TxData): tx is LegacyTxData {
  return tx._type === ETHTransactionType.LEGACY;
}

function isEIP1559Txn(tx: TxData): tx is EIP1559TxData {
  return tx._type === ETHTransactionType.EIP1559;
}
