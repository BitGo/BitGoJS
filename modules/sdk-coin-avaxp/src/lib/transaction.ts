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
import { Credential } from 'avalanche/dist/common';
import { BaseTx } from 'bitgo-aaron-avalanchejs/dist/serializable/avax';
import type { TransferableInput } from 'bitgo-aaron-avalanchejs/dist/serializable/avax/transferableInput';
import { getAVMManager } from 'bitgo-aaron-avalanchejs/dist/serializable/avm/codec';
import { AddPermissionlessValidatorTx } from 'bitgo-aaron-avalanchejs/dist/serializable/pvm';
import { bufferToHex } from 'bitgo-aaron-avalanchejs/dist/utils/buffer';
import { Buffer } from 'buffer';
import { ADDRESS_SEPARATOR, DecodedUtxoObj, INPUT_SEPARATOR, TransactionExplanation, Tx, TxData } from './iface';
import { KeyPair } from './keyPair';
import utils from './utils';

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
  if (signatures.length > 1 && signatures.every((sig) => isEmptySignature(sig.bytes))) {
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
      return isEmptySignature(sig.bytes);
    };
  }
}
// end region utils for sign

export class Transaction extends BaseTransaction {
  protected _avaxTransaction: Tx;
  public _type: TransactionType;
  public _network: AvalancheNetwork;
  public _networkID: number;
  public _assetId: BufferAvax;
  public _blockchainID: BufferAvax;
  public _threshold = 2;
  public _locktime: BN = new BN(0);
  public _fromAddresses: BufferAvax[] = [];
  public _rewardAddresses: BufferAvax[];
  public _utxos: DecodedUtxoObj[] = [];
  public _to: BufferAvax[];
  public _fee: Partial<TransactionFee> = {};

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._network = coinConfig.network as AvalancheNetwork;
    this._assetId = utils.cb58Decode(this._network.avaxAssetID);
    this._blockchainID = utils.cb58Decode(this._network.blockchainID);
    this._networkID = this._network.networkID;
  }

  get avaxPTransaction(): BaseTx {
    return this._avaxTransaction.baseTx;
  }

  get signature(): string[] {
    if (this.credentials.length === 0) {
      return [];
    }
    const obj: any = this.credentials[0].serialize();
    return obj.sigArray.map((s) => s.bytes).filter((s) => !isEmptySignature(s));
  }

  get credentials(): Credential[] {
    // it should be this._avaxpTransaction?.getCredentials(), but EVMTx doesn't have it
    return (this._avaxTransaction as any)?.credentials;
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

  toHexString(byteArray: Uint8Array): string {
    return bufferToHex(byteArray);
  }

  /** @inheritdoc */
  /**
   * should be of signedTx doing this with baseTx
   */
  toBroadcastFormat(): string {
    if (!this.avaxPTransaction) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    return this.toHexString(this._avaxTransaction.toBytes(getAVMManager().getDefaultCodec()));
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
      // TODO(CR-1073): is this required here
      // sourceChain: this.sourceChain,
      // destinationChain: this.destinationChain,
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
    return utils.sha256(this._avaxTransaction.toBytes(getAVMManager().getDefaultCodec()));
  }

  get id(): string {
    const bufferArray = utils.sha256(this._avaxTransaction.toBytes(getAVMManager().getDefaultCodec()));
    return utils.cb58Encode(BufferAvax.from(bufferArray));
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
  get outputs(): Entry[] {
    switch (this.type) {
      case TransactionType.AddPermissionlessValidator:
        const addValidatorTx = this._avaxTransaction;
        return [
          {
            address: addValidatorTx.subnetValidator.validator.nodeId.toString(),
            value: addValidatorTx.subnetValidator.validator.weight.toString(),
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
    return (this._avaxTransaction as AddPermissionlessValidatorTx).baseTx.outputs.map(
      utils.mapOutputToEntry(this._network)
    );
  }

  get inputs(): Entry[] {
    let inputs;
    switch (this.type) {
      case TransactionType.AddPermissionlessValidator:
      default:
        inputs = this._avaxTransaction.baseTx.inputs;
        break;
    }
    return inputs.map((input: TransferableInput) => {
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

  /**
   * Get blockchain alias by blockchain id
   * @param {BufferAvax} blockchainIDBuffer
   * @return {string} alias or blockchainID
   * @private
   */
  // TODO(CR-1073): this is only used when we are identifying sourceChain or destinationChain,
  // which is only required for crossChain transactions. So probably we don't need this.
  private blockchainIDtoAlias(blockchainIDBuffer: BufferAvax): string {
    const blockchainId = this._avaxTransaction.baseTx.BlockchainId.toString();
    switch (blockchainId) {
      case this._network.cChainBlockchainID:
        return 'C';
      case this._network.blockchainID:
        return 'P';
      default:
        return blockchainId;
    }
  }
}
