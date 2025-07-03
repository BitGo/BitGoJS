import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from '../transactionBuilder';
import { BaseKey, BaseTransaction, BuildTransactionError } from '@bitgo/sdk-core';
import { Principal } from '@dfinity/principal';
import { createHash } from 'crypto';
import utils, { Utils } from '../utils';
import { Transaction } from '../transaction';
import { UnsignedTransactionBuilder } from '../unsignedTransactionBuilder';
import {
  GOVERNANCE_CANISTER_ID,
  IcpTransaction,
  IcpTransactionData,
  OperationType,
  CurveType,
  IcpPublicKey,
  IcpOperation,
  ClaimNeuronParams,
} from '../iface';

export class ClaimNeuronBuilder extends TransactionBuilder {
  private _neuronMemo: bigint;
  private utils: Utils;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._neuronMemo = 0n;
    this.utils = new Utils();
  }

  /**
   * Set the neuron memo for staking
   *
   * @param {bigint} memo - The memo to use for neuron identification
   * @returns {this} The builder instance
   */
  public neuronMemo(memo: bigint): this {
    this.utils.validateMemo(memo);
    this._neuronMemo = memo;
    return this;
  }

  /**
   * Generate the neuron subaccount based on controller principal and memo
   *
   * @param {Principal} controllerPrincipal - The principal ID of the controller
   * @param {bigint} memo - The memo value
   * @returns {Uint8Array} The generated subaccount
   */
  private getNeuronSubaccount(controllerPrincipal: Principal, memo: bigint): Uint8Array {
    const nonceBuf = Buffer.alloc(8);
    nonceBuf.writeBigUInt64BE(memo);
    const domainSeparator = Buffer.from([0x0c]);
    const context = Buffer.from('neuron-stake', 'utf8');
    const principalBytes = controllerPrincipal.toUint8Array();

    const hashInput = Buffer.concat([domainSeparator, context, principalBytes, nonceBuf]);

    return new Uint8Array(createHash('sha256').update(hashInput).digest());
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    if (!this._sender || !this._publicKey) {
      throw new BuildTransactionError('Sender address and public key are required');
    }
    if (!this._amount) {
      throw new BuildTransactionError('Staking amount is required');
    }

    // Get controller principal from public key
    const controllerPrincipal = this.utils.derivePrincipalFromPublicKey(this._publicKey);

    // Generate neuron subaccount
    const subaccount = this.getNeuronSubaccount(controllerPrincipal, this._neuronMemo);

    // Set receiver as governance canister with neuron subaccount
    const governancePrincipal = Principal.fromUint8Array(GOVERNANCE_CANISTER_ID);
    this._receiverId = this.utils.fromPrincipal(governancePrincipal, subaccount);

    const publicKey: IcpPublicKey = {
      hex_bytes: this._publicKey,
      curve_type: CurveType.SECP256K1,
    };

    const senderOperation: IcpOperation = {
      type: OperationType.TRANSACTION,
      account: { address: this._sender },
      amount: {
        value: `-${this._amount}`,
        currency: {
          symbol: this._coinConfig.family,
          decimals: this._coinConfig.decimalPlaces,
        },
      },
    };

    const receiverOperation: IcpOperation = {
      type: OperationType.TRANSACTION,
      account: { address: this._receiverId },
      amount: {
        value: this._amount,
        currency: {
          symbol: this._coinConfig.family,
          decimals: this._coinConfig.decimalPlaces,
        },
      },
    };

    const feeOperation: IcpOperation = {
      type: OperationType.FEE,
      account: { address: this._sender },
      amount: {
        value: this.utils.feeData(),
        currency: {
          symbol: this._coinConfig.family,
          decimals: this._coinConfig.decimalPlaces,
        },
      },
    };

    const createdTimestamp = this._transaction.createdTimestamp;
    const { metaData, ingressEndTime } = this.utils.getMetaData(
      Number(this._neuronMemo),
      createdTimestamp,
      this._ingressEnd
    );

    const icpTransaction: IcpTransaction = {
      public_keys: [publicKey],
      operations: [senderOperation, receiverOperation, feeOperation],
      metadata: metaData,
    };

    const icpTransactionData: IcpTransactionData = {
      senderAddress: this._sender,
      receiverAddress: this._receiverId,
      amount: this._amount,
      fee: this.utils.feeData(),
      senderPublicKeyHex: this._publicKey,
      transactionType: OperationType.TRANSACTION,
      expiryTime: ingressEndTime,
      memo: Number(this._neuronMemo),
    };

    this._transaction.icpTransactionData = icpTransactionData;
    this._transaction.icpTransaction = icpTransaction;

    const unsignedTransactionBuilder = new UnsignedTransactionBuilder(this._transaction.icpTransaction);
    this._transaction.payloadsData = await unsignedTransactionBuilder.getUnsignedTransaction();
    return this._transaction;
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): BaseTransaction {
    const signatures = utils.getSignatures(this._transaction.payloadsData, this._publicKey, key.key);
    this._transaction.addSignature(signatures);
    return this._transaction;
  }

  /**
   * Get the parameters needed for claiming the neuron after the staking transaction is confirmed.
   * This allows the consumer to handle the network calls themselves.
   *
   * @returns {ClaimNeuronParams} Parameters needed for claiming the neuron
   * @throws {BuildTransactionError} If required fields are missing
   */
  public getClaimNeuronParams(): ClaimNeuronParams {
    if (!this._publicKey) {
      throw new BuildTransactionError('Public key is required');
    }

    const controllerPrincipal = this.utils.derivePrincipalFromPublicKey(this._publicKey);
    return {
      controller: controllerPrincipal,
      memo: this._neuronMemo,
    };
  }
}
