import {
  TransactionType,
  BaseKey,
  BuildTransactionError,
  SigningError,
  ExtendTransactionError,
  InvalidParameterValueError,
} from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionReceipt, VoteWitnessData, VoteWitnessContract, Block } from './iface';
import { Address } from './address';
import {
  decodeTransaction,
  getHexAddressFromBase58Address,
  getByteArrayFromHexAddress,
  getBase58AddressFromHex,
} from './utils';
import { createHash } from 'crypto';
import { protocol } from '../../resources/protobuf/tron';

import ContractType = protocol.Transaction.Contract.ContractType;
const DEFAULT_EXPIRATION = 3600000; // one hour
const MAX_DURATION = 86400000;

export class VoteWitnessTxBuilder extends TransactionBuilder {
  protected _signingKeys: BaseKey[];
  private _ownerAddress: string;
  private _votes: VoteWitnessData[];
  private _refBlockBytes: string;
  private _refBlockHash: string;
  private _expiration: number;
  private _timestamp: number;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._signingKeys = [];
    this.transaction = new Transaction(_coinConfig);
  }

  /** @inheritdoc */
  protected get transactionType(): TransactionType {
    return TransactionType.StakingVote;
  }

  initBuilder(rawTransaction: TransactionReceipt | string): this {
    this.transaction = this.fromImplementation(rawTransaction);
    this.transaction.setTransactionType(this.transactionType);
    this.validateRawTransaction(rawTransaction);
    const tx = this.fromImplementation(rawTransaction);
    this.transaction = tx;
    this._signingKeys = [];
    const rawData = tx.toJson().raw_data;
    this._refBlockBytes = rawData.ref_block_bytes;
    this._refBlockHash = rawData.ref_block_hash;
    this._expiration = rawData.expiration;
    this._timestamp = rawData.timestamp;
    this.transaction.setTransactionType(TransactionType.StakingActivate);
    const contractCall = rawData.contract[0] as VoteWitnessContract;
    this.initVoteWitnessContractCall(contractCall);
    return this;
  }

  /**
   * Initialize the contract call specific data
   *
   * @param {TriggerSmartContract} contractCall object with transfer data
   */
  protected initVoteWitnessContractCall(voteWitnessContractCall: VoteWitnessContract): void {
    const { votes, owner_address } = voteWitnessContractCall.parameter.value;
    if (owner_address) {
      this.source({ address: getBase58AddressFromHex(owner_address) });
    }

    if (votes) {
      this.setVotes(votes);
    }
  }

  source(address: Address): this {
    this.validateAddress(address);
    this._ownerAddress = getHexAddressFromBase58Address(address.address);
    return this;
  }

  setVotes(votes: VoteWitnessData[]): this {
    this.validateVotes(votes);
    this._votes = votes;
    return this;
  }

  validateVotes(votes: VoteWitnessData[]): void {
    if (!this._votes || this._votes.length === 0) {
      throw new BuildTransactionError('Missing or empty votes array');
    }

    if (!this._votes.every((vote) => vote.vote_address && vote.vote_count > 0)) {
      throw new BuildTransactionError('Invalid vote address or vote count');
    }
  }

  validateTransaction(transaction: Transaction | TransactionReceipt): void {
    this.validateVoteTransactionFields();
  }

  /**
   * Validates if the transaction is a valid vote transaction
   * @param {TransactionReceipt} transaction - The transaction to validate
   * @throws {InvalidTransactionError} when the transaction is invalid
   */
  private validateVoteTransactionFields(): void {
    if (!this._ownerAddress) {
      throw new BuildTransactionError('Missing parameter: source');
    }

    if (!this._refBlockBytes || !this._refBlockHash) {
      throw new BuildTransactionError('Missing block reference information');
    }

    // Validate votes
    if (!this._votes || this._votes.length === 0) {
      throw new BuildTransactionError('Missing or empty votes array');
    }

    if (!this._votes.every((vote) => vote.vote_address && vote.vote_count > 0)) {
      throw new BuildTransactionError('Invalid vote address or vote count');
    }
  }

  protected async buildImplementation(): Promise<Transaction> {
    this.createVoteWitnessContractTransaction();
    /** @inheritdoccreateTransaction */
    // This method must be extended on child classes
    if (this._signingKeys.length > 0) {
      this.applySignatures();
    }

    if (!this.transaction.id) {
      throw new BuildTransactionError('A valid transaction must have an id');
    }
    return Promise.resolve(this.transaction);
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    if (this._signingKeys.some((signingKey) => signingKey.key === key.key)) {
      throw new SigningError('Duplicated key');
    }
    this._signingKeys.push(key);

    // We keep this return for compatibility but is not meant to be use
    return this.transaction;
  }

  private createVoteWitnessContractTransaction(): void {
    const rawDataHex = this.getVoteWitnessRawDataHex();
    const rawData = decodeTransaction(rawDataHex);
    const contract = rawData.contract[0] as VoteWitnessContract;
    const contractParameter = contract.parameter;
    contractParameter.value.owner_address = this._ownerAddress.toLocaleLowerCase();
    contractParameter.value.votes = this._votes;
    contractParameter.type_url = 'type.googleapis.com/protocol.VoteWitnessContract';
    contract.type = 'VoteWitnessContract';
    const hexBuffer = Buffer.from(rawDataHex, 'hex');
    const id = createHash('sha256').update(hexBuffer).digest('hex');
    const txRecip: TransactionReceipt = {
      raw_data: rawData,
      raw_data_hex: rawDataHex,
      txID: id,
      signature: this.transaction.signature,
    };
    this.transaction = new Transaction(this._coinConfig, txRecip);
  }

  private getVoteWitnessRawDataHex(): string {
    const rawContract = {
      ownerAddress: getByteArrayFromHexAddress(this._ownerAddress),
      votes: this._votes.map((vote) => ({
        ...vote,
        vote_address: getByteArrayFromHexAddress(vote.vote_address),
      })),
    };

    const voteWitnessContract = protocol.VoteWitnessContract.fromObject(rawContract);
    const voteWitnessContractBytes = protocol.VoteWitnessContract.encode(voteWitnessContract).finish();
    const txContract = {
      type: ContractType.VoteWitnessContract,
      parameter: {
        value: voteWitnessContractBytes,
        type_url: 'type.googleapis.com/protocol.VoteWitnessContract',
      },
    };
    const raw = {
      refBlockBytes: Buffer.from(this._refBlockBytes, 'hex'),
      refBlockHash: Buffer.from(this._refBlockHash, 'hex'),
      expiration: this._expiration || Date.now() + DEFAULT_EXPIRATION,
      timestamp: this._timestamp || Date.now(),
      contract: [txContract],
    };
    const rawTx = protocol.Transaction.raw.create(raw);
    return Buffer.from(protocol.Transaction.raw.encode(rawTx).finish()).toString('hex');
  }

  private applySignatures(): void {
    if (!this.transaction.inputs) {
      throw new SigningError('Transaction has no inputs');
    }
    this._signingKeys.forEach((key) => this.applySignature(key));
  }

  /**
   * Set the block values,
   *
   * @param {Block} block the object containing number and hash of the block
   * @returns {ContractCallBuilder} the builder with the new parameter set
   */
  block(block: Block): this {
    const blockBytes = Buffer.alloc(8);
    blockBytes.writeInt32BE(block.number, 4);
    this._refBlockBytes = blockBytes.slice(6, 8).toString('hex');
    this._refBlockHash = Buffer.from(block.hash, 'hex').slice(8, 16).toString('hex');

    return this;
  }

  /**
   * Set the expiration time for the transaction, set also timestamp if it was not set previously
   *
   * @param {number} time the expiration time in milliseconds
   * @returns {ContractCallBuilder} the builder with the new parameter set
   */
  expiration(time: number): this {
    if (this.transaction.id) {
      throw new ExtendTransactionError('Expiration is already set, it can only be extended');
    }
    this._timestamp = this._timestamp || Date.now();
    this.validateExpirationTime(time);
    this._expiration = time;
    return this;
  }

  validateExpirationTime(value: number): void {
    if (value < this._timestamp) {
      throw new InvalidParameterValueError('Expiration must be greater than timestamp');
    }
    if (value < Date.now()) {
      throw new InvalidParameterValueError('Expiration must be greater than current time');
    }
    if (value - this._timestamp > MAX_DURATION) {
      throw new InvalidParameterValueError('Expiration must not be greater than one year');
    }
  }

  /** @inheritdoc */
  extendValidTo(extensionMs: number): void {
    if (this.transaction.signature && this.transaction.signature.length > 0) {
      throw new ExtendTransactionError('Cannot extend a signed transaction');
    }

    if (extensionMs <= 0) {
      throw new Error('Value cannot be below zero');
    }

    if (extensionMs > MAX_DURATION) {
      throw new ExtendTransactionError('The expiration cannot be extended more than one year');
    }

    if (this._expiration) {
      this._expiration = this._expiration + extensionMs;
    } else {
      throw new Error('There is not expiration to extend');
    }
  }

  /**
   * Set the timestamp for the transaction
   *
   * @param {number} time the timestamp in milliseconds
   * @returns {ContractCallBuilder} the builder with the new parameter set
   */
  timestamp(time: number): this {
    this._timestamp = time;
    return this;
  }
}
