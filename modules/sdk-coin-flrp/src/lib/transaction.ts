import { UnsignedTx, Credential, utils as flrpUtils, pvmSerial, secp256k1 } from '@flarenetwork/flarejs';
import {
  BaseKey,
  BaseTransaction,
  Entry,
  InvalidTransactionError,
  SigningError,
  TransactionFee,
  TransactionType,
} from '@bitgo/sdk-core';
import { FlareNetwork, BaseCoin as CoinConfig } from '@bitgo/statics';
import { Buffer } from 'buffer';
import {
  ADDRESS_SEPARATOR,
  DecodedUtxoObj,
  INPUT_SEPARATOR,
  TransactionExplanation,
  Tx,
  TxData,
  FlrpEntry,
} from './iface';
import { KeyPair } from './keyPair';
import utils from './utils';
import {
  FLR_ASSET_ID,
  HEX_ENCODING,
  MEMO_FIELD,
  DISPLAY_ORDER_BASE,
  REWARD_ADDRESSES_FIELD,
  SOURCE_CHAIN_FIELD,
  DESTINATION_CHAIN_FIELD,
} from './constants';

/**
 * Checks if a signature is empty
 * @param signature
 * @returns {boolean}
 */
function isEmptySignature(signature: string): boolean {
  return !!signature && utils.removeHexPrefix(signature).startsWith(''.padStart(90, '0'));
}

