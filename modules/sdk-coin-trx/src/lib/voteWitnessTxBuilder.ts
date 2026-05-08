import { createHash } from 'crypto';
import { TransactionType, BaseKey, BuildTransactionError, SigningError, ExtendTransactionError } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { TransactionReceipt, VoteWitnessData, VoteWitnessContract } from './iface';
import {
  decodeTransaction,
  getHexAddressFromBase58Address,
  getByteArrayFromHexAddress,
  getBase58AddressFromHex,
  TRANSACTION_DEFAULT_EXPIRATION,
  TRANSACTION_MAX_EXPIRATION,
} from './utils';
import { protocol } from '../../resources/protobuf/tron';

import ContractType = protocol.Transaction.Contract.ContractType;

export class VoteWitnessTxBuilder extends TransactionBuilder {
  protected _signingKeys: BaseKey[];
  private _votes: VoteWitnessData[];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._signingKeys = [];
    this.transaction = new Transaction(_coinConfig);
  }

  /** @inheritdoc */
  protected get transactionType(): TransactionType {
    return TransactionType.StakingVote;
  }

  /**
   * Set the votes to be used in the transaction
   *
   * @param votes vote data containing vote address and vote count
   * @returns the builder with the new parameter set
   */
  setVotes(votes: VoteWitnessData[]): this {
    this.validateVotes(votes);
    this._votes = votes.map((vote) => ({
      ...vote,
      vote_address: getHexAddressFromBase58Address(vote.vote_address),
    }));
    return this;
  }

  /** @inheritdoc */
  extendValidTo(extensionMs: number): void {
    if (this.transaction.signature && this.transaction.signature.length > 0) {
      throw new ExtendTransactionError('Cannot extend a signed transaction');
    }

    if (extensionMs <= 0) {
      throw new Error('Value cannot be below zero');
    }

    if (extensionMs > TRANSACTION_MAX_EXPIRATION) {
      throw new ExtendTransactionError('The expiration cannot be extended more than one year');
    }

    if (this._expiration) {
      this._expiration = this._expiration + extensionMs;
    } else {
      throw new Error('There is not expiration to extend');
    }
  }

  /**
   * Initialize the transaction builder fields using the transaction data
   *
   * @param {TransactionReceipt | string} rawTransaction the transaction data in a string or JSON format
   * @returns {VoteWitnessTxBuilder} the builder with the transaction data set
   */
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
    this.transaction.setTransactionType(TransactionType.StakingVote);
    const contractCall = rawData.contract[0] as VoteWitnessContract;
    this.initVoteWitnessContractCall(contractCall);
    return this;
  }

  /**
   * Initialize the votewitnesscontract call specific data
   *
   * @param {VoteWitnessContract} contractCall object with transfer data
   */
  protected initVoteWitnessContractCall(voteWitnessContractCall: VoteWitnessContract): void {
    const { votes, owner_address } = voteWitnessContractCall.parameter.value;
    if (owner_address) {
      this.source({ address: getBase58AddressFromHex(owner_address) });
    }

    if (votes) {
      this.setVotes(
        votes.map((vote) => ({
          ...vote,
          vote_address: getBase58AddressFromHex(vote.vote_address),
        }))
      );
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

  /**
   * Creates the vote witness transaction
   */
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

  /**
   * Helper method to get the vote witness transaction raw data hex
   * @returns vote witness transaction raw data hex
   */
  private getVoteWitnessRawDataHex(): string {
    const voteArray = this._votes.map((vote) => {
      const voteObject = protocol.Vote.fromObject({
        voteAddress: getByteArrayFromHexAddress(vote.vote_address),
        voteCount: vote.vote_count,
      });

      return protocol.Vote.create(voteObject);
    });
    const rawContract = {
      ownerAddress: getByteArrayFromHexAddress(this._ownerAddress),
      votes: voteArray,
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
      expiration: this._expiration || Date.now() + TRANSACTION_DEFAULT_EXPIRATION,
      timestamp: this._timestamp || Date.now(),
      contract: [txContract],
    };
    const rawTx = protocol.Transaction.raw.create(raw);
    return Buffer.from(protocol.Transaction.raw.encode(rawTx).finish()).toString('hex');
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

  private applySignatures(): void {
    if (!this.transaction.inputs) {
      throw new SigningError('Transaction has no inputs');
    }
    this._signingKeys.forEach((key) => this.applySignature(key));
  }

  validateTransaction(transaction: Transaction): void {
    this.validateVoteTransactionFields();
  }

  /**
   * Validates the votes array
   *
   * @param {VoteWitnessData[]} votes - The votes array to validate
   * @throws {Error} when the votes array is invalid
   */
  validateVotes(votes: VoteWitnessData[]): void {
    if (!votes || votes.length === 0) {
      throw new Error('Votes array is missing or empty');
    }

    votes.forEach((vote) => {
      if (!vote.vote_address) {
        throw new Error('Vote address is missing');
      }
      this.validateAddress({ address: vote.vote_address });

      if (vote.vote_count == null || vote.vote_count < 0) {
        throw new Error('Invalid vote count');
      }
    });
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
  }
}
