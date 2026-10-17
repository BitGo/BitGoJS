import {
  BaseUtils,
  BuildTransactionError,
  InvalidTransactionError,
  isValidEd25519PublicKey,
  ParseTransactionError,
  Recipient,
  RecoveryProviderError,
  TransactionType,
} from '@bitgo/sdk-core';
import BigNumber from 'bignumber.js';
import { SUI_ADDRESS_LENGTH } from './constants';
import { isPureArg } from './mystenlab/types/sui-bcs';
import { BCS, fromB64 } from '@mysten/bcs';
import {
  MethodNames,
  RequestAddStake,
  RequestWalrusStakeWithPool,
  RequestWalrusWithdrawStake,
  StakingProgrammableTransaction,
  WalrusStakingProgrammableTransaction,
  WalrusWithdrawStakeProgrammableTransaction,
  SuiBalanceInfo,
  SuiObjectInfo,
  SuiProgrammableTransaction,
  SuiTransaction,
  SuiTransactionType,
} from './iface';
import { Buffer } from 'buffer';
import {
  isValidSuiAddress,
  normalizeSuiAddress,
  normalizeSuiObjectId,
  SUI_TYPE_ARG,
  SuiJsonValue,
  SuiObjectRef,
} from './mystenlab/types';
import {
  builder,
  MergeCoinsTransaction,
  MoveCallTransaction,
  ObjectCallArg,
  SplitCoinsTransaction,
  TransactionBlockInput,
  TransactionType as TransactionCommandType,
} from './mystenlab/builder';
import { SIGNATURE_SCHEME_TO_FLAG } from './keyPair';
import blake2b from '@bitgo/blake2b';
import { TRANSACTION_DATA_MAX_SIZE } from './mystenlab/builder/TransactionDataBlock';
import { createSuiGrpcClient, SuiGrpcClient } from './grpcClient';

/**
 * First argument accepted by the exported util helpers: a pre-built gRPC
 * client (current style) or the legacy node URL (backwards-compatible with
 * the pre-migration signatures that took a JSON-RPC url).
 */
export type SuiGrpcClientOrUrl = SuiGrpcClient | string;

// Test-only seam: the url->client factory is captured in a mutable slot so
// url-style signatures can be tested without network (mirrors the
// __setSuiEsmOverridesForTest pattern in sui.ts).
let urlClientFactory: typeof createSuiGrpcClient = createSuiGrpcClient;

async function toGrpcClient(clientOrUrl: SuiGrpcClientOrUrl): Promise<SuiGrpcClient> {
  if (typeof clientOrUrl !== 'string') {
    return clientOrUrl;
  }
  // Legacy callers passed a bare node URL; infer the network from it the same
  // way the legacy JSON-RPC endpoints were addressed.
  return await urlClientFactory(clientOrUrl, clientOrUrl.includes('testnet') ? 'testnet' : 'mainnet');
}
import assert from 'assert';
import { BaseNetwork, coins, SuiCoin } from '@bitgo/statics';

export function isImmOrOwnedObj(obj: ObjectCallArg['Object']): obj is { ImmOrOwned: SuiObjectRef } {
  return 'ImmOrOwned' in obj;
}

