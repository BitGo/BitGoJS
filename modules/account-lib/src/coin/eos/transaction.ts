import * as EosJs from 'eosjs';
import ser from 'eosjs/dist/eosjs-serialize';
import { TransactionBuilder as EosTxBuilder } from 'eosjs/dist/eosjs-api';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransaction, TransactionType } from '../baseCoin';
import { InvalidTransactionError } from '../baseCoin/errors';
import { BaseKey } from '../baseCoin/iface';
import { TxData } from './ifaces';
const { TextEncoder, TextDecoder } = require('util');

// import { KeyPair } from './keyPair';
export class Transaction extends BaseTransaction {
  private _eosTransaction?: EosJs.RpcInterfaces.PushTransactionArgs;
  private _signedTransaction?: EosJs.RpcInterfaces.PushTransactionArgs;
  private _serializedUnsignedTransaction?: EosJs.RpcInterfaces.PushTransactionArgs;
  private _numberOfRequiredSigners: number;
  private _sender: string;
  private _signers: string[];
  private _blocksBehind: number;
  private _expireSeconds: number;
  private eosApi: EosJs.Api;
  private _eosTxBuilder?: EosTxBuilder;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._numberOfRequiredSigners = 0;
    this._signers = [];
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    return true;
  }

  sender(address: string): void {
    this._sender = address;
  }

  blocksBehind(blocksBehind: number): void {
    this._blocksBehind = blocksBehind;
  }

  expireSeconds(expireSeconds: number): void {
    this._expireSeconds = expireSeconds;
  }

  /**
   * Set the transaction type.
   *
   * @param {TransactionType} transactionType The transaction type to be set.
   */
  setTransactionType(transactionType: TransactionType): void {
    this._type = transactionType;
  }

  /**
   * Set underlying eos transaction.
   *
   * @param {EosJs.RpcInterfaces.PushTransactionArgs} tx represents a broadcast format tx
   * @returns {void}
   */
  setEosTransaction(tx: EosJs.RpcInterfaces.PushTransactionArgs): void {
    this._eosTransaction = tx;
  }

  /**
   * Set underlying signed eos transaction.
   *
   * @param {EosJs.RpcInterfaces.PushTransactionArgs} tx represents a broadcast format signed tx
   * @returns {void}
   */
  setEosSignedTransaction(tx: EosJs.RpcInterfaces.PushTransactionArgs): void {
    this._signedTransaction = tx;
  }

  async build(eosApi: EosJs.Api, eosTxBuilder?: EosTxBuilder) {
    this.eosApi = eosApi;
    this._eosTxBuilder = eosTxBuilder;
    const tx = await eosTxBuilder?.send();
    this.setEosTransaction(tx as EosJs.RpcInterfaces.PushTransactionArgs);
    this.setEosSignedTransaction(
      (await this._eosTxBuilder?.send({
        sign: true,
      })) as EosJs.RpcInterfaces.PushTransactionArgs,
    );
  }
  /**
   * Get underlying eos transaction.
   *
   * @returns {EosJs.RpcInterfaces.PushTransactionArgs}
   */
  getEosTransaction(): EosJs.RpcInterfaces.PushTransactionArgs | undefined {
    return this._eosTransaction;
  }

  /**
   * Get underlying signed eos transaction.
   *
   * @returns {EosJs.RpcInterfaces.PushTransactionArgs}
   */
  getEosSignedTransaction(): EosJs.RpcInterfaces.PushTransactionArgs | undefined {
    return this._signedTransaction;
  }

  /** @inheritdoc */
  toBroadcastFormat(): EosJs.RpcInterfaces.PushTransactionArgs {
    if (!this._eosTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    if (this._signedTransaction) {
      return this._signedTransaction;
    }
    return this._eosTransaction;
  }

  // TODO
  // METHOD PICKED FROM EOSJS-API line 186
  public deserialize(buffer: ser.SerialBuffer, type: string): any {
    // transactionTypes comes from abi
    // return this.transactionTypes.get(type).deserialize(buffer);
  }

  /**
   * Deserialize eos tx
   *
   * @param {Uint8Array} transaction = tx
   * @returns {EosJs.ApiInterfaces.Transaction} Eos tx
   */
  public deserializeTransaction(transaction: Uint8Array): EosJs.ApiInterfaces.Transaction {
    const buffer = new ser.SerialBuffer({ textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });
    buffer.pushArray(transaction);
    return this.deserialize(buffer, 'transaction');
  }

  /** @inheritdoc */
  toJson(): any {
    // throw new NotImplementedError('toJson not implemented');
    if (!this._eosTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    const deserializedTransaction = this.deserializeTransaction(this._eosTransaction.serializedTransaction);
    const actions = deserializedTransaction.actions;
    const result: TxData = {
      actions: [],
    };
    if (this.type === TransactionType.Send) {
      result.actions.push({
        name: actions[0].name,
        account: actions[0].account,
        authorization: actions[0].authorization,
        data: {
          from: actions[0].data.from,
          to: actions[0].data.to,
          quantity: actions[0].data.quantity,
          memo: actions[0].data.memo,
        },
      });
    }
    if (this.type === TransactionType.StakingActivate || this.type === TransactionType.StakingWithdraw) {
      result.actions.push({
        name: actions[0].name,
        account: actions[0].account,
        authorization: actions[0].authorization,
        data: {
          from: actions[0].data.from,
          receiver: actions[0].data.receiver,
          stake_net_quantity: actions[0].data.stake_net_quantity,
          stake_cpu_quantity: actions[0].data.stake_cpu_quantity,
          transfer: actions[0].data.transfer,
        },
      });
    }

    if (this.type === TransactionType.BuyRamBytes) {
      result.actions.push({
        name: actions[0].name,
        account: actions[0].account,
        authorization: actions[0].authorization,
        data: {
          payer: actions[0].data.payer,
          receiver: actions[0].data.receiver,
          bytes: actions[0].data.bytes,
        },
      });
    }

    if (this.type === TransactionType.WalletInitialization) {
      result.actions.push({
        name: actions[0].name,
        account: actions[0].account,
        authorization: actions[0].authorization,
        data: {
          creator: actions[0].data.creator,
          name: actions[0].data.name,
          owner: actions[0].data.owner,
          active: actions[0].data.active,
        },
      });
      result.actions.push({
        name: actions[0].name,
        account: actions[0].account,
        authorization: actions[0].authorization,
        data: {
          payer: actions[1].data.payer,
          receiver: actions[1].data.receiver,
          bytes: actions[1].data.bytes,
        },
      });
      result.actions.push({
        name: actions[0].name,
        account: actions[0].account,
        authorization: actions[0].authorization,
        data: {
          from: actions[2].data.from,
          receiver: actions[2].data.receiver,
          stake_net_quantity: actions[2].data.stake_net_quantity,
          stake_cpu_quantity: actions[2].data.stake_cpu_quantity,
          transfer: actions[2].data.transfer,
        },
      });
    }
    return result;
  }
}
