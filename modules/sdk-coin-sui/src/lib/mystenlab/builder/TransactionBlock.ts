import { fromB64 } from '@mysten/bcs';
import { is, mask } from 'superstruct';
import { ObjectId, SuiObjectRef } from '../types';
import { Transactions, TransactionArgument, TransactionType, TransactionBlockInput } from './Transactions';
import { BuilderCallArg, getIdFromCallArg, Inputs, ObjectCallArg } from './Inputs';
import { TransactionBlockDataBuilder, TransactionExpiration } from './TransactionDataBlock';
import { create } from './utils';

type TransactionResult = TransactionArgument & TransactionArgument[];

function createTransactionResult(index: number): TransactionResult {
  const baseResult: TransactionArgument = { kind: 'Result', index };

  const nestedResults: TransactionArgument[] = [];
  const nestedResultFor = (resultIndex: number): TransactionArgument =>
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

const TRANSACTION_BRAND = Symbol.for('@mysten/transaction');

// The maximum number of gas objects that can be selected for one transaction.
const MAX_GAS_OBJECTS = 256;

// The maximum gas that is allowed.
const MAX_GAS = 1000000000;

// A guess about how much overhead each coin provides for gas calculations.
// @ts-ignore
const GAS_OVERHEAD_PER_COIN = 10n;

interface BuildOptions {
  onlyTransactionKind?: boolean;
}

/**
 * Transaction Builder
 */
export class TransactionBlock {
  /** Returns `true` if the object is an instance of the Transaction builder class. */
  static is(obj: unknown): obj is TransactionBlock {
    return !!obj && typeof obj === 'object' && (obj as any)[TRANSACTION_BRAND] === true;
  }

  /**
   * Converts from a serialize transaction kind (built with `build({ onlyTransactionKind: true })`) to a `Transaction` class.
   * Supports either a byte array, or base64-encoded bytes.
   */
  static fromKind(serialized: string | Uint8Array) {
    const tx = new TransactionBlock();

    tx.#blockData = TransactionBlockDataBuilder.fromKindBytes(
      typeof serialized === 'string' ? fromB64(serialized) : serialized
    );

    return tx;
  }

  /**
   * Converts from a serialized transaction format to a `Transaction` class.
   * There are two supported serialized formats:
   * - A string returned from `Transaction#serialize`. The serialized format must be compatible, or it will throw an error.
   * - A byte array (or base64-encoded bytes) containing BCS transaction data.
   */
  static from(serialized: string | Uint8Array) {
    const tx = new TransactionBlock();

    // Check for bytes:
    if (typeof serialized !== 'string' || !serialized.startsWith('{')) {
      tx.#blockData = TransactionBlockDataBuilder.fromBytes(
        typeof serialized === 'string' ? fromB64(serialized) : serialized
      );
    } else {
      tx.#blockData = TransactionBlockDataBuilder.restore(JSON.parse(serialized));
    }

    return tx;
  }

  /** A helper to retrieve the Transaction builder `Transactions` */
  static get Transactions() {
    return Transactions;
  }

  /** A helper to retrieve the Transaction builder `Inputs` */
  static get Inputs() {
    return Inputs;
  }

  setSender(sender: string) {
    this.#blockData.sender = sender;
  }
  /**
   * Sets the sender only if it has not already been set.
   * This is useful for sponsored transaction flows where the sender may not be the same as the signer address.
   */
  setSenderIfNotSet(sender: string) {
    if (!this.#blockData.sender) {
      this.#blockData.sender = sender;
    }
  }
  setExpiration(expiration?: TransactionExpiration) {
    this.#blockData.expiration = expiration;
  }
  setGasPrice(price: number | bigint) {
    this.#blockData.gasConfig.price = String(price);
  }
  setGasBudget(budget: number | bigint) {
    this.#blockData.gasConfig.budget = String(budget);
  }
  setGasOwner(owner: string) {
    this.#blockData.gasConfig.owner = owner;
  }
  setGasPayment(payments: SuiObjectRef[]) {
    if (payments.length >= MAX_GAS_OBJECTS) {
      throw new Error(`Payment objects exceed maximum amount ${MAX_GAS_OBJECTS}`);
    }
    this.#blockData.gasConfig.payment = payments.map((payment) => mask(payment, SuiObjectRef));
  }

  #blockData: TransactionBlockDataBuilder;
  /** Get a snapshot of the transaction data, in JSON form: */
  get blockData() {
    return this.#blockData.snapshot();
  }

  // Used to brand transaction classes so that they can be identified, even between multiple copies
  // of the builder.
  get [TRANSACTION_BRAND]() {
    return true;
  }

  constructor(transaction?: TransactionBlock) {
    this.#blockData = new TransactionBlockDataBuilder(transaction ? transaction.#blockData : undefined);
  }

  /** Returns an argument for the gas coin, to be used in a transaction. */
  get gas(): TransactionArgument {
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
  input(type: 'object' | 'pure', value?: unknown) {
    const index = this.#blockData.inputs.length;
    const input = create(
      {
        kind: 'Input',
        // bigints can't be serialized to JSON, so just string-convert them here:
        value: typeof value === 'bigint' ? String(value) : value,
        index,
        type,
      },
      TransactionBlockInput
    );
    this.#blockData.inputs.push(input);
    return input;
  }

  /**
   * Add a new object input to the transaction.
   */
  object(value: ObjectId | ObjectCallArg) {
    const id = getIdFromCallArg(value);
    // deduplicate
    const inserted = this.#blockData.inputs.find((i) => i.type === 'object' && id === getIdFromCallArg(i.value));
    return inserted ?? this.input('object', value);
  }

  /**
   * Add a new non-object input to the transaction.
   */
  pure(
    /**
     * The pure value that will be used as the input value. If this is a Uint8Array, then the value
     * is assumed to be raw bytes, and will be used directly.
     */
    value: unknown,
    /**
     * The BCS type to serialize the value into. If not provided, the type will automatically be determined
     * based on how the input is used.
     */
    type?: string
  ) {
    // TODO: we can also do some deduplication here
    return this.input(
      'pure',
      value instanceof Uint8Array ? Inputs.Pure(value) : type ? Inputs.Pure(value, type) : value
    );
  }

  /** Add a transaction to the transaction block. */
  add(transaction: TransactionType) {
    const index = this.#blockData.transactions.push(transaction);
    return createTransactionResult(index - 1);
  }

  // Method shorthands:

  splitCoins(...args: Parameters<(typeof Transactions)['SplitCoins']>) {
    return this.add(Transactions.SplitCoins(...args));
  }
  mergeCoins(...args: Parameters<(typeof Transactions)['MergeCoins']>) {
    return this.add(Transactions.MergeCoins(...args));
  }
  publish(...args: Parameters<(typeof Transactions)['Publish']>) {
    return this.add(Transactions.Publish(...args));
  }
  moveCall(...args: Parameters<(typeof Transactions)['MoveCall']>) {
    return this.add(Transactions.MoveCall(...args));
  }
  transferObjects(...args: Parameters<(typeof Transactions)['TransferObjects']>) {
    return this.add(Transactions.TransferObjects(...args));
  }
  makeMoveVec(...args: Parameters<(typeof Transactions)['MakeMoveVec']>) {
    return this.add(Transactions.MakeMoveVec(...args));
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
    return JSON.stringify(this.#blockData.snapshot());
  }

  /** Build the transaction to BCS bytes. */
  async build({ onlyTransactionKind }: BuildOptions = {}): Promise<Uint8Array> {
    return this.#blockData.build({ onlyTransactionKind });
  }

  /** Derive transaction digest */
  async getDigest(): Promise<string> {
    return this.#blockData.getDigest();
  }
}
