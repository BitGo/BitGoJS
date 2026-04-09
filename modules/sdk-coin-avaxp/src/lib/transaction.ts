import { avaxSerial, utils as avaxUtils, Credential, pvmSerial, secp256k1, UnsignedTx } from '@bitgo-forks/avalanchejs';
import {
  BaseKey,
  BaseTransaction,
  Entry,
  InvalidTransactionError,
  SigningError,
  TransactionFee,
  TransactionType,
} from '@bitgo/sdk-core';
import { AvalancheNetwork, BaseCoin as CoinConfig } from '@bitgo/statics';
import { BN, Buffer as BufferAvax } from 'avalanche';
import { Buffer } from 'buffer';
import { ADDRESS_SEPARATOR, DecodedUtxoObj, INPUT_SEPARATOR, TransactionExplanation, Tx, TxData } from './iface';
import { KeyPair } from './keyPair';
import utils from './utils';

/**
 * Checks if a signature is empty
 * @param signature
 * @returns {boolean}
 */
function isEmptySignature(signature: string): boolean {
  return !!signature && utils.removeHexPrefix(signature).startsWith(''.padStart(90, '0'));
}

interface CheckSignature {
  (sigature: string, addressHex: string): boolean;
}

function generateSelectorSignature(signatures: string[]): CheckSignature {
  if (signatures.length > 1 && signatures.every((sig) => isEmptySignature(sig))) {
    // Look for address.
    return function (sig, address): boolean {
      try {
        if (!isEmptySignature(sig)) {
          return false;
        }
        if (sig.startsWith('0x')) sig = sig.substring(2);
        const pub = sig.substring(90);
        return pub === address;
      } catch (e) {
        return false;
      }
    };
  } else {
    // Look for empty string
    return function (sig, address): boolean {
      return isEmptySignature(sig);
    };
  }
}
// end region utils for sign

