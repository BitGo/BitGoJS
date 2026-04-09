import EthereumAbi from 'ethereumjs-abi';
import { addHexPrefix } from 'ethereumjs-util';
import { TransactionType, InvalidTransactionError, TransactionRecipient } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Transaction as VetTransaction, Secp256k1, TransactionClause } from '@vechain/sdk-core';
import { Transaction } from './transaction';
import { VetTransactionData } from '../iface';
import { CLAIM_STAKING_REWARDS_METHOD_ID } from '../constants';
import utils from '../utils';

export class ClaimRewardsTransaction extends Transaction {
  private _stakingContractAddress: string;
  private _tokenId: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._type = TransactionType.StakingClaim;
  }

  get stakingContractAddress(): string {
    return this._stakingContractAddress;
  }

  set stakingContractAddress(address: string) {
    this._stakingContractAddress = address;
  }

  get tokenId(): string {
    return this._tokenId;
  }

  set tokenId(tokenId: string) {
    this._tokenId = tokenId;
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
    if (!this.stakingContractAddress) {
      throw new Error('Staking contract address is not set');
    }

    utils.validateStakingContractAddress(this.stakingContractAddress, this._coinConfig);

    if (this.tokenId === undefined || this.tokenId === null) {
      throw new Error('Token ID is not set');
    }

    const data = this.encodeClaimRewardsMethod(this.tokenId);
    this._transactionData = data;

    // Create the clause for claim rewards
    this._clauses = [
      {
        to: this.stakingContractAddress,
        value: '0x0',
        data: this._transactionData,
      },
    ];

    // Set recipients as empty since claim rewards doesn't send value
    this.recipients = [];
  }

  /**
   * Encode the claim rewards method call data
   */
  private encodeClaimRewardsMethod(tokenId: string): string {
    const methodName = 'claimRewards';
    const types = ['uint256'];
    const params = [tokenId];

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
      tokenId: this.tokenId,
      stakingContractAddress: this.stakingContractAddress,
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

      if (body.clauses.length === 1) {
        const clause = body.clauses[0];
        if (clause.data && clause.data.startsWith(CLAIM_STAKING_REWARDS_METHOD_ID)) {
          // claimRewards should go to STARGATE_DELEGATION_ADDRESS
          this.tokenId = utils.decodeClaimRewardsData(clause.data);
          this.stakingContractAddress = clause.to || '0x0';
        }
      }

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
}