export class Utils implements BaseUtils {
  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  isValidPrivateKey(key: string): boolean {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  isValidPublicKey(key: string): boolean {
    return isValidEd25519PublicKey(key);
  }

  /** @inheritdoc */
  isValidSignature(signature: string): boolean {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    throw new Error('Method not implemented.');
  }

  /**
   * Checks if raw transaction can be deserialized
   *
   * @param {string} rawTransaction - transaction in base64 string format
   * @returns {boolean} - the validation result
   */
  isValidRawTransaction(rawTransaction: string): boolean {
    try {
      const data = fromB64(rawTransaction);
      const deserialized = builder.de('TransactionData', data);
      builder.ser('TransactionData', deserialized, { maxSize: TRANSACTION_DATA_MAX_SIZE });
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Check the raw transaction has a valid format in the blockchain context, throw otherwise.
   *
   * @param {string} rawTransaction - Transaction in base64 string  format
   */
  validateRawTransaction(rawTransaction: string): void {
    if (!rawTransaction) {
      throw new ParseTransactionError('Invalid raw transaction: Undefined');
    }
    if (!this.isValidRawTransaction(rawTransaction)) {
      throw new ParseTransactionError('Invalid raw transaction');
    }
  }

  /**
   * Validates addresses to check if all exist and are valid Sui public keys
   *
   * @param {string} addresses The address to be validated
   * @param {string} fieldName Name of the field to validate, its needed to return which field is failing on case of error.
   */
  validateAddresses(addresses: string[], fieldName: string): void {
    for (const address of addresses) {
      this.validateAddress(address, fieldName);
    }
  }

  /**
   * Validates address to check if it exists and is a valid Sui public key
   *
   * @param {string} address The address to be validated
   * @param {string} fieldName Name of the field to validate, its needed to return which field is failing on case of error.
   */
  validateAddress(address: string, fieldName: string): void {
    if (!address || !isValidSuiAddress(normalizeSuiAddress(address))) {
      throw new BuildTransactionError(`Invalid or missing ${fieldName}, got: ${address}`);
    }
  }

  /** @inheritdoc */
  isValidAddress(address: string): boolean {
    return this.isHex(address) && this.getHexByteLength(address) === SUI_ADDRESS_LENGTH;
  }

  isHex(value: string): boolean {
    return /^(0x|0X)?[a-fA-F0-9]+$/.test(value) && value.length % 2 === 0;
  }

  getHexByteLength(value: string): number {
    // return /^(0x|0X)/.test(value) ? (value.length - 2) / 2 : value.length / 2;
    return /^(0x|0X)/.test(value) ? (value.length - 2) / 2 : value.length / 2;
  }

  /**
   * Returns whether or not the string is a valid amount
   *
   * @param {number[]} amounts - the amounts to validate
   * @returns {boolean} - the validation result
   */
  isValidAmounts(amounts: number[]): boolean {
    for (const amount of amounts) {
      if (!this.isValidAmount(amount)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns whether or not the string is a valid amount
   *
   * @param {number} amounts - the amount to validate
   * @returns {boolean} - the validation result
   */
  isValidAmount(amount: string | number): boolean {
    // Build the BigNumber directly from the raw value. Wrapping in Number() first would
    // truncate integers above 2^53 (e.g. large consolidation amounts in MIST), causing
    // valid amounts to be mis-validated.
    const bigNumberAmount = new BigNumber(amount);
    if (!bigNumberAmount.isInteger() || bigNumberAmount.isLessThanOrEqualTo(0)) {
      return false;
    }
    return true;
  }

  /**
   * Normalizes hex ids (addresses, object ids) to always contain the '0x' prefix.
   *
   * @param {string} id
   * @return {string}
   **/
  normalizeHexId(id: string): string {
    return id.startsWith('0x') ? id : '0x'.concat(id);
  }

  /**
   * Get transaction type by function name
   *
   * @param {MethodNames} fctName
   * @return {TransactionType}
   */
  getTransactionType(suiTransactionType: SuiTransactionType): TransactionType {
    switch (suiTransactionType) {
      case SuiTransactionType.Transfer:
      case SuiTransactionType.TokenTransfer:
        return TransactionType.Send;
      case SuiTransactionType.AddStake:
      case SuiTransactionType.WalrusStakeWithPool:
        return TransactionType.StakingAdd;
      case SuiTransactionType.WalrusRequestWithdrawStake:
        return TransactionType.StakingDeactivate;
      case SuiTransactionType.WithdrawStake:
      case SuiTransactionType.WalrusWithdrawStake:
        return TransactionType.StakingWithdraw;
      case SuiTransactionType.CustomTx:
        return TransactionType.CustomTx;
    }
  }

  /**
   * Get SUI transaction type
   *
   * @param {MethodNames} fctName
   * @return {TransactionType}
   */
  getSuiTransactionType(command: TransactionCommandType): SuiTransactionType {
    switch (command.kind) {
      case 'SplitCoins':
        if ((command as SplitCoinsTransaction).coin.kind === 'GasCoin') {
          return SuiTransactionType.Transfer;
        }
        return SuiTransactionType.TokenTransfer;
      case 'TransferObjects':
        return SuiTransactionType.Transfer;
      case 'MergeCoins':
        if ((command as MergeCoinsTransaction).destination.kind === 'GasCoin') {
          return SuiTransactionType.Transfer;
        }
        return SuiTransactionType.TokenTransfer;
      case 'MoveCall':
        if (command.target.endsWith(MethodNames.RequestAddStake)) {
          return SuiTransactionType.AddStake;
        } else if (command.target.endsWith(MethodNames.RequestWithdrawStake)) {
          return SuiTransactionType.WithdrawStake;
        } else if (
          command.target.endsWith(MethodNames.StakingPoolSplit) ||
          command.target.endsWith(MethodNames.PublicTransfer)
        ) {
          return SuiTransactionType.CustomTx;
        } else if (command.target.endsWith(MethodNames.WalrusStakeWithPool)) {
          return SuiTransactionType.WalrusStakeWithPool;
        } else if (
          command.target.endsWith(MethodNames.WalrusRequestWithdrawStake) ||
          command.target.endsWith(MethodNames.WalrusSplitStakedWal)
        ) {
          return SuiTransactionType.WalrusRequestWithdrawStake;
        } else if (command.target.endsWith(MethodNames.WalrusWithdrawStake)) {
          return SuiTransactionType.WalrusWithdrawStake;
        } else if (command.target.endsWith(MethodNames.RedeemFunds)) {
          // redeem_funds is a helper MoveCall used with BalanceWithdrawal to convert
          // address balance into a Coin<T>; it co-exists with Transfer or TokenTransfer commands.
          return SuiTransactionType.Transfer;
        } else {
          throw new InvalidTransactionError(`unsupported target method ${command.target}`);
        }
      default:
        throw new InvalidTransactionError(`unsupported transaction kind ${command.kind}`);
    }
  }

  getRecipients(tx: SuiTransaction<SuiProgrammableTransaction>): Recipient[] {
    const receipts: Recipient[] = [];
    const splitResults: number[] = [];
    tx.tx.transactions.forEach((transaction) => {
      if (transaction.kind === 'SplitCoins') {
        const index = transaction.amounts[0].index;
        const input = tx.tx.inputs[index] as any;
        splitResults.push(this.getAmount(input));
      }

      if (transaction.kind === 'MoveCall' && transaction.target.endsWith(MethodNames.StakingPoolSplit)) {
        const index = transaction.arguments[1].index;
        const input = tx.tx.inputs[index] as any;
        splitResults.push(this.getAmount(input));
      }
    });

    const destinations: string[] = [];
    tx.tx.transactions.forEach((transaction) => {
      if (transaction.kind === 'TransferObjects') {
        const index = transaction.address.index;
        const input = tx.tx.inputs[index] as any;
        destinations.push(this.getAddress(input));
      }
    });
    // In Path 1b (sponsored, address-balance-only), after all recipient SplitCoins/TransferObjects
    // there may be one extra TransferObjects that returns change to the sender.  That transfer
    // has no corresponding SplitCoins entry, so destinations.length may be splitResults.length+1.
    // Limit the zip to splitResults.length so the change transfer is not counted as a recipient.
    destinations.slice(0, splitResults.length).map((address, i) => {
      receipts.push({
        address: address,
        amount: splitResults[i].toString(),
      });
    });

    // Full-amount addr-bal transfer: the last recipient receives mergedObject (addrCoin)
    // directly via TransferObjects rather than via SplitCoins, to avoid leaving a zero-balance
    // Coin<T> unused (UnusedValueWithoutDrop). Recover amounts from BalanceWithdrawal.
    //
    // Single-recipient (0 SplitCoins, 1 TransferObjects): receipts is empty — recover the
    // full withdrawal amount and push one receipt.
    //
    // Multi-recipient (N-1 SplitCoins, N TransferObjects): receipts has N-1 entries — recover
    // the last recipient's amount as BalanceWithdrawal.amount - sum(splitResults).
    if (receipts.length === 0 && destinations.length > 0) {
      const withdrawalInput = (tx.tx.inputs as any[]).find(
        (input: any) => input?.BalanceWithdrawal != null || input?.value?.BalanceWithdrawal != null
      ) as any;
      if (withdrawalInput) {
        const bw = withdrawalInput.BalanceWithdrawal ?? withdrawalInput.value?.BalanceWithdrawal;
        const amount = String(bw.reservation?.MaxAmountU64 ?? bw.amount ?? 0);
        destinations.forEach((address) => {
          receipts.push({ address, amount });
        });
      }
    } else if (receipts.length > 0 && destinations.length === receipts.length + 1) {
      const lastDest = destinations[destinations.length - 1];
      // Path 1b with change returns the surplus to the sender via a trailing TransferObjects —
      // this destination is intentionally excluded by the zip-limit above and must not be
      // re-added as a recipient. Only proceed when the last destination is NOT the sender
      // (i.e. it is the final recipient in a multi-recipient full-amount addr-bal send).
      if (lastDest !== tx.sender) {
        const withdrawalInput = (tx.tx.inputs as any[]).find(
          (input: any) => input?.BalanceWithdrawal != null || input?.value?.BalanceWithdrawal != null
        ) as any;
        if (withdrawalInput) {
          const bw = withdrawalInput.BalanceWithdrawal ?? withdrawalInput.value?.BalanceWithdrawal;
          const totalWithdrawn = Number(bw.reservation?.MaxAmountU64 ?? bw.amount ?? 0);
          const splitTotal = splitResults.reduce((sum, v) => sum + v, 0);
          const lastAmount = totalWithdrawn - splitTotal;
          if (lastAmount > 0) {
            receipts.push({ address: lastDest, amount: String(lastAmount) });
          }
        }
      }
    }

    tx.tx.transactions.forEach((transaction) => {
      if (transaction.kind === 'MoveCall' && transaction.target.endsWith(MethodNames.PublicTransfer)) {
        const destinationArg = transaction.arguments[1];
        const destinationInput = tx.tx.inputs[destinationArg.index] as any;
        const destination = this.getAddress(destinationInput);

        const movingObject = transaction.arguments[0];
        if (movingObject.kind === 'Input') {
          receipts.push({
            address: destination,
            amount: '0', // set 0, not able to get amount merely from parsing
            data: 'unknown amount',
          });
        } else if (movingObject.kind === 'Result') {
          receipts.push({
            address: destination,
            amount: splitResults[movingObject.index].toString(),
          });
        }
      }
    });

    return receipts;
  }

  /**
   * Get add staking requests
   *
   * @param {StakingProgrammableTransaction} tx: staking transaction object
   * @return {RequestAddStake[]}  add staking requests
   */
  getStakeRequests(tx: StakingProgrammableTransaction): RequestAddStake[] {
    const amounts: number[] = [];
    const addresses: string[] = [];
    tx.transactions.forEach((transaction, i) => {
      if (transaction.kind === 'SplitCoins') {
        const amountInputIdx = ((transaction as SplitCoinsTransaction).amounts[0] as TransactionBlockInput).index;
        amounts.push(utils.getAmount(tx.inputs[amountInputIdx] as TransactionBlockInput));
      }
      if (
        transaction.kind === 'MoveCall' &&
        (transaction as MoveCallTransaction).target.endsWith('::sui_system::request_add_stake')
      ) {
        const validatorAddressInputIdx = ((transaction as MoveCallTransaction).arguments[2] as TransactionBlockInput)
          .index;
        const validatorAddress = utils.getAddress(tx.inputs[validatorAddressInputIdx] as TransactionBlockInput);
        addresses.push(validatorAddress);
      }
    });
    return addresses.map((address, index) => {
      return {
        validatorAddress: address,
        amount: amounts[index],
      } as RequestAddStake;
    });
  }

  getWalrusStakeWithPoolRequests(tx: WalrusStakingProgrammableTransaction): RequestWalrusStakeWithPool[] {
    const amounts: number[] = [];
    const addresses: string[] = [];
    tx.transactions.forEach((transaction, i) => {
      if (transaction.kind === 'SplitCoins') {
        const amountInputIdx = ((transaction as SplitCoinsTransaction).amounts[0] as TransactionBlockInput).index;
        amounts.push(utils.getAmount(tx.inputs[amountInputIdx] as TransactionBlockInput));
      }
      if (
        transaction.kind === 'MoveCall' &&
        (transaction as MoveCallTransaction).target.endsWith('::staking::stake_with_pool')
      ) {
        const validatorAddressInputIdx = ((transaction as MoveCallTransaction).arguments[2] as TransactionBlockInput)
          .index;
        const validatorAddress = utils.getAddress(tx.inputs[validatorAddressInputIdx] as TransactionBlockInput);
        addresses.push(validatorAddress);
      }
    });
    return addresses.map((address, index) => {
      return {
        validatorAddress: address,
        amount: amounts[index],
      } as RequestWalrusStakeWithPool;
    });
  }

  isWalrusRequestWithdrawStakeTx(tx: WalrusWithdrawStakeProgrammableTransaction): boolean {
    return tx.transactions
      .filter((transaction) => 'kind' in transaction && transaction.kind === 'MoveCall')
      .some(({ target }) => target.endsWith('::staking::request_withdraw_stake'));
  }

  getWalrusWithdrawStakeRequests(tx: WalrusWithdrawStakeProgrammableTransaction): RequestWalrusWithdrawStake {
    let amount: number | undefined = undefined;
    let stakedWal: SuiObjectRef;
    let stakedWalInputIdx = -1;

    // TS won't let us use filter
    const moveCalls: MoveCallTransaction[] = [];
    tx.transactions.forEach((transaction) => {
      if (transaction.kind === 'MoveCall') {
        moveCalls.push(transaction);
      }
    });

    if (moveCalls.length === 1) {
      // This is either request_withdraw full or withdraw full (either way, no amount)
      stakedWalInputIdx = ((moveCalls[0] as MoveCallTransaction).arguments[1] as TransactionBlockInput).index;
    } else if (moveCalls.length === 2) {
      // This is request_withdraw partial
      const amountInputIdx = ((moveCalls[0] as MoveCallTransaction).arguments[1] as TransactionBlockInput).index;
      amount = utils.getAmount(tx.inputs[amountInputIdx] as TransactionBlockInput);

      stakedWalInputIdx = ((moveCalls[0] as MoveCallTransaction).arguments[0] as TransactionBlockInput).index;
    } else {
      throw new InvalidTransactionError('Invalid number of MoveCall transactions');
    }

    let input = tx.inputs[stakedWalInputIdx];
    if ('value' in input) {
      input = input.value;
    }
    if ('Object' in input && isImmOrOwnedObj(input.Object)) {
      stakedWal = utils.normalizeSuiObjectRef(input.Object.ImmOrOwned as SuiObjectRef);
    } else {
      throw new InvalidTransactionError(
        `Expected StakedWal object at input index ${stakedWalInputIdx}, found ${input}`
      );
    }

    return { amount, stakedWal };
  }

  getAmount(input: SuiJsonValue | TransactionBlockInput): number {
    return isPureArg(input)
      ? builder.de(BCS.U64, Buffer.from(new Uint16Array(input.Pure)).toString('base64'), 'base64')
      : (input as TransactionBlockInput).value;
  }

  getAddress(input: TransactionBlockInput): string {
    if (input.hasOwnProperty('value')) {
      return isPureArg(input.value)
        ? normalizeSuiAddress(
            builder.de(BCS.ADDRESS, Buffer.from(new Uint16Array(input.value?.Pure)).toString('base64'), 'base64')
          )
        : (input as TransactionBlockInput).value;
    } else {
      return isPureArg(input)
        ? normalizeSuiAddress(
            builder.de(BCS.ADDRESS, Buffer.from(new Uint16Array(input.Pure)).toString('base64'), 'base64')
          )
        : (input as TransactionBlockInput).value;
    }
  }

  normalizeCoins(coins: any[]): SuiObjectRef[] {
    return coins.map((coin) => {
      return utils.normalizeSuiObjectRef(coin);
    });
  }

  normalizeSuiObjectRef(obj: SuiObjectRef): SuiObjectRef {
    return {
      objectId: normalizeSuiObjectId(obj.objectId),
      version: Number(obj.version),
      digest: obj.digest,
    };
  }

  transactionInput(type: 'object' | 'pure', index = 0, value?: unknown): TransactionBlockInput {
    return {
      kind: 'Input',
      value: typeof value === 'bigint' ? String(value) : value,
      index,
      type,
    };
  }

  getAddressFromPublicKey(publicKey: string): string {
    const PUBLIC_KEY_SIZE = 32;
    const tmp = new Uint8Array(PUBLIC_KEY_SIZE + 1);
    const pubBuf = Buffer.from(publicKey, 'hex');
    tmp.set([SIGNATURE_SCHEME_TO_FLAG['ED25519']]); // ED25519: 0x00,
    tmp.set(pubBuf, 1);
    return normalizeSuiAddress(
      blake2b(PUBLIC_KEY_SIZE)
        .update(tmp)
        .digest('hex')
        .slice(0, SUI_ADDRESS_LENGTH * 2)
    );
  }

  /**
   * Test-only: swap (or reset with undefined) the factory used for url-style
   * calls, mirroring the __setSuiEsmOverridesForTest seam in sui.ts.
   */
  __setUrlClientFactoryForTest(factory: typeof createSuiGrpcClient | undefined): void {
    urlClientFactory = factory ?? createSuiGrpcClient;
  }

  /**
   * Estimates the fee (in MIST) for a transaction by dry-running it against the
   * Sui node with full transaction checks (sui_dryRunTransactionBlock parity).
   * The returned estimate is max(computation + storage - rebate, computation).
   * @param {SuiGrpcClient | string} clientOrUrl - A pre-built Sui gRPC client, or the
   *   legacy node URL (backwards compatible; the network is inferred from the URL).
   * @param {string} txHex - The serialized transaction in base64 format.
   * @returns {Promise<BigNumber>} - The estimated fee, floored at the computation cost.
   * @throws when the simulation response carries no gas summary or any gas field,
   *   or when the simulated transaction fails execution.
   */
  async getFeeEstimate(clientOrUrl: SuiGrpcClientOrUrl, txHex: string): Promise<BigNumber> {
    const client = await toGrpcClient(clientOrUrl);
    const result = await client.core.simulateTransaction({
      transaction: Buffer.from(txHex, 'base64'),
      // Preserve sui_dryRunTransactionBlock semantics: unchecked simulation is
      // the devInspect equivalent and would return effects for transactions
      // dry-run rejects, skewing the derived gas budget.
      checksEnabled: true,
      include: { effects: true },
    });

    const effects = result.$kind === 'Transaction' ? result.Transaction?.effects : undefined;
    if (!effects || !effects.gasUsed) {
      throw new Error(`Failed to get fee estimate: no gas summary in simulation response`);
    }

    if (!effects.status?.success) {
      console.error(`Dry run failed, could not automatically determine a budget for txHex ${txHex}`);
      throw new Error(`Failed to get fee estimate`);
    }

    const gasObject = effects.gasUsed;

    // A proto shape drift would otherwise default every field to '0' and turn
    // the estimate into a near-zero fee that fails only at broadcast.
    const { storageCost, computationCost, storageRebate } = gasObject;
    if (storageCost === undefined || storageCost === null) {
      throw new Error('Failed to get fee estimate: missing storageCost in simulation response');
    }
    if (computationCost === undefined || computationCost === null) {
      throw new Error('Failed to get fee estimate: missing computationCost in simulation response');
    }
    if (storageRebate === undefined || storageRebate === null) {
      throw new Error('Failed to get fee estimate: missing storageRebate in simulation response');
    }

    const netCost = new BigNumber(computationCost).plus(storageCost).minus(storageRebate);

    return netCost.comparedTo(computationCost) > 0 ? netCost : new BigNumber(computationCost);
  }

  /**
   * Returns the current epoch and chain identifier of the Sui network via the gRPC ledger service.
   * The chain identifier is the digest of the genesis checkpoint (sequence number 0), matching
   * what the legacy sui_getCheckpoint('0') JSON-RPC call returned.
   * @param {SuiGrpcClient | string} clientOrUrl - A pre-built Sui gRPC client, or the
   *   legacy node URL (backwards compatible; the network is inferred from the URL).
   * @returns {Promise<{ epoch: number; chainId: string }>} - The current epoch and chain identifier.
   */
  async getChainContext(clientOrUrl: SuiGrpcClientOrUrl): Promise<{ epoch: number; chainId: string }> {
    const client = await toGrpcClient(clientOrUrl);
    const [systemStateResponse, chainIdResponse] = await Promise.all([
      client.core.getCurrentSystemState(),
      client.core.getChainIdentifier(),
    ]);
    const epoch = systemStateResponse.systemState?.epoch;
    const chainId = chainIdResponse.chainIdentifier;
    if (epoch === undefined || epoch === null) {
      throw new Error('Failed to get current epoch from gRPC system state');
    }
    if (!chainId) {
      throw new Error('Failed to get chain identifier from gRPC service info');
    }
    return { epoch: Number(epoch), chainId };
  }

  /**
   * Returns balance information for an address via the gRPC balance service.
   * totalBalance = Coin<T> object balance + SIP-58 address-system balance
   * (fundsInAddressBalance is exposed separately for transaction building and
   * must not be added to totalBalance again).
   * @param {SuiGrpcClient | string} clientOrUrl - A pre-built Sui gRPC client, or the
   *   legacy node URL (backwards compatible; the network is inferred from the URL).
   * @param {string} owner - The address to query.
   * @param {string} [coinType] - The coin type; defaults to 0x2::sui::SUI.
   * @returns {Promise<SuiBalanceInfo>} - {totalBalance, coinObjectBalance, fundsInAddressBalance}.
   * @throws when the gRPC response carries no balance object.
   */
  async getBalance(clientOrUrl: SuiGrpcClientOrUrl, owner: string, coinType?: string): Promise<SuiBalanceInfo> {
    const client = await toGrpcClient(clientOrUrl);
    if (coinType === undefined) {
      coinType = SUI_TYPE_ARG;
    }
    const response = await client.core.getBalance({ owner, coinType });
    if (!response.balance) {
      throw new Error(`Failed to get balance: no balance object in gRPC response for ${owner}`);
    }
    // The gRPC balance service reports the Coin<T> object balance and the SIP-58
    // address-system balance separately, so totalBalance is their sum (the legacy
    // suix_getBalance totalBalance included both).
    const coinObjectBalance = (response.balance?.coinBalance ?? '0').toString();
    const fundsInAddressBalance = (response.balance?.addressBalance ?? '0').toString();
    const totalBalance = new BigNumber(coinObjectBalance).plus(new BigNumber(fundsInAddressBalance)).toString();
    return {
      totalBalance,
      coinObjectBalance,
      fundsInAddressBalance,
    };
  }

  /**
   * Returns all unfiltered spendable coins of an address (legacy suix_getCoins
   * semantics) via the gRPC list service: bare coin type, numeric version,
   * objectId and balance per entry.
   * @param {SuiGrpcClient | string} clientOrUrl - A pre-built Sui gRPC client, or the
   *   legacy node URL (backwards compatible; the network is inferred from the URL).
   * @param {string} owner - The address to query.
   * @param {string} [coinType] - The coin type; defaults to 0x2::sui::SUI.
   * @returns {Promise<SuiObjectInfo[]>} - One entry per owned coin object.
   * @throws {RecoveryProviderError} when the node call fails.
   */
  async getInputCoins(clientOrUrl: SuiGrpcClientOrUrl, owner: string, coinType?: string): Promise<SuiObjectInfo[]> {
    const client = await toGrpcClient(clientOrUrl);
    if (coinType === undefined) {
      coinType = SUI_TYPE_ARG;
    }
    const resolvedCoinType = coinType;
    const data: Array<{ objectId: string; version: string; digest: string; balance: string }> = [];
    let cursor: string | null = null;
    let hasNextPage = true;
    try {
      while (hasNextPage) {
        const page = await client.core.listCoins({ owner, coinType: resolvedCoinType, cursor });
        data.push(...page.objects);
        hasNextPage = page.hasNextPage;
        cursor = page.cursor;
      }
    } catch (e) {
      console.error(`Failed to get input coins from the node ${e}`);
      throw new RecoveryProviderError(`Failed to get input coins from the node.`, e);
    }
    return data
      .filter((object) => object.balance !== undefined)
      .map((object) => {
        // gRPC surfaces the coin type as 0x2::coin::Coin<T>; the legacy suix_getCoins
        // response carried the bare coin type, which callers still expect.
        return {
          coinType: resolvedCoinType,
          objectId: object.objectId,
          version: object.version,
          digest: object.digest,
          balance: new BigNumber(object.balance),
        } as SuiObjectInfo;
      });
  }

  /**
   * Broadcasts a signed transaction to the Sui node over gRPC and returns the
   * transaction digest. Signatures are base64 strings (the gRPC layer decodes
   * them into BCS).
   * @param {SuiGrpcClient | string} clientOrUrl - A pre-built Sui gRPC client, or the
   *   legacy node URL (backwards compatible; the network is inferred from the URL).
   * @param {string} serializedTx - The serialized transaction in base64 format.
   * @param {string[]} signatures - Base64-encoded signatures for the transaction.
   * @returns {Promise<string>} - The transaction digest.
   * @throws when the node response carries no digest or the broadcast fails.
   */
  async executeTransactionBlock(
    clientOrUrl: SuiGrpcClientOrUrl,
    serializedTx: string,
    signatures: string[]
  ): Promise<string> {
    const client = await toGrpcClient(clientOrUrl);
    let digest: string | undefined;
    try {
      const result = await client.core.executeTransaction({
        transaction: Buffer.from(serializedTx, 'base64'),
        signatures,
      });
      digest = (result.Transaction ?? result.FailedTransaction)?.digest;
    } catch (e) {
      throw new Error(`${(e as Error).message}`);
    }
    if (!digest) {
      throw new Error(`Failed to broadcast transaction, no digest in response`);
    }
    return digest;
  }

  validateNonNegativeNumber(defaultVal: number, errorMsg: string, inputVal?: number): number {
    if (inputVal === undefined) {
      return defaultVal;
    }
    let nonNegativeNum: number;
    try {
      nonNegativeNum = Number(inputVal);
    } catch (e) {
      throw new Error(errorMsg);
    }
    if (isNaN(nonNegativeNum.valueOf()) || nonNegativeNum < 0) {
      throw new Error(errorMsg);
    }
    return nonNegativeNum;
  }

  getSuiTokenFromAddress(packageId: string, network: BaseNetwork) {
    const tokens = coins.filter((coin) => {
      return (
        coin instanceof SuiCoin &&
        coin.network.type === network.type &&
        coin.packageId.toLowerCase() === packageId.toLowerCase()
      );
    });
    const tokensArray = tokens.map((token) => token);
    if (tokensArray.length >= 1) {
      // there should never be two tokens with the same contract address, so we assert that here
      assert(tokensArray.length === 1);
      return tokensArray[0];
    }
    return undefined;
  }

  selectObjectsInDescOrderOfBalance(objs: SuiObjectInfo[], limit: BigNumber): SuiObjectInfo[] {
    objs = objs.sort((a, b) => {
      return b.balance.minus(a.balance).toNumber();
    });
    return objs.reduce((acc, obj) => {
      if (limit.gt(0)) {
        acc.push(obj);
        limit = limit.minus(obj.balance);
      }
      return acc;
    }, [] as SuiObjectInfo[]);
  }
}

const utils = new Utils();
export default utils;

export enum AppId {
  Sui = 0,
}

export enum IntentVersion {
  V0 = 0,
}

export enum IntentScope {
  TransactionData = 0,
  TransactionEffects = 1,
  CheckpointSummary = 2,
  PersonalMessage = 3,
}

export type Intent = [IntentScope, IntentVersion, AppId];
