import * as _ from 'lodash';
import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { CLPublicKey as PublicKey, DeployUtil, Keys, CLString, CLU512 } from 'casper-js-sdk';
import { BaseTransaction, TransactionType } from '../baseCoin';
import { BaseKey } from '../baseCoin/iface';
import { InvalidTransactionError, SigningError } from '../baseCoin/errors';
import { KeyPair } from './keyPair';
import { CasperTransaction } from './ifaces';
import {
  DELEGATE_FROM_ADDRESS,
  DELEGATE_VALIDATOR,
  OWNER_PREFIX,
  SECP256K1_PREFIX,
  TRANSACTION_TYPE,
} from './constants';
import {
  getTransferAmount,
  getTransferDestinationAddress,
  getTransferId,
  isValidPublicKey,
  removeAlgoPrefixFromHexValue,
  getDeployType,
  getDelegatorAddress,
  getValidatorAddress,
  getDelegateAmount,
} from './utils';

export class Transaction extends BaseTransaction {
  protected _type: TransactionType;
  protected _deploy: DeployUtil.Deploy;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    return true;
  }

  sign(keyPair: KeyPair): void {
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new SigningError('Missing private key');
    }
    if (
      this._deploy.approvals.some(
        (ap) => !ap.signer.startsWith(SECP256K1_PREFIX) || !isValidPublicKey(removeAlgoPrefixFromHexValue(ap.signer)),
      )
    ) {
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
   *
   * @param {string} signature The signature to add, in string hex format
   * @param {KeyPair} keyPair The key pair that created the signature
   */
  addSignature(signature: string, keyPair: KeyPair): void {
    const pub = keyPair.getKeys().pub;
    const signatureBuffer = Uint8Array.from(Buffer.from(signature, 'hex'));
    const pubKeyBuffer = Uint8Array.from(Buffer.from(pub, 'hex'));
    const parsedPublicKey = Keys.Secp256K1.parsePublicKey(pubKeyBuffer, 'raw');
    const pubKeyHex = Keys.Secp256K1.accountHex(parsedPublicKey);
    if (removeAlgoPrefixFromHexValue(pubKeyHex) !== pub) {
      throw new SigningError('Signer does not match signature');
    }
    const signedDeploy = DeployUtil.setSignature(
      this._deploy,
      signatureBuffer,
      PublicKey.fromSecp256K1(parsedPublicKey),
    );
    const approval = _.last(signedDeploy.approvals) as DeployUtil.Approval;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const txJson: any = DeployUtil.deployToJson(this.casperTx);
    // The new casper lib is converting the TTL from miliseconds to another date format, in this case 1 day
    // we need to leave it as ms for the HSM to be able to parse it
    txJson.deploy.header.ttl = `${this.casperTx.header.ttl}ms`;
    this.setOwnersInJson(txJson);
    this.setTransfersFieldsInJson(txJson);
    this.setDelegateFieldsInJson(txJson);
    return JSON.stringify(txJson);
  }

  /** @inheritdoc */
  toJson(): CasperTransaction {
    const deployPayment = this._deploy.payment.asModuleBytes()?.getArgByName('amount') as CLU512;
    if (!deployPayment) {
      throw new InvalidTransactionError('Undefined fee');
    }

    const owner1Index = 0;
    const owner2Index = 1;
    const owner3Index = 2;
    const sourcePublicKey = Buffer.from(this._deploy.header.account.value()).toString('hex');
    const sourceAddress = new KeyPair({ pub: sourcePublicKey }).getAddress();

    const result: CasperTransaction = {
      hash: Buffer.from(this._deploy.hash).toString('hex'),
      fee: { gasLimit: deployPayment.value().toString(), gasPrice: this._deploy.header.gasPrice.toString() },
      from: sourceAddress,
      startTime: new Date(this._deploy.header.timestamp).toISOString(),
      expiration: this._deploy.header.ttl,
      deployType: (this._deploy.session.getArgByName(TRANSACTION_TYPE) as CLString).value(),
    };

    const transactionType = getDeployType(this._deploy.session);

    switch (transactionType) {
      case TransactionType.Send:
        result.to = getTransferDestinationAddress(this._deploy.session);
        result.amount = getTransferAmount(this._deploy.session);
        result.transferId = getTransferId(this._deploy.session);
        break;
      case TransactionType.WalletInitialization:
        result.owner1 = (this.casperTx.session.getArgByName(OWNER_PREFIX + owner1Index) as CLString).value();
        result.owner2 = (this.casperTx.session.getArgByName(OWNER_PREFIX + owner2Index) as CLString).value();
        result.owner3 = (this.casperTx.session.getArgByName(OWNER_PREFIX + owner3Index) as CLString).value();
        break;
      case TransactionType.StakingLock:
        result.fromDelegate = getDelegatorAddress(this.casperTx.session);
        result.validator = getValidatorAddress(this.casperTx.session);
        result.amount = getDelegateAmount(this.casperTx.session);
        break;
      case TransactionType.StakingUnlock:
        result.fromDelegate = getDelegatorAddress(this.casperTx.session);
        result.validator = getValidatorAddress(this.casperTx.session);
        result.amount = getDelegateAmount(this.casperTx.session);
        break;
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
   * Retrieve signatures from the deploy instance and load them into the signatures list
   */
  loadPreviousSignatures(): void {
    if (this._deploy.approvals && this._deploy.approvals.length > 0) {
      this._deploy.approvals.forEach((approval) => {
        this._signatures.push(approval.signature);
      });
    }
  }

  /**
   * Set owners inside a json representing a wallet initialization tx.
   *
   * @param {Record<string, any>} txJson json to modify
   */
  setOwnersInJson(txJson: Record<string, any>): void {
    if (getDeployType(this.casperTx.session) === TransactionType.WalletInitialization) {
      const argName = 0;
      const argValue = 1;
      const owner0 = 0;
      const owner1 = 1;
      const owner2 = 2;

      const ownersValues = new Map();

      ownersValues.set(TRANSACTION_TYPE, (this.casperTx.session.getArgByName(TRANSACTION_TYPE) as CLString).value());

      [owner0, owner1, owner2].forEach((index) => {
        ownersValues.set(
          OWNER_PREFIX + index,
          (this.casperTx.session.getArgByName(OWNER_PREFIX + index) as CLString).value(),
        );
      });

      txJson['deploy']['session']['ModuleBytes']['args'].forEach((arg) => {
        if (ownersValues.has(arg[argName])) {
          arg[argValue]['parsed'] = ownersValues.get(arg[argName]);
        }
      });
    }
  }

  /**
   * Set transfer fields inside a json representing a transfer tx.
   *
   * @param {Record<string, any>} txJson json to modify
   */
  setTransfersFieldsInJson(txJson: Record<string, any>): void {
    if (getDeployType(this.casperTx.session) === TransactionType.Send) {
      const argName = 0;
      const argValue = 1;

      const transferValues = new Map();
      transferValues.set(TRANSACTION_TYPE, (this.casperTx.session.getArgByName(TRANSACTION_TYPE) as CLString).value());
      transferValues.set('amount', getTransferAmount(this.casperTx.session));
      transferValues.set('to_address', getTransferDestinationAddress(this.casperTx.session));
      const transferId = getTransferId(this.casperTx.session);
      if (transferId !== undefined) {
        transferValues.set('id', transferId.toString());
      }

      txJson['deploy']['session']['Transfer']['args'].forEach((arg) => {
        if (transferValues.has(arg[argName])) {
          arg[argValue]['parsed'] = transferValues.get(arg[argName]);
        }
      });
    }
  }

  /**
   * Set delegate / undelegate fields inside a json representing the tx.
   *
   * @param {Record<string, any>} txJson json to modify
   */
  setDelegateFieldsInJson(txJson: Record<string, any>): void {
    if (
      getDeployType(this.casperTx.session) === TransactionType.StakingLock ||
      getDeployType(this.casperTx.session) === TransactionType.StakingUnlock
    ) {
      const argName = 0;
      const argValue = 1;

      const delegateValues = new Map();
      delegateValues.set(TRANSACTION_TYPE, (this.casperTx.session.getArgByName(TRANSACTION_TYPE) as CLString).value());
      delegateValues.set('amount', getDelegateAmount(this.casperTx.session));
      delegateValues.set(DELEGATE_FROM_ADDRESS, getDelegatorAddress(this.casperTx.session));
      delegateValues.set(DELEGATE_VALIDATOR, getValidatorAddress(this.casperTx.session));

      txJson.deploy.session.ModuleBytes.args.forEach((arg) => {
        if (delegateValues.has(arg[argName])) {
          arg[argValue]['parsed'] = delegateValues.get(arg[argName]);
        }
      });
    }
  }

  get casperTx(): DeployUtil.Deploy {
    return this._deploy;
  }

  set casperTx(deploy: DeployUtil.Deploy) {
    this._deploy = deploy;
  }

  // endregion
}
