import { TransactionType, InvalidTransactionError } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Transaction as VetTransaction, Secp256k1 } from '@vechain/sdk-core';
import { Transaction } from './transaction';
import { VetTransactionData } from '../iface';
import EthereumAbi from 'ethereumjs-abi';
import utils from '../utils';
import BigNumber from 'bignumber.js';
import { addHexPrefix } from 'ethereumjs-util';
import { ZERO_VALUE_AMOUNT } from '../constants';

export class DelegateClauseTransaction extends Transaction {
  private _stakingContractAddress: string;
  private _tokenId: number;
  private _delegateForever = true;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._type = TransactionType.StakingDelegate;
  }

  get stakingContractAddress(): string {
    return this._stakingContractAddress;
  }

  set stakingContractAddress(address: string) {
    this._stakingContractAddress = address;
  }

  get tokenId(): number {
    return this._tokenId;
  }

  set tokenId(tokenId: number) {
    this._tokenId = tokenId;
  }

  get delegateForever(): boolean {
    return this._delegateForever;
  }

  set delegateForever(delegateForever: boolean) {
    this._delegateForever = delegateForever;
  }

  buildClauses(): void {
    if (!this.stakingContractAddress) {
      throw new Error('Staking contract address is not set');
    }

    utils.validateDelegationContractAddress(this.stakingContractAddress, this._coinConfig);

    if (this.tokenId === undefined || this.tokenId === null) {
      throw new Error('Token ID is not set');
    }

    const data = this.getDelegateData(this.tokenId, this.delegateForever);
    this._transactionData = data;

    // Create the clause for delegation
    this._clauses = [
      {
        to: this.stakingContractAddress,
        value: ZERO_VALUE_AMOUNT,
        data: this._transactionData,
      },
    ];

    // Set recipients based on the clauses
    this._recipients = [
      {
        address: this.stakingContractAddress,
        amount: ZERO_VALUE_AMOUNT,
      },
    ];
  }
  /**
   * Encodes delegation transaction data using ethereumjs-abi for delegate method
   *
   * @param {number} tokenId - The Token ID for delegation
   * @returns {string} - The encoded transaction data
   */
  getDelegateData(levelId: number, delegateForever = true): string {
    const methodName = 'delegate';
    const types = ['uint256', 'bool'];
    const params = [levelId, delegateForever];

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
      value: ZERO_VALUE_AMOUNT,
      sender: this.sender,
      to: this.stakingContractAddress,
      stakingContractAddress: this.stakingContractAddress,
      amountToStake: ZERO_VALUE_AMOUNT,
      nftTokenId: this.tokenId,
      autorenew: this.delegateForever,
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

      // Set delegation-specific properties
      if (body.clauses.length > 0) {
        const clause = body.clauses[0];
        if (clause.to) {
          this.stakingContractAddress = clause.to;
        }
        if (clause.data) {
          this.transactionData = clause.data;
          const decoded = utils.decodeDelegateClauseData(clause.data);
          this.tokenId = decoded.tokenId;
          this.delegateForever = decoded.delegateForever;
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
