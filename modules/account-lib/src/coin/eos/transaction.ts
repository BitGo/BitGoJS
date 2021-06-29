import * as EosJS from 'eosjs';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransaction, TransactionType } from '../baseCoin';
import { InvalidTransactionError, NotImplementedError } from '../baseCoin/errors';
import { BaseKey } from '../baseCoin/iface';
import { TxData } from './ifaces';
// import { KeyPair } from './keyPair';
export class Transaction extends BaseTransaction {
  private _eosTransaction?: EosJS.ApiInterfaces.Transaction;
  private _signedTransaction?: EosJS.RpcInterfaces.PushTransactionArgs;
  private _serializedUnsignedTransaction?: EosJS.RpcInterfaces.PushTransactionArgs;
  private _numberOfRequiredSigners: number;
  private _sender: string;
  private _signers: string[];
  private _blocksBehind: number;
  private _expireSeconds: number;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._numberOfRequiredSigners = 0;
    this._signers = [];
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    if (this._numberOfRequiredSigners === 0) {
      return false;
    }
    // if (this._numberOfRequiredSigners === 1) {
    //   const kp = new KeyPair({ prv: key });
    //   const addr = kp.getAddress();
    //   if (addr === this._sender) {
    //     return true;
    //   } else {
    //     return false;
    //   }
    // } else {
    //   return true;
    // }
    throw new NotImplementedError('canSign not implemented');
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
   * Signs transaction.
   *
   * @param {EosJS.Api} api Eos API.
   * @param {string[]} requiredKeys signing keys.
   */
  async sign(api: EosJS.Api, requiredKeys: string[]): Promise<void> {
    this._signedTransaction = await this.serializeTransaction(api, true, requiredKeys);
  }

  /**
   * Serializes an unsigned transaction.
   *
   * @param {EosJS.Api} api Eos API.
   * @param {string[]} requiredKeys signing keys.
   */
  async serializeUnsignedTransaction(api: EosJS.Api): Promise<void> {
    this._serializedUnsignedTransaction = await this.serializeTransaction(api, false, []);
  }

  /**
   * Serializes a transaction.
   *
   * @param {EosJS.Api} api Eos API.
   * @param {boolean} sign sign the transaction or not.
   * @param {string[]} requiredKeys signing keys.
   * @returns {EosJS.RpcInterfaces.PushTransactionArgs} serialized transaction
   */
  private async serializeTransaction(
    api: EosJS.Api,
    sign: boolean,
    requiredKeys: string[],
  ): Promise<EosJS.RpcInterfaces.PushTransactionArgs> {
    if (!this._eosTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    return (await api.transact(this._eosTransaction, {
      broadcast: false,
      sign,
      requiredKeys,
      blocksBehind: this._blocksBehind,
      expireSeconds: this._expireSeconds,
    })) as EosJS.RpcInterfaces.PushTransactionArgs;
  }

  /**
   * Set underlying eos transaction.
   *
   * @returns {void}
   */

  setEosTransaction(tx: EosJS.ApiInterfaces.Transaction): void {
    this._eosTransaction = tx;
  }

  /**
   * Get underlying eos transaction.
   *
   * @returns {EosJS.ApiInterfaces.Transaction}
   */

  getEosTransaction(): EosJS.ApiInterfaces.Transaction | undefined {
    return this._eosTransaction;
  }

  /** @inheritdoc */
  toBroadcastFormat(): EosJS.RpcInterfaces.PushTransactionArgs {
    if (!this._eosTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    if (this._signedTransaction) {
      return this._signedTransaction;
    }
    if (!this._serializedUnsignedTransaction) {
      throw new InvalidTransactionError('Please serialize the transaction first');
    }
    return this._serializedUnsignedTransaction;
  }

  /** @inheritdoc */
  toJson(): any {
    // throw new NotImplementedError('toJson not implemented');
    if (!this._eosTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    const actions = this._eosTransaction.actions;
    const result: TxData = {
      actions: [],
    };
    if (this.type === TransactionType.Send) {
      result.actions.push({
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
        data: {
          payer: actions[0].data.payer,
          receiver: actions[0].data.receiver,
          bytes: actions[0].data.bytes,
        },
      });
    }

    if (this.type === TransactionType.WalletInitialization) {
      result.actions.push({
        data: {
          creator: actions[0].data.creator,
          name: actions[0].data.name,
          owner: actions[0].data.owner,
          active: actions[0].data.active,
        },
      });
      result.actions.push({
        data: {
          payer: actions[1].data.payer,
          receiver: actions[1].data.receiver,
          bytes: actions[1].data.bytes,
        },
      });
      result.actions.push({
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
