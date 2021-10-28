import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransactionBuilder, TransactionType } from '../baseCoin';
import { InvalidTransactionError, BuildTransactionError } from '../baseCoin/errors';
import { BaseAddress, BaseKey } from '../baseCoin/iface';
import { isValidEd25519Seed } from '../../utils/crypto';
import { metadataRpc } from './metaData';
import BigNumber from 'bignumber.js';
import { decodeAddress } from '@polkadot/keyring';
import { getRegistry, decode } from '@substrate/txwrapper-polkadot';
import { UnsignedTransaction } from '@substrate/txwrapper-core';
import { TypeRegistry, DecodedSignedTx, DecodedSigningPayload } from '@substrate/txwrapper-core/lib/types';
import { BaseTransactionSchema, SignedTransactionSchema, SigningPayloadTransactionSchema } from './txnSchema';
import { Transaction } from './transaction';
import { KeyPair } from './keyPair';
import { CreateBaseTxInfo, sequenceId, specNameType, TxMethod, Validity } from './iface';
import Utils from './utils';
import { AddressValidationError } from './errors';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;
  protected _keyPair: KeyPair;
  protected _sender: string;

  protected _blockNumber: number;
  protected _blockHash: string;
  protected _genesisHash: string;
  protected _metadataRpc: string;
  protected _specVersion: number;
  protected _transactionVersion: number;
  protected _specName: specNameType;
  protected _chainName: string;
  protected _nonce: number;
  protected _tip?: number;
  protected _eraPeriod?: number;
  protected _registry: TypeRegistry;
  protected _method?: TxMethod;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
  }
  /**
   *
   * Sets the address of sending account.
   *
   * @param {string} sender The SS58-encoded address.
   * @returns {TransactionBuilder} This transaction builder.
   *
   * @see https://wiki.polkadot.network/docs/build-transaction-construction
   */
  sender(sender: string): this {
    this.validateAddress({ address: sender });
    this._sender = sender;
    this._transaction.sender(sender);
    return this;
  }
  /**
   *
   * The number of blocks after the checkpoint for which a transaction is valid. If zero, the transaction is immortal.
   *
   * @param {number | undefined} maxDuration
   * @returns {TransactionBuilder} This transaction builder.
   *
   * @see https://wiki.polkadot.network/docs/build-transaction-construction
   */
  durationConfig({ maxDuration }: { maxDuration: number | undefined }): this {
    if (maxDuration !== undefined) {
      this.validateValue(new BigNumber(maxDuration));
      this._eraPeriod = maxDuration;
    }
    return this;
  }
  /**
   *
   * The nonce for this transaction.
   *
   * @param {number} nonce
   * @returns {TransactionBuilder} This transaction builder.
   *
   * @see https://wiki.polkadot.network/docs/build-transaction-construction
   */
  sequenceId(nonce: sequenceId): this {
    const value = new BigNumber(nonce.value);
    this.validateValue(value);
    this._nonce = value.toNumber();
    return this;
  }
  /**
   *
   * The tip to increase transaction priority.
   *
   * @param {number | undefined} tip optional
   * @returns {TransactionBuilder} This transaction builder.
   *
   * @see https://wiki.polkadot.network/docs/build-transaction-construction
   */
  tip(tip: number | undefined): this {
    if (tip !== undefined) {
      this.validateValue(new BigNumber(tip));
    }
    this._tip = tip;
    return this;
  }

  /**
   *
   * The number of the checkpoint block after which the transaction is valid
   *
   * @param {number} blockNumber
   * @returns {TransactionBuilder} This transaction builder.
   *
   * @see https://wiki.polkadot.network/docs/build-transaction-construction
   */
  validity({ firstValid }: Validity): this {
    this.validateValue(new BigNumber(firstValid));
    this._blockNumber = firstValid;
    return this;
  }
  /**
   *
   * The hash of the checkpoint block.
   *
   * @param {number} blockHash
   * @returns {TransactionBuilder} This transaction builder.
   *
   * @see https://wiki.polkadot.network/docs/build-transaction-construction
   * @see https://wiki.polkadot.network/docs/build-protocol-info#transaction-mortality
   */
  blockHash(blockHash: string): this {
    this._blockHash = blockHash;
    return this;
  }
  /**
   *
   * The current version for transaction format.
   *
   * @param {number} transactionVersion
   * @returns {TransactionBuilder} This transaction builder.
   *
   * @see https://wiki.polkadot.network/docs/build-transaction-construction
   */
  transactionVersion(transactionVersion: number): this {
    this._transactionVersion = transactionVersion;
    return this;
  }

  private method(method: TxMethod): this {
    this._method = method;
    return this;
  }
  /**
   * Sets the
   * specName,
   * genesisHash - genesisHash of the chain,
   * metadataRpc - The SCALE-encoded metadata for the runtime when submitted,
   * specVersion - The current spec version for the runtime,
   * chainName - chainName,
   * registry,
   *
   * @returns {TransactionBuilder} This transaction builder.
   *
   * @see https://wiki.polkadot.network/docs/build-transaction-construction
   */
  testnet(): this {
    this._specName = 'polkadot';
    this._genesisHash = '0x2b8d4fdbb41f4bc15b8a7ec8ed0687f2a1ae11e0fc2dc6604fa962a9421ae349';
    this._metadataRpc = metadataRpc;
    this._specVersion = 9100;
    this._chainName = 'Polkadot';
    this.registry();
    return this;
  }

  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  /** @inheritdoc */
  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }

  protected isSigningPayload(payload: DecodedSigningPayload | DecodedSignedTx): payload is DecodedSigningPayload {
    return (payload as DecodedSigningPayload).blockHash !== undefined;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const decodedTxn = decode(rawTransaction, {
      metadataRpc: this._metadataRpc,
      registry: this._registry,
    }) as DecodedSigningPayload | DecodedSignedTx;

    if (this.isSigningPayload(decodedTxn)) {
      this.blockHash(decodedTxn.blockHash);
      this.transactionVersion(decodedTxn.transactionVersion);
    } else {
      const keypair = new KeyPair({
        pub: Buffer.from(decodeAddress(decodedTxn.address, false, this._registry.chainSS58)).toString('hex'),
      });
      this.sender(keypair.getAddress());
    }
    this.durationConfig({ maxDuration: decodedTxn.eraPeriod });
    this.sequenceId({
      name: 'Nonce',
      keyword: 'nonce',
      value: decodedTxn.nonce,
    });
    this.tip(decodedTxn.tip);
    this.method(decodedTxn.method as unknown as TxMethod);
    return this._transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.setDotTransaction(this.buildDotTxn());
    this.transaction.setTransactionType(this.transactionType);
    this.transaction.registry(this._registry);
    this.transaction.chainName(this._chainName);
    if (this._keyPair) {
      this.transaction.sign(this._keyPair);
    }
    return this._transaction;
  }

  protected createBaseTxInfo(): CreateBaseTxInfo {
    return {
      baseTxInfo: {
        address: this._sender,
        blockHash: this._blockHash,
        blockNumber: this._registry.createType('BlockNumber', this._blockNumber).toNumber(),
        eraPeriod: this._eraPeriod,
        genesisHash: this._genesisHash,
        metadataRpc: this._metadataRpc,
        nonce: this._nonce,
        specVersion: this._specVersion,
        tip: this._tip,
        transactionVersion: this._transactionVersion,
      },
      options: {
        metadataRpc: this._metadataRpc,
        registry: this._registry,
      },
    };
  }
  private registry(): this {
    this._registry = getRegistry({
      chainName: this._chainName,
      specName: this._specName,
      specVersion: this._specVersion,
      metadataRpc: this._metadataRpc,
    });
    return this;
  }
  /**
   * The transaction type.
   */
  protected abstract buildDotTxn(): UnsignedTransaction;

  /**
   * The transaction type.
   */
  protected abstract get transactionType(): TransactionType;

  /** @inheritdoc */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    if (!Utils.isValidAddress(address.address)) {
      throw new AddressValidationError(address.address);
    }
  }
  /** @inheritdoc */
  validateKey({ key }: BaseKey): void {
    let isValidPrivateKeyFromBytes;
    const isValidPrivateKeyFromHex = isValidEd25519Seed(key);
    const isValidPrivateKeyFromBase64 = isValidEd25519Seed(Buffer.from(key, 'base64').toString('hex'));
    try {
      const decodedSeed = Utils.decodeSeed(key);
      isValidPrivateKeyFromBytes = isValidEd25519Seed(Buffer.from(decodedSeed.seed).toString('hex'));
    } catch (err) {
      isValidPrivateKeyFromBytes = false;
    }

    if (!isValidPrivateKeyFromBytes && !isValidPrivateKeyFromHex && !isValidPrivateKeyFromBase64) {
      throw new BuildTransactionError(`Key validation failed`);
    }
  }
  /** @inheritdoc */
  validateRawTransaction(rawTransaction: string): void {
    const decodedTxn = decode(rawTransaction, {
      metadataRpc: this._metadataRpc,
      registry: this._registry,
    }) as DecodedSigningPayload | DecodedSignedTx;

    const eraPeriod = decodedTxn.eraPeriod;
    const nonce = decodedTxn.nonce;
    const tip = decodedTxn.tip;

    if (this.isSigningPayload(decodedTxn)) {
      const blockHash = decodedTxn.blockHash;
      const validationResult = SigningPayloadTransactionSchema.validate({
        eraPeriod,
        blockHash,
        nonce,
        tip,
      });
      if (validationResult.error) {
        throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
      }
    } else {
      const sender = decodedTxn.address;
      const validationResult = SignedTransactionSchema.validate({
        sender,
        nonce,
        eraPeriod,
        tip,
      });
      if (validationResult.error) {
        throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
      }
    }
  }
  /** @inheritdoc */
  validateTransaction(_: Transaction): void {
    this.validateBaseFields(
      this._sender,
      this._blockNumber,
      this._blockHash,
      this._genesisHash,
      this._metadataRpc,
      this._chainName,
      this._nonce,
      this._specVersion,
      this._specName,
      this._transactionVersion,
      this._eraPeriod,
      this._tip,
    );
  }
  private validateBaseFields(
    sender: string,
    blockNumber: number,
    blockHash: string,
    genesisHash: string,
    metadataRpc: string,
    chainName: string,
    nonce: number,
    specVersion: number,
    specName: specNameType,
    transactionVersion: number,
    eraPeriod: number | undefined,
    tip: number | undefined,
  ): void {
    const validationResult = BaseTransactionSchema.validate({
      sender,
      blockNumber,
      blockHash,
      genesisHash,
      metadataRpc,
      chainName,
      nonce,
      specVersion,
      specName,
      transactionVersion,
      eraPeriod,
      tip,
    });

    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }
  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }
  /** @inheritdoc */
  protected signImplementation({ key }: BaseKey): Transaction {
    this._keyPair = new KeyPair({ prv: key });
    return this._transaction;
  }
}
