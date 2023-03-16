import { fromB64 } from '@mysten/bcs';
import { mask } from 'superstruct';
import { ObjectId, SuiObjectRef } from '../types';
import { CommandArgument, Commands, TransactionCommand, TransactionInput } from './Commands';
import { getIdFromCallArg, Inputs, ObjectCallArg } from './Inputs';
import { TransactionDataBuilder, TransactionExpiration } from './TransactionData';
import { create } from './utils';

type TransactionResult = CommandArgument & CommandArgument[];

function createTransactionResult(index: number): TransactionResult {
  const baseResult: CommandArgument = { kind: 'Result', index };

  const nestedResults: CommandArgument[] = [];
  const nestedResultFor = (resultIndex: number): CommandArgument =>
    (nestedResults[resultIndex] ??= {
      kind: 'NestedResult',
      index,
      resultIndex,
    });

  return new Proxy(baseResult, {
    set() {
      throw new Error('The transaction result is a proxy, and does not support setting properties directly');
    },
    // TODO: Instead of making this return a concrete argument, we should ideally
    // make it reference-based (so that this gets resolved at build-time), which
    // allows re-ordering transactions.
    get(target, property) {
      // This allows this transaction argument to be used in the singular form:
      if (property in target) {
        return Reflect.get(target, property);
      }

      // Support destructuring:
      if (property === Symbol.iterator) {
        return function* () {
          let i = 0;
          while (true) {
            yield nestedResultFor(i);
            i++;
          }
        };
      }

      if (typeof property === 'symbol') return;

      const resultIndex = parseInt(property, 10);
      if (Number.isNaN(resultIndex) || resultIndex < 0) return;
      return nestedResultFor(resultIndex);
    },
  }) as TransactionResult;
}

// The maximum number of gas objects that can be selected for one transaction.
const MAX_GAS_OBJECTS = 256;

interface BuildOptions {
  onlyTransactionKind?: boolean;
}

/**
 * Transaction Builder
 */
export class Transaction {
  /** Returns `true` if the object is an instance of the Transaction builder class. */
  static is(obj: unknown): obj is Transaction {
    return !!obj && typeof obj === 'object';
    // return !!obj && typeof obj === 'object' && (obj as any)[TRANSACTION_BRAND] === true;
  }

  /**
   * Converts from a serialized transaction format to a `Transaction` class.
   * There are two supported serialized formats:
   * - A string returned from `Transaction#serialize`. The serialized format must be compatible, or it will throw an error.
   * - A byte array (or base64-encoded bytes) containing BCS transaction data.
   */
  static from(serialized: string | Uint8Array) {
    const tx = new Transaction();

    // Check for bytes:
    if (typeof serialized !== 'string' || !serialized.startsWith('{')) {
      tx.#transactionData = TransactionDataBuilder.fromBytes(
        typeof serialized === 'string' ? fromB64(serialized) : serialized
      );
    } else {
      tx.#transactionData = TransactionDataBuilder.restore(JSON.parse(serialized));
    }

