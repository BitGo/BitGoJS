import { FlareNetwork, BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  BaseKey,
  BaseTransaction,
  Entry,
  InvalidTransactionError,
  SigningError,
  TransactionType,
  TransactionFee,
} from '@bitgo/sdk-core';
import {
  utils as FlareUtils,
  Credential,
  pvmSerial,
  UnsignedTx,
  secp256k1,
  EVMUnsignedTx,
  Address,
} from '@flarenetwork/flarejs';
import { Buffer } from 'buffer';
import { DecodedUtxoObj, TransactionExplanation, Tx, TxData } from './iface';
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

export class Transaction extends BaseTransaction {
  protected _flareTransaction: Tx;
  public _type: TransactionType;
  public _network: FlareNetwork;
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
  public _to: Uint8Array[] = [];
  public _rewardAddresses: Uint8Array[] = [];
  public _utxos: DecodedUtxoObj[] = []; // Define proper type based on Flare's UTXO structure
  public _fee: Partial<TransactionFee> = {};
  // Store original raw signed bytes to preserve exact format when re-serializing
  public _rawSignedBytes: Buffer | undefined;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._network = coinConfig.network as FlareNetwork;
    // Decode cb58-encoded asset ID to hex for use in transaction serialization
    this._assetId = utils.cb58Decode(this._network.assetId).toString('hex');
    this._blockchainID = this._network.blockchainID;
    this._networkID = this._network.networkID;
  }

  get signature(): string[] {
    if (!this.hasCredentials) {
      return [];
    }
    return this.credentials[0].getSignatures().filter((s) => !isEmptySignature(s));
  }

  get credentials(): Credential[] {
    return (this._flareTransaction as UnsignedTx)?.credentials;
  }

  get hasCredentials(): boolean {
    return this.credentials !== undefined && this.credentials.length > 0;
  }

  /** @inheritdoc */
  canSign({ key }: BaseKey): boolean {
    return true;
  }

  async sign(keyPair: KeyPair): Promise<void> {
    const prv = keyPair.getPrivateKey() as Uint8Array;
    if (!prv) {
      throw new SigningError('Missing private key');
    }
    if (!this._flareTransaction) {
      throw new InvalidTransactionError('empty transaction to sign');
    }
    if (!this.hasCredentials) {
      throw new InvalidTransactionError('empty credentials to sign');
    }

    //TODO: need to check for type of transaction and handle accordingly
    const unsignedTx = this._flareTransaction as EVMUnsignedTx;
    const unsignedBytes = unsignedTx.toBytes();
    const publicKey = secp256k1.getPublicKey(prv);

    const EVMAddressHex = new Address(secp256k1.publicKeyToEthAddress(publicKey)).toHex();

    const addressMap = unsignedTx.getAddresses();

    const hasMatchingAddress = addressMap.some(
      (addr) => Buffer.from(addr).toString('hex').toLowerCase() === utils.removeHexPrefix(EVMAddressHex).toLowerCase()
    );

    if (hasMatchingAddress) {
      const signature = await secp256k1.sign(unsignedBytes, prv);

      let signatureSet = false;
      // Find first empty signature slot and set it
      for (const credential of unsignedTx.credentials) {
        const emptySlotIndex = credential.getSignatures().findIndex((sig) => isEmptySignature(sig));
        if (emptySlotIndex !== -1) {
          credential.setSignature(emptySlotIndex, signature);
          signatureSet = true;
          // Clear raw signed bytes since we've modified the transaction
          this._rawSignedBytes = undefined;
          break;
        }
      }

      if (!signatureSet) {
        throw new SigningError('No empty signature slot found');
      }
    }
  }

  toBroadcastFormat(): string {
    if (!this._flareTransaction) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    // If we have the original raw signed bytes, use them directly to preserve exact format
    if (this._rawSignedBytes) {
      return FlareUtils.bufferToHex(this._rawSignedBytes);
    }
    const unsignedTx = this._flareTransaction as UnsignedTx;
    // For signed transactions, return the full signed tx with credentials
    // Check signature.length for robustness
    if (this.signature.length > 0) {
      return FlareUtils.bufferToHex(unsignedTx.getSignedTx().toBytes());
    }
    // For unsigned transactions, return just the transaction bytes
    return FlareUtils.bufferToHex(unsignedTx.toBytes());
  }

  toJson(): TxData {
    if (!this._flareTransaction) {
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
    this._flareTransaction = tx as UnsignedTx;
  }

  setTransactionType(transactionType: TransactionType): void {
    if (![TransactionType.AddPermissionlessValidator].includes(transactionType)) {
      throw new Error(`Transaction type ${transactionType} is not supported`);
    }
    this._type = transactionType;
  }

  get signablePayload(): Buffer {
    return utils.sha256((this._flareTransaction as UnsignedTx).toBytes());
  }

  get id(): string {
    const bufferArray = utils.sha256((this._flareTransaction as UnsignedTx).toBytes());
    return utils.cb58Encode(Buffer.from(bufferArray));
  }

  get fromAddresses(): string[] {
    return this._fromAddresses.map((a) => FlareUtils.format(this._network.alias, this._network.hrp, a));
  }

  get rewardAddresses(): string[] {
    return this._rewardAddresses.map((a) => FlareUtils.format(this._network.alias, this._network.hrp, a));
  }

  get fee(): TransactionFee {
    return { fee: '0', ...this._fee };
  }

  get outputs(): Entry[] {
    switch (this.type) {
      case TransactionType.AddPermissionlessValidator:
        return [
          {
            address: (
              (this._flareTransaction as UnsignedTx).getTx() as pvmSerial.AddPermissionlessValidatorTx
            ).subnetValidator.validator.nodeId.toString(),
            value: (
              (this._flareTransaction as UnsignedTx).getTx() as pvmSerial.AddPermissionlessValidatorTx
            ).subnetValidator.validator.weight.toJSON(),
          },
        ];
      default:
        return [];
    }
  }

  get changeOutputs(): Entry[] {
    return (
      (this._flareTransaction as UnsignedTx).getTx() as pvmSerial.AddPermissionlessValidatorTx
    ).baseTx.outputs.map(utils.mapOutputToEntry(this._network));
  }

  explainTransaction(): TransactionExplanation {
    const txJson = this.toJson();
    const displayOrder = ['id', 'inputs', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'type'];

    const outputAmount = txJson.outputs.reduce((p, n) => p + BigInt(n.value), BigInt(0)).toString();
    const changeAmount = txJson.changeOutputs.reduce((p, n) => p + BigInt(n.value), BigInt(0)).toString();

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
