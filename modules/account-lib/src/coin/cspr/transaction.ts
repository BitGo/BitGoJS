import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { CLValue, DeployUtil, Keys } from 'casper-client-sdk';
import { Deploy, Transfer } from 'casper-client-sdk/dist/lib/DeployUtil';
import { BaseTransaction, TransactionType } from '../baseCoin';
import { BaseKey } from '../baseCoin/iface';
import { InvalidTransactionError, SigningError } from '../baseCoin/errors';
import { KeyPair } from './keyPair';
import { CasperTransaction } from './ifaces';
import { OWNER_PREFIX, SECP256K1_PREFIX } from './constants';
import { getTransferAmount, getTransferDestinationAddress, getTransferId, isValidPublicKey } from './utils';

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
    if (this._deploy.approvals.some(ap => !ap.signer.startsWith(SECP256K1_PREFIX) || 
      !isValidPublicKey(ap.signer.slice(2)))) {
      throw new SigningError('Invalid deploy. Already signed with an invalid key');
    }
    const secpKeys = new Keys.Secp256K1(
      Uint8Array.from(Buffer.from(keys.pub, 'hex')),
      Uint8Array.from(Buffer.from(keys.prv, 'hex')),
    );
    const signedDeploy = DeployUtil.signDeploy(this._deploy, secpKeys);
    this.addSignature(signedDeploy.approvals[signedDeploy.approvals.length - 1].signature);
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
    const txJson = DeployUtil.deployToJson(this.casperTx);
    this.setOwnersInJson(txJson);
    this.setTransfersFieldsInJson(txJson);
    return JSON.stringify(txJson);
  }

  /** @inheritdoc */
  toJson(): CasperTransaction {
    const deployPayment = this._deploy.payment.asModuleBytes()!.getArgByName('amount');
    if (!deployPayment) {
      throw new InvalidTransactionError('Undefined fee');
    }

    const result: CasperTransaction = {
      hash: Buffer.from(this._deploy.hash).toString('hex'),
      fee: { gasLimit: deployPayment.asBigNumber().toString(), gasPrice: this._deploy.header.gasPrice.toString() },
      from: Buffer.from(this._deploy.header.account.rawPublicKey).toString('hex'),
      startTime: new Date(this._deploy.header.timestamp).toISOString(),
      expiration: this._deploy.header.ttl,
    };

    if (this._deploy.session.isTransfer()) {
      result.to = Buffer.from(
        ((this._deploy.session.asTransfer() as Transfer).getArgByName('target') as CLValue).asBytesArray(),
      ).toString('hex');
      result.amount = ((this._deploy.session.asTransfer() as Transfer).getArgByName('amount') as CLValue)
        .asBigNumber()
        .toString();
    }
    return result;
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

  setOwnersInJson(txJson: Record<string, any>): void {
    if (this.casperTx.session.isModuleBytes()) {
      const argName = 0;
      const argValue = 1;
      const owner0 = 0;
      const owner1 = 1;
      const owner2 = 2;

      const ownersValues = new Map();

      [owner0, owner1, owner2].forEach(index => {
        ownersValues.set(
          OWNER_PREFIX + index,
          (this.casperTx.session.getArgByName(OWNER_PREFIX + index) as CLValue).asString(),
        );
      });

      txJson['deploy']!['session']['ModuleBytes']['args'].forEach(arg => {
        if (ownersValues.has(arg[argName])) {
          arg[argValue]['parsed'] = ownersValues.get(arg[argName]);
        }
      });
    }
  }

  setTransfersFieldsInJson(txJson: Record<string, any>): void {
    if (this.casperTx.session.isTransfer()) {
      const argName = 0;
      const argValue = 1;

      const transferValues = new Map();
      transferValues.set('amount', getTransferAmount(this.casperTx.session));
      transferValues.set('to_address', getTransferDestinationAddress(this.casperTx.session));
      transferValues.set('id', getTransferId(this.casperTx.session).toString());

      txJson['deploy']!['session']['Transfer']['args'].forEach(arg => {
        if (transferValues.has(arg[argName])) {
          arg[argValue]['parsed'] = transferValues.get(arg[argName]);
        }
      });
    }
  }

  get casperTx(): Deploy {
    return this._deploy;
  }

  set casperTx(deploy: DeployUtil.Deploy) {
    this._deploy = deploy;
  }

  //endregion
}
