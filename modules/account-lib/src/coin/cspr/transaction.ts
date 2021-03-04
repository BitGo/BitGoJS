import * as _ from 'lodash';
import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { CLValue, PublicKey, DeployUtil, Keys } from 'casper-client-sdk';
import { Approval, Deploy } from 'casper-client-sdk/dist/lib/DeployUtil';
import { BaseTransaction, TransactionType } from '../baseCoin';
import { BaseKey } from '../baseCoin/iface';
import { InvalidTransactionError, SigningError } from '../baseCoin/errors';
import { KeyPair } from './keyPair';
import { CasperTransaction } from './ifaces';
import { OWNER_PREFIX, SECP256K1_PREFIX, TRANSACTION_TYPE } from './constants';
import {
  getTransferAmount,
  getTransferDestinationAddress,
  getTransferId,
  isValidPublicKey,
  isWalletInitContract,
  removeAlgoPrefixFromHexValue,
} from './utils';

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
    this._signatures.push(signedDeploy.approvals[signedDeploy.approvals.length - 1].signature);
  }

  /**
   * Add a signature to this transaction and to and its deploy
   * @param {string} signature The signature to add, in string hex format
   * @param {KeyPair} keyPair The key pair that created the signature
   */
  addSignature(signature: string, keyPair: KeyPair): void {
    const pub = keyPair.getKeys().pub;
    const signatureBuffer = Uint8Array.from(Buffer.from(signature, 'hex'));
    const pubKeyBuffer = Uint8Array.from(Buffer.from(pub, 'hex'));
    const parsedPublicKey = Keys.Secp256K1.parsePublicKey(pubKeyBuffer, 'raw');
    const pubKeyHex = Keys.Secp256K1.accountHex(parsedPublicKey);
    if (removeAlgoPrefixFromHexValue(pubKeyHex).toUpperCase() !== pub) {
      throw new SigningError('Signer does not match signature');
    }
    const signedDeploy = DeployUtil.setSignature(this._deploy, signatureBuffer, PublicKey.fromSecp256K1(parsedPublicKey));
    const approval = _.last(signedDeploy.approvals) as Approval;
    if (removeAlgoPrefixFromHexValue(approval.signature) !== signature) {
      throw new SigningError('Invalid signature');
    }
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
    const owner1Index = 0;
    const owner2Index = 1;
    const owner3Index = 2;

    if (!deployPayment) {
      throw new InvalidTransactionError('Undefined fee');
    }

    const result: CasperTransaction = {
      hash: Buffer.from(this._deploy.hash).toString('hex'),
      fee: { gasLimit: deployPayment.asBigNumber().toString(), gasPrice: this._deploy.header.gasPrice.toString() },
      from: Buffer.from(this._deploy.header.account.rawPublicKey).toString('hex'),
      startTime: new Date(this._deploy.header.timestamp).toISOString(),
      expiration: this._deploy.header.ttl,
      deployType: (this._deploy.session.getArgByName(TRANSACTION_TYPE) as CLValue).asString(),
    };

    if (this._deploy.session.isTransfer()) {
      result.to = getTransferDestinationAddress(this._deploy.session);
      result.amount = getTransferAmount(this._deploy.session);
      result.transferId = getTransferId(this._deploy.session);
    }
    if (this._deploy.session.isModuleBytes() && isWalletInitContract(this._deploy.session.asModuleBytes())) {
      result.owner1 = (this.casperTx.session.getArgByName(OWNER_PREFIX + owner1Index) as CLValue).asString();
      result.owner2 = (this.casperTx.session.getArgByName(OWNER_PREFIX + owner2Index) as CLValue).asString();
      result.owner3 = (this.casperTx.session.getArgByName(OWNER_PREFIX + owner3Index) as CLValue).asString();
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

      ownersValues.set(TRANSACTION_TYPE, (this.casperTx.session.getArgByName(TRANSACTION_TYPE) as CLValue).asString());

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
      transferValues.set(TRANSACTION_TYPE, (this.casperTx.session.getArgByName(TRANSACTION_TYPE) as CLValue).asString());
      transferValues.set('amount', getTransferAmount(this.casperTx.session));
      transferValues.set('to_address', getTransferDestinationAddress(this.casperTx.session));
      const transferId = getTransferId(this.casperTx.session);
      if (transferId !== undefined) {
        transferValues.set('id', transferId.toString());
      }

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
