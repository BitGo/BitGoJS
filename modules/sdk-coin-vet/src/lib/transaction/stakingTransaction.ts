import { TransactionType, InvalidTransactionError } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Transaction as VetTransaction, Secp256k1 } from '@vechain/sdk-core';
import { Transaction } from './transaction';
import { VetTransactionData } from '../iface';
import EthereumAbi from 'ethereumjs-abi';
import utils from '../utils';
import BigNumber from 'bignumber.js';
import { addHexPrefix } from 'ethereumjs-util';

export class StakingTransaction extends Transaction {
  private _stakingContractAddress: string;
  private _levelId: number;
  private _autorenew = true;
  private _amountToStake: string;
  private _stakingContractABI: EthereumAbi;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._type = TransactionType.ContractCall;
    this._autorenew = true;
  }

  get stakingContractAddress(): string {
    return this._stakingContractAddress;
  }

  set stakingContractAddress(address: string) {
    this._stakingContractAddress = address;
  }

  get levelId(): number {
    return this._levelId;
  }

  set levelId(levelId: number) {
    this._levelId = levelId;
  }

  get autorenew(): boolean {
    return this._autorenew;
  }

  set autorenew(autorenew: boolean) {
    this._autorenew = autorenew;
  }

  get amountToStake(): string {
    return this._amountToStake;
  }

  set amountToStake(amount: string) {
    this._amountToStake = amount;
  }

  get stakingContractABI(): EthereumAbi {
    return this._stakingContractABI;
  }

  set stakingContractABI(abi: EthereumAbi) {
    this._stakingContractABI = abi;
  }

  buildClauses(): void {
    if (!this.stakingContractAddress) {
      throw new Error('Staking contract address is not set');
    }

    utils.validateStakingContractAddress(this.stakingContractAddress, this._coinConfig);

    if (this.levelId === undefined || this.levelId === null) {
      throw new Error('Level ID is not set');
    }

    if (!this.amountToStake) {
      throw new Error('Amount to stake is not set');
    }

    const data = this.getStakingData(this.levelId, this.autorenew);
    this._transactionData = data;

    // Create the clause for staking
    this._clauses = [
      {
        to: this.stakingContractAddress,
        value: this.amountToStake,
        data: this._transactionData,
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
   * Encodes staking transaction data using ethereumjs-abi for stakeAndDelegate method
   *
   * @param {number} levelId - The level ID for staking
   * @param {boolean} autorenew - Whether to enable autorenew
   * @returns {string} - The encoded transaction data
   */
  getStakingData(levelId: number, autorenew = true): string {
    const methodName = 'stakeAndDelegate';
    const types = ['uint8', 'bool'];
    const params = [levelId, autorenew];

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
      nftTokenId: this.levelId,
      autorenew: this.autorenew,
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

      // Set staking-specific properties
      if (body.clauses.length > 0) {
        const clause = body.clauses[0];
        if (clause.to) {
          this.stakingContractAddress = clause.to;
        }
        if (clause.value) {
          this.amountToStake = String(clause.value);
        }
        if (clause.data) {
          this.transactionData = clause.data;
          const decoded = utils.decodeStakingData(clause.data);
          this.levelId = decoded.levelId;
          this.autorenew = decoded.autorenew;
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
