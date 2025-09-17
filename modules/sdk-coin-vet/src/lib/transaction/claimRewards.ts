import EthereumAbi from 'ethereumjs-abi';
import { addHexPrefix } from 'ethereumjs-util';
import { TransactionType, InvalidTransactionError, TransactionRecipient } from '@bitgo/sdk-core';
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

  get clauses(): TransactionClause[] {
    return this._clauses;
  }

  set clauses(clauses: TransactionClause[]) {
    this._clauses = clauses;
  }

  get recipients(): TransactionRecipient[] {
    return this._recipients;
  }

  set recipients(recipients: TransactionRecipient[]) {
    this._recipients = recipients;
  }

  /** @inheritdoc */
  buildClauses(): void {
    if (!this._claimRewardsData) {
      throw new InvalidTransactionError('Missing claim rewards data');
    }

    const clauses: TransactionClause[] = [];

    // Add clause for claiming base rewards if requested
    const shouldClaimBaseRewards = this.claimRewardsData.claimBaseRewards !== false; // Default true
    if (shouldClaimBaseRewards) {
      clauses.push(this.buildClaimBaseRewardsClause());
    }

    // Add clause for claiming staking rewards if requested
    const shouldClaimStakingRewards = this.claimRewardsData.claimStakingRewards !== false; // Default true
    if (shouldClaimStakingRewards) {
      clauses.push(this.buildClaimStakingRewardsClause());
    }

    if (clauses.length === 0) {
      throw new InvalidTransactionError('At least one type of rewards must be claimed');
    }

    this.clauses = clauses;

    // Set recipients as empty since claim rewards doesn't send value
    this.recipients = [];
  }

  /**
   * Get the delegation contract address to use for claims
   * Uses the address from claimRewardsData if provided, otherwise falls back to default
   */
  private getDelegationAddress(): string {
    return this._claimRewardsData.delegationContractAddress || STARGATE_DELEGATION_ADDRESS;
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
      to: this.getDelegationAddress(),
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
      to: this.getDelegationAddress(),
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
    let delegationContractAddress = '';

    for (const clause of clauses) {
      // Check if this is a claim rewards clause by looking at the method ID in data
      if (
        clause.data &&
        (clause.data.startsWith(CLAIM_BASE_REWARDS_METHOD_ID) ||
          clause.data.startsWith(CLAIM_STAKING_REWARDS_METHOD_ID))
      ) {
        // Store the contract address (could be different from default)
        if (!delegationContractAddress) {
          delegationContractAddress = clause.to || '';
        }

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
      delegationContractAddress:
        delegationContractAddress !== STARGATE_DELEGATION_ADDRESS ? delegationContractAddress : undefined,
      claimBaseRewards,
      claimStakingRewards,
    };
  }

  /**
   * Parse validator and delegator addresses from claim rewards method data.
   *
   * The method data follows Ethereum ABI encoding where each parameter occupies 32 bytes (64 hex chars).
   * After the 4-byte method ID, the parameters are laid out as:
   * - Bytes 0-31 (chars 0-63): First address parameter (validator) - right-padded, actual address in bytes 12-31
   * - Bytes 32-63 (chars 64-127): Second address parameter (delegator) - right-padded, actual address in bytes 44-63
   *
   * @param data The encoded method call data including method ID and parameters
   * @returns Object containing the extracted validator and delegator addresses
   */
  private parseAddressesFromClaimData(data: string): { validator: string; delegator: string } {
    // Remove method ID (first 10 characters: '0x' + 4-byte method ID)
    const methodData = data.slice(10);

    // Extract validator address from first parameter (bytes 12-31 of first 32-byte slot)
    // Slice 24-64: Skip first 12 bytes of padding (24 hex chars), take next 20 bytes (40 hex chars)
    const validatorAddress = '0x' + methodData.slice(24, 64);

    // Extract delegator address from second parameter (bytes 44-63 of second 32-byte slot)
    // Slice 88-128: Skip to second slot + 12 bytes padding (88 hex chars), take next 20 bytes (40 hex chars)
    const delegatorAddress = '0x' + methodData.slice(88, 128);

    return {
      validator: validatorAddress,
      delegator: delegatorAddress,
    };
  }
}
