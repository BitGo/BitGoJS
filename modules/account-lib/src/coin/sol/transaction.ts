import BigNumber from 'bignumber.js';
import { BaseTransaction, TransactionType } from '../baseCoin';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { InvalidTransactionError, ParseTransactionError, SigningError } from '../baseCoin/errors';
import { Blockhash, PublicKey, Signer, Transaction as SolTransaction, SystemInstruction } from '@solana/web3.js';
import { Memo, Transfer, TransactionExplanation, TxData, WalletInit, Nonce, DurableNonceParams } from './iface';
import base58 from 'bs58';
import { getTransactionType, isValidRawTransaction, requiresAllSignatures } from './utils';
import { KeyPair } from '.';
import { instructionParamsFactory } from './instructionParamsFactory';
import { InstructionBuilderTypes } from './constants';
import { Entry, TransactionRecipient } from '../baseCoin/iface';

export class Transaction extends BaseTransaction {
  private _solTransaction: SolTransaction;
  protected _type: TransactionType;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  get solTransaction(): SolTransaction {
    return this._solTransaction;
  }

  set solTransaction(tx: SolTransaction) {
    this._solTransaction = tx;
  }

  set id(id: string) {
    this._id = id;
  }

  get id(): string {
    return this._id as string;
  }

  /** @inheritDoc */
  get signature(): string[] {
    const signatures: string[] = [];

    for (const solSignature of this._solTransaction.signatures) {
      if (solSignature.signature) {
        signatures.push(base58.encode(solSignature.signature));
      }
    }

    return signatures;
  }

  /**
   * Set the transaction type.
   *
   * @param {TransactionType} transactionType The transaction type to be set.
   */
  setTransactionType(transactionType: TransactionType): void {
    this._type = transactionType;
  }

  /** @inheritdoc */
  canSign(): boolean {
    return true;
  }

  /**
   * Signs transaction.
   *
   * @param {KeyPair} keyPair Signer keys.
   */
  async sign(keyPair: KeyPair[] | KeyPair): Promise<void> {
    if (!this._solTransaction || !this._solTransaction.recentBlockhash) {
      throw new SigningError('Nonce is required before signing');
    }
    if (!this._solTransaction || !this._solTransaction.feePayer) {
      throw new SigningError('feePayer is required before signing');
    }
    const keyPairs = keyPair instanceof Array ? keyPair : [keyPair];
    const signers: Signer[] = [];
    for (const kp of keyPairs) {
      const keys = kp.getKeys(true);
      if (!keys.prv) {
        throw new SigningError('Missing private key');
      }
      signers.push({ publicKey: new PublicKey(keys.pub), secretKey: keys.prv as Uint8Array });
    }
    try {
      this._solTransaction.partialSign(...signers);
    } catch (e) {
      throw e;
    }
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    if (!this._solTransaction) {
      throw new ParseTransactionError('Empty transaction');
    }
    // The signatures can have null signatures (which means they are required but yet unsigned)
    // In order to be able to serializer the txs, we have to change the requireAllSignatures based
    // on if the TX is fully signed or not
    const requireAllSignatures = requiresAllSignatures(this._solTransaction.signatures);
    try {
      // Based on the recomendation encoding found here https://docs.solana.com/developing/clients/jsonrpc-api#sendtransaction
      // We use base64 encoding
      return this._solTransaction.serialize({ requireAllSignatures }).toString('base64');
    } catch (e) {
      throw e;
    }
  }

  /**
   * Sets this transaction payload
   *
   * @param rawTransaction
   */
  fromRawTransaction(rawTransaction: string): void {
    try {
      isValidRawTransaction(rawTransaction);
      this._solTransaction = SolTransaction.from(Buffer.from(rawTransaction, 'base64'));

      if (this._solTransaction.signature && this._solTransaction.signature !== null) {
        this._id = base58.encode(this._solTransaction.signature);
      }
      const transactionType = getTransactionType(this._solTransaction);
      switch (transactionType) {
        case TransactionType.WalletInitialization:
          this.setTransactionType(TransactionType.WalletInitialization);
          break;
        case TransactionType.Send:
          this.setTransactionType(TransactionType.Send);
          break;
      }
      this.loadInputsAndOutputs();
    } catch (e) {
      throw e;
    }
  }

