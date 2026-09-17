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
import { bufferToHex, bufferToInt, ecsign, keccak256, toBuffer, toUnsigned, addHexPrefix } from 'ethereumjs-util';
import {
  BaseTxData,
  EIP1559TxData,
  EIP7702TxData,
  EthLikeTransactionData,
  LegacyTxData,
  ETHTransactionType,
  TxData,
} from './iface';
import { KeyPair } from './keyPair';
import {
  SET_CODE_TX_TYPE,
  SignedSetCodeTransaction,
  buildSetCodeTransaction,
  getSetCodeTransactionSigningHash,
  parseSetCodeTransaction,
} from './eip7702';

// https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/tx/src/transactionFactory.ts#L31
const LEGACY_TX_TYPE = 0;
const EIP1559_TX_TYPE = 2;

/**
 * An Ethereum transaction with helpers for serialization and deserialization.
 */
export class EthTransactionData implements EthLikeTransactionData {
  /** The @ethereumjs/tx transaction, set for Legacy and EIP-1559 types. */
  private tx?: TypedTransaction;
  /**
   * The parsed EIP-7702 set code transaction fields. Set (instead of `tx`) for
   * transaction type `0x04`, which @ethereumjs/tx v3 cannot represent natively.
   */
  private eip7702?: SignedSetCodeTransaction;
  protected args?: { deployedAddress?: string; chainId?: string };

  constructor(tx: TypedTransaction, args?: { deployedAddress?: string; chainId?: string });
  constructor(
    eip7702: SignedSetCodeTransaction,
    args: { deployedAddress?: string; chainId?: string } | undefined,
    isEip7702: true
  );
  constructor(
    txOrEip7702: TypedTransaction | SignedSetCodeTransaction,
    args?: { deployedAddress?: string; chainId?: string },
    isEip7702?: boolean
  ) {
    this.args = args;
    if (isEip7702) {
      this.eip7702 = txOrEip7702 as SignedSetCodeTransaction;
    } else {
      this.tx = txOrEip7702 as TypedTransaction;
    }
  }

  /**
   * Build an thereum transaction from its JSON representation
   *
   * @param {TxData} tx The JSON representation of the transaction
   * @param {EthereumCommon} common Class to access chain and hardfork parameters
   * @returns {EthTransactionData} a new ethereum transaction object
   */
  public static fromJson(tx: TxData, common: EthereumCommon): EthTransactionData {
    if (isEIP7702Tx(tx)) {
      // buildSetCodeTransaction / getSetCodeTransactionSigningHash treat string
      // scalars as decimal, so the stored representation uses decimal strings
      // for all scalar fields.
      const eip7702: SignedSetCodeTransaction = {
        chainId: tx.chainId ? scalarToDecimalString(tx.chainId) : common.chainIdBN().toString(10),
        nonce: scalarToDecimalString(tx.nonce),
        maxPriorityFeePerGas: scalarToDecimalString(tx.maxPriorityFeePerGas),
        maxFeePerGas: scalarToDecimalString(tx.maxFeePerGas),
        gasLimit: scalarToDecimalString(tx.gasLimit),
        destination: tx.to ?? '',
        value: scalarToDecimalString(tx.value),
        data: tx.data,
        authorizationList: tx.authorizationList,
        yParity: tx.v !== undefined ? (Number(tx.v) as 0 | 1) : 0,
        r: tx.r ?? '0x',
        s: tx.s ?? '0x',
      };

      return new EthTransactionData(
        eip7702,
        {
          deployedAddress: tx.deployedAddress,
          chainId: addHexPrefix(new BigNumber(Number(tx.chainId)).toString(16)),
        },
        true
      );
    }

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
    const bytes = toBuffer(addHexPrefix(tx));
    // @ethereumjs/tx v3 cannot parse the EIP-7702 type byte (0x04), so route
    // those through the dedicated set code util.
    if (bytes.length > 0 && bytes[0] === SET_CODE_TX_TYPE) {
      // parseSetCodeTransaction returns hex strings; convert scalars to the
      // decimal representation expected by buildSetCodeTransaction.
      return new EthTransactionData(normalizeEip7702Scalars(parseSetCodeTransaction(tx)), undefined, true);
    }
    return new EthTransactionData(
      TransactionFactory.fromSerializedData(bytes, { common: common })
    );
  }

  sign(keyPair: KeyPair) {
    const privateKey = Buffer.from(keyPair.getKeys().prv as string, 'hex');
    if (this.eip7702) {
      // Produce the envelope signature over the set code transaction signing hash.
      const hash = getSetCodeTransactionSigningHash(this.eip7702);
      const sig = ecsign(hash, privateKey);
      this.eip7702 = {
        ...this.eip7702,
        yParity: (sig.v - 27) as 0 | 1,
        r: bufferToHex(sig.r),
        s: bufferToHex(sig.s),
      };
      return;
    }
    this.tx = this.tx!.sign(privateKey);
  }

  getSignablePayload(): Buffer {
    if (this.eip7702) {
      // The 32-byte envelope digest an external (MPC) signer signs over.
      return getSetCodeTransactionSigningHash(this.eip7702);
    }
    return Buffer.from(this.tx!.getMessageToSign(true));
  }

