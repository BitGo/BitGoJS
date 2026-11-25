import { CosmosCoin, CosmosKeyPair, GasAmountDetails } from '@bitgo/abstract-cosmos';
import { BaseCoin, BitGoBase, Environments, TransactionType, VerifyTransactionOptions } from '@bitgo/sdk-core';
import { BaseUnit, BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import * as _ from 'lodash';

import { KeyPair, TransactionBuilderFactory } from './lib';
import utils from './lib/utils';

export class Tia extends CosmosCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Tia(bitgo, staticsCoin);
  }

  /** @inheritDoc **/
  getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
  }

  /** @inheritDoc **/
  getBaseFactor(): string | number {
    return 1e6;
  }

  /** @inheritDoc **/
  isValidAddress(address: string): boolean {
    return utils.isValidAddress(address) || utils.isValidValidatorAddress(address);
  }

  /** @inheritDoc **/
  protected getPublicNodeUrl(): string {
    return Environments[this.bitgo.getEnv()].tiaNodeUrl;
  }

  /** @inheritDoc **/
  getDenomination(): string {
    return BaseUnit.TIA;
  }

  /** @inheritDoc **/
  getGasAmountDetails(): GasAmountDetails {
    return {
      gasAmount: '30000',
      gasLimit: 250000,
    };
  }

  /** @inheritDoc **/
  getKeyPair(publicKey: string): CosmosKeyPair {
    return new KeyPair({ pub: publicKey });
  }

  /** @inheritDoc **/
  getAddressFromPublicKey(publicKey: string): string {
    return new KeyPair({ pub: publicKey }).getAddress();
  }

  /**
   * @inheritDoc
   *
   * Overrides CosmosCoin.verifyTransaction because a recipient's memo can be expressed in
   * several ways, while explainTransaction() reports the plain on-chain address plus a single
   * tx-level `memo` field stamped on every output:
   *   1. folded into the address as `address?memoId=X` (see getAddressDetails) — the API shape;
   *   2. a `recipient.memo` field;
   *   3. a tx-level `txParams.memo` ({value, type}) — the web UI shape (bare address plus memo),
   *      also restored from intent.memo by resolveEffectiveTxParams on pending-approval re-signs.
   * Normalize both sides to the same {address, amount, memo?} shape before comparing. Empty
   * memos count as absent, and conflicting declarations are rejected. A declared memo must match
   * the transaction memo exactly; when none is declared, the transaction must not carry one.
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
        const declaredMemos = [memoId, recipient.memo, txParams.memo?.value].filter(
          (memo): memo is string => memo !== undefined && memo !== ''
        );
        if (declaredMemos.some((memo) => memo !== declaredMemos[0])) {
          throw new Error('Tx outputs does not match with expected txParams recipients');
        }
        const memo = declaredMemos[0];
        return { address, amount: recipient.amount, ...(memo !== undefined ? { memo } : {}) };
      });
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
