import * as EosJs from 'eosjs';
import * as ecc from 'eosjs-ecc';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransaction, TransactionType } from '../baseCoin';
import { InvalidTransactionError } from '../baseCoin/errors';
import { BaseKey } from '../baseCoin/iface';
import { TxJson } from './ifaces';
import Utils from './utils';
import { KeyPair } from './keyPair';
export class Transaction extends BaseTransaction {
  private _eosTransaction?: EosJs.RpcInterfaces.PushTransactionArgs;
  private _signedTransaction?: EosJs.RpcInterfaces.PushTransactionArgs;
  private _chainId: string;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    return true;
  }

  sign(keys: KeyPair[]): void {
    if (!this._eosTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    if (!this._signedTransaction) {
      this._signedTransaction = this._eosTransaction;
    }
    const txHex = Buffer.from(this._signedTransaction.serializedTransaction);
    keys.forEach((key) => {
      const signature = ecc.Signature.sign(txHex, key.getKeys().prv).toString();
      this._signedTransaction?.signatures.push(signature);
    });
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

  setChainId(id: string): this {
    this._chainId = id;
    return this;
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

  /** @inheritdoc */
  async toJson(): Promise<TxJson> {
    if (!this._eosTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    const deserializedTransaction = await Utils.deserializeTransactionWithActions(
      this._eosTransaction.serializedTransaction,
      this._chainId,
    );
    const actions = deserializedTransaction.actions;
    const result: TxJson = {
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
