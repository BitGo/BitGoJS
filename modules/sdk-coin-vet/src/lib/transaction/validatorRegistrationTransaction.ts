import { TransactionType, InvalidTransactionError } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Transaction as VetTransaction, Secp256k1 } from '@vechain/sdk-core';
import { Transaction } from './transaction';
import { VetTransactionData } from '../iface';
import EthereumAbi from 'ethereumjs-abi';
import utils from '../utils';
import BigNumber from 'bignumber.js';
import { addHexPrefix, BN } from 'ethereumjs-util';

export class ValidatorRegistrationTransaction extends Transaction {
  private _stakingContractAddress: string;
  private _validator: string;
  private _stakingPeriod: number;
  private _amountToStake: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._type = TransactionType.StakingLock;
  }

  get validator(): string {
    return this._validator;
  }

  set validator(address: string) {
    this._validator = address;
  }

  get stakingPeriod(): number {
    return this._stakingPeriod;
  }

  set stakingPeriod(period: number) {
    this._stakingPeriod = period;
  }

  get amountToStake(): string {
    return this._amountToStake;
  }

  set amountToStake(amount: string) {
    this._amountToStake = amount;
  }

  get stakingContractAddress(): string {
    return this._stakingContractAddress;
  }

  set stakingContractAddress(address: string) {
    this._stakingContractAddress = address;
  }

  buildClauses(): void {
    if (!this.stakingContractAddress) {
      throw new Error('Staking contract address is not set');
    }

    if (!this.validator) {
      throw new Error('Validator address is not set');
    }

    if (!this.stakingPeriod) {
      throw new Error('Staking period is not set');
    }

    utils.validateContractAddressForValidatorRegistration(this.stakingContractAddress, this._coinConfig);
    const addValidationData = this.getAddValidationClauseData(this.validator, this.stakingPeriod);
    this._transactionData = addValidationData;
    // Create the clause for delegation
    this._clauses = [
      {
        to: this.stakingContractAddress,
        value: this.amountToStake,
        data: addValidationData,
      },
    ];

    // Set recipients based on the clauses
    this._recipients = [
      {
        address: this.stakingContractAddress,
        amount: this.amountToStake,
      },
    ];
  }

  /**
   * Encodes addValidation transaction data using ethereumjs-abi for addValidation method
   * @param {string} validator - address of the validator
   * @param {number} period - staking period, denoted in blocks, that the Validator commits to hard
locking their VET into the built-in staker contract. Allowed values are 60480 (7 days),
129600 (15 days) or 259200 (30 days)
   * @returns {string} - The encoded transaction data
   */
  getAddValidationClauseData(validator: string, period: number): string {
    const methodName = 'addValidation';
    const types = ['address', 'uint32'];
    const params = [validator, new BN(period)];

    const method = EthereumAbi.methodID(methodName, types);
    const args = EthereumAbi.rawEncode(types, params);

    return addHexPrefix(Buffer.concat([method, args]).toString('hex'));
  }

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
      data: this.transactionData,
      value: this.amountToStake,
      sender: this.sender,
      to: this.stakingContractAddress,
      stakingContractAddress: this.stakingContractAddress,
      amountToStake: this.amountToStake,
      validatorAddress: this.validator,
      stakingPeriod: this.stakingPeriod,
    };

    return json;
  }

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

      // Set validator registration-specific properties
      if (body.clauses.length > 0) {
        // Get the addValidation clause
        const addValidationClause = body.clauses[0];
        if (addValidationClause.to) {
          this.stakingContractAddress = addValidationClause.to;
        }

        if (addValidationClause.value) {
          this.amountToStake = new BigNumber(addValidationClause.value).toFixed();
        }

        // Extract validator and period from addValidation data
        if (addValidationClause.data) {
          this.transactionData = addValidationClause.data;
          const decoded = utils.decodeAddValidationData(addValidationClause.data);
          this.validator = decoded.validator;
          this.stakingPeriod = decoded.period;
        }
      }

      // Set recipients from clauses
      this.recipients = body.clauses.map((clause) => ({
        address: (clause.to || '0x0').toString().toLowerCase(),
        amount: new BigNumber(clause.value || 0).toString(),
      }));
      this.loadInputsAndOutputs();

      // Set sender address
      if (signedTx.signature && signedTx.origin) {
        this.sender = signedTx.origin.toString().toLowerCase();
      }

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
