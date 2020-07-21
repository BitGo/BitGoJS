import BigNumber from 'bignumber.js';
import { LocalWallet } from '@celo/contractkit/lib/wallets/local-wallet';
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
import { EthLikeTransactionData, TxData } from '../eth/iface';
import { KeyPair } from '../eth';

export class CeloTransaction {
  private raw: Buffer[];
  private _from: Buffer;
  private _senderPubKey?;
  private _signatures: Buffer[];
  private _feeCurrency: Buffer = toBuffer('0x');
  private _gatewayFeeRecipient: Buffer = toBuffer('0x');
  private _gatewayFee: Buffer = toBuffer('0x');
  nonce: Buffer;
  gasLimit: Buffer;
  gasPrice: Buffer;
  data: Buffer;
  value: Buffer;
  to: Buffer = toBuffer([]);
  v: Buffer = toBuffer([]);
  r: Buffer = toBuffer([]);
  s: Buffer = toBuffer([]);

  // TODO: validate if this needs to be moved to Utils class
  /**
   * Clean hex formatted values ensuring they have an even length
   *
   * @param numberValue Hex formatted number value. Example '0x01'
   * @returns sanitized value
   */
  private sanitizeHexString(numberValue) {
    if (numberValue === '0x0') {
      return '0x';
    } else if (numberValue.length % 2 === 0) {
      return numberValue;
    }
    return '0x0' + numberValue.slice(2);
  }

  constructor(tx: TxData) {
    this.nonce = toBuffer(this.sanitizeHexString(tx.nonce));
    this.gasLimit = toBuffer(this.sanitizeHexString(tx.gasLimit));
    this.gasPrice = toBuffer(this.sanitizeHexString(tx.gasPrice));
    this.data = toBuffer(tx.data);
    this.value = toBuffer(this.sanitizeHexString(tx.value));
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

export class CeloTransactionData implements EthLikeTransactionData {
  private tx: CeloTransaction;
  private deployedAddress?: string;

  constructor(tx: CeloTransaction, deployedAddress?: string) {
    this.tx = tx;
    this.deployedAddress = deployedAddress;
  }

  public static fromJson(tx: TxData): CeloTransactionData {
    const chainId = addHexPrefix(new BigNumber(Number(tx.chainId)).toString(16));
    return new CeloTransactionData(
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
      tx.deployedAddress,
    );
  }

  async sign(keyPair: KeyPair) {
    const privateKey = addHexPrefix(keyPair.getKeys().prv as string);
    const data = CeloTransactionData.txJsonToCeloTx(this.toJson(), keyPair.getAddress());

    const celoLocalWallet = new LocalWallet();
    celoLocalWallet.addAccount(privateKey);
    const rawTransaction = await celoLocalWallet.signTransaction(data);

    const nonceBigNumber = new BigNumber(rawTransaction.tx.nonce);
    rawTransaction.tx.nonce = addHexPrefix(nonceBigNumber.toString(16));
    rawTransaction.tx.data = data.data;
    rawTransaction.tx.gasLimit = rawTransaction.tx.gas;
    this.tx = new CeloTransaction(rawTransaction.tx);
    this.tx.sign(toBuffer(privateKey));
  }

  /** @inheritdoc */
  toJson(): TxData {
    const result: TxData = {
      nonce: bufferToInt(this.tx.nonce),
      gasPrice: new BigNumber(bufferToHex(this.tx.gasPrice), 16).toString(10),
      gasLimit: new BigNumber(bufferToHex(this.tx.gasLimit), 16).toString(10),
      value: this.tx.value.length === 0 ? '0' : new BigNumber(bufferToHex(this.tx.value), 16).toString(10),
      data: bufferToHex(this.tx.data),
      id: addHexPrefix(bufferToHex(this.tx.hash(true))),
    };

    if (this.tx.to && this.tx.to.length) {
      result.to = bufferToHex(this.tx.to);
    }

    if (this.tx.verifySignature()) {
      result.from = bufferToHex(this.tx.getSenderAddress());
    }

    const chainId = this.tx.getChainId();
    if (chainId) {
      result.chainId = chainId.toString();
    }

    if (this.deployedAddress) {
      result.deployedAddress = this.deployedAddress;
    }

    this.setSignatureFields(result);

    return result;
  }

  private setSignatureFields(result: TxData): void {
    if (this.tx.v && this.tx.v.length) {
      result.v = bufferToHex(this.tx.v);
    }

    if (this.tx.r && this.tx.r.length) {
      result.r = bufferToHex(this.tx.r);
    }

    if (this.tx.s && this.tx.s.length) {
      result.s = bufferToHex(this.tx.s);
    }
  }

  /** @inheritdoc */
  toSerialized(): string {
    return addHexPrefix(this.tx.serialize().toString('hex'));
  }

  private static txJsonToCeloTx(txJson: TxData, signer: string): CeloLibraryTx {
    // the celo library requires you to specify the signer address with the from field
    return Object.assign({}, txJson, { gas: txJson.gasLimit, from: signer });
  }
}

// the same as normal txdata but gasLimit is called gas
interface CeloLibraryTx extends TxData {
  gas: string;
}
