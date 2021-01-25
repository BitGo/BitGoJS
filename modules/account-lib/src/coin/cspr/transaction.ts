import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { DeployUtil, Keys } from 'casper-client-sdk';
import { Deploy } from 'casper-client-sdk/dist/lib/DeployUtil';
import { BaseTransaction, TransactionType } from '../baseCoin';
import { BaseKey } from '../baseCoin/iface';
import { InvalidTransactionError, NotImplementedError, SigningError } from '../baseCoin/errors';
import { KeyPair } from './keyPair';
import { CasperTransaction } from './ifaces';
import { SECP256K1_PREFIX } from './constants';

export class Transaction extends BaseTransaction {
  protected _type: TransactionType;
  protected _deploy: Deploy;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    return true;
  }

  async sign(keyPair: KeyPair): Promise<void> {
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new SigningError('Missing private key');
    }
    if (this._deploy.approvals.some(ap => !ap.signer.startsWith(SECP256K1_PREFIX))) {
      throw new SigningError('Invalid deploy. Already signed with an invalid key');
    }
    const secpKeys = new Keys.Secp256K1(
      Uint8Array.from(Buffer.from(keys.pub, 'hex')),
      Uint8Array.from(Buffer.from(keys.prv, 'hex')),
    );
    DeployUtil.signDeploy(this._deploy, secpKeys);
  }

  /**
   * Add a signature to this transaction
   * @param {string} signature The signature to add, in string hex format
   */
  addSignature(signature: string): void {
    this._signatures.push(signature);
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    if (!this.casperTx) {
      throw new InvalidTransactionError('Empty transaction');
    }
    return JSON.stringify(DeployUtil.deployToJson(this.casperTx));
  }

  /** @inheritdoc */
  toJson(): string {
    const result: CasperTransaction = {
      hash: Buffer.from(this._deploy.hash).toString('hex'),
      data: Buffer.from(this._deploy.header.bodyHash).toString('hex'),
      fee: 0, // TODO: Research on how to get gasLimit from ExecutableDeployItem
      from: Buffer.from(this._deploy.header.account.rawPublicKey).toString('hex'),
      startTime: new Date(this._deploy.header.timestamp).toISOString(),
      validDuration: DeployUtil.humanizerTTL(this._deploy.header.ttl),
    };

    if (this._deploy.session instanceof DeployUtil.Transfer) {
      // TODO: Get target and amount
      // const [recipient, amount] = this.getTransferData();
    }
    return JSON.stringify(result);
  }

  /**
   * Set the transaction type
   *
   * @param {TransactionType} transactionType The transaction type to be set
   */
  setTransactionType(transactionType: TransactionType): void {
    this._type = transactionType;
  }

  /**
   * Decode previous signatures from the inner transaction
   * and save them into the base transaction signature list.
   */
  loadPreviousSignatures(): void {
    if (this._deploy.approvals && this._deploy.approvals.length > 0) {
      this._deploy.approvals.forEach(approval => {
        this._signatures.push(approval.signature);
      });
    }
  }

  /**
   * Load the input and output data on this transaction using the transaction json
   * if there are outputs. For transactions without outputs (e.g. wallet initializations),
   * this function will not do anything
   */
  loadInputsAndOutputs(): void {
    throw new NotImplementedError('loadInputsAndOutputs not implemented');
  }

  get casperTx(): Deploy {
    return this._deploy;
  }

  set casperTx(deploy: DeployUtil.Deploy) {
    this._deploy = deploy;
  }

  //endregion
}
