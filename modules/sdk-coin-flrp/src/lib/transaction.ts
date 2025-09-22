import { UnsignedTx, Credential } from '@flarenetwork/flarejs';
import {
  BaseKey,
  BaseTransaction,
  Entry,
  InvalidTransactionError,
  SigningError,
  TransactionFee,
  TransactionType,
} from '@bitgo-beta/sdk-core';
import { FlareNetwork, BaseCoin as CoinConfig } from '@bitgo-beta/statics';
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
  public _fromAddresses: string[] = [];
  public _rewardAddresses: string[] = [];
  public _utxos: DecodedUtxoObj[] = [];
  public _to: string[];
  public _fee: Partial<TransactionFee> = {};
  public _blsPublicKey: string;
  public _blsSignature: string;
  public _memo: Uint8Array = new Uint8Array(); // FlareJS memo field

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._network = coinConfig.network as FlareNetwork;
    this._assetId = 'FLR'; // Default FLR asset
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
    // For now, return placeholder
    return [];
  }

  get credentials(): Credential[] {
    // TODO: Extract credentials from FlareJS transaction
    // For now, return empty array
    return [];
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
    const prv = keyPair.getPrivateKey() as Buffer;

    if (!prv) {
      throw new SigningError('Missing private key');
    }

    if (!this.flareTransaction) {
      throw new InvalidTransactionError('empty transaction to sign');
    }

    if (!this.hasCredentials) {
      throw new InvalidTransactionError('empty credentials to sign');
    }

    // TODO: Implement FlareJS signing process
    // This will involve:
    // 1. Creating FlareJS signature using private key
    // 2. Attaching signature to appropriate credential
    // 3. Updating transaction with signed credentials

    throw new Error('FlareJS signing not yet implemented - placeholder');
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
    return Buffer.from(byteArray).toString('hex');
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    if (!this.flareTransaction) {
      throw new InvalidTransactionError('Empty transaction data');
    }

    // TODO: Implement FlareJS transaction serialization
    // For now, return placeholder
    return 'flare-tx-hex-placeholder';
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

    // TODO: Implement FlareJS signable payload extraction
    // For now, return placeholder
    return Buffer.from('flare-signable-payload');
  }

  get id(): string {
    if (!this.flareTransaction) {
      throw new InvalidTransactionError('Empty transaction for ID generation');
    }

    // TODO: Implement FlareJS transaction ID generation
    // For now, return placeholder
    return 'flare-transaction-id-placeholder';
  }

  get fromAddresses(): string[] {
    return this._fromAddresses.map((address) => {
      // TODO: Format addresses using FlareJS utilities
      return address;
    });
  }

  get rewardAddresses(): string[] {
    return this._rewardAddresses.map((address) => {
      // TODO: Format addresses using FlareJS utilities
      return address;
    });
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
            address: this._nodeID || 'placeholder-node-id',
            value: this._stakeAmount?.toString() || '0',
          },
        ];
      case TransactionType.AddDelegator:
      case TransactionType.AddPermissionlessDelegator:
        // TODO: Extract delegator outputs from FlareJS transaction
        return [
          {
            address: this._nodeID || 'placeholder-node-id',
            value: this._stakeAmount?.toString() || '0',
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
    return [];
  }

  get inputs(): FlrpEntry[] {
    // TODO: Extract inputs from FlareJS transaction
    // For now, return placeholder based on UTXOs
    return this._utxos.map((utxo) => ({
      id: utxo.txid + INPUT_SEPARATOR + utxo.outputidx,
      address: this.fromAddresses.sort().join(ADDRESS_SEPARATOR),
      value: utxo.amount,
    }));
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
    return signval.toString('hex');
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
    const displayOrder = ['id', 'inputs', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'type'];

    // Add memo to display order if present
    if (this.hasMemo()) {
      displayOrder.push('memo');
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
      displayOrder.splice(6, 0, 'rewardAddresses');
    }

    // Add cross-chain information for export/import
    if (this.isTransactionForCChain) {
      displayOrder.push('sourceChain', 'destinationChain');
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
