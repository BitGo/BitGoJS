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
  evmSerial,
  UnsignedTx,
  secp256k1,
  EVMUnsignedTx,
  Address,
} from '@flarenetwork/flarejs';
import { Buffer } from 'buffer';
import { createHash } from 'crypto';
import { DecodedUtxoObj, TransactionExplanation, Tx, TxData, ADDRESS_SEPARATOR, FlareTransactionType } from './iface';
import { KeyPair } from './keyPair';
import utils from './utils';

/**
 * Checks if a signature is empty (first 90 hex chars are zeros)
 * @param signature
 * @returns {boolean}
 */
function isEmptySignature(signature: string): boolean {
  return !!signature && utils.removeHexPrefix(signature).startsWith(''.padStart(90, '0'));
}

/**
 * Interface for signature slot checking
 */
interface CheckSignature {
  (signature: string, addressHex: string): boolean;
}

/**
 * Checks if an empty signature has an embedded address (non-zero bytes after position 90)
 * @param signature Hex string of the signature
 */
function hasEmbeddedAddress(signature: string): boolean {
  if (!isEmptySignature(signature)) return false;
  const cleanSig = utils.removeHexPrefix(signature);
  if (cleanSig.length < 130) return false;
  const embeddedPart = cleanSig.substring(90, 130);
  // Check if it's not all zeros
  return embeddedPart !== '0'.repeat(40);
}

/**
 * Generates a function to check if a signature slot matches a given address.
 * If signatures have embedded addresses, it matches by address.
 * Otherwise, it just finds empty slots.
 * @param signatures Array of signature hex strings
 */
