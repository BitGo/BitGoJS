import { BaseTransactionBuilderFactory, NotImplementedError } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { decode } from '@substrate/txwrapper-polkadot';
import { TransferBuilder } from './transferBuilder';
import { HexTransferBuilder } from './hexTransferBuilder';
import { RegisterDidWithCDDBuilder } from './registerDidWithCDDBuilder';
import { BondExtraBuilder } from './bondExtraBuilder';
import { BatchStakingBuilder } from './batchStakingBuilder';
import { BatchUnstakingBuilder } from './batchUnstakingBuilder';
import { UnbondBuilder } from './unbondBuilder';
import { WithdrawUnbondedBuilder } from './withdrawUnbondedBuilder';
import utils from './utils';
import { Interface, SingletonRegistry, TransactionBuilder } from './';
import { TxMethod, BatchCallObject, MethodNames, AddAndAffirmWithMediatorsArgs } from './iface';
import { Transaction as BaseTransaction } from '@bitgo/abstract-substrate';
import { Transaction as PolyxTransaction } from './transaction';
import { PreApproveAssetBuilder } from './preApproveAssetBuilder';
import { TokenTransferBuilder } from './tokenTransferBuilder';
import { HexTokenTransferBuilder } from './hexTokenTransferBuilder';
import { RejectInstructionBuilder } from './rejectInstructionBuilder';
import { NominateBuilder } from './nominateBuilder';
import { V8TransferBuilder } from './v8TransferBuilder';
import { V8HexTransferBuilder } from './v8HexTransferBuilder';
import { V8RegisterDidWithCDDBuilder } from './v8RegisterDidWithCDDBuilder';
import { V8RegisterDidBuilder } from './v8RegisterDidBuilder';
import { V8TokenTransferBuilder } from './v8TokenTransferBuilder';
import { V8HexTokenTransferBuilder } from './v8HexTokenTransferBuilder';
import { V8PreApproveAssetBuilder } from './v8PreApproveAssetBuilder';
import { V8BatchStakingBuilder } from './v8BatchStakingBuilder';
import { V8BondExtraBuilder } from './v8BondExtraBuilder';
import { V8UnbondBuilder } from './v8UnbondBuilder';
import { V8BatchUnstakingBuilder } from './v8BatchUnstakingBuilder';
import { V8WithdrawUnbondedBuilder } from './v8WithdrawUnbondedBuilder';
import { V8NominateBuilder } from './v8NominateBuilder';

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

  getHexTransferBuilder(): HexTransferBuilder {
    return new HexTransferBuilder(this._coinConfig).material(this._material);
  }

  getRegisterDidWithCDDBuilder(): RegisterDidWithCDDBuilder {
    return new RegisterDidWithCDDBuilder(this._coinConfig).material(this._material);
  }

  getPreApproveAssetBuilder(): PreApproveAssetBuilder {
    return new PreApproveAssetBuilder(this._coinConfig).material(this._material);
  }

  getTokenTransferBuilder(): TokenTransferBuilder {
    return new TokenTransferBuilder(this._coinConfig).material(this._material);
  }

  getHexTokenTransferBuilder(): HexTokenTransferBuilder {
    return new HexTokenTransferBuilder(this._coinConfig).material(this._material);
  }

  getRejectInstructionBuilder(): RejectInstructionBuilder {
    return new RejectInstructionBuilder(this._coinConfig).material(this._material);
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

  getUnbondBuilder(): UnbondBuilder {
    return new UnbondBuilder(this._coinConfig).material(this._material);
  }

  getWithdrawUnbondedBuilder(): WithdrawUnbondedBuilder {
    return new WithdrawUnbondedBuilder(this._coinConfig).material(this._material);
  }

  getNominateBuilder(): NominateBuilder {
    return new NominateBuilder(this._coinConfig).material(this._material);
  }

  getV8TransferBuilder(): V8TransferBuilder {
    return new V8TransferBuilder(this._coinConfig);
  }

  getV8HexTransferBuilder(): V8HexTransferBuilder {
    return new V8HexTransferBuilder(this._coinConfig);
  }

  getV8RegisterDidWithCDDBuilder(): V8RegisterDidWithCDDBuilder {
    return new V8RegisterDidWithCDDBuilder(this._coinConfig);
  }

  getV8RegisterDidBuilder(): V8RegisterDidBuilder {
    return new V8RegisterDidBuilder(this._coinConfig);
  }

  getV8TokenTransferBuilder(): V8TokenTransferBuilder {
    return new V8TokenTransferBuilder(this._coinConfig);
  }

  getV8HexTokenTransferBuilder(): V8HexTokenTransferBuilder {
    return new V8HexTokenTransferBuilder(this._coinConfig);
  }

  getV8PreApproveAssetBuilder(): V8PreApproveAssetBuilder {
    return new V8PreApproveAssetBuilder(this._coinConfig);
  }

  getV8BatchStakingBuilder(): V8BatchStakingBuilder {
    return new V8BatchStakingBuilder(this._coinConfig);
  }

  getV8BondExtraBuilder(): V8BondExtraBuilder {
    return new V8BondExtraBuilder(this._coinConfig);
  }

  getV8UnbondBuilder(): V8UnbondBuilder {
    return new V8UnbondBuilder(this._coinConfig);
  }

  getV8BatchUnstakingBuilder(): V8BatchUnstakingBuilder {
    return new V8BatchUnstakingBuilder(this._coinConfig);
  }

  getV8WithdrawUnbondedBuilder(): V8WithdrawUnbondedBuilder {
    return new V8WithdrawUnbondedBuilder(this._coinConfig);
  }

  getV8NominateBuilder(): V8NominateBuilder {
    return new V8NominateBuilder(this._coinConfig);
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
    let decodedTxn;
    try {
      decodedTxn = decode(rawTxn, {
        metadataRpc: this._material.metadata,
        registry: registry,
      });
    } catch (err) {
      // v8-encoded transactions use different chain metadata and signed extensions, so they
      // cannot be decoded with v7 material. Retry against v8 material and route to the matching
      // v8 staking builder (e.g. batchAll([bond, nominate]) with the 2-arg v8 bond → no
      // controller). Falls back to re-throwing the original v7 decode error if the transaction is
      // not a recognized v8 staking transaction.
      const v8Builder = this.tryGetV8Builder(rawTxn);
      if (v8Builder) {
        return v8Builder;
      }
      throw err;
    }

    const methodName = decodedTxn.method?.name;
    if (methodName === Interface.MethodNames.TransferWithMemo) {
      const args = decodedTxn.method.args as Interface.TransferWithMemoArgs;
      if (utils.isNewMemoEncoding(args.memo)) {
        return this.getHexTransferBuilder();
      }
      return this.getTransferBuilder();
    } else if (methodName === MethodNames.RegisterDidWithCDD) {
      return this.getRegisterDidWithCDDBuilder();
    } else if (methodName === MethodNames.PreApproveAsset) {
      return this.getPreApproveAssetBuilder();
    } else if (methodName === MethodNames.AddAndAffirmWithMediators) {
      const args = decodedTxn.method.args as AddAndAffirmWithMediatorsArgs;
      if (utils.isNewMemoEncoding(args.instructionMemo)) {
        return this.getHexTokenTransferBuilder();
      }
      return this.getTokenTransferBuilder();
    } else if (methodName === MethodNames.RejectInstruction) {
      return this.getRejectInstructionBuilder();
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
      return this.getNominateBuilder();
    } else if (methodName === 'unbond') {
      return this.getUnbondBuilder();
    } else if (methodName === 'withdrawUnbonded') {
      return this.getWithdrawUnbondedBuilder();
    }

    throw new Error('Transaction cannot be parsed or has an unsupported transaction type');
  }

  /**
   * Attempt to decode a transaction against v8 chain metadata and return the matching v8 staking
   * builder. Returns undefined when the transaction cannot be decoded with v8 material or is not a
   * recognized v8 staking transaction, so the caller can surface the original v7 decode error.
   */
  private tryGetV8Builder(rawTxn: string): TransactionBuilder<TxMethod, SupportedTransaction> | undefined {
    const v8Material = utils.getV8Material(this._coinConfig.network.type);
    const registry = SingletonRegistry.getInstance(v8Material);
    let decodedTxn;
    try {
      decodedTxn = decode(rawTxn, {
        metadataRpc: v8Material.metadata,
        registry: registry,
      });
    } catch (e) {
      return undefined;
    }

    const methodName = decodedTxn.method?.name;
    if (methodName === 'batchAll') {
      const args = decodedTxn.method.args as { calls?: BatchCallObject[] };

      if (args.calls && args.calls.length === 2) {
        const firstCallMethod = utils.decodeMethodName(args.calls[0], registry);
        const secondCallMethod = utils.decodeMethodName(args.calls[1], registry);

        // v8 batch staking pattern: bond (2-arg, no controller) + nominate
        if (firstCallMethod === 'bond' && secondCallMethod === 'nominate') {
          return this.getV8BatchStakingBuilder();
        }
        // v8 batch unstaking pattern: chill + unbond
        if (firstCallMethod === 'chill' && secondCallMethod === 'unbond') {
          return this.getV8BatchUnstakingBuilder();
        }
      }
      return this.getV8BatchStakingBuilder();
    } else if (methodName === 'bondExtra') {
      return this.getV8BondExtraBuilder();
    } else if (methodName === 'nominate') {
      return this.getV8NominateBuilder();
    } else if (methodName === 'unbond') {
      return this.getV8UnbondBuilder();
    } else if (methodName === 'withdrawUnbonded') {
      return this.getV8WithdrawUnbondedBuilder();
    }

    return undefined;
  }
}