export class Transaction extends BaseTransaction {
  protected _avaxTransaction: Tx;
  public _type: TransactionType;
  public _network: AvalancheNetwork;
  public _networkID: number;
  public _assetId: string;
  public _blockchainID: string;
  public _nodeID: string;
  public _startTime: bigint;
  public _endTime: bigint;
  public _stakeAmount: bigint;
  public _threshold = 2;
  public _locktime = BigInt(0);
  public _fromAddresses: Uint8Array[] = [];
  public _rewardAddresses: BufferAvax[] = [];
  public _utxos: DecodedUtxoObj[] = [];
  public _to: BufferAvax[];
  public _fee: Partial<TransactionFee> = {};
  public _blsPublicKey: string;
  public _blsSignature: string;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._network = coinConfig.network as AvalancheNetwork;
    this._assetId = this._network.avaxAssetID;
    this._blockchainID = this._network.blockchainID;
    this._networkID = this._network.networkID;
  }

  get avaxPTransaction(): avaxSerial.BaseTx {
    return ((this._avaxTransaction as UnsignedTx).getTx() as pvmSerial.AddPermissionlessValidatorTx).baseTx;
  }

  get signature(): string[] {
    if (this.credentials.length === 0) {
      return [];
    }
    return this.credentials[0].getSignatures().filter((s) => !isEmptySignature(s));
  }

  get credentials(): Credential[] {
    return (this._avaxTransaction as UnsignedTx)?.credentials;
  }

  get hasCredentials(): boolean {
    return this.credentials !== undefined && this.credentials.length > 0;
  }

  /** @inheritdoc */
  canSign({ key }: BaseKey): boolean {
    // TODO(BG-56700):  Improve canSign by check in addresses in empty credentials match signer
    return true;
  }

  /**
   * Sign an avaxp transaction and update the transaction hex
   * @param {KeyPair} keyPair
   */
  async sign(keyPair: KeyPair): Promise<void> {
    const prv = keyPair.getPrivateKey() as Uint8Array;
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
    const unsignedTx = this._avaxTransaction as UnsignedTx;
    const unsignedBytes = unsignedTx.toBytes();

    const publicKey = secp256k1.getPublicKey(prv);
    if (unsignedTx.hasPubkey(publicKey)) {
      const signature = await secp256k1.sign(unsignedBytes, prv);
      let checkSign: CheckSignature | undefined = undefined;
      unsignedTx.credentials.forEach((c, index) => {
        if (checkSign === undefined) {
          checkSign = generateSelectorSignature(c.getSignatures());
        }
        let find = false;
        c.getSignatures().forEach((sig, index) => {
          if (checkSign && checkSign(sig, addressHex)) {
            c.setSignature(index, signature);
            find = true;
          }
        });
        if (!find) {
          throw new SigningError(
            `Private key cannot sign the transaction, address hex ${addressHex}, public key: ${publicKey}`
          );
        }
      });
    }
  }

  toHexString(byteArray: Uint8Array): string {
    return avaxUtils.bufferToHex(byteArray);
  }

  /** @inheritdoc */
  /**
   * should be of signedTx doing this with baseTx
   */
  toBroadcastFormat(): string {
    if (!this.avaxPTransaction) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    return this.toHexString(avaxUtils.addChecksum((this._avaxTransaction as UnsignedTx).getSignedTx().toBytes()));
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
      signatures: this.signature,
      outputs: this.outputs,
      changeOutputs: this.changeOutputs,
    };
  }

  setTransaction(tx: Tx): void {
    this._avaxTransaction = tx;
  }

  /**
   * Set the transaction type
   *
   * @param {TransactionType} transactionType The transaction type to be set
   */
  setTransactionType(transactionType: TransactionType): void {
    if (![TransactionType.AddPermissionlessValidator].includes(transactionType)) {
      throw new Error(`Transaction type ${transactionType} is not supported`);
    }
    this._type = transactionType;
  }

  /**
   * Returns the portion of the transaction that needs to be signed in Buffer format.
   * Only needed for coins that support adding signatures directly (e.g. TSS).
   */
  get signablePayload(): Buffer {
    return utils.sha256((this._avaxTransaction as UnsignedTx).toBytes());
  }

  get id(): string {
    const bufferArray = utils.sha256((this._avaxTransaction as UnsignedTx).toBytes());
    return utils.cb58Encode(BufferAvax.from(bufferArray));
  }

  get fromAddresses(): string[] {
    return this._fromAddresses.map((a) => avaxUtils.format(this._network.alias, this._network.hrp, a));
  }

  get rewardAddresses(): string[] {
    return this._rewardAddresses.map((a) => avaxUtils.format(this._network.alias, this._network.hrp, a));
  }

  /**
   * Get the list of outputs. Amounts are expressed in absolute value.
   */
  get outputs(): Entry[] {
    switch (this.type) {
      case TransactionType.AddPermissionlessValidator:
        return [
          {
            address: (
              (this._avaxTransaction as UnsignedTx).getTx() as pvmSerial.AddPermissionlessValidatorTx
            ).subnetValidator.validator.nodeId.toString(),
            value: (
              (this._avaxTransaction as UnsignedTx).getTx() as pvmSerial.AddPermissionlessValidatorTx
            ).subnetValidator.validator.weight.toJSON(),
          },
        ];
      default:
        return [];
    }
  }

  get fee(): TransactionFee {
    return { fee: '0', ...this._fee };
  }

  get changeOutputs(): Entry[] {
    return ((this._avaxTransaction as UnsignedTx).getTx() as pvmSerial.AddPermissionlessValidatorTx).baseTx.outputs.map(
      utils.mapOutputToEntry(this._network)
    );
  }

  get inputs(): Entry[] {
    let inputs;
    switch (this.type) {
      case TransactionType.AddPermissionlessValidator:
      default:
        inputs = ((this._avaxTransaction as UnsignedTx).getTx() as pvmSerial.AddPermissionlessValidatorTx).baseTx
          .inputs;
        break;
    }
    return inputs.map((input) => {
      return {
        id: input.utxoID.txID.toString() + INPUT_SEPARATOR + input.utxoID.outputIdx.value(),
        address: this.fromAddresses.sort().join(ADDRESS_SEPARATOR),
        value: input.amount().toString(),
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
    const displayOrder = ['id', 'inputs', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'type'];

    const outputAmount = txJson.outputs.reduce((p, n) => p.add(new BN(n.value)), new BN(0)).toString();
    const changeAmount = txJson.changeOutputs.reduce((p, n) => p.add(new BN(n.value)), new BN(0)).toString();

    let rewardAddresses;
    if ([TransactionType.AddPermissionlessValidator].includes(txJson.type)) {
      rewardAddresses = this.rewardAddresses;
      displayOrder.splice(6, 0, 'rewardAddresses');
    }

    return {
      displayOrder,
      id: txJson.id,
      inputs: txJson.inputs,
      outputs: txJson.outputs.map((o) => ({ address: o.address, amount: o.value })),
      outputAmount,
      changeOutputs: txJson.changeOutputs.map((o) => ({ address: o.address, amount: o.value })),
      changeAmount,
      rewardAddresses,
      fee: this.fee,
      type: txJson.type,
    };
  }
}
