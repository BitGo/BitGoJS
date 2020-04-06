import { Buffer } from 'buffer';
import createKeccakHash from 'keccak';
import { encode } from 'rlp';
import secp256k1 from 'secp256k1';
import { TxData, SigData } from './iface';
import { stripZeros, getFieldValue, toBuffer, bufferToInt } from './utils';

/**
 * @param data
 * @param chainId
 * @param privateKey
 */
export async function signTx(data: TxData = {}, chainId: number, privateKey: Buffer): Promise<string> {
  const tx = new Transaction(data, chainId);
  tx.sign(privateKey);
  const serializedTx = tx.serialize();
  return serializedTx.toString('hex');
}

export class Transaction {
  public raw!: Buffer[];
  public nonce!: Buffer;
  public gasLimit!: Buffer;
  public gasPrice!: Buffer;
  public to!: Buffer;
  public value!: Buffer;
  public chainId!: number;
  public data!: Buffer;
  public v!: Buffer;
  public r!: Buffer;
  public s!: Buffer;

  protected _from?: Buffer;

  /**
   * Creates a new transaction from an object with its fields' values.
   *
   * @param data - A transaction can be initialized with its rlp representation, an array containing
   * the value of its fields in order, or an object containing them by name.
   * @param chainId
   * @param opts - The transaction's options, used to indicate the chain and hardfork the
   * transactions belongs to.
   * @note Transaction objects implement EIP155 by default. To disable it, use the constructor's
   * second parameter to set a chain and hardfork before EIP155 activation (i.e. before Spurious
   * Dragon.)
   * @example
   * ```js
   * const txData = {
   * nonce: '0x00',
   * gasPrice: '0x09184e72a000',
   * gasLimit: '0x2710',
   * to: '0x0000000000000000000000000000000000000000',
   * value: '0x00',
   * data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057',
   * v: '0x1c',
   * r: '0x5e1d3a76fbf824220eafc8c79ad578ad2b67d01b0c2425eb1f1347e8f50882ab',
   * s: '0x5bd428537f05f9830e93792f90ea6a3e2d1ee84952dd96edbae9f658f831ab13'
   * };
   * const tx = new Transaction(txData);
   * ```
   */
  constructor(data: TxData = {}, chainId: number) {
    // Define Properties
    const fields = [
      {
        name: 'nonce',
        length: 32,
        allowLess: true,
        default: new Buffer([]),
      },
      {
        name: 'gasPrice',
        length: 32,
        allowLess: true,
        default: new Buffer([]),
      },
      {
        name: 'gasLimit',
        alias: 'gas',
        length: 32,
        allowLess: true,
        default: new Buffer([]),
      },
      {
        name: 'to',
        allowZero: true,
        length: 20,
        default: new Buffer([]),
      },
      {
        name: 'value',
        length: 32,
        allowLess: true,
        default: new Buffer([]),
      },
      {
        name: 'data',
        alias: 'input',
        allowZero: true,
        default: new Buffer([]),
      },
      {
        name: 'v',
        allowZero: true,
        default: new Buffer([]),
      },
      {
        name: 'r',
        length: 32,
        allowZero: true,
        allowLess: true,
        default: new Buffer([]),
      },
      {
        name: 's',
        length: 32,
        allowZero: true,
        allowLess: true,
        default: new Buffer([]),
      },
    ];

    this.chainId = chainId;

    // attached serialize
    this._defineProperties(this, fields, data);

    /**
     * @property {Buffer} from (read only) sender address of this transaction, mathematically derived from other parameters.
     * @name from
     * @memberof Transaction
     */
    Object.defineProperty(this, 'from', {
      enumerable: true,
      configurable: true,
    });

    this._validateV(this.v);
    this._overrideVSetterWithValidation();
  }

  /**
   * Computes a sha3-256 hash of the serialized tx
   */
  private _hash(): Buffer {
    let items;

    if (this._implementsEIP155()) {
      items = [...this.raw.slice(0, 6), toBuffer(this._getChainId()), stripZeros(toBuffer(0)), stripZeros(toBuffer(0))];
    } else {
      items = this.raw.slice(0, 6);
    }

    // create hash
    return this._keccak(encode(items));
  }

  /**
   * returns chain ID
   */
  private _getChainId(): number {
    return this.chainId;
  }

