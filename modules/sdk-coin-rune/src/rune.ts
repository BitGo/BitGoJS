import {
  CosmosCoin,
  CosmosKeyPair,
  CosmosLikeCoinRecoveryOutput,
  CosmosTransaction,
  FeeData,
  GasAmountDetails,
  RecoveryOptions,
  SendMessage,
} from '@bitgo/abstract-cosmos';
import {
  BaseCoin,
  BitGoBase,
  Ecdsa,
  ECDSAUtils,
  Environments,
  TransactionType,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, BaseUnit, coins } from '@bitgo/statics';
import { KeyPair, TransactionBuilderFactory } from './lib';
import { GAS_AMOUNT, GAS_LIMIT, RUNE_FEES, ROOT_PATH } from './lib/constants';
import { RuneUtils } from './lib/utils';
import { BigNumber } from 'bignumber.js';
const bech32 = require('bech32-buffer');
import * as _ from 'lodash';
import { Coin } from '@cosmjs/stargate';
import { createHash } from 'crypto';

export class Rune extends CosmosCoin {
  protected readonly _utils: RuneUtils;
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }
    this._staticsCoin = staticsCoin;
    this._utils = new RuneUtils();
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Rune(bitgo, staticsCoin);
  }

  /** @inheritDoc **/
  getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
  }

  /**
   * Factor between the coin's base unit and its smallest subdivison
   */
  public getBaseFactor(): number {
    return 1e8;
  }

  isValidAddress(address: string): boolean {
    return this._utils.isValidAddress(address) || this._utils.isValidValidatorAddress(address);
  }

  /** @inheritDoc **/
  protected getPublicNodeUrl(): string {
    return Environments[this.bitgo.getEnv()].runeNodeUrl;
  }

  /** @inheritDoc **/
  getDenomination(): string {
    return BaseUnit.RUNE;
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
      const filteredRecipients = txParams.recipients?.map((recipient) => _.pick(recipient, ['address', 'amount']));
      let filteredOutputs = explainedTx.outputs.map((output) => _.pick(output, ['address', 'amount']));

      filteredOutputs = filteredOutputs.map((output) => {
        const prefix = this._utils.getNetworkPrefix();
        const convertedAddress = bech32.encode(prefix, output.address);
        return {
          ...output,
          address: convertedAddress,
        };
      });

      if (!_.isEqual(filteredOutputs, filteredRecipients)) {
        throw new Error('Tx outputs does not match with expected txParams recipients');
      }
      // WithdrawDelegatorRewards and ContractCall transaction don't have amount
      if (transaction.type !== TransactionType.StakingWithdraw && transaction.type !== TransactionType.ContractCall) {
        for (const recipients of txParams.recipients) {
          totalAmount = totalAmount.plus(recipients.amount);
        }
        if (!totalAmount.isEqualTo(explainedTx.outputAmount)) {
          throw new Error('Tx total amount does not match with expected total amount field');
        }
      }
    }
    return true;
  }

  getNativeRuneTxnFees(): string {
    return RUNE_FEES;
  }

  /**
   * This function is overridden from CosmosCoin class' recover function due to the difference in fees handling in thorchain
   * @param {RecoveryOptions} params parameters needed to construct and
   * (maybe) sign the transaction
   *
   * @returns {CosmosLikeCoinRecoveryOutput} the serialized transaction hex string and index
   * of the address being swept
   */
  async recover(params: RecoveryOptions): Promise<CosmosLikeCoinRecoveryOutput> {
    // Step 1: Check if params contains the required parameters

    if (!params.recoveryDestination || !this.isValidAddress(params.recoveryDestination)) {
      throw new Error('invalid recoveryDestination');
    }

    if (!params.userKey) {
      throw new Error('missing userKey');
    }

    if (!params.backupKey) {
      throw new Error('missing backupKey');
    }

    if (!params.walletPassphrase) {
      throw new Error('missing wallet passphrase');
    }

    // Step 2: Fetch the bitgo key from params
    const userKey = params.userKey.replace(/\s/g, '');
    const backupKey = params.backupKey.replace(/\s/g, '');

    const { userKeyShare, backupKeyShare, commonKeyChain } = await ECDSAUtils.getMpcV2RecoveryKeyShares(
      userKey,
      backupKey,
      params.walletPassphrase
    ); // baseAddress is not extracted
    // Step 3: Instantiate the ECDSA signer and fetch the address details
    const MPC = new Ecdsa();
    const chainId = await this.getChainId();
    const publicKey = MPC.deriveUnhardened(commonKeyChain, ROOT_PATH).slice(0, 66);
    const senderAddress = this.getAddressFromPublicKey(publicKey);

    // Step 4: Fetch account details such as accountNo, balance and check for sufficient funds once gasAmount has been deducted
    const [accountNumber, sequenceNo] = await this.getAccountDetails(senderAddress);
    const balance = new BigNumber(await this.getAccountBalance(senderAddress));
    const gasBudget: FeeData = {
      amount: [{ denom: this.getDenomination(), amount: this.getGasAmountDetails().gasAmount }],
      gasLimit: this.getGasAmountDetails().gasLimit,
    };
    const actualBalance = balance.minus(this.getNativeRuneTxnFees());

    if (actualBalance.isLessThanOrEqualTo(0)) {
      throw new Error('Did not have enough funds to recover');
    }

    // Step 5: Once sufficient funds are present, construct the recover tx messsage
    const amount: Coin[] = [
      {
        denom: this.getDenomination(),
        amount: actualBalance.toFixed(),
      },
    ];
    const sendMessage: SendMessage[] = [
      {
        fromAddress: senderAddress,
        toAddress: params.recoveryDestination,
        amount: amount,
      },
    ];

    // Step 6: Build the unsigned tx using the constructed message
    const txnBuilder = this.getBuilder().getTransferBuilder();
    txnBuilder
      .messages(sendMessage)
      .gasBudget(gasBudget)
      .publicKey(publicKey)
      .sequence(Number(sequenceNo))
      .accountNumber(Number(accountNumber))
      .chainId(chainId);
    const unsignedTransaction = (await txnBuilder.build()) as CosmosTransaction;
    let serializedTx = unsignedTransaction.toBroadcastFormat();
    const signableHex = unsignedTransaction.signablePayload.toString('hex');

    // Step 7: Sign the tx
    const message = unsignedTransaction.signablePayload;
    const messageHash = createHash('sha256').update(message).digest();

    const signature = await ECDSAUtils.signRecoveryMpcV2(messageHash, userKeyShare, backupKeyShare, commonKeyChain);

    const signableBuffer = Buffer.from(signableHex, 'hex');
    MPC.verify(signableBuffer, signature, this.getHashFunction());
    const cosmosKeyPair = this.getKeyPair(publicKey);
    txnBuilder.addSignature({ pub: cosmosKeyPair.getKeys().pub }, Buffer.from(signature.r + signature.s, 'hex'));
    const signedTransaction = await txnBuilder.build();
    serializedTx = signedTransaction.toBroadcastFormat();

    return { serializedTx: serializedTx };
  }
}