interface CheckSignature {
  (signature: string, addressHex: string): boolean;
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

/**
 * Flare P-chain transaction implementation using FlareJS
 * Based on AVAX transaction patterns adapted for Flare network
 */
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
  public _fromAddresses: string[] = []; // TODO need to check for string or Uint8Array
  public _rewardAddresses: string[] = [];
  public _utxos: DecodedUtxoObj[] = [];
  public _to: string[];
  public _fee: Partial<TransactionFee> = {};
  public _blsPublicKey: string;
  public _blsSignature: string;
  public _memo: Uint8Array = new Uint8Array(); // FlareJS memo field // TODO need to check need for this

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._network = coinConfig.network as FlareNetwork;
    this._assetId = this._network.assetId || FLR_ASSET_ID;
    this._blockchainID = this._network.blockchainID || '';
    this._networkID = this._network.networkID || 0;
  }

  /**
   * Get the base transaction from FlareJS UnsignedTx
   * TODO: Implement proper FlareJS transaction extraction
   */
  get flareTransaction(): UnsignedTx {
    return this._flareTransaction as UnsignedTx;
  }

  get signature(): string[] {
    if (this.credentials.length === 0) {
      return [];
    }
    // TODO: Extract signatures from FlareJS credentials
    return this.credentials[0].getSignatures().filter((s) => !isEmptySignature(s));
  }

  get credentials(): Credential[] {
    // TODO: Extract credentials from FlareJS transaction
    // For now, return empty array
    return (this._flareTransaction as UnsignedTx)?.credentials;
  }

  get hasCredentials(): boolean {
    return this.credentials !== undefined && this.credentials.length > 0;
  }

  /** @inheritdoc */
  canSign({ key }: BaseKey): boolean {
    // TODO: Implement proper signing validation for FlareJS
    return true;
  }

  /**
   * Sign a Flare transaction using FlareJS
   * @param {KeyPair} keyPair
   */
  async sign(keyPair: KeyPair): Promise<void> {
    const prv = keyPair.getPrivateKey() as Uint8Array;
    const addressHex = keyPair.getAddressBuffer().toString('hex');
    if (!prv) {
      throw new SigningError('Missing private key');
    }
    if (!this.flareTransaction) {
      throw new InvalidTransactionError('empty transaction to sign');
    }
    if (!this.hasCredentials) {
      throw new InvalidTransactionError('empty credentials to sign');
    }
    const unsignedTx = this._flareTransaction as UnsignedTx;
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

  /**
   * Set memo from string
   * @param {string} memo - Memo text
   */
  setMemo(memo: string): void {
    this._memo = utils.stringToBytes(memo);
  }

  /**
   * Set memo from various formats
   * @param {string | Record<string, unknown> | Uint8Array} memo - Memo data
   */
  setMemoData(memo: string | Record<string, unknown> | Uint8Array): void {
    this._memo = utils.createMemoBytes(memo);
  }

  /**
   * Get memo as bytes (FlareJS format)
   * @returns {Uint8Array} Memo bytes
   */
  getMemoBytes(): Uint8Array {
    return this._memo;
  }

  /**
   * Get memo as string
   * @returns {string} Memo string
   */
  getMemoString(): string {
    return utils.parseMemoBytes(this._memo);
  }

  /**
   * Check if transaction has memo
   * @returns {boolean} Whether memo exists and is not empty
   */
  hasMemo(): boolean {
    return this._memo.length > 0;
  }

  toHexString(byteArray: Uint8Array): string {
    return flrpUtils.bufferToHex(Buffer.from(byteArray));
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    if (!this.flareTransaction) {
      throw new InvalidTransactionError('Empty transaction data');
    }

    // TODO: verify and implement FlareJS transaction serialization
    return this.toHexString(flrpUtils.addChecksum((this._flareTransaction as UnsignedTx).getSignedTx().toBytes()));
  }

  toJson(): TxData {
    if (!this.flareTransaction) {
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
      sourceChain: this._network.blockchainID,
      destinationChain: this._network.cChainBlockchainID,
      memo: this.getMemoString(), // Include memo in JSON representation
    };
  }

  setTransaction(tx: Tx): void {
    this._flareTransaction = tx;
  }

  /**
   * Set the transaction type
   * @param {TransactionType} transactionType The transaction type to be set
   */
  setTransactionType(transactionType: TransactionType): void {
    const supportedTypes = [
      TransactionType.Export,
      TransactionType.Import,
      TransactionType.AddValidator,
      TransactionType.AddDelegator,
      TransactionType.AddPermissionlessValidator,
      TransactionType.AddPermissionlessDelegator,
      TransactionType.ImportToC,
    ];

    if (!supportedTypes.includes(transactionType)) {
      throw new Error(`Transaction type ${transactionType} is not supported`);
    }
    this._type = transactionType;
  }

  /**
   * Returns the portion of the transaction that needs to be signed in Buffer format.
   * Only needed for coins that support adding signatures directly (e.g. TSS).
   */
  get signablePayload(): Buffer {
    if (!this.flareTransaction) {
      throw new InvalidTransactionError('Empty transaction for signing');
    }

    // TODO: verify and Implement FlareJS signable payload extraction
    return utils.sha256((this._flareTransaction as UnsignedTx).toBytes());
  }

  get id(): string {
    if (!this.flareTransaction) {
      throw new InvalidTransactionError('Empty transaction for ID generation');
    }

    // TODO: verify and Implement FlareJS transaction ID generation
    const bufferArray = utils.sha256((this._flareTransaction as UnsignedTx).toBytes());
    return utils.cb58Encode(Buffer.from(bufferArray));
  }

  get fromAddresses(): string[] {
    return this._fromAddresses.map((a) =>
      flrpUtils.format(this._network.alias, this._network.hrp, Buffer.from(a, 'hex'))
    );
  }

  get rewardAddresses(): string[] {
    return this._rewardAddresses.map((a) =>
      flrpUtils.format(this._network.alias, this._network.hrp, Buffer.from(a, 'hex'))
    );
  }

  /**
   * Get the list of outputs. Amounts are expressed in absolute value.
   */
  get outputs(): Entry[] {
    switch (this.type) {
      case TransactionType.Export:
        // TODO: Extract export outputs from FlareJS transaction
        return [];
      case TransactionType.Import:
        // TODO: Extract import outputs from FlareJS transaction
        return [];
      case TransactionType.AddValidator:
      case TransactionType.AddPermissionlessValidator:
        // TODO: Extract validator outputs from FlareJS transaction
        return [
          {
            address: (
              (this._flareTransaction as UnsignedTx).getTx() as pvmSerial.AddPermissionlessValidatorTx
            ).subnetValidator.validator.nodeId.toString(),
            value: (
              (this._flareTransaction as UnsignedTx).getTx() as pvmSerial.AddPermissionlessValidatorTx
            ).subnetValidator.validator.weight.toString(),
          },
        ];
      case TransactionType.AddDelegator:
      case TransactionType.AddPermissionlessDelegator:
        // TODO: Extract delegator outputs from FlareJS transaction
        return [
          {
            address: (
              (this._flareTransaction as UnsignedTx).getTx() as pvmSerial.AddPermissionlessDelegatorTx
            ).subnetValidator.validator.nodeId.toString(),
            value: (
              (this._flareTransaction as UnsignedTx).getTx() as pvmSerial.AddPermissionlessDelegatorTx
            ).subnetValidator.validator.weight.toString(),
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
    // TODO: Extract change outputs from FlareJS transaction
    // For now, return empty array
    return (
      (this._flareTransaction as UnsignedTx).getTx() as pvmSerial.AddPermissionlessValidatorTx
    ).baseTx.outputs.map(utils.mapOutputToEntry(this._network));
  }

  get inputs(): FlrpEntry[] {
    // TODO: Extract inputs from FlareJS transaction
    // For now, return placeholder based on UTXOs
    let inputs;
    switch (this.type) {
      case TransactionType.AddPermissionlessValidator:
      default:
        inputs = ((this._flareTransaction as UnsignedTx).getTx() as pvmSerial.AddPermissionlessValidatorTx).baseTx
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
   * Flare wrapper to create signature and return it for credentials
   * @param prv
   * @return hexstring
   */
  createSignature(prv: Buffer): string {
    // TODO: Implement FlareJS signature creation
    // This should use FlareJS signing utilities
    const signval = utils.createSignature(this._network, this.signablePayload, prv);
    return signval.toString(HEX_ENCODING);
  }

  /**
   * Check if transaction is for C-chain (cross-chain)
   */
  get isTransactionForCChain(): boolean {
    return this.type === TransactionType.Export || this.type === TransactionType.Import;
  }

  /** @inheritdoc */
  explainTransaction(): TransactionExplanation {
    const txJson = this.toJson();
    const displayOrder = [...DISPLAY_ORDER_BASE];

    // Add memo to display order if present
    if (this.hasMemo()) {
      displayOrder.push(MEMO_FIELD);
    }

    // Calculate total output amount
    const outputAmount = txJson.outputs
      .reduce((sum, output) => {
        return sum + BigInt(output.value || '0');
      }, BigInt(0))
      .toString();

    // Calculate total change amount
    const changeAmount = txJson.changeOutputs
      .reduce((sum, output) => {
        return sum + BigInt(output.value || '0');
      }, BigInt(0))
      .toString();

    let rewardAddresses;
    const stakingTypes = [
      TransactionType.AddValidator,
      TransactionType.AddDelegator,
      TransactionType.AddPermissionlessValidator,
      TransactionType.AddPermissionlessDelegator,
    ];

    if (stakingTypes.includes(txJson.type)) {
      rewardAddresses = this.rewardAddresses;
      displayOrder.splice(6, 0, REWARD_ADDRESSES_FIELD);
    }

    // Add cross-chain information for export/import
    if (this.isTransactionForCChain) {
      displayOrder.push(SOURCE_CHAIN_FIELD, DESTINATION_CHAIN_FIELD);
    }

    const explanation: TransactionExplanation & { memo?: string } = {
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

    // Add memo to explanation if present
    if (this.hasMemo()) {
      explanation.memo = this.getMemoString();
    }

    return explanation;
  }
}
