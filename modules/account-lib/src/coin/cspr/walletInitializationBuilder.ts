import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { CLValue, CLPublicKey as PublicKey, RuntimeArgs, CLValueBuilder, CLString } from 'casper-js-sdk';
import { BuildTransactionError } from '../baseCoin/errors';
import { TransactionType } from '../baseCoin';
import { TransactionBuilder, DEFAULT_M, DEFAULT_N } from './transactionBuilder';
import { Transaction } from './transaction';
import { Owner, WalletInitContractArgs } from './ifaces';
import { casperContractHexCode } from './utils';
import { OWNER_PREFIX, TRANSACTION_TYPE, WALLET_INITIALIZATION_CONTRACT_ACTION } from './constants';
import { KeyPair } from './keyPair';

const DEFAULT_OWNER_WEIGHT = 1;
export class WalletInitializationBuilder extends TransactionBuilder {
  private _owners: Owner[] = [];
  private _contract: Uint8Array;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._contract = Uint8Array.from(Buffer.from(casperContractHexCode, 'hex'));
  }

  // region Base Builder
  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const args = this.buildWalletParameters();
    const extraArguments = new Map<string, CLValue>();

    extraArguments.set(TRANSACTION_TYPE, CLValueBuilder.string(TransactionType[TransactionType.WalletInitialization]));
    for (let index = 0; index < this._owners.length; index++) {
      const ownerPublicKey = Buffer.from(this._owners[index].address.value()).toString('hex');
      const ownerAddress = new KeyPair({ pub: ownerPublicKey }).getAddress();
      extraArguments.set(OWNER_PREFIX + index, CLValueBuilder.string(ownerAddress));
    }

    this._session = { moduleBytes: this._contract, args: RuntimeArgs.fromMap(args), extraArguments: extraArguments };
    this.transaction.setTransactionType(TransactionType.WalletInitialization);
    return await super.buildImplementation();
  }

  /**
   * Build args needed to create a session, then we can send this session with the contract
   *
   * @returns {WalletInitContractArgs} contracts args to create a session
   */
  private buildWalletParameters(): WalletInitContractArgs {
    const accounts = this._owners.map((owner) => CLValueBuilder.byteArray(owner.address.toAccountHash()));
    const weights = this._owners.map((owner) => CLValueBuilder.u8(owner.weight));

    // set source address weight to zero to disable the master private key from signing.
    accounts.push(CLValueBuilder.byteArray(PublicKey.fromHex(this._source.address).toAccountHash()));
    weights.push(CLValueBuilder.u8(0));

    return {
      action: CLValueBuilder.string(WALLET_INITIALIZATION_CONTRACT_ACTION),
      // This typo is on purpose since the contract we use for multisig wallet initialization expect this argument to be written like this.
      deployment_thereshold: CLValueBuilder.u8(DEFAULT_N),
      key_management_threshold: CLValueBuilder.u8(DEFAULT_M),
      accounts: CLValueBuilder.list(accounts),
      weights: CLValueBuilder.list(weights),
    };
  }

  /** @inheritdoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    this.transaction.setTransactionType(TransactionType.WalletInitialization);
    for (let ownerIndex = 0; ownerIndex < DEFAULT_M; ownerIndex++) {
      const ownerCLValue = tx.casperTx.session.getArgByName(OWNER_PREFIX + ownerIndex) as CLString;
      this.owner(ownerCLValue.value());
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
      if (address.substr(0, 2) + Buffer.from(_owner.address.value()).toString('hex') === address) {
        throw new BuildTransactionError('Duplicated owner: ' + address);
      }
    }

    this._owners.push({ address: PublicKey.fromHex(address), weight: DEFAULT_OWNER_WEIGHT });
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
