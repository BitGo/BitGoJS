import BigNumber from 'bignumber.js';
import { LocalWallet } from '@celo/wallet-local';
import {
  addHexPrefix,
  toBuffer,
  bufferToHex,
  bufferToInt,
  rlp,
  rlphash,
  ecrecover,
  publicToAddress,
  unpadBuffer,
} from 'ethereumjs-util';
import { CeloTx, EncodedTransaction } from '@celo/connect';
import { EthLikeTransactionData, ETHTransactionType, KeyPair, LegacyTxData } from '@bitgo/sdk-coin-eth';

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
    if (numberValue === '0x0' || numberValue == '') {
      return '0x';
    } else if (numberValue.length % 2 === 0) {
      return numberValue;
    }
    return '0x0' + numberValue.slice(2);
  }

  constructor(tx: LegacyTxData) {
    this.nonce = unpadBuffer(toBuffer(tx.nonce));
    this.gasLimit = toBuffer(this.sanitizeHexString(tx.gasLimit));
    this.gasPrice = toBuffer(this.sanitizeHexString(tx.gasPrice));
    this.data = toBuffer(this.sanitizeHexString(tx.data));
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
        .concat([toBuffer(this.getChainId()), unpadBuffer(toBuffer(0)), unpadBuffer(toBuffer(0))]);
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

  public static fromJson(tx: LegacyTxData): CeloTransactionData {
    const chainId = addHexPrefix(new BigNumber(Number(tx.chainId)).toString(16));
    return new CeloTransactionData(
      new CeloTransaction({
        _type: ETHTransactionType.LEGACY,
        nonce: tx.nonce,
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
      tx.deployedAddress
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
    rawTransaction.raw = data.data === undefined ? '' : data.data;
    rawTransaction.tx.gas = rawTransaction.tx.gas;
    this.tx = new CeloTransaction(CeloTransactionData.encodedTxToJson(rawTransaction));
    this.tx.sign(toBuffer(privateKey));
  }

  /** @inheritdoc */
  toJson(): LegacyTxData {
    const result: LegacyTxData = {
      _type: ETHTransactionType.LEGACY,
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

  private setSignatureFields(result: LegacyTxData): void {
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

  private static txJsonToCeloTx(txJson: LegacyTxData, signer: string): CeloTx {
    // the celo library requires you to specify the signer address with the from field
    return Object.assign({}, txJson, {
      chainId: txJson.chainId === undefined ? 0 : parseInt(txJson.chainId, 10),
      gas: txJson.gasLimit,
      from: signer,
    });
  }

  private static encodedTxToJson(encodedTx: EncodedTransaction): LegacyTxData {
    return {
      ...encodedTx.tx,
      _type: ETHTransactionType.LEGACY,
      nonce: parseInt(encodedTx.tx.nonce, 16),
      gasLimit: encodedTx.tx.gas,
      data: encodedTx.raw,
    };
  }
}
