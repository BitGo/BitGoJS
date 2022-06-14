import { BaseCoin as CoinConfig, AvalancheNetwork } from '@bitgo/statics';
import {
  BaseKey,
  SigningError,
  BaseTransaction,
  TransactionType,
  InvalidTransactionError,
  NotImplementedError
} from '@bitgo/sdk-core';
import { KeyPair } from './keyPair';
import { TxData } from './iface';
import {
  UnsignedTx,
  BaseTx,
  KeyChain,
  KeyPair as KeyPairAvax,
  Tx,
  SelectCredentialClass
} from 'avalanche/dist/apis/platformvm';
import { Buffer as BufferAvax } from 'avalanche';
import utils from './utils';
import * as createHash from "create-hash";
import { Credential, Signature  } from "avalanche/dist/common"

export class Transaction extends BaseTransaction {
  protected _avaxpTransaction: UnsignedTx;
  private _credentials: Credential[] = [];
  private _sender!: string;
  protected _type: TransactionType;
  protected _network: AvalancheNetwork;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._network = coinConfig.network as AvalancheNetwork;
  }

  get avaxPTransaction(): BaseTx {
    return this._avaxpTransaction.getTransaction();
  }

  set avaxPTransaction(tx: BaseTx) {
    this._avaxpTransaction = new UnsignedTx(tx);
  }

  set credentials(credentials: Credential[]) {
    this._credentials = credentials;
  }

  get credentials(): Credential[] {
    return this._credentials;
  }

  get hasCredentials(): boolean {
    return this._credentials.length > 0;
  }

  /** @inheritdoc */
  canSign({ key }: BaseKey): boolean {
    try {
      if (key.prv) return true;
      /* TODO: improve signed validation.
      const kp = new KeyPair({ prv: key.key });
      const privateKey = kp.getPrivateKey();
      if (!privateKey) return false;
      const privateKeyBuffer = BufferAvax.from(privateKey);
      const ins0 = this._avaxpTransaction.getTransaction().getIns()[0];
      if (!ins0) return false;
      if (ins0.getInput().getSigIdxs()
          .map(sigId => sigId.getSource())
          .filter(privateKeyBuffer.equals).length == 0) {
        return false;
      }
      return true;

       */
      return true;
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
  sign(keyPair: BaseKey): void {
    const keys = keyPair.key;
    if (!keys.prv) {
      throw new SigningError('Missing private key');
    }
    if (!this.avaxPTransaction) {
      throw new InvalidTransactionError('empty transaction to sign');
    }
    if (!this.hasCredentials) {
      throw new InvalidTransactionError('empty credentials to sign');
    }
    const signature = this.createSignature(keyPair);
    this._credentials.forEach(credential=> credential.addSignature(signature));
  }

  sender(sender: string): void {
    this._sender = sender;
  }

  /** @inheritdoc */
  /**
   * should be of signedTx doing this with baseTx
   */
  toBroadcastFormat(): string {
    if (!this.avaxPTransaction) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    const buffer = this.hasCredentials ? new Tx(this._avaxpTransaction, this._credentials).toBuffer() :
        this._avaxpTransaction.toBuffer();
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


  createSignature(keyPair: BaseKey): Signature {
    const ky = new KeyPairAvax(this._network.hrp, this._network.networkID.toString());
    ky.importKey(utils.cb58Decode(keyPair.key.prv || utils.throw(new SigningError('Missing private key'))));
    const signval = ky.sign(BufferAvax.from(this.signablePayload));
    const sig =  new Signature();
    sig.fromBuffer(signval);
    return sig;
  }


}
