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
import { AddValidatorTx, AmountInput, AmountOutput, BaseTx, Tx } from 'avalanche/dist/apis/platformvm';
import { BinTools, BN, Buffer as BufferAvax } from 'avalanche';
import utils from './utils';
import { Credential } from 'avalanche/dist/common';

// region utils to sign
interface signatureSerialized {
  bytes: string;
}
interface CheckSignature {
  (sigature: signatureSerialized, addressHex: string): boolean;
}

function isEmptySignature(s: string): boolean {
  return !!s && s.startsWith(''.padStart(90, '0'));
}

/**
 * Signatures are prestore as empty buffer for hsm and address of signar for first signature.
 * When sign is required, this method return the function that identify a signature to be replaced.
 * @param signatures any signatures as samples to identify which signature required replace.
 */
function generateSelectorSignature(signatures: signatureSerialized[]): CheckSignature {
  if (signatures.every((sig) => isEmptySignature(sig.bytes))) {
    // Look for address.
    return function (sig, address): boolean {
      try {
        if (!isEmptySignature(sig.bytes)) {
          return false;
        }
        const pub = sig.bytes.substring(90);
        return pub === address;
      } catch (e) {
        return false;
      }
    };
  } else {
    // Look for empty string
    return function (sig, address): boolean {
      if (isEmptySignature(sig.bytes)) return true;
      return false;
    };
  }
}
// end region utils for sign

export class Transaction extends BaseTransaction {
  protected _avaxpTransaction: Tx;
  public _type: TransactionType;
  public _network: AvalancheNetwork;
  public _networkID: number;
  public _assetId: BufferAvax;
  public _blockchainID: BufferAvax;
  public _memo?: BufferAvax;
  public _threshold = 2;
  public _locktime: BN = new BN(0);
  public _fromAddresses: BufferAvax[] = [];
  public _rewardAddresses: BufferAvax[];
  public _utxos: DecodedUtxoObj[] = [];
  public _fee: BN = new BN(0);

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._network = coinConfig.network as AvalancheNetwork;
    this._assetId = utils.cb58Decode(this._network.avaxAssetID);
    this._blockchainID = utils.cb58Decode(this._network.blockchainID);
    this._networkID = this._network.networkID;
  }

  get avaxPTransaction(): BaseTx {
    return this._avaxpTransaction.getUnsignedTx().getTransaction();
  }

  get signature(): string[] {
    if (this.credentials.length === 0) {
      return [];
    }
    const obj: any = this.credentials[0].serialize();
    return obj.sigArray.map((s) => s.bytes).filter((s) => !isEmptySignature(s));
  }

  get credentials(): Credential[] {
    return this._avaxpTransaction.getCredentials();
  }

  get hasCredentials(): boolean {
    return this.credentials !== undefined && this.credentials.length > 0;
  }

  /** @inheritdoc */
  canSign({ key }: BaseKey): boolean {
    try {
      const kp = new KeyPair({ prv: key });
      const privateKey = kp.getPrivateKey();
      if (!privateKey) return false;
      const address = utils.parseAddress(kp.getAvaxPAddress(this._network.hrp));
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
    const addressHex = keyPair.getAddressBuffer().toString('hex');
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
    let checkSign: CheckSignature | undefined = undefined;
    this.credentials.forEach((c) => {
      const cs: any = c.serialize();
      if (checkSign === undefined) {
        checkSign = generateSelectorSignature(cs.sigArray);
      }
      let find = false;
      cs.sigArray.forEach((sig) => {
        if (checkSign && checkSign(sig, addressHex)) {
          sig.bytes = signature;
          find = true;
        }
      });
      if (!find) throw new SigningError('Private key cannot sign the transaction');
      c.deserialize(cs);
    });
  }

  /** @inheritdoc */
  /**
   * should be of signedTx doing this with baseTx
   */
  toBroadcastFormat(): string {
    if (!this.avaxPTransaction) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    const bintools = BinTools.getInstance();
    return bintools.addChecksum(this._avaxpTransaction.toBuffer()).toString('hex');
  }

  // types - stakingTransaction, import, export
  toJson(): TxData {
    if (!this.avaxPTransaction) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    return {
      id: this.id,
      inputs: this.inputs,
      fromAddresses: this.fromAddresses,
      threshold: this._threshold,
      locktime: this._locktime.toString(),
      type: this.type,
      memo: utils.bufferToString(this.avaxPTransaction.getMemo()),
      signatures: this.signature,
      stakedOutputs: this.stakedOutputs,
      changeOutputs: this.changeOutputs,
    };
  }

  setTransaction(tx: Tx): void {
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
    return utils.sha256(this._avaxpTransaction.getUnsignedTx().toBuffer());
  }

  get id(): string {
    return utils.cb58Encode(BufferAvax.from(utils.sha256(this._avaxpTransaction.toBuffer())));
  }

  get fromAddresses(): string[] {
    return this._fromAddresses.map((a) => utils.addressToString(this._network.hrp, this._network.alias, a));
  }

  get rewardAddresses(): string[] {
    return this._rewardAddresses.map((a) => utils.addressToString(this._network.hrp, this._network.alias, a));
  }

  /**
   * Get the list of outputs. Amounts are expressed in absolute value.
   */
  get stakedOutputs(): Entry[] {
    // Get staked outputs
    const addValidatorTx = this.avaxPTransaction as AddValidatorTx;
    return [
      {
        address: addValidatorTx.getNodeIDString(),
        value: addValidatorTx.getStakeAmount().toString(),
      },
    ];
  }

  get changeOutputs(): Entry[] {
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

  get inputs(): Entry[] {
    const bintools = BinTools.getInstance();
    return this.avaxPTransaction.getIns().map((input) => {
      const amountInput = input.getInput() as any as AmountInput;
      return {
        address: amountInput
          .getSigIdxs()
          .map((i) => bintools.fromBufferToBN(bintools.b58ToBuffer(i.toString())).toString())
          .toString(),
        value: amountInput.getAmount().toString(),
      };
    });
  }

  /**
   * Avax wrapper to create signature and return it for credentials
   * @param prv
   * @return hexstring
   */
  createSignature(prv: Buffer): string {
    const signval = utils.createSignatureAvaxBuffer(
      this._network,
      BufferAvax.from(this.signablePayload),
      BufferAvax.from(prv)
    );
    return signval.toString('hex');
  }

  /** @inheritdoc */
  explainTransaction(): TransactionExplanation {
    const txJson = this.toJson();
    const displayOrder = [
      'id',
      'inputs',
      'outputAmount',
      'changeAmount',
      'outputs',
      'changeOutputs',
      'rewardAddresses',
      'fee',
      'type',
      'memo',
    ];

    let totalIn = new BN(0);
    this._utxos.map((utxo) => {
      totalIn = totalIn.add(new BN(utxo.amount));
    });
    const outputAmount = txJson.stakedOutputs.reduce((p, n) => p.add(new BN(n.value)), new BN(0)).toString();
    const changeAmount = txJson.changeOutputs.reduce((p, n) => p.add(new BN(n.value)), new BN(0)).toString();

    return {
      displayOrder,
      id: txJson.id,
      inputs: txJson.inputs,
      outputs: txJson.stakedOutputs.map((o) => ({ address: o.address, amount: o.value })),
      outputAmount,
      changeOutputs: txJson.changeOutputs.map((o) => ({ address: o.address, amount: o.value })),
      changeAmount,
      rewardAddresses: this.rewardAddresses,
      fee: { fee: this._fee.toString() },
      type: txJson.type,
      memo: txJson.memo,
    };
  }
}
