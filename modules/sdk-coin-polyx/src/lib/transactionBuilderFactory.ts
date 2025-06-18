import { BaseTransactionBuilderFactory, NotImplementedError } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { decode } from '@substrate/txwrapper-polkadot';
import { TransferBuilder } from './transferBuilder';
import { RegisterDidWithCDDBuilder } from './registerDidWithCDDBuilder';
import { BondExtraBuilder } from './bondExtraBuilder';
import { BatchStakingBuilder } from './batchStakingBuilder';
import { BatchUnstakingBuilder } from './batchUnstakingBuilder';
import { WithdrawUnbondedBuilder } from './withdrawUnbondedBuilder';
import utils from './utils';
import { Interface, SingletonRegistry, TransactionBuilder } from './';
import { TxMethod, BatchCallObject } from './iface';
import { Transaction as BaseTransaction } from '@bitgo/abstract-substrate';
import { Transaction as PolyxTransaction } from './transaction';

export type SupportedTransaction = BaseTransaction | PolyxTransaction;

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  protected _material: Interface.Material;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._material = utils.getMaterial(_coinConfig.network.type);
  }

  getTransferBuilder(): TransferBuilder {
    return new TransferBuilder(this._coinConfig).material(this._material);
  }

  getRegisterDidWithCDDBuilder(): RegisterDidWithCDDBuilder {
    return new RegisterDidWithCDDBuilder(this._coinConfig).material(this._material);
  }

  getBondExtraBuilder(): BondExtraBuilder {
    return new BondExtraBuilder(this._coinConfig).material(this._material);
  }

  getBatchBuilder(): BatchStakingBuilder {
    return new BatchStakingBuilder(this._coinConfig).material(this._material);
  }

  getBatchUnstakingBuilder(): BatchUnstakingBuilder {
    return new BatchUnstakingBuilder(this._coinConfig).material(this._material);
  }

  getWithdrawUnbondedBuilder(): WithdrawUnbondedBuilder {
    return new WithdrawUnbondedBuilder(this._coinConfig).material(this._material);
  }

  getWalletInitializationBuilder(): void {
    throw new NotImplementedError(`walletInitialization for ${this._coinConfig.name} not implemented`);
  }

  from(rawTxn: string): TransactionBuilder<TxMethod, SupportedTransaction> {
    const builder = this.getBuilder(rawTxn);
    builder.from(rawTxn);
    return builder;
  }

  material(material: Interface.Material): this {
    this._material = material;
    return this;
  }

  private getBuilder(rawTxn: string): TransactionBuilder<TxMethod, SupportedTransaction> {
    const registry = SingletonRegistry.getInstance(this._material);
    const decodedTxn = decode(rawTxn, {
      metadataRpc: this._material.metadata,
      registry: registry,
    });

    const methodName = decodedTxn.method?.name;
    if (methodName === Interface.MethodNames.TransferWithMemo) {
      return this.getTransferBuilder();
    } else if (methodName === Interface.MethodNames.RegisterDidWithCDD) {
      return this.getRegisterDidWithCDDBuilder();
    } else if (methodName === 'bondExtra') {
      return this.getBondExtraBuilder();
    } else if (methodName === 'batchAll') {
      const args = decodedTxn.method.args as { calls?: BatchCallObject[] };

      if (args.calls && args.calls.length === 2) {
        // Decode method names from the calls using utils.decodeMethodName
        const firstCallMethod = utils.decodeMethodName(args.calls[0], registry);
        const secondCallMethod = utils.decodeMethodName(args.calls[1], registry);

        // Check for batch staking pattern: bond + nominate
        if (firstCallMethod === 'bond' && secondCallMethod === 'nominate') {
          return this.getBatchBuilder();
        }
        // Check for batch unstaking pattern: chill + unbond
        if (firstCallMethod === 'chill' && secondCallMethod === 'unbond') {
          return this.getBatchUnstakingBuilder();
        }
      }
      // Fall back to general batch builder for other batchAll cases
      return this.getBatchBuilder();
    } else if (methodName === 'batch') {
      return this.getBatchBuilder();
    } else if (methodName === 'bond') {
      return this.getBatchBuilder();
    } else if (methodName === 'nominate') {
      return this.getBatchBuilder();
    } else if (methodName === 'withdrawUnbonded') {
      return this.getWithdrawUnbondedBuilder();
    }

    throw new Error('Transaction cannot be parsed or has an unsupported transaction type');
  }
}