function generateSelectorSignature(signatures: string[]): CheckSignature {
  // Check if any empty signature has an embedded address
  const hasEmbeddedAddresses = signatures.some((sig) => isEmptySignature(sig) && hasEmbeddedAddress(sig));

  if (hasEmbeddedAddresses) {
    // Look for address embedded in the empty signature (after position 90)
    return function (sig: string, address: string): boolean {
      try {
        if (!isEmptySignature(sig)) {
          return false;
        }
        const cleanSig = utils.removeHexPrefix(sig);
        const embeddedAddr = cleanSig.substring(90, 130).toLowerCase();
        return embeddedAddr === address.toLowerCase();
      } catch (e) {
        return false;
      }
    };
  } else {
    // Look for any empty slot (no embedded addresses)
    return function (sig: string, address: string): boolean {
      return isEmptySignature(sig);
    };
  }
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

    const unsignedTx = this._flareTransaction as EVMUnsignedTx;
    const unsignedBytes = unsignedTx.toBytes();
    const publicKey = secp256k1.getPublicKey(prv);

    // Derive both EVM and P-chain addresses from the public key
    const evmAddressHex = new Address(secp256k1.publicKeyToEthAddress(publicKey)).toHex();

    // P-chain address derivation: ripemd160(sha256(publicKey))
    const sha256Hash = createHash('sha256').update(Buffer.from(publicKey)).digest();
    const pChainAddressBuffer = createHash('ripemd160').update(sha256Hash).digest();
    const pChainAddressHex = pChainAddressBuffer.toString('hex');

    const addressMap = unsignedTx.getAddresses();

    // Check for both EVM and P-chain address formats
    const hasMatchingAddress = addressMap.some((addr) => {
      const addrHex = Buffer.from(addr).toString('hex').toLowerCase();
      return (
        addrHex === utils.removeHexPrefix(evmAddressHex).toLowerCase() || addrHex === pChainAddressHex.toLowerCase()
      );
    });

    const signature = await secp256k1.sign(unsignedBytes, prv);
    let signatureSet = false;

    if (hasMatchingAddress) {
      // Use address-based slot matching (like AVAX-P)
      let checkSign: CheckSignature | undefined = undefined;

      for (const credential of unsignedTx.credentials) {
        const signatures = credential.getSignatures();
        if (checkSign === undefined) {
          checkSign = generateSelectorSignature(signatures);
        }

        // Find the slot that matches this address
        for (let i = 0; i < signatures.length; i++) {
          const sig = signatures[i];
          // Try matching with P-chain address first, then EVM address
          if (checkSign(sig, pChainAddressHex) || checkSign(sig, utils.removeHexPrefix(evmAddressHex).toLowerCase())) {
            credential.setSignature(i, signature);
            signatureSet = true;
            // Clear raw signed bytes since we've modified the transaction
            this._rawSignedBytes = undefined;
            break;
          }
        }

        if (signatureSet) break;
      }
    }

    // Fallback: If address-based matching didn't work (e.g., ImportInC loaded from unsigned tx
    // where P-chain addresses aren't in addressMaps), try to sign the first empty slot.
    // This handles the case where we have empty credentials but signer address isn't in the map.
    if (!signatureSet) {
      for (const credential of unsignedTx.credentials) {
        const signatures = credential.getSignatures();
        for (let i = 0; i < signatures.length; i++) {
          if (isEmptySignature(signatures[i])) {
            credential.setSignature(i, signature);
            signatureSet = true;
            this._rawSignedBytes = undefined;
            break;
          }
        }
        if (signatureSet) break;
      }
    }

    if (!signatureSet) {
      throw new SigningError('No matching signature slot found for this private key');
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

  /**
   * Get the underlying Flare transaction
   * @returns The Flare transaction object
   */
  getFlareTransaction(): Tx {
    return this._flareTransaction;
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

  /**
   * Check if this transaction is for C-chain (EVM transactions)
   */
  get isTransactionForCChain(): boolean {
    const tx = (this._flareTransaction as UnsignedTx).getTx();
    const txType = (tx as { _type?: string })._type;
    return txType === FlareTransactionType.EvmExportTx || txType === FlareTransactionType.EvmImportTx;
  }

  get outputs(): Entry[] {
    const tx = (this._flareTransaction as UnsignedTx).getTx();

    switch (this.type) {
      case TransactionType.Import:
        if (this.isTransactionForCChain) {
          // C-chain Import: output is to a C-chain address
          const importTx = tx as evmSerial.ImportTx;
          return importTx.Outs.map((out) => ({
            address: '0x' + Buffer.from(out.address.toBytes()).toString('hex'),
            value: out.amount.value().toString(),
          }));
        } else {
          // P-chain Import: outputs are the baseTx.outputs (destination on P-chain)
          const pvmImportTx = tx as pvmSerial.ImportTx;
          return pvmImportTx.baseTx.outputs.map(utils.mapOutputToEntry(this._network));
        }

      case TransactionType.Export:
        if (this.isTransactionForCChain) {
          // C-chain Export: exported outputs go to P-chain
          const exportTx = tx as evmSerial.ExportTx;
          return exportTx.exportedOutputs.map(utils.mapOutputToEntry(this._network));
        } else {
          // P-chain Export: exported outputs go to C-chain
          const pvmExportTx = tx as pvmSerial.ExportTx;
          return pvmExportTx.outs.map(utils.mapOutputToEntry(this._network));
        }

      case TransactionType.AddPermissionlessValidator:
        return [
          {
            address: (tx as pvmSerial.AddPermissionlessValidatorTx).subnetValidator.validator.nodeId.toString(),
            value: (tx as pvmSerial.AddPermissionlessValidatorTx).subnetValidator.validator.weight.toJSON(),
          },
        ];

      default:
        return [];
    }
  }

  get changeOutputs(): Entry[] {
    const tx = (this._flareTransaction as UnsignedTx).getTx();

    // C-chain transactions and Import transactions don't have change outputs
    if (this.isTransactionForCChain || this.type === TransactionType.Import) {
      return [];
    }

    switch (this.type) {
      case TransactionType.Export:
        // P-chain Export: change outputs are in baseTx.outputs
        return (tx as pvmSerial.ExportTx).baseTx.outputs.map(utils.mapOutputToEntry(this._network));

      case TransactionType.AddPermissionlessValidator:
        return (tx as pvmSerial.AddPermissionlessValidatorTx).baseTx.outputs.map(utils.mapOutputToEntry(this._network));

      default:
        return [];
    }
  }

  get inputs(): Entry[] {
    const tx = (this._flareTransaction as UnsignedTx).getTx();

    switch (this.type) {
      case TransactionType.Import:
        if (this.isTransactionForCChain) {
          // C-chain Import: inputs come from P-chain (importedInputs)
          const importTx = tx as evmSerial.ImportTx;
          return importTx.importedInputs.map((input) => ({
            id: utils.cb58Encode(Buffer.from(input.utxoID.txID.toBytes())) + ':' + input.utxoID.outputIdx.value(),
            address: this.fromAddresses.sort().join(ADDRESS_SEPARATOR),
            value: input.amount().toString(),
          }));
        } else {
          // P-chain Import: inputs are ins (imported from C-chain)
          const pvmImportTx = tx as pvmSerial.ImportTx;
          return pvmImportTx.ins.map((input) => ({
            id: utils.cb58Encode(Buffer.from(input.utxoID.txID.toBytes())) + ':' + input.utxoID.outputIdx.value(),
            address: this.fromAddresses.sort().join(ADDRESS_SEPARATOR),
            value: input.amount().toString(),
          }));
        }

      case TransactionType.Export:
        if (this.isTransactionForCChain) {
          // C-chain Export: inputs are from C-chain (EVM inputs)
          const exportTx = tx as evmSerial.ExportTx;
          return exportTx.ins.map((evmInput) => ({
            address: '0x' + Buffer.from(evmInput.address.toBytes()).toString('hex'),
            value: evmInput.amount.value().toString(),
            nonce: Number(evmInput.nonce.value()),
          }));
        } else {
          // P-chain Export: inputs are from baseTx.inputs
          const pvmExportTx = tx as pvmSerial.ExportTx;
          return pvmExportTx.baseTx.inputs.map((input) => ({
            id: utils.cb58Encode(Buffer.from(input.utxoID.txID.toBytes())) + ':' + input.utxoID.outputIdx.value(),
            address: this.fromAddresses.sort().join(ADDRESS_SEPARATOR),
            value: input.amount().toString(),
          }));
        }

      case TransactionType.AddPermissionlessValidator:
      default:
        const baseTx = tx as pvmSerial.AddPermissionlessValidatorTx;
        if (baseTx.baseTx?.inputs) {
          return baseTx.baseTx.inputs.map((input) => ({
            id: utils.cb58Encode(Buffer.from(input.utxoID.txID.toBytes())) + ':' + input.utxoID.outputIdx.value(),
            address: this.fromAddresses.sort().join(ADDRESS_SEPARATOR),
            value: input.amount().toString(),
          }));
        }
        return [];
    }
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