  /** @inheritdoc */
  toJson(): TxData {
    if (this.eip7702) {
      return this.toEip7702Json();
    }

    const tx = this.tx!;
    const result: BaseTxData = {
      nonce: bufferToInt(toUnsigned(tx.nonce)),
      gasLimit: new BigNumber(bufferToHex(toUnsigned(tx.gasLimit)), 16).toString(10),
      value: tx.value.toString(10),
      data: bufferToHex(tx.data),
    };

    if (tx.isSigned()) {
      result.id = addHexPrefix(bufferToHex(tx.hash()));
    } else {
      result.id = addHexPrefix(bufferToHex(tx.getMessageToSign()));
    }

    if (tx.to) {
      result.to = bufferToHex(tx.to.toBuffer());
    }

    if (tx.verifySignature()) {
      result.from = bufferToHex(tx.getSenderAddress().toBuffer());
      assert(tx.r != undefined);
      result.r = bufferToHex(toUnsigned(tx.r));
      assert(tx.s != undefined);
      result.s = bufferToHex(toUnsigned(tx.s));
    }
    if (tx.v) {
      result.v = bufferToHex(toUnsigned(tx.v));
    }
    result.chainId = addHexPrefix(tx.common.chainIdBN().toString(16));

    if (this.args && this.args.deployedAddress) {
      result.deployedAddress = this.args.deployedAddress;
    }

    if (tx instanceof LegacyTransaction) {
      const gasPrice = new BigNumber(bufferToHex(toUnsigned(tx.gasPrice)), 16).toString(10);

      return {
        ...result,
        _type: ETHTransactionType.LEGACY,
        gasPrice,
      };
    } else if (tx instanceof FeeMarketEIP1559Transaction) {
      const maxFeePerGas = new BigNumber(bufferToHex(toUnsigned(tx.maxFeePerGas)), 16).toString(10);
      const maxPriorityFeePerGas = new BigNumber(bufferToHex(toUnsigned(tx.maxPriorityFeePerGas)), 16).toString(10);

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

  /**
   * Produce the JSON representation of an EIP-7702 set code transaction. The
   * stored scalar fields are decimal strings; they are emitted in the same
   * representation used for the other transaction types (decimal strings and a
   * numeric nonce), with the chain id as a 0x-prefixed hex string.
   */
  private toEip7702Json(): EIP7702TxData {
    const e = this.eip7702!;
    const result: BaseTxData = {
      nonce: Number(e.nonce),
      gasLimit: String(e.gasLimit),
      value: String(e.value),
      data: e.data,
    };

    result.chainId = addHexPrefix(new BigNumber(String(e.chainId)).toString(16));
    const isSigned = e.r !== '0x' && e.s !== '0x';
    result.id = addHexPrefix(
      (isSigned ? keccak256(buildSetCodeTransaction(e)) : getSetCodeTransactionSigningHash(e)).toString('hex')
    );
    result.to = e.destination;

    if (isSigned) {
      // Match the 0x-prefixed hex convention used by the other transaction types
      // (and expected by toStringSig / hasSignature).
      result.v = addHexPrefix(e.yParity.toString(16).padStart(2, '0'));
      result.r = e.r;
      result.s = e.s;
    }

    if (this.args && this.args.deployedAddress) {
      result.deployedAddress = this.args.deployedAddress;
    }

    return {
      ...result,
      _type: ETHTransactionType.EIP7702,
      maxFeePerGas: String(e.maxFeePerGas),
      maxPriorityFeePerGas: String(e.maxPriorityFeePerGas),
      authorizationList: e.authorizationList,
    };
  }

  /** @inheritdoc */
  toSerialized(): string {
    if (this.eip7702) {
      return addHexPrefix(buildSetCodeTransaction(this.eip7702).toString('hex'));
    }
    return addHexPrefix(this.tx!.serialize().toString('hex'));
  }
}

function isLegacyTx(tx: TxData): tx is LegacyTxData {
  return tx._type === ETHTransactionType.LEGACY;
}

function isEIP1559Txn(tx: TxData): tx is EIP1559TxData {
  return tx._type === ETHTransactionType.EIP1559;
}

function isEIP7702Tx(tx: TxData): tx is EIP7702TxData {
  return tx._type === ETHTransactionType.EIP7702;
}

/**
 * Convert an EIP-7702 scalar to a decimal string. Hex strings (0x-prefixed,
 * as returned by {@link parseSetCodeTransaction}) are converted to decimal;
 * everything else is passed through, since the set code encoding treats string
 * scalars as decimal.
 */
function scalarToDecimalString(value: string | number | bigint): string {
  if (typeof value === 'string' && value.startsWith('0x')) {
    // BigNumber yields "NaN" for the bare "0x" prefix; map it to zero.
    if (value === '0x') {
      return '0';
    }
    return new BigNumber(value, 16).toString(10);
  }
  return String(value);
}

/**
 * Normalize a parsed EIP-7702 transaction (hex-string scalars) into the decimal
 * scalar representation expected by {@link buildSetCodeTransaction}.
 */
function normalizeEip7702Scalars(tx: SignedSetCodeTransaction): SignedSetCodeTransaction {
  return {
    ...tx,
    chainId: scalarToDecimalString(tx.chainId),
    nonce: scalarToDecimalString(tx.nonce),
    maxPriorityFeePerGas: scalarToDecimalString(tx.maxPriorityFeePerGas),
    maxFeePerGas: scalarToDecimalString(tx.maxFeePerGas),
    gasLimit: scalarToDecimalString(tx.gasLimit),
    value: scalarToDecimalString(tx.value),
    authorizationList: tx.authorizationList.map((auth) => ({
      ...auth,
      chainId: scalarToDecimalString(auth.chainId),
      nonce: scalarToDecimalString(auth.nonce),
    })),
  };
}
