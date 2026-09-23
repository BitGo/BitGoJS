import { CosmosCoin, CosmosKeyPair, GasAmountDetails } from '@bitgo/abstract-cosmos';
import { BaseCoin, BitGoBase, Environments, TransactionType, VerifyTransactionOptions } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, BaseUnit, coins } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import * as _ from 'lodash';
import { KeyPair, TransactionBuilderFactory } from './lib';
import { GAS_AMOUNT, GAS_LIMIT } from './lib/constants';
import utils from './lib/utils';

export class Zeta extends CosmosCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Zeta(bitgo, staticsCoin);
  }

  /** @inheritDoc **/
  getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
  }

  /** @inheritDoc **/
  getBaseFactor(): string | number {
    return 1e18;
  }

  /** @inheritDoc **/
  isValidAddress(address: string): boolean {
    return utils.isValidAddress(address) || utils.isValidValidatorAddress(address);
  }

  /** @inheritDoc **/
  protected getPublicNodeUrl(): string {
    return Environments[this.bitgo.getEnv()].zetaNodeUrl;
  }

  /** @inheritDoc **/
  getDenomination(): string {
    return BaseUnit.ZETA;
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

  /** @inheritDoc **/
  getAddressFromPublicKey(publicKey: string): string {
    return new KeyPair({ pub: publicKey }).getAddress();
  }

  /** @inheritDoc **/
  protected async getAccountDetails(senderAddress: string): Promise<string[]> {
    const response = await this.getAccountFromNode(senderAddress);
    if (response.status !== 200) {
      throw new Error('Account not found');
    }
    return [response.body.account.base_account.account_number, response.body.account.base_account.sequence];
  }

  /**
   * @inheritDoc
   *
   * Overrides CosmosCoin.verifyTransaction to fix a ZETA-specific gap: recipients can carry
   * their memo folded into the address as `address?memoId=X` (the BitGo combined
   * address+memo convention - see getAddressDetails), but explainTransaction() always
   * reports the plain on-chain address plus a separate `memo` field. The base class
   * compares the two sides as raw strings, so any memo-tagged recipient fails verification
   * even when the transaction was built correctly - this reproduced a live incident where a
   * client could never sign a correctly-built, pending ZETA transaction to a memo'd
   * recipient. Normalize both sides to the same {address, amount, memo?} shape before
   * comparing.
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
        return { address, amount: recipient.amount, ...(memoId !== undefined ? { memo: memoId } : {}) };
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
