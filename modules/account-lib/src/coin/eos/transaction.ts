import * as EosJs from 'eosjs';
import * as ecc from 'eosjs-ecc';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransaction } from '../baseCoin';
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

  /**
   * Signs transaction.
   *
   * @param {KeyPair} keys Signer keys.
   */
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
      this._signatures.push(signature);
      this._signedTransaction?.signatures.push(signature);
    });
  }

  async loadInputsAndOutputs(): Promise<void> {
    const txJson = await this.toJson();
    const actions = txJson.actions;
    actions.forEach((action) => {
      switch (action.name) {
        case 'transfer': {
          const to = action.data.to;
          const from = action.data.from;
          const amount = action.data.quantity;

          if (!to || !from || !amount) {
            throw new InvalidTransactionError('Missing required fields');
          }

          this._outputs.push({
            address: to,
            value: amount,
            coin: this._coinConfig.name,
          });

          this._inputs.push({
            address: from,
            value: amount,
            coin: this._coinConfig.name,
          });
          break;
        }
        case 'delegatebw': {
          const to = action.data.receiver;
          const from = action.data.from;

          if (!to || !from) {
            throw new InvalidTransactionError('Missing required fields');
          }

          this._outputs.push({
            address: to,
            value: '0',
            coin: this._coinConfig.name,
          });

          this._inputs.push({
            address: from,
            value: '0',
            coin: this._coinConfig.name,
          });
          break;
        }
        case 'undelegatebw': {
          const to = action.data.receiver;
          const from = action.data.from;

          if (!to || !from) {
            throw new InvalidTransactionError('Missing required fields');
          }

          this._outputs.push({
            address: to,
            value: '0',
            coin: this._coinConfig.name,
          });

          this._inputs.push({
            address: from,
            value: '0',
            coin: this._coinConfig.name,
          });
          break;
        }
        case 'buyrambytes': {
          const to = action.data.receiver;
          const from = action.data.payer;

          if (!to || !from) {
            throw new InvalidTransactionError('Missing required fields');
          }

          this._outputs.push({
            address: to,
            value: '0',
            coin: this._coinConfig.name,
          });

          this._inputs.push({
            address: from,
            value: '0',
            coin: this._coinConfig.name,
          });
          break;
        }
        case 'newaccount': {
          const from = action.data.creator;

          if (!from) {
            throw new InvalidTransactionError('Missing required fields');
          }

          this._outputs.push({
            address: from,
            value: '0',
            coin: this._coinConfig.name,
          });

          this._inputs.push({
            address: from,
            value: '0',
            coin: this._coinConfig.name,
          });
          break;
        }
        case 'updateauth':
        case 'deleteauth':
        case 'linkauth':
        case 'unlinkauth': {
          const from = action.data.account;

          if (!from) {
            throw new InvalidTransactionError('Missing required fields');
          }

          this._outputs.push({
            address: from,
            value: '0',
            coin: this._coinConfig.name,
          });

          this._inputs.push({
            address: from,
            value: '0',
            coin: this._coinConfig.name,
          });
          break;
        }
        case 'voteproducer': {
          const from = action.data.voter;

          if (!from) {
            throw new InvalidTransactionError('Missing required fields');
          }

          this._outputs.push({
            address: from,
            value: '0',
            coin: this._coinConfig.name,
          });

          this._inputs.push({
            address: from,
            value: '0',
            coin: this._coinConfig.name,
          });
          break;
        }
        case 'powerup': {
          const to = action.data.receiver;
          const from = action.data.payer;

          if (!to || !from) {
            throw new InvalidTransactionError('Missing required fields');
          }

          this._outputs.push({
            address: to,
            value: '0',
            coin: this._coinConfig.name,
          });

          this._inputs.push({
            address: from,
            value: '0',
            coin: this._coinConfig.name,
          });
          break;
        }
      }
    });
  }

  verifySignature(publicKeys: string[]): boolean {
    const serializedTransaction = this._signedTransaction?.serializedTransaction;
    if (this._signedTransaction && serializedTransaction) {
      this._signedTransaction.signatures.forEach((signature, index) => {
        ecc.verify(signature, Buffer.from(serializedTransaction), publicKeys[index]);
        return false;
      });
      return true;
    } else {
      throw new InvalidTransactionError('Transaction has not been signed');
    }
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
   * Sets the EOS chain id
   *
   * @param {string} id
   * @returns {this} the transaction
   */
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
      expiration: deserializedTransaction.expiration,
      ref_block_num: deserializedTransaction.ref_block_num,
      ref_block_prefix: deserializedTransaction.ref_block_prefix,
      max_net_usage_words: deserializedTransaction.max_net_usage_words,
      max_cpu_usage_ms: deserializedTransaction.max_cpu_usage_ms,
      delay_sec: deserializedTransaction.delay_sec,
      actions: [],
    };
    actions.forEach((action) => {
      switch (action.name) {
        case 'transfer':
          result.actions.push({
            name: action.name,
            data: {
              from: action.data.from,
              to: action.data.to,
              quantity: action.data.quantity,
              memo: action.data.memo,
            },
          });
          break;
        case 'delegatebw':
          result.actions.push({
            name: action.name,
            data: {
              from: action.data.from,
              receiver: action.data.receiver,
              stake_net_quantity: action.data.stake_net_quantity,
              stake_cpu_quantity: action.data.stake_cpu_quantity,
              transfer: action.data.transfer,
            },
          });
          break;
        case 'undelegatebw':
          result.actions.push({
            name: action.name,
            data: {
              from: action.data.from,
              receiver: action.data.receiver,
              unstake_net_quantity: action.data.unstake_net_quantity,
              unstake_cpu_quantity: action.data.unstake_cpu_quantity,
              transfer: action.data.transfer,
            },
          });
          break;
        case 'buyrambytes':
          result.actions.push({
            name: action.name,
            data: {
              payer: action.data.payer,
              receiver: action.data.receiver,
              bytes: action.data.bytes,
            },
          });
          break;
        case 'newaccount':
          result.actions.push({
            name: action.name,
            data: {
              creator: action.data.creator,
              name: action.data.name,
              owner: action.data.owner,
              active: action.data.active,
            },
          });
          break;
        case 'updateauth':
          result.actions.push({
            name: action.name,
            data: {
              account: action.data.account,
              permission: action.data.permission,
              parent: action.data.parent,
              auth: action.data.auth,
            },
          });
          break;
        case 'deleteauth':
          result.actions.push({
            name: action.name,
            data: {
              account: action.data.account,
              permission: action.data.permission,
            },
          });
          break;
        case 'linkauth':
          result.actions.push({
            name: action.name,
            data: {
              account: action.data.account,
              code: action.data.code,
              type: action.data.type,
              requirement: action.data.requirement,
            },
          });
          break;
        case 'unlinkauth':
          result.actions.push({
            name: action.name,
            data: {
              account: action.data.account,
              code: action.data.code,
              type: action.data.type,
            },
          });
          break;
        case 'voteproducer':
          result.actions.push({
            name: action.name,
            data: {
              voter: action.data.voter,
              proxy: action.data.proxy,
              producers: action.data.producers,
            },
          });
          break;
        case 'powerup':
          result.actions.push({
            name: action.name,
            data: {
              payer: action.data.payer,
              receiver: action.data.receiver,
              days: action.data.days,
              net_frac: action.data.net_frac,
              cpu_frac: action.data.cpu_frac,
              max_payment: action.data.max_payment,
            },
          });
          break;
      }
    });
    return result;
  }
}
