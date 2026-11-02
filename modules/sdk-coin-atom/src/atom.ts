import { CosmosCoin, CosmosKeyPair, GasAmountDetails } from '@bitgo/abstract-cosmos';
import _ from 'lodash';
import BigNumber from 'bignumber.js';
import { BaseCoin, BitGoBase, Environments, TransactionType, VerifyTransactionOptions } from '@bitgo/sdk-core';
import { BaseUnit, BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { KeyPair, TransactionBuilderFactory } from './lib';
import { GAS_AMOUNT, GAS_LIMIT } from './lib/constants';
import utils from './lib/utils';

export class Atom extends CosmosCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Atom(bitgo, staticsCoin);
  }

  /** @inheritDoc **/
  getBaseFactor(): string | number {
    return 1e6;
  }

  getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
  }

  /** @inheritDoc **/
  isValidAddress(address: string): boolean {
    return utils.isValidAddress(address) || utils.isValidValidatorAddress(address);
  }

  /** @inheritDoc **/
  getDenomination(): string {
    return BaseUnit.ATOM;
  }

  /** @inheritDoc **/
  getGasAmountDetails(): GasAmountDetails {
    return {
      gasAmount: GAS_AMOUNT,
      gasLimit: GAS_LIMIT,
    };
  }

  /** @inheritDoc **/
  getKeyPair(publicKey: string): CosmosKeyPair {
    return new KeyPair({ pub: publicKey });
  }

  /**
   * Get the public node url from the Environments constant we have defined
   */
  protected getPublicNodeUrl(): string {
    return Environments[this.bitgo.getEnv()].atomNodeUrl;
  }

  getAddressFromPublicKey(pubKey: string): string {
    return new KeyPair({ pub: pubKey }).getAddress();
  }

  /**
   * @inheritDoc
   *
   * Overrides CosmosCoin.verifyTransaction because a recipient's memo can be expressed in
   * several ways, while explainTransaction() reports the plain on-chain address plus a single
   * tx-level `memo` field (stamped on every output):
   *   1. folded into the address as `address?memoId=X` (see getAddressDetails) — the form the
   *      enterprise UI and wallet APIs send for cosmos destinations requiring a memo;
   *   2. a `recipient.memo` field (ITransactionRecipient.memo);
   *   3. a tx-level `txParams.memo` ({value, type}) — the form the retail UI sends for cosmos
   *      destinations (plain address plus tx-level memo).
   * The base class compares raw address strings, so the combined form fails verification even
   * when the transaction was built correctly (reproduced as COINS-2285: every ATOM withdrawal
   * to a memo-required destination failed with 'Tx outputs does not match with expected
   * txParams recipients'). Normalize both sides to the same {address, amount, memo?} shape
   * before comparing. The expected memo is derived solely from txParams (user intent) — never
   * from the prebuild. A declared memo must match the transaction memo exactly; empty-string
   * memos are treated as absent, and conflicting distinct memo declarations are rejected as
   * ambiguous intent. When no memo is declared anywhere in txParams, the transaction must not
   * carry one either — a memo the user never approved is a prebuild-integrity failure.
   * Intent-based re-signs that would otherwise lose the tx-level memo get it restored into
   * txParams.memo by resolveEffectiveTxParams (sdk-core recipientUtils).
   */
  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    let totalAmount = new BigNumber(0);
    const { txPrebuild, txParams } = params;
    const rawTx = txPrebuild.txHex;
    if (!rawTx) {
      throw new Error('missing required tx prebuild property txHex');
    }
    const transaction = await this.getBuilder().from(rawTx).build();
    const explainedTx = transaction.explainTransaction();
    if (txParams.recipients && txParams.recipients.length > 0) {
      const filteredRecipients = txParams.recipients.map((recipient) => {
        const { address, memoId } = this.getAddressDetails(recipient.address);
        // A recipient's memo may be declared via the address `?memoId=` suffix, a `recipient.memo`
        // field, or the tx-level `txParams.memo.value`. Empty strings mean "no memo" (the UI and
        // wallet APIs send memo: '' when the field is unused, and explainTransaction() omits the
        // memo entirely for memo-less transactions). Conflicting distinct declarations are an
        // ambiguous intent and are rejected rather than silently resolved by precedence.
        const declaredMemos = [memoId, recipient.memo, txParams.memo?.value].filter(
          (memo): memo is string => memo !== undefined && memo !== ''
        );
        if (declaredMemos.some((memo) => memo !== declaredMemos[0])) {
          throw new Error('Tx outputs does not match with expected txParams recipients');
        }
        const memo = declaredMemos[0];
        return { address, amount: recipient.amount, ...(memo !== undefined ? { memo } : {}) };
      });
      // explainTransaction() stamps the tx-level memo on every output. A declared memo must
      // match it exactly; when no memo is declared anywhere in txParams, the tx must not carry
      // one either — a memo the user never approved is a prebuild-integrity failure. Intent-based
      // re-signs that would otherwise lose the memo get it restored into txParams.memo by
      // resolveEffectiveTxParams (see sdk-core recipientUtils).
      const filteredOutputs = explainedTx.outputs.map((output) => _.pick(output, ['address', 'amount', 'memo']));

      if (!_.isEqual(filteredOutputs, filteredRecipients)) {
        throw new Error('Tx outputs does not match with expected txParams recipients');
      }
      // WithdrawDelegatorRewards and ContractCall transaction don't have amount
      if (transaction.type !== TransactionType.StakingWithdraw && transaction.type !== TransactionType.ContractCall) {
        for (const recipient of txParams.recipients) {
          totalAmount = totalAmount.plus(recipient.amount);
        }
        if (!totalAmount.isEqualTo(explainedTx.outputAmount)) {
          throw new Error('Tx total amount does not match with expected total amount field');
        }
      }
    }
    return true;
  }
}
