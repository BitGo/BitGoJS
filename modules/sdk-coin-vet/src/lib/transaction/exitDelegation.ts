import { TransactionType, InvalidTransactionError } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Transaction as VetTransaction, Secp256k1 } from '@vechain/sdk-core';
import { Transaction } from './transaction';
import { VetTransactionData } from '../iface';
import { EXIT_DELEGATION_METHOD_ID } from '../constants';
import EthereumAbi from 'ethereumjs-abi';
import { addHexPrefix } from 'ethereumjs-util';
import utils from '../utils';
import BigNumber from 'bignumber.js';

export class ExitDelegationTransaction extends Transaction {
  private _tokenId: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._type = TransactionType.StakingUnlock;
  }

  get tokenId(): string {
    return this._tokenId;
  }

  set tokenId(id: string) {
    this._tokenId = id;
  }

  /** @inheritdoc */
  async build(): Promise<void> {
    this.buildClauses();
    await this.buildRawTransaction();
    this.generateTxnIdAndSetSender();
    this.loadInputsAndOutputs();
  }

  /** @inheritdoc */
  buildClauses(): void {
    if (!this._contract || !this._tokenId) {
      throw new InvalidTransactionError('Missing required unstaking parameters');
    }

    utils.validateDelegationContractAddress(this._contract, this._coinConfig);

    this._clauses = [
      {
        to: this._contract,
        value: '0x0',
        data: this._transactionData || this.getExitDelegationData(),
      },
    ];

    this._recipients = [
      {
        address: this._contract,
        amount: '0',
      },
    ];
  }

  /**
   * Generates the transaction data for unstaking by encoding the exitDelegation method call.
   *
   * @private
   * @returns {string} The encoded transaction data as a hex string
   */
  private getExitDelegationData(): string {
    const methodName = 'requestDelegationExit';
    const types = ['uint256'];
    const params = [this._tokenId];

    const method = EthereumAbi.methodID(methodName, types);
    const args = EthereumAbi.rawEncode(types, params);

    return addHexPrefix(Buffer.concat([method, args]).toString('hex'));
  }

  /** @inheritdoc */
  toJson(): VetTransactionData {
    const json: VetTransactionData = {
      id: this.id,
      chainTag: this.chainTag,
      blockRef: this.blockRef,
      expiration: this.expiration,
      gasPriceCoef: this.gasPriceCoef,
      gas: this.gas,
      dependsOn: this.dependsOn,
      nonce: this.nonce,
      data: this.transactionData || this.getExitDelegationData(),
      value: '0',
      sender: this.sender,
      to: this.contract,
    };
    return json;
  }

  /** @inheritdoc */
  fromDeserializedSignedTransaction(signedTx: VetTransaction): void {
    try {
      if (!signedTx || !signedTx.body) {
        throw new InvalidTransactionError('Invalid transaction: missing transaction body');
      }

      // Store the raw transaction
      this.rawTransaction = signedTx;

      // Set transaction body properties
      const body = signedTx.body;
      this.chainTag = typeof body.chainTag === 'number' ? body.chainTag : 0;
      this.blockRef = body.blockRef || '0x0';
      this.expiration = typeof body.expiration === 'number' ? body.expiration : 64;
      this.clauses = body.clauses || [];
      this.gasPriceCoef = typeof body.gasPriceCoef === 'number' ? body.gasPriceCoef : 128;
      this.gas = typeof body.gas === 'number' ? body.gas : Number(body.gas) || 0;
      this.dependsOn = body.dependsOn || null;
      this.nonce = String(body.nonce);

      // Set data from clauses
      this.contract = body.clauses[0]?.to || '0x0';
      this.transactionData = body.clauses[0]?.data || '0x0';
      this.type = TransactionType.StakingUnlock;

      // Extract tokenId from transaction data
      if (this.transactionData.startsWith(EXIT_DELEGATION_METHOD_ID)) {
        this.tokenId = utils.decodeExitDelegationData(this.transactionData);
      }
      this.recipients = body.clauses.map((clause) => ({
        address: (clause.to || '0x0').toString().toLowerCase(),
        amount: new BigNumber(clause.value || 0).toString(),
      }));

      // Set sender address
      if (signedTx.signature && signedTx.origin) {
        this.sender = signedTx.origin.toString().toLowerCase();
      }

      this.loadInputsAndOutputs();

      // Set signatures if present
      if (signedTx.signature) {
        // First signature is sender's signature
        this.senderSignature = Buffer.from(signedTx.signature.slice(0, Secp256k1.SIGNATURE_LENGTH));

        // If there's additional signature data, it's the fee payer's signature
        if (signedTx.signature.length > Secp256k1.SIGNATURE_LENGTH) {
          this.feePayerSignature = Buffer.from(signedTx.signature.slice(Secp256k1.SIGNATURE_LENGTH));
        }
      }
    } catch (e) {
      throw new InvalidTransactionError(`Failed to deserialize transaction: ${e.message}`);
    }
  }
}
