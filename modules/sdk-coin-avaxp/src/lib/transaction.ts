import { BaseCoin as CoinConfig, AvalancheNetwork } from '@bitgo/statics';
import { BaseKey, SigningError, BaseTransaction, TransactionType, InvalidTransactionError } from '@bitgo/sdk-core';
import { KeyPair } from './keyPair';
import { DecodedUtxoObj, TxData } from './iface';
import { UnsignedTx, BaseTx, Tx } from 'avalanche/dist/apis/platformvm';
import { BN, Buffer as BufferAvax } from 'avalanche';
import utils from './utils';
import * as createHash from 'create-hash';
import { Credential, Signature } from 'avalanche/dist/common';

export class Transaction extends BaseTransaction {
  protected _avaxpTransaction: UnsignedTx;
  private _credentials: Credential[] = [];
  public _type: TransactionType;
  public _network: AvalancheNetwork;
  public _networkID: number;
  public _assetId: BufferAvax;
  public _blockchainID: BufferAvax;
  public _memo?: BufferAvax;
  public _threshold = 2;
  public _locktime: BN = new BN(0);
  public _fromPubKeys: BufferAvax[] = [];
  public _utxos: DecodedUtxoObj[] = [];
  public _txFee: BN;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._network = coinConfig.network as AvalancheNetwork;
    this._assetId = utils.cb58Decode(this._network.avaxAssetID);
    this._blockchainID = utils.cb58Decode(this._network.blockchainID);
    this._networkID = this._network.networkID;
    this._txFee = new BN(this._network.txFee.toString());
  }

  get avaxPTransaction(): BaseTx {
    return this._avaxpTransaction.getTransaction();
  }

  set avaxPTransaction(tx: BaseTx) {
    this._avaxpTransaction = new UnsignedTx(tx);
  }

  get signature(): string[] {
    if (this.credentials.length == 1) {
      return [];
    }
    const obj: any = this.credentials[0].serialize();
    return obj.sigArray;
  }

  set credentials(credentials: Credential[]) {
    this._credentials = credentials;
  }

  get credentials(): Credential[] {
    return this._credentials;
  }

  get hasCredentials(): boolean {
    return this._credentials !== undefined && this._credentials.length > 0;
  }

  /** @inheritdoc */
  canSign({ key }: BaseKey): boolean {
    try {
      const kp = new KeyPair({ prv: key });
      const privateKey = kp.getPrivateKey();
      if (!privateKey) return false;
      const address = utils.parseAddress(kp.getAddress(this._network.hrp));
      return this._fromPubKeys.find((a) => address.equals(a)) !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Sign a avaxp transaction and update the transaction hex
   * validator, delegator, import, exports extend baseTx
   * unsignedTx: UnsignedTx = new UnsignedTx(baseTx)  (baseTx = addValidatorTx)
   * const tx: Tx = unsignedTx.sign(keychain) (tx is type standard signed tx)
   * get baseTx then create new unsignedTx then sign
   *
   * @param {KeyPair} keyPair
   */
  sign(keyPair: KeyPair): void {
    const prv = keyPair.getPrivateKey();
    if (!prv) {
      throw new SigningError('Missing private key');
    }
    if (!this.avaxPTransaction) {
      throw new InvalidTransactionError('empty transaction to sign');
    }
    if (!this.hasCredentials) {
      throw new InvalidTransactionError('empty credentials to sign');
    }
    const signature = this.createSignature(prv);
    this._credentials.forEach((credential) => credential.addSignature(signature));
  }

  /** @inheritdoc */
  /**
   * should be of signedTx doing this with baseTx
   */
  toBroadcastFormat(): string {
    if (!this.avaxPTransaction) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    const buffer = this.hasCredentials
      ? new Tx(this._avaxpTransaction, this._credentials).toBuffer()
      : this._avaxpTransaction.toBuffer();
    const txSerialized = utils.cb58Encode(buffer).toString();
    return txSerialized;
  }

  // types - stakingTransaction, import, export
  toJson(): TxData {
    if (!this.avaxPTransaction) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    return {
      blockchain_id: utils.cb58Encode(this.avaxPTransaction.getBlockchainID()),
      network_id: this.avaxPTransaction.getNetworkID(),
      inputs: this.avaxPTransaction.getIns(),
      outputs: this.avaxPTransaction.getOuts(),
      memo: utils.bufferToString(this.avaxPTransaction.getMemo()),
      typeID: this.avaxPTransaction.getTxType(),
    };
  }

  setTransaction(tx: UnsignedTx): void {
    this._avaxpTransaction = tx;
  }

  /**
   * Set the transaction type
   *
   * @param {TransactionType} transactionType The transaction type to be set
   */
  setTransactionType(transactionType: TransactionType): void {
    this._type = transactionType;
  }

  /**
   * Returns the portion of the transaction that needs to be signed in Buffer format.
   * Only needed for coins that support adding signatures directly (e.g. TSS).
   */
  get signablePayload(): Buffer {
    const txbuff = this._avaxpTransaction.toBuffer();
    return createHash.default('sha256').update(txbuff).digest();
  }

  /**
   * Avax wrapper to create signature and return it for credentials
   * @param prv
   */
  createSignature(prv: Buffer): Signature {
    const signval = utils.createSignatureAvaxBuffer(
      this._network,
      BufferAvax.from(this.signablePayload),
      BufferAvax.from(prv)
    );
    const sig = new Signature();
    sig.fromBuffer(signval);
    return sig;
  }
}
