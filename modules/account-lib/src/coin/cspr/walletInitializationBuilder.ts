import fs from 'fs';
import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { RuntimeArgs, DeployUtil, CLValue } from 'casper-client-sdk';
import { BuildTransactionError, NotImplementedError } from '../baseCoin/errors';
import { TransactionType } from '../baseCoin';
import { TransactionBuilder, DEFAULT_M } from './transactionBuilder';
import { Transaction } from './transaction';
import { Owner, RunTimeArg } from './ifaces';
import { getAccountHash, isValidPublicKey } from './utils';

const OWNER_WEIGHT = 1;
const wasmPath = '../../../resources/cspr/contract/keys-manager.wasm';
export class WalletInitializationBuilder extends TransactionBuilder {
  private _owners: Owner[] = [];
  private _contract: Uint8Array;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._contract = new Uint8Array(fs.readFileSync(wasmPath, null).buffer);
  }

  // region Base Builder
  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    // let args : Array<Object>;
    const args: RunTimeArg[] = [];
    const thresholdMaxArgs = {
      action: CLValue.fromString('set_key_management_threshold'),
      weight: CLValue.fromU8(DEFAULT_M),
    };
    args.push(thresholdMaxArgs);
    const thresholdMinArgs = {
      action: CLValue.fromString('set_deployment_threshold'),
      weight: CLValue.fromU8(DEFAULT_M),
    };
    args.push(thresholdMinArgs);

    for (const _owner of this._owners) {
      args.push({
        action: CLValue.fromString('set_key_weight'),
        weight: CLValue.fromU8(OWNER_WEIGHT),
        account: CLValue.fromBytes(getAccountHash({ pub: _owner.address })),
      });
    }

    this._session = { moduleBytes: this._contract, args: RuntimeArgs.fromMap(args).toBytes() };
    this.transaction.setTransactionType(TransactionType.WalletInitialization);
    return await super.buildImplementation();
  }

  /** @inheritdoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    this.transaction.setTransactionType(TransactionType.WalletInitialization);

    throw new NotImplementedError('initBuilder not implemented');
  }

  // endregion

  // region Common builder methods
  /**
   * Set one of the owners of the multisig wallet.
   *
   * @param {string} address The public key of the owner's account
   * @returns {WalletInitializationBuilder} This wallet initialization builder
   */
  owner(address: string): this {
    if (this._owners.length >= DEFAULT_M) {
      throw new BuildTransactionError('A maximum of ' + DEFAULT_M + ' owners can be set for a multisig wallet');
    }
    if (!isValidPublicKey(address)) {
      throw new BuildTransactionError('Invalid address: ' + address);
    }
    for (const _owner of this._owners) {
      if (_owner.address.includes(address)) {
        throw new BuildTransactionError('Repeated owner address: ' + address);
      }
    }

    this._owners.push({ address: address, weight: OWNER_WEIGHT });
    return this;
  }
  // endregion

  // region Validators
  validateMandatoryFields(): void {
    if (this._owners === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing wallet owners');
    }

    if (this._owners.length !== DEFAULT_M) {
      throw new BuildTransactionError(
        `Invalid transaction: wrong number of owners -- required: ${DEFAULT_M}, found: ${this._owners.length}`,
      );
    }
    super.validateMandatoryFields();
  }
  // endregion
}
