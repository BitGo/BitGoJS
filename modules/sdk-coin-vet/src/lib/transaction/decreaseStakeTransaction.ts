import { TransactionType, InvalidTransactionError } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Transaction as VetTransaction, Secp256k1 } from '@vechain/sdk-core';
import { Transaction } from './transaction';
import { VetTransactionData } from '../iface';
import EthereumAbi from 'ethereumjs-abi';
import utils from '../utils';
import BigNumber from 'bignumber.js';
import { addHexPrefix, BN } from 'ethereumjs-util';
import { ZERO_VALUE_AMOUNT } from '../constants';

export class DecreaseStakeTransaction extends Transaction {
  private _stakingContractAddress: string;
  private _validator: string;
  private _amount: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._type = TransactionType.StakingDeactivate;
  }

  get validator(): string {
    return this._validator;
  }

  set validator(address: string) {
    this._validator = address;
  }

  get amount(): string {
    return this._amount;
  }

  set amount(value: string) {
    this._amount = value;
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

    if (!this.amount) {
      throw new Error('Amount is not set');
    }

    utils.validateContractAddressForValidatorRegistration(this.stakingContractAddress, this._coinConfig);
    const decreaseStakeData = this.getDecreaseStakeClauseData(this.validator, this.amount);
    this._transactionData = decreaseStakeData;
    this._clauses = [
      {
        to: this.stakingContractAddress,
        value: ZERO_VALUE_AMOUNT,
        data: decreaseStakeData,
      },
    ];

    this._recipients = [
      {
        address: this.stakingContractAddress,
        amount: ZERO_VALUE_AMOUNT,
      },
    ];
  }

  getDecreaseStakeClauseData(validator: string, amount: string): string {
    const methodName = 'decreaseStake';
    const types = ['address', 'uint256'];
    const params = [validator, new BN(amount)];

    const method = EthereumAbi.methodID(methodName, types);
    const args = EthereumAbi.rawEncode(types, params);

    return addHexPrefix(Buffer.concat([method, args]).toString('hex'));
  }

  toJson(): VetTransactionData {
    return {
      id: this.id,
      chainTag: this.chainTag,
      blockRef: this.blockRef,
      expiration: this.expiration,
      gasPriceCoef: this.gasPriceCoef,
      gas: this.gas,
      dependsOn: this.dependsOn,
      nonce: this.nonce,
      data: this.transactionData,
      value: ZERO_VALUE_AMOUNT,
      sender: this.sender,
      to: this.stakingContractAddress,
      stakingContractAddress: this.stakingContractAddress,
      amountToStake: this.amount,
      validatorAddress: this.validator,
    };
  }

  fromDeserializedSignedTransaction(signedTx: VetTransaction): void {
    try {
      if (!signedTx || !signedTx.body) {
        throw new InvalidTransactionError('Invalid transaction: missing transaction body');
      }

      this.rawTransaction = signedTx;

      const body = signedTx.body;
      this.chainTag = typeof body.chainTag === 'number' ? body.chainTag : 0;
      this.blockRef = body.blockRef || '0x0';
      this.expiration = typeof body.expiration === 'number' ? body.expiration : 64;
      this.clauses = body.clauses || [];
      this.gasPriceCoef = typeof body.gasPriceCoef === 'number' ? body.gasPriceCoef : 128;
      this.gas = typeof body.gas === 'number' ? body.gas : Number(body.gas) || 0;
      this.dependsOn = body.dependsOn || null;
      this.nonce = String(body.nonce);

      if (body.clauses.length > 0) {
        const clause = body.clauses[0];
        if (clause.to) {
          this.stakingContractAddress = clause.to;
        }

        if (clause.data) {
          this.transactionData = clause.data;
          const decoded = utils.decodeDecreaseStakeData(clause.data);
          this.validator = decoded.validator;
          this.amount = decoded.amount;
        }
      }

      this.recipients = body.clauses.map((clause) => ({
        address: (clause.to || '0x0').toString().toLowerCase(),
        amount: new BigNumber(clause.value || 0).toString(),
      }));
      this.loadInputsAndOutputs();

      if (signedTx.signature && signedTx.origin) {
        this.sender = signedTx.origin.toString().toLowerCase();
      }

      if (signedTx.signature) {
        this.senderSignature = Buffer.from(signedTx.signature.slice(0, Secp256k1.SIGNATURE_LENGTH));

        if (signedTx.signature.length > Secp256k1.SIGNATURE_LENGTH) {
          this.feePayerSignature = Buffer.from(signedTx.signature.slice(Secp256k1.SIGNATURE_LENGTH));
        }
      }
    } catch (e) {
      throw new InvalidTransactionError(`Failed to deserialize transaction: ${e.message}`);
    }
  }
}