    return tx;
  }

  /** A helper to retrieve the Transaction builder `Commands` */
  static get Commands() {
    return Commands;
  }

  /** A helper to retrieve the Transaction builder `Inputs` */
  static get Inputs() {
    return Inputs;
  }

  setSender(sender: string) {
    this.#transactionData.sender = sender;
  }
  setExpiration(expiration?: TransactionExpiration) {
    this.#transactionData.expiration = expiration;
  }
  setGasPrice(price: number | bigint) {
    this.#transactionData.gasConfig.price = String(price);
  }
  setGasBudget(budget: number | bigint) {
    this.#transactionData.gasConfig.budget = String(budget);
  }
  setGasPayment(payments: SuiObjectRef[]) {
    if (payments.length > MAX_GAS_OBJECTS) {
      throw new Error(`Payment objects exceed maximum amount ${MAX_GAS_OBJECTS}`);
    }
    this.#transactionData.gasConfig.payment = payments.map((payment) => mask(payment, SuiObjectRef));
  }

  #transactionData: TransactionDataBuilder;
  /** Get a snapshot of the transaction data, in JSON form: */
  get transactionData() {
    return this.#transactionData.snapshot();
  }

  constructor(transaction?: Transaction) {
    this.#transactionData = new TransactionDataBuilder(transaction ? transaction.#transactionData : undefined);
  }

  /** Returns an argument for the gas coin, to be used in a transaction. */
  get gas(): CommandArgument {
    return { kind: 'GasCoin' };
  }

  /**
   * Dynamically create a new input, which is separate from the `input`. This is important
   * for generated clients to be able to define unique inputs that are non-overlapping with the
   * defined inputs.
   *
   * For `Uint8Array` type automatically convert the input into a `Pure` CallArg, since this
   * is the format required for custom serialization.
   *
   */
  private input(type: 'object' | 'pure', value?: unknown) {
    const index = this.#transactionData.inputs.length;
    const input = create(
      {
        kind: 'Input',
        // bigints can't be serialized to JSON, so just string-convert them here:
        value: typeof value === 'bigint' ? String(value) : value,
        index,
        type,
      },
      TransactionInput
    );
    this.#transactionData.inputs.push(input);
    return input;
  }

  /**
   * Add a new object input to the transaction.
   */
  object(value: ObjectId | ObjectCallArg) {
    const id = getIdFromCallArg(value);
    // deduplicate
    const inserted = this.#transactionData.inputs.find((i) => i.type === 'object' && id === getIdFromCallArg(i.value));
    return inserted ?? this.input('object', value);
  }

  /**
   * Add a new non-object input to the transaction.
   */
  pure(
    value: unknown,
    /**
     * The BCS type to serialize the value into. If not provided, the type will automatically be determined
     * based on how the input is used.
     */
    type?: string
  ) {
    // TODO: we can also do some deduplication here
    return this.input('pure', type ? Inputs.Pure(type, value) : value);
  }

  /** Add a command to the transaction. */
  add(command: TransactionCommand) {
    // TODO: This should also look at the command arguments and add any referenced commands that are not present in this transaction.
    const index = this.#transactionData.commands.push(command);
    return createTransactionResult(index - 1);
  }

  // Method shorthands:

  splitCoin(...args: Parameters<typeof Commands['SplitCoin']>) {
    return this.add(Commands.SplitCoin(...args));
  }
  mergeCoins(...args: Parameters<typeof Commands['MergeCoins']>) {
    return this.add(Commands.MergeCoins(...args));
  }
  publish(...args: Parameters<typeof Commands['Publish']>) {
    return this.add(Commands.Publish(...args));
  }
  moveCall(...args: Parameters<typeof Commands['MoveCall']>) {
    return this.add(Commands.MoveCall(...args));
  }
  transferObjects(...args: Parameters<typeof Commands['TransferObjects']>) {
    return this.add(Commands.TransferObjects(...args));
  }
  makeMoveVec(...args: Parameters<typeof Commands['MakeMoveVec']>) {
    return this.add(Commands.MakeMoveVec(...args));
  }

  /**
   * Serialize the transaction to a string so that it can be sent to a separate context.
   * This is different from `build` in that it does not serialize to BCS bytes, and instead
   * uses a separate format that is unique to the transaction builder. This allows
   * us to serialize partially-complete transactions, that can then be completed and
   * built in a separate context.
   *
   * For example, a dapp can construct a transaction, but not provide gas objects
   * or a gas budget. The transaction then can be sent to the wallet, where this
   * information is automatically filled in (e.g. by querying for coin objects
   * and performing a dry run).
   */
  serialize() {
    return JSON.stringify(this.#transactionData.snapshot());
  }

  /** Build the transaction to BCS bytes. */
  async build({ onlyTransactionKind }: BuildOptions = {}): Promise<Uint8Array> {
    return this.#transactionData.build({ onlyTransactionKind });
  }

  /** Derive transaction digest */
  async getDigest(): Promise<string> {
    return this.#transactionData.getDigest();
  }
}
