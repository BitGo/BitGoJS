import fs from 'fs';
import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { CLValue, PublicKey } from 'casper-client-sdk';
import { BuildTransactionError, InvalidKey } from '../baseCoin/errors';
import { TransactionType } from '../baseCoin';
import { TransactionBuilder, DEFAULT_M, DEFAULT_N } from './transactionBuilder';
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
    const args: RunTimeArg[] = [];
    const thresholdMaxArgs = {
      action: CLValue.string('set_key_management_threshold'),
      weight: CLValue.u8(DEFAULT_M),
    };
    args.push(thresholdMaxArgs);
    const thresholdMinArgs = {
      action: CLValue.string('set_deployment_threshold'),
      weight: CLValue.u8(DEFAULT_N),
    };
    args.push(thresholdMinArgs);

    for (const _owner of this._owners) {
      const ac = CLValue.fromBytes(getAccountHash({ pub: Buffer.from(_owner.address.rawPublicKey).toString('hex') }));
      if (ac.hasError()) {
        throw new InvalidKey('Failed to obtain public key');
      }
      args.push({
        action: CLValue.string('set_key_weight'),
        weight: CLValue.u8(OWNER_WEIGHT),
        account: ac.value,
      });
    }

    // this._session = { moduleBytes: this._contract, args: RuntimeArgs.fromMap(args).toBytes() };
    this.transaction.setTransactionType(TransactionType.WalletInitialization);
    return await super.buildImplementation();
  }

  /** @inheritdoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    this.transaction.setTransactionType(TransactionType.WalletInitialization);
    if (tx.casperTx.approvals) {
      const signers = tx.casperTx.approvals.map(ap => ap.signer);
      for (const signer of signers) {
        this.owner(signer);
      }
    }
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
      if (Buffer.from(_owner.address.rawPublicKey).toString('hex') === address) {
        throw new BuildTransactionError('Repeated owner address: ' + address);
      }
    }

    this._owners.push({ address: PublicKey.fromHex(address), weight: OWNER_WEIGHT });
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
