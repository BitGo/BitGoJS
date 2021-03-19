import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransactionBuilder, TransactionType } from '../baseCoin';
import { BuildTransactionError, InvalidTransactionError, ParseTransactionError, SigningError, NotImplementedError } from '../baseCoin/errors';
import { BaseAddress, BaseKey } from '../baseCoin/iface';
import { Transaction } from './transaction';
import { promises } from 'dns';
import { Key } from './iface';
import { Buffer } from 'buffer';

import eosjs = require('eosjs');

const ecc = require('eosjs-ecc');


// necessary config setup to push recreated transaction to get back tx id
const request = require('request-json');
const httpEndpoint = 'http://159.69.74.183:2888';

const client = request.createClient(httpEndpoint);

const config = {
    chainId: "2a02a0053e5a8cf73a56ba0fda11e4d92e0238a4a2aa74fccf46d5a910746840", // 32 byte (64 char) hex string
    keyProvider: ['5KUZyFK1Sz35w4k9ZMEsvQNwfupPYj74o52Z36cumcZ93Wz7Epp'], // WIF string or array of keys..
    httpEndpoint: httpEndpoint,
    expireInSeconds: 60,
    broadcast: true,
    verbose: false, // API activity
    sign: true
};

const eos = eosjs(config);

export class TransactionBuilder extends BaseTransactionBuilder {
  private _transaction: Transaction;
  private _serializedTransaction: string;
  private _type: TransactionType;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._type = TransactionType.Send;
    // this._transaction = new Transaction(_coinConfig);
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction): void {
    throw new NotImplementedError('initBuilder not implemented');
  }

  protected fromImplementation(rawTransaction: string): Transaction {
    // Decoding the transaction is an async operation, so save it and leave the decoding for the
    // build step
    this._serializedTransaction = rawTransaction;
    return new Transaction(this._coinConfig);
  }



  protected async buildImplementation(): Promise<Transaction> {

    // If the from() method was called, use the serialized transaction as a base
    if (this._serializedTransaction) {
      // console.log('SERIALIZED', this._serializedTransaction)

      // parse packed transaction
      const parsedTrx = JSON.parse(this._serializedTransaction)
      // console.log('PACKED', parsedTrx)

      // grab signature
      const signature = parsedTrx.signatures;
      // console.log('SIGNATURE', signature)

      // add signature to config
      config.keyProvider = [signature];
      // console.log('config', config)

      //deserialized transaction to get unpack hex
      const eosClient = new eosjs({ });
      const eosTxStruct = eosClient.fc.structs.transaction;
      const serializedBuffer = Buffer.from(parsedTrx.packed_trx, 'hex');
      const finalTransaction =  eosjs.modules.Fcbuffer.fromBuffer(eosTxStruct, serializedBuffer);

      // set variables for recreating transaction from deserialized data so we can get the tx.id 
      const trxActor = finalTransaction.actions[0].authorization[0].actor;
      const trxPermission = finalTransaction.actions[0].authorization[0].permission 
      const trxNewAccountData = finalTransaction.actions[0].data;
      const trxActionData = finalTransaction.actions[1].data;
      const firstAction = finalTransaction.actions[0].name;
      const secondAction = finalTransaction.actions[1].name;
      const contextFreeActionName = finalTransaction.context_free_actions[0].name;
      const contextFreeActionData = finalTransaction.context_free_actions[0].data;

      
      // recreate transaction from deserialized data
      let newTrx = {
        actions: [{
          account: 'eosio',
          name: firstAction,
          authorization: [{
            actor: trxActor,
            permission: trxPermission,
          }],
          data: trxNewAccountData
        },
        {
          account: 'eosio',
          name: secondAction,
          authorization: [{
            actor: trxActor,
            permission: trxPermission,
          }],
          data: trxActionData 
        }],
        context_free_actions: [{
            account: 'eosio.null',
            name: contextFreeActionName,
            authorization: [],
            data: contextFreeActionData,
        }],
    }

      const trxWithId = await eos.transaction(newTrx, { sign: false, broadcast: false });
      console.log('ID', trxWithId)

      const txId = trxWithId.transaction_id;
      console.log('ID', txId)

      

    } else {

      return Promise.resolve(new Transaction(this._coinConfig));
    }
    this.transaction = new Transaction(this._coinConfig);
    return this.transaction;
  }

  protected signImplementation(key: Key): Transaction {

    return new Transaction(this._coinConfig);
  }

  // region Getters and Setters
  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }
  // endregion

  // region Validators
  /** @inheritdoc */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    throw new NotImplementedError('validateAddress not implemented');
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    throw new NotImplementedError('validateKey not implemented');
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: any): void {
    if (!rawTransaction) {
      throw new InvalidTransactionError('Raw transaction is empty');
    }

    // removed to test initialization tx that also had signatures and was in string format

    // if (typeof rawTransaction !== 'string' || /^[0-9a-fA-F]+$/.test(rawTransaction) === false) {
    //   throw new InvalidTransactionError('Transaction is not a hex string');
    // } 
  }

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {

    // TODO: validate all required fields are present in the builder before buildImplementation
    // copied from Tezos, may need to check whether other items need to be validated
    switch (this._type) {
      case TransactionType.WalletInitialization:
        break;
      case TransactionType.Send:
        break;
      case TransactionType.SingleSigSend:
        break;
      case TransactionType.AccountUpdate:
        break;
      case TransactionType.AddressInitialization:
        break;
      default:
        throw new BuildTransactionError('Transaction type not supported');
    }
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    throw new NotImplementedError('validateValue not implemented');
  }

  /** @inheritdoc */
  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }
  // endregion
}
