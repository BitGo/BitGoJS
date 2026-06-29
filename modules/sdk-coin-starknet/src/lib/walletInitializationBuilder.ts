import { BuildTransactionError } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { StarknetTransactionData, StarknetTransactionType } from './iface';
import { OZ_ETH_ACCOUNT_CLASS_HASH } from './constants';
import utils from './utils';

/**
 * Builds DEPLOY_ACCOUNT v3 transactions for counterfactual EthAccount activation.
 */
export class WalletInitializationBuilder extends TransactionBuilder {
  protected _classHash: string = OZ_ETH_ACCOUNT_CLASS_HASH;
  protected _constructorCalldata?: string[];
  protected _contractAddressSalt?: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): StarknetTransactionType {
    return StarknetTransactionType.DEPLOY_ACCOUNT;
  }

  /**
   * Set deploy parameters from a secp256k1 public key (compressed or uncompressed).
   * Derives counterfactual address, constructor calldata, and salt.
   */
  public fromPublicKey(pubKey: string): this {
    if (!utils.isValidPublicKey(pubKey)) {
      throw new BuildTransactionError('Invalid pubKey, got: ' + pubKey);
    }
    const fullPublicKey = utils.getUncompressedPublicKey(pubKey);
    const { address, constructorCalldata, salt } = utils.computeStarknetAddress(fullPublicKey);
    this._constructorCalldata = constructorCalldata;
    this._contractAddressSalt = salt;
    return this.sender(address, pubKey);
  }

  public classHash(classHash: string): this {
    if (!classHash || !utils.isValidAddress(classHash)) {
      throw new BuildTransactionError('Invalid class hash, got: ' + classHash);
    }
    this._classHash = classHash;
    return this;
  }

  /** @inheritdoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    const data = tx.starknetTransactionData;
    if (data.classHash) {
      this._classHash = data.classHash;
    }
    if (data.constructorCalldata) {
      this._constructorCalldata = data.constructorCalldata;
    }
    if (data.contractAddressSalt) {
      this._contractAddressSalt = data.contractAddressSalt;
    }
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.ensureDeployFields();

    const contractAddress = this._sender as string;
    const chainId = this._chainId as string;
    const nonce = this._nonce as string;
    const constructorCalldata = this._constructorCalldata as string[];
    const contractAddressSalt = this._contractAddressSalt as string;

    const transactionHash = utils.calculateDeployAccountTransactionHash({
      contractAddress,
      classHash: this._classHash,
      constructorCalldata,
      contractAddressSalt,
      chainId,
      nonce,
      resourceBounds: this._resourceBounds,
      tip: this._tip,
    });

    const data: StarknetTransactionData = {
      senderAddress: contractAddress,
      contractAddress,
      calls: [],
      nonce,
      chainId,
      transactionType: StarknetTransactionType.DEPLOY_ACCOUNT,
      resourceBounds: this._resourceBounds,
      tip: this._tip,
      transactionHash,
      classHash: this._classHash,
      constructorCalldata,
      contractAddressSalt,
    };

    this._transaction.starknetTransactionData = data;
    return this._transaction;
  }

  private ensureDeployFields(): void {
    if (!this._sender) {
      throw new BuildTransactionError('Sender (counterfactual address) is required');
    }
    if (this._publicKey && (!this._constructorCalldata || !this._contractAddressSalt)) {
      this.fromPublicKey(this._publicKey);
    }
    if (!this._constructorCalldata || !this._contractAddressSalt) {
      throw new BuildTransactionError(
        'Deploy account requires public key (fromPublicKey) or explicit constructor calldata and salt'
      );
    }
    const fullPublicKey = this._publicKey ? utils.getUncompressedPublicKey(this._publicKey) : undefined;
    if (fullPublicKey) {
      const derived = utils.computeStarknetAddress(fullPublicKey);
      if (utils.normalizeAddress(derived.address) !== utils.normalizeAddress(this._sender)) {
        throw new BuildTransactionError(
          `Address does not match public key. Expected ${derived.address}, got ${this._sender}`
        );
      }
      if (
        derived.constructorCalldata.join(',') !== this._constructorCalldata.join(',') ||
        derived.salt !== this._contractAddressSalt
      ) {
        throw new BuildTransactionError('Constructor calldata or salt does not match public key');
      }
    }
  }
}