  /**
   * sign a transaction with a given private key
   *
   * @param privateKey - Must be 32 bytes in length
   */
  public sign(privateKey: Buffer) {
    // We clear any previous signature before signing it. Otherwise, _implementsEIP155's can give
    // different results if this tx was already signed.
    this.v = new Buffer([]);
    this.s = new Buffer([]);
    this.r = new Buffer([]);

    const msgHash = this._hash();
    const sig = this._ecsign(msgHash, privateKey);

    if (this._implementsEIP155() && sig.v !== undefined) {
      sig.v += this._getChainId() * 2 + 8;
    }

    Object.assign(this, sig);
  }

  /**
   * Returns the rlp encoding of the transaction
   */
  serialize(): Buffer {
    // Note: This never gets executed, _defineProperties overwrites it.
    return encode(this.raw);
  }

  private _validateV(v?: Buffer): void {
    if (v === undefined || v.length === 0) {
      return;
    }

    const vInt = bufferToInt(v);
    if (vInt === 27 || vInt === 28) {
      return;
    }
    const isValidEIP155V = vInt === this._getChainId() * 2 + 35 || vInt === this._getChainId() * 2 + 36;

    if (!isValidEIP155V) {
      throw new Error(`Incompatible EIP155-based V ${vInt} and chain id ${this._getChainId()}.`);
    }
  }

  private _keccak(a: any): any {
    a = toBuffer(a);
    const bits = 256;

    return createKeccakHash('keccak' + bits)
      .update(a)
      .digest();
  }

  private _ecsign(msgHash: any, privateKey: Buffer): SigData {
    const sig = secp256k1.sign(msgHash, privateKey);
    const ret: SigData = {};
    ret.r = sig.signature.slice(0, 32);
    ret.s = sig.signature.slice(32, 64);
    ret.v = sig.recovery + 27;
    return ret;
  }

  private _defineProperties(self: any, fields: any, data: any): void {
    self.raw = [];
    self._fields = [];

    self.serialize = function serialize() {
      return encode(self.raw);
    };

    fields.forEach((field, i) => {
      self._fields.push(field.name);
      /**
       *
       */
      function getter() {
        return self.raw[i];
      }
      /**
       * @param v
       */
      function setter(v) {
        self.raw[i] = getFieldValue(v, field);
      }

      Object.defineProperty(self, field.name, {
        enumerable: true,
        configurable: true,
        get: getter,
        set: setter.bind(this),
      });

      self[field.name] = field.default;

      // attach alias
      if (field.alias) {
        Object.defineProperty(self, field.alias, {
          enumerable: false,
          configurable: true,
          set: setter,
          get: getter,
        });
      }
    });

    if (typeof data === 'object') {
      const keys = Object.keys(data);
      fields.forEach(field => {
        if (keys.indexOf(field.name) !== -1) self[field.name] = data[field.name];
        if (keys.indexOf(field.alias) !== -1) self[field.alias] = data[field.alias];
      });
    } else {
      throw new Error('invalid data');
    }
  }

  private _isSigned(): boolean {
    return this.v.length > 0 && this.r.length > 0 && this.s.length > 0;
  }

  private _overrideVSetterWithValidation() {
    const vDescriptor = Object.getOwnPropertyDescriptor(this, 'v')!;

    Object.defineProperty(this, 'v', {
      ...vDescriptor,
      set: v => {
        if (v !== undefined) {
          this._validateV(toBuffer(v));
        }

        vDescriptor.set!(v);
      },
    });
  }

  private _implementsEIP155(): boolean {
    if (!this._isSigned()) {
      return true;
    }

    // EIP155 spec:
    // If block.number >= 2,675,000 and v = CHAIN_ID * 2 + 35 or v = CHAIN_ID * 2 + 36, then when computing
    // the hash of a transaction for purposes of signing or recovering, instead of hashing only the first six
    // elements (i.e. nonce, gasprice, startgas, to, value, data), hash nine elements, with v replaced by
    // CHAIN_ID, r = 0 and s = 0.
    const v = bufferToInt(this.v);
    const vAndChainIdMeetEIP155Conditions = v === this._getChainId() * 2 + 35 || v === this._getChainId() * 2 + 36;
    return vAndChainIdMeetEIP155Conditions;
  }
}