  /** @inheritdoc */
  toJson(): TxData {
    if (!this._solTransaction) {
      throw new ParseTransactionError('Empty transaction');
    }

    let durableNonce: DurableNonceParams | undefined;
    if (this._solTransaction.nonceInfo) {
      const nonceInstruction = SystemInstruction.decodeNonceAdvance(this._solTransaction.nonceInfo.nonceInstruction);
      durableNonce = {
        walletNonceAddress: nonceInstruction.noncePubkey.toString(),
        authWalletAddress: nonceInstruction.authorizedPubkey.toString(),
      };
    }

    const result: TxData = {
      id: this.id,
      feePayer: this._solTransaction.feePayer?.toString(),
      nonce: this.getNonce(),
      durableNonce: durableNonce,
      numSignatures: this.signature.length,
      instructionsData: instructionParamsFactory(this._type, this._solTransaction.instructions),
    };
    return result;
  }

  /**
   * Get the nonce from the Solana Transaction
   * Throws if not set
   */
  private getNonce(): Blockhash {
    if (this._solTransaction.recentBlockhash) {
      return this._solTransaction.recentBlockhash;
    } else if (this._solTransaction.nonceInfo) {
      return this._solTransaction.nonceInfo.nonce;
    } else {
      throw new InvalidTransactionError('Nonce is not set');
    }
  }

  /**
   * Load the input and output data on this transaction.
   */
  loadInputsAndOutputs(): void {
    if (!this._solTransaction || this._solTransaction.instructions?.length === 0) {
      return;
    }
    const outputs: Entry[] = [];
    const inputs: Entry[] = [];
    const instructionParams = instructionParamsFactory(this.type, this._solTransaction.instructions);

    for (const instruction of instructionParams) {
      switch (instruction.type) {
        case InstructionBuilderTypes.CreateNonceAccount:
          inputs.push({
            address: instruction.params.fromAddress,
            value: instruction.params.amount,
            coin: this._coinConfig.name,
          });
          break;
        case InstructionBuilderTypes.Transfer:
          inputs.push({
            address: instruction.params.fromAddress,
            value: instruction.params.amount,
            coin: this._coinConfig.name,
          });
          outputs.push({
            address: instruction.params.toAddress,
            value: instruction.params.amount,
            coin: this._coinConfig.name,
          });
          break;
      }
    }
    this._outputs = outputs;
    this._inputs = inputs;
  }

  /** @inheritDoc */
  explainTransaction(): TransactionExplanation {
    const decodedInstructions = instructionParamsFactory(this._type, this._solTransaction.instructions);

    let memo: string | undefined = undefined;
    let durableNonce: DurableNonceParams | undefined = undefined;

    let outputAmount = new BigNumber(0);
    const outputs: TransactionRecipient[] = [];

    for (const instruction of decodedInstructions) {
      switch (instruction.type) {
        case InstructionBuilderTypes.NonceAdvance:
          durableNonce = (instruction as Nonce).params;
          break;
        case InstructionBuilderTypes.Memo:
          memo = (instruction as Memo).params.memo;
          break;
        case InstructionBuilderTypes.Transfer:
          const transferInstruction = instruction as Transfer;
          outputs.push({
            address: transferInstruction.params.toAddress,
            amount: transferInstruction.params.amount,
          });
          outputAmount = outputAmount.plus(transferInstruction.params.amount);
          break;
        case InstructionBuilderTypes.CreateNonceAccount:
          const createInstruction = instruction as WalletInit;
          outputs.push({
            address: createInstruction.params.nonceAddress,
            amount: createInstruction.params.amount,
          });
          outputAmount = outputAmount.plus(createInstruction.params.amount);
          break;
        default:
          continue;
      }
    }

    const explainedTransaction = {
      displayOrder: [
        'id',
        'type',
        'blockhash',
        'durableNonce',
        'outputAmount',
        'changeAmount',
        'outputs',
        'changeOutputs',
        'fee',
        'memo',
      ],
      // TODO (STLX-8791): Need to figure out what id to use for unsigned transactions.
      id: this.id || 'undefined',
      type: TransactionType[this.type].toString(),
      changeOutputs: [],
      changeAmount: '0',
      outputAmount: outputAmount.toFixed(0),
      outputs: outputs,
      fee: {
        // TODO(STLX-8791): need to figure out how to get fee information.
        fee: '0',
      },
      memo: memo,
      blockhash: this.getNonce(),
      durableNonce: durableNonce,
    };

    return explainedTransaction;
  }
}
