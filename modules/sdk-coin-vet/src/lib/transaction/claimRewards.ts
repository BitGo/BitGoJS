import { TransactionType, InvalidTransactionError } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Transaction as VetTransaction, Secp256k1, TransactionClause } from '@vechain/sdk-core';
import { Transaction } from './transaction';
import { VetTransactionData } from '../iface';
import { ClaimRewardsData } from '../types';
import {
  CLAIM_BASE_REWARDS_METHOD_ID,
  CLAIM_STAKING_REWARDS_METHOD_ID,
  STARGATE_DELEGATION_ADDRESS,
} from '../constants';
import EthereumAbi from 'ethereumjs-abi';
import { addHexPrefix } from 'ethereumjs-util';

export class ClaimRewardsTransaction extends Transaction {
  private _claimRewardsData: ClaimRewardsData;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._type = TransactionType.StakingClaim;
  }

  get claimRewardsData(): ClaimRewardsData {
    return this._claimRewardsData;
  }

  set claimRewardsData(data: ClaimRewardsData) {
    this._claimRewardsData = data;
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
    if (!this._claimRewardsData) {
      throw new InvalidTransactionError('Missing claim rewards data');
    }

    const clauses: TransactionClause[] = [];

    // Add clause for claiming base rewards if requested
    const shouldClaimBaseRewards = this._claimRewardsData.claimBaseRewards !== false; // Default true
    if (shouldClaimBaseRewards) {
      clauses.push(this.buildClaimBaseRewardsClause());
    }

    // Add clause for claiming staking rewards if requested
    const shouldClaimStakingRewards = this._claimRewardsData.claimStakingRewards !== false; // Default true
    if (shouldClaimStakingRewards) {
      clauses.push(this.buildClaimStakingRewardsClause());
    }

    if (clauses.length === 0) {
      throw new InvalidTransactionError('At least one type of rewards must be claimed');
    }

    this._clauses = clauses;

    // Set recipients as empty since claim rewards doesn't send value
    this._recipients = [];
  }

  /**
   * Build clause for claiming base rewards
   */
  private buildClaimBaseRewardsClause(): TransactionClause {
    const methodData = this.encodeClaimRewardsMethod(
      CLAIM_BASE_REWARDS_METHOD_ID,
      this._claimRewardsData.validatorAddress,
      this._claimRewardsData.delegatorAddress
    );

    return {
      to: STARGATE_DELEGATION_ADDRESS,
      value: '0x0',
      data: methodData,
    };
  }

  /**
   * Build clause for claiming staking rewards
   */
  private buildClaimStakingRewardsClause(): TransactionClause {
    const methodData = this.encodeClaimRewardsMethod(
      CLAIM_STAKING_REWARDS_METHOD_ID,
      this._claimRewardsData.validatorAddress,
      this._claimRewardsData.delegatorAddress
    );

    return {
      to: STARGATE_DELEGATION_ADDRESS,
      value: '0x0',
      data: methodData,
    };
  }

  /**
   * Encode the claim rewards method call data
   */
  private encodeClaimRewardsMethod(methodId: string, validatorAddress: string, delegatorAddress: string): string {
    const methodName = methodId === CLAIM_BASE_REWARDS_METHOD_ID ? 'claimBaseRewards' : 'claimStakingRewards';
    const types = ['address', 'address'];
    const params = [validatorAddress, delegatorAddress];

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
      sender: this.sender,
      feePayer: this.feePayerAddress,
      recipients: this.recipients,
      claimRewardsData: this._claimRewardsData,
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

      // Parse claim rewards data from clauses
      this.parseClaimRewardsDataFromClauses(body.clauses);

      // Set recipients as empty for claim rewards
      this.recipients = [];
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

  /**
   * Parse claim rewards data from transaction clauses
   */
  private parseClaimRewardsDataFromClauses(clauses: TransactionClause[]): void {
    if (!clauses || clauses.length === 0) {
      throw new InvalidTransactionError('No clauses found in transaction');
    }

    let claimBaseRewards = false;
    let claimStakingRewards = false;
    let validatorAddress = '';
    let delegatorAddress = '';

    for (const clause of clauses) {
      if (clause.to?.toLowerCase() === STARGATE_DELEGATION_ADDRESS.toLowerCase() && clause.data) {
        if (clause.data.startsWith(CLAIM_BASE_REWARDS_METHOD_ID)) {
          claimBaseRewards = true;
          if (!validatorAddress || !delegatorAddress) {
            const addresses = this.parseAddressesFromClaimData(clause.data);
            validatorAddress = addresses.validator;
            delegatorAddress = addresses.delegator;
          }
        } else if (clause.data.startsWith(CLAIM_STAKING_REWARDS_METHOD_ID)) {
          claimStakingRewards = true;
          if (!validatorAddress || !delegatorAddress) {
            const addresses = this.parseAddressesFromClaimData(clause.data);
            validatorAddress = addresses.validator;
            delegatorAddress = addresses.delegator;
          }
        }
      }
    }

    if (!claimBaseRewards && !claimStakingRewards) {
      throw new InvalidTransactionError('Transaction does not contain claim rewards clauses');
    }

    this._claimRewardsData = {
      validatorAddress,
      delegatorAddress,
      claimBaseRewards,
      claimStakingRewards,
    };
  }

  /**
   * Parse validator and delegator addresses from claim rewards method data
   */
  private parseAddressesFromClaimData(data: string): { validator: string; delegator: string } {
    // Remove method ID (first 10 characters: '0x' + 4 bytes)
    const methodData = data.slice(10);

    const validatorAddress = '0x' + methodData.slice(24, 64);
    const delegatorAddress = '0x' + methodData.slice(88, 128);

    return {
      validator: validatorAddress,
      delegator: delegatorAddress,
    };
  }
}
