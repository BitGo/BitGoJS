import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { DeployUtil, CLPublicKey as PublicKey } from 'casper-js-sdk';
import _ from 'lodash';
import { BaseTransactionBuilder, TransactionType } from '../baseCoin';
import { BaseAddress, BaseKey } from '../baseCoin/iface';
import {
  BuildTransactionError,
  SigningError,
  InvalidTransactionError,
  ParseTransactionError,
} from '../baseCoin/errors';
import { Transaction } from './transaction';
import { KeyPair } from './keyPair';
import {
  Fee,
  CasperModuleBytesTransaction,
  CasperTransferTransaction,
  CasperDelegateTransaction,
  SignatureData,
} from './ifaces';
import { isValidAddress, removeAlgoPrefixFromHexValue } from './utils';
import { DEFAULT_CHAIN_NAMES, TRANSACTION_EXPIRATION } from './constants';

export const DEFAULT_M = 3;
export const DEFAULT_N = 2;
export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _source: BaseAddress;
  protected _fee: Fee;
  private _transaction: Transaction;
  protected _session: CasperTransferTransaction | CasperModuleBytesTransaction | CasperDelegateTransaction;
  protected _expiration: number;
  protected _multiSignerKeyPairs: KeyPair[];
  protected _signatures: SignatureData[];
  protected _chainName: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.transaction = new Transaction(_coinConfig);
    this._multiSignerKeyPairs = [];
    this._signatures = [];
    this._chainName = this.coinName() === 'cspr' ? DEFAULT_CHAIN_NAMES.mainnet : DEFAULT_CHAIN_NAMES.testnet;
  }

  // region Base Builder
  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const deployParams = this.getDeployParams();
    const session = this.getSession();

    const payment = DeployUtil.standardPayment(_.parseInt(this._fee.gasLimit));

    let cTransaction = this.transaction.casperTx || DeployUtil.makeDeploy(deployParams, session, payment);

    // Cannot add arguments to an already signed deploy.
    if (cTransaction.approvals.length === 0) {
      this._session.extraArguments.forEach((extraArgument, extraArgumentName) => {
        if (!cTransaction.session.getArgByName(extraArgumentName)) {
          cTransaction = DeployUtil.addArgToDeploy(cTransaction, extraArgumentName, extraArgument);
        }
      });
    }

    this.transaction.casperTx = cTransaction;

    this.processSigning();

    return this.transaction;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = new Transaction(this._coinConfig);
    const jsonTransaction = JSON.parse(rawTransaction);
    tx.casperTx = DeployUtil.deployFromJson(jsonTransaction).unwrap();
    this.initBuilder(tx);
    return this.transaction;
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    this.checkDuplicatedKeys(key);
    const signer = new KeyPair({ prv: key.key });

    // Signing the transaction is an operation that relies on all the data being set,
    // so we set the source here and leave the actual signing for the build step
    this._multiSignerKeyPairs.push(signer);
    return this.transaction;
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction): void {
    this.transaction = tx;
    this.transaction.loadPreviousSignatures();
    const txData = tx.toJson();
    this.fee(txData.fee);
    this.source({ address: txData.from });
    this.expiration(txData.expiration || TRANSACTION_EXPIRATION);
  }

  // endregion

  // region Common builder methods

  /**
   * Set the transaction fees
   *
   * @param {BaseFee} fee The maximum gas to pay
   * @returns {TransactionBuilder} This transaction builder
   */
  fee(fee: Fee): this {
    this.validateValue(new BigNumber(fee.gasLimit));
    this._fee = fee;
    return this;
  }

  /**
   * Set the transaction source
   *
   * @param {BaseAddress} address The source account
   * @returns {TransactionBuilder} This transaction builder
   */
  source(address: BaseAddress): this {
    this.validateAddress(address);
    this._source = address;
    return this;
  }

  /**
   * Set the transaction expirationTime
   *
   * @param {string} expirationTime The transaction expirationTime
   * @returns {TransactionBuilder} This transaction builder
   */
  expiration(expirationTime: number): this {
    const transactionExpiration = new BigNumber(expirationTime);
    if (transactionExpiration.isNaN() || transactionExpiration.isGreaterThan(TRANSACTION_EXPIRATION)) {
      throw new BuildTransactionError('Invalid transaction expiration');
    }
    this.validateValue(transactionExpiration);
    this._expiration = transactionExpiration.toNumber();
    return this;
  }

  /**
   * Set an external transaction signature
   *
   * @param {string} signature Hex encoded signature string
   * @param {KeyPair} keyPair The public key keypair that was used to create the signature
   * @returns {TransactionBuilder} This transaction builder
   */
  signature(signature: string, keyPair: KeyPair): this {
    // if we already have a signature for this key pair, just update it
    for (const oldSignature of this._signatures) {
      if (oldSignature.keyPair.getKeys().pub === keyPair.getKeys().pub) {
        oldSignature.signature = signature;
        return this;
      }
    }

    // otherwise add the new signature
    this._signatures.push({ signature, keyPair });
    return this;
  }

  nodeChainName(chainName: string): this {
    this._chainName = chainName;
    return this;
  }

  // endregion

  // region Validators
  /** @inheritdoc */
  validateAddress(address: BaseAddress): void {
    if (!isValidAddress(address.address)) {
      throw new BuildTransactionError('Invalid address ' + address.address);
    }
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    if (!new KeyPair({ prv: key.key })) {
      throw new BuildTransactionError('Invalid key');
    }
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: string): void {
    if (!rawTransaction) {
      throw new InvalidTransactionError('Raw transaction is empty');
    }
    try {
      DeployUtil.deployFromJson(JSON.parse(rawTransaction));
    } catch (e) {
      throw new ParseTransactionError('There was an error parsing the JSON string');
    }
  }

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    this.validateMandatoryFields();
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }

  /**
   * Validates that the mandatory fields are defined
   */
  validateMandatoryFields(): void {
    this.validateFee();
    this.validateSource();
  }

  /**
   * Validates that the fee field is defined
   */
  private validateFee(): void {
    if (this._fee === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing fee');
    }
    if (!this._fee.gasLimit) {
      throw new BuildTransactionError('Invalid transaction: missing gas limit');
    }
    try {
      this.validateValue(new BigNumber(this._fee.gasLimit));
    } catch (e) {
      throw new BuildTransactionError('Invalid gas limit');
    }
  }

  /**
   * Validates that the source field is defined
   */
  private validateSource(): void {
    if (this._source === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing source');
    }
    this.validateAddress(this._source);
  }

  /**
   * Validates that the given key is not already in this._multiSignerKeyPairs
   *
   * @param {BaseKey} key - The key to check
   */
  private checkDuplicatedKeys(key: BaseKey) {
    this._multiSignerKeyPairs.forEach((_sourceKeyPair) => {
      if (_sourceKeyPair.getKeys().prv === key.key) {
        throw new SigningError('Repeated sign: ' + key.key);
      }
      // Try to get extended keys in order to validate them
      let xprv;
      try {
        xprv = _sourceKeyPair.getExtendedKeys().xprv;
      } catch (err) {
        return;
      }
      if (xprv && xprv === key.key) {
        throw new SigningError('Repeated sign: ' + key.key);
      }
    });
  }

  // endregion

  // region Getters and Setters
  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  /** @inheritdoc */
  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }

  /**
   * Get the chain name for the coin environment
   */
  public get chainName(): string {
    return this._chainName;
  }
  // endregion

  // region auxiliaryMethods
  /**
   * Generate a DeployParams instance with the transaction data
   *
   * @returns {DeployUtil.DeployParams}
   */
  private getDeployParams(): DeployUtil.DeployParams {
    const gasPrice = this._fee.gasPrice ? _.parseInt(this._fee.gasPrice) : undefined;
    return new DeployUtil.DeployParams(
      PublicKey.fromHex(this._source.address),
      this._chainName,
      gasPrice,
      this._expiration || TRANSACTION_EXPIRATION,
    );
  }

  /**
   * Generate the session for the Deploy according to the transactionType.
   *
   * @returns {DeployUtil.ExecutableDeployItem}
   */
  private getSession(): DeployUtil.ExecutableDeployItem {
    let session;
    switch (this.transaction.type) {
      case TransactionType.Send:
        const transferSession = this._session as CasperTransferTransaction;
        session = DeployUtil.ExecutableDeployItem.newTransferWithOptionalTransferId(
          transferSession.amount,
          transferSession.target,
          undefined,
          transferSession.id,
        );
        break;
      case TransactionType.WalletInitialization:
      case TransactionType.StakingLock:
      case TransactionType.StakingUnlock:
        const moduleBytesSession = this._session as CasperModuleBytesTransaction;
        session = DeployUtil.ExecutableDeployItem.newModuleBytes(
          moduleBytesSession.moduleBytes,
          moduleBytesSession.args,
        );
        break;
      default:
        throw new BuildTransactionError('Transaction Type error');
    }
    return session;
  }

  /**
   * Checks whether the transaction has the owner signature
   *
   * @param {string} pub - public key of the signer
   * @returns {boolean} true if the pub key already signed th transaction
   * @private
   */
  private isTransactionSignedByPub(pub: string): boolean {
    return (
      _.findIndex(this.transaction.casperTx.approvals, (approval) => {
        const approvalSigner = removeAlgoPrefixFromHexValue(approval.signer);
        return approvalSigner === pub;
      }) !== -1
    );
  }

  /**
   * Add signatures to the transaction
   *
   * @private
   */
  private processSigning(): void {
    for (const keyPair of this._multiSignerKeyPairs) {
      // Add signature if it's not already in the deploy
      if (!this.isTransactionSignedByPub(keyPair.getKeys().pub)) {
        this.transaction.sign(keyPair);
      }
    }
    for (const { signature, keyPair } of this._signatures) {
      // Add signature if it's not already in the deploy
      if (!this.isTransactionSignedByPub(keyPair.getKeys().pub)) {
        this.transaction.addSignature(signature, keyPair);
      }
    }
  }
  // endregion
}
