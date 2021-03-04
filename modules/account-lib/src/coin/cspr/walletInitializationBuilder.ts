import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { CLTypedAndToBytesHelper, CLValue, PublicKey, RuntimeArgs } from 'casper-client-sdk';
import { BuildTransactionError, InvalidTransactionError } from '../baseCoin/errors';
import { TransactionType } from '../baseCoin';
import { TransactionBuilder, DEFAULT_M, DEFAULT_N } from './transactionBuilder';
import { Transaction } from './transaction';
import { Owner, ContractArgs } from './ifaces';
import { walletInitContractHexCode } from './utils';
import { OWNER_PREFIX, SECP256K1_PREFIX, TRANSACTION_TYPE } from './constants';

const DEFAULT_OWNER_WEIGHT = 1;
export class WalletInitializationBuilder extends TransactionBuilder {
  private _owners: Owner[] = [];
  private _contract: Uint8Array;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._contract = Uint8Array.from(Buffer.from(walletInitContractHexCode, 'hex'));
  }

  // region Base Builder
  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const args = this.buildWalletParameters();
    const extraArguments = new Map<string, CLValue>();

    extraArguments.set(TRANSACTION_TYPE, CLValue.string(TransactionType[TransactionType.WalletInitialization]));
    for (let index = 0; index < this._owners.length; index++) {
      extraArguments.set(
        OWNER_PREFIX + index,
        CLValue.string(Buffer.from(this._owners[index].address.rawPublicKey).toString('hex')),
      );
    }

    this._session = { moduleBytes: this._contract, args: RuntimeArgs.fromMap(args), extraArguments: extraArguments };
    this.transaction.setTransactionType(TransactionType.WalletInitialization);
    return await super.buildImplementation();
  }

  /**
   * Build args needed to create a session, then we can send this session with the contract
   * @returns {ContractArgs} contracts args to create a session
   */
  private buildWalletParameters(): ContractArgs {
    const accounts = this._owners.map(owner => CLTypedAndToBytesHelper.bytes(owner.address.toAccountHash()));
    const weights = this._owners.map(owner => CLTypedAndToBytesHelper.u8(owner.weight));

    // set source address weight to zero to disable the master private key from signing.
    accounts.push(
      CLTypedAndToBytesHelper.bytes(PublicKey.fromHex(SECP256K1_PREFIX + this._source.address).toAccountHash()),
    );
    weights.push(CLTypedAndToBytesHelper.u8(0));

    return {
      action: CLValue.string('set_all'),
      // This typo is on purpose since the contract we use for multisig wallet initialization expect this argument to be written like this.
      deployment_thereshold: CLValue.u8(DEFAULT_N),
      key_management_threshold: CLValue.u8(DEFAULT_M),
      accounts: CLValue.list(accounts),
      weights: CLValue.list(weights),
    };
  }

  /** @inheritdoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    this.transaction.setTransactionType(TransactionType.WalletInitialization);
    for (let ownerIndex = 0; ownerIndex < DEFAULT_M; ownerIndex++) {
      const ownerCLValue = tx.casperTx.session.getArgByName(OWNER_PREFIX + ownerIndex) as CLValue;
      this.owner(ownerCLValue.asString());
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
    this.validateAddress({ address: address });
    for (const _owner of this._owners) {
      if (
        Buffer.from(_owner.address.rawPublicKey)
          .toString('hex')
          .toUpperCase() === address.toUpperCase()
      ) {
        throw new BuildTransactionError('Duplicated owner: ' + address);
      }
    }

    this._owners.push({ address: PublicKey.fromHex(SECP256K1_PREFIX + address), weight: DEFAULT_OWNER_WEIGHT });
    return this;
  }
  // endregion

  // region Validators
  validateMandatoryFields(): void {
    if (this._owners.length === 0) {
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
