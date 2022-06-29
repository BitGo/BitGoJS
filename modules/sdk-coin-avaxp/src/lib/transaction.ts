import { AvalancheNetwork, BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  BaseKey,
  BaseTransaction,
  Entry,
  InvalidTransactionError,
  SigningError,
  TransactionType,
} from '@bitgo/sdk-core';
import { KeyPair } from './keyPair';
import { DecodedUtxoObj, TransactionExplanation, TxData } from './iface';
import { AddValidatorTx, AmountOutput, BaseTx, Tx, UnsignedTx } from 'avalanche/dist/apis/platformvm';
import { BN, Buffer as BufferAvax } from 'avalanche';
import utils from './utils';
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
  public _fromAddresses: BufferAvax[] = [];
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
    if (this.credentials.length == 0) {
      return [];
    }
    const obj: any = this.credentials[0].serialize();
    return obj.sigArray.map((s) => s.bytes);
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
      return this._fromAddresses.find((a) => address.equals(a)) !== undefined;
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
      id: this.id,
      fromAddresses: this.fromAddresses,
      threshold: this._threshold,
      locktime: this._locktime.toString(),
      type: this.type,
      memo: utils.bufferToString(this.avaxPTransaction.getMemo()),
      signatures: this.signature,
      outputs: this.outputs,
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
    return utils.sha256(txbuff);
  }

  get id(): string {
    return utils.cb58Encode(BufferAvax.from(utils.sha256(utils.cb58Decode(this.toBroadcastFormat()))));
  }

  get fromAddresses(): string[] {
    return this._fromAddresses.map((a) => utils.addressToString(this._network.hrp, this._network.alias, a));
  }
  /**
   * Get the list of outputs. Amounts are expressed in absolute value.
   */
  get outputs(): Entry[] {
    if (this.type === TransactionType.addValidator) {
      const addValidatorTx = this.avaxPTransaction as AddValidatorTx;
      return [
        {
          address: addValidatorTx.getNodeIDString(),
          value: addValidatorTx.getStakeAmount().toString(),
        },
      ];
    }
    // general support any transaction type, but it's scoped yet
    return this.avaxPTransaction.getOuts().map((output) => {
      const amountOutput = output.getOutput() as any as AmountOutput;
      const address = amountOutput
        .getAddresses()
        .map((a) => utils.addressToString(this._network.hrp, this._network.alias, a))
        .join(', ');
      return {
        value: amountOutput.getAmount().toString(),
        address,
      };
    });
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

  /** @inheritdoc */
  explainTransaction(): TransactionExplanation {
    const txJson = this.toJson();
    const displayOrder = ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'type'];
    return {
      displayOrder,
      id: txJson.id,
      outputs: txJson.outputs.map((o) => ({ address: o.address, amount: o.value, memo: txJson.memo })),
      outputAmount: txJson.outputs.reduce((p, n) => p.add(new BN(n.value)), new BN(0)).toString(),
      changeOutputs: [], // account based does not use change outputs
      changeAmount: '0', // account base does not make change
      fee: { fee: this._txFee.toString() },
      type: txJson.type,
    };
  }
}
