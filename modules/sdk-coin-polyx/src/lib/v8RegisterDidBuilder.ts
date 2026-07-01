import { Interface, utils } from '@bitgo/abstract-substrate';
import { PolyxBaseBuilder } from './baseBuilder';
import { DecodedSignedTx, DecodedSigningPayload, defineMethod, UnsignedTransaction } from '@substrate/txwrapper-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType, BaseAddress, InvalidTransactionError } from '@bitgo/sdk-core';
import { RegisterDidArgs, TxMethod, MethodNames } from './iface';
import { RegisterDidTransactionSchema } from './txnSchema';
import { Transaction } from './transaction';
import polyxUtils from './utils';

/**
 * Builds a Polymesh identity.registerDid transaction (0x0718) — the v8 DID Registrar path.
 * BitGo acts as a DID Registrar and signs with the platform key, same operational model as
 * the v7 identity.cddRegisterDidWithCdd path (RegisterDidWithCDDBuilder): same signer, same
 * HSM flow, only the extrinsic name/call index and initialized metadata differ.
 *
 * Unlike the v7 CDD path, registerDid takes only `targetAccount` — verified against the real
 * testnetV8Material metadata (its call fields are `[target_account]` only). The migration plan's
 * dry-run note claiming an identical {targetAccount, secondaryKeys, expiry} shape does not hold.
 *
 * Pre-condition (open question, see migration plan §6.2): BitGo's platform key must be
 * permissioned on-chain as a DID Registrar before identity.registerDid is accepted.
 */
export class V8RegisterDidBuilder extends PolyxBaseBuilder<TxMethod, Transaction> {
  protected _to: string;
  protected _method: TxMethod;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
    this.material(polyxUtils.getV8Material(_coinConfig.network.type));
  }

  protected get transactionType(): TransactionType {
    return TransactionType.WalletInitialization;
  }

  protected buildTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
    return this.registerDid(
      {
        targetAccount: this._to,
      },
      baseTxInfo
    );
  }

  /**
   *
   * The destination address for transfer transaction.
   *
   * @param {string} dest
   * @returns {V8RegisterDidBuilder} This register-did builder.
   */
  to({ address }: BaseAddress): this {
    this.validateAddress({ address });
    this._to = address;
    return this;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if (this._method?.name === MethodNames.RegisterDid) {
      const txMethod = this._method.args as RegisterDidArgs;
      this.to({ address: utils.decodeSubstrateAddress(txMethod.targetAccount, this.getAddressFormat()) });
    } else {
      throw new InvalidTransactionError(`Invalid Transaction Type: ${this._method?.name}. Expected RegisterDid`);
    }
    return tx;
  }

  /** @inheritdoc */
  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx, rawTransaction?: string): void {
    if (decodedTxn.method?.name === MethodNames.RegisterDid) {
      const txMethod = decodedTxn.method.args as RegisterDidArgs;
      const validationResult = RegisterDidTransactionSchema.validate({ targetAccount: txMethod.targetAccount });
      if (validationResult.error) {
        throw new InvalidTransactionError(`Invalid transaction: ${validationResult.error.message}`);
      }
    }
  }

  /**
   * Construct a transaction to register a DID via the v8 DID Registrar path
   *
   * @param {RegisterDidArgs} args Arguments to be passed to the registerDid method
   * @param {Interface.CreateBaseTxInfo} info Base txn info required to construct the DID registration txn
   * @returns {UnsignedTransaction} an unsigned transaction for DID registration
   */
  private registerDid(args: RegisterDidArgs, info: Interface.CreateBaseTxInfo): UnsignedTransaction {
    return defineMethod(
      {
        method: {
          args,
          name: 'registerDid',
          pallet: 'identity',
        },
        ...info.baseTxInfo,
      },
      info.options
    );
  }
}
