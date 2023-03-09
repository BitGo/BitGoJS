/**
 * @prettier
 */
import { BigNumber } from 'bignumber.js';
import * as request from 'superagent';

import {
  BaseCoin,
  BitGoBase,
  checkKrsProvider,
  Environments,
  getBip32Keys,
  getIsKrsRecovery,
  getIsUnsignedSweep,
  InvalidAddressError,
  KeyPair,
  promiseProps,
  SignedTransaction,
  TransactionExplanation,
  UnexpectedAddressError,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { CoinFamily, BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import xrpUtils from './lib/utils';
import { KeyPair as XrpKeyPair, Transaction, TransactionBuilderFactory } from './lib';
import {
  ExplainTransactionOptions,
  ParsedTransaction,
  ParseTransactionOptions,
  RecoveryInfo,
  RecoveryOptions,
  SignTransactionOptions,
  SupplementGenerateWalletOptions,
  VerifyAddressOptions,
} from './lib/iface';
import * as xrpl from 'xrpl';
import { MASTER_KEY_DEACTIVATION_FLAG, REQUIRE_DESTINATION_TAG_FLAG, USER_KEY_SETTING_FLAG } from './lib/constants';
export class Xrp extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Xrp(bitgo, staticsCoin);
  }

  /**
   * Factor between the coin's base unit and its smallest subdivison
   */
  public getBaseFactor(): number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  /**
   * Identifier for the blockchain which supports this coin
   */
  public getChain(): string {
    return this._staticsCoin.name;
  }

  /**
   * Identifier for the coin family
   */
  public getFamily(): CoinFamily {
    return this._staticsCoin.family;
  }

  /**
   * Complete human-readable name of this coin
   */
  public getFullName(): string {
    return this._staticsCoin.fullName;
  }

  isValidPub(pub: string): boolean {
    return xrpUtils.isValidPublicKey(pub);
  }

  isValidPrv(prv: string): boolean {
    return xrpUtils.isValidPrivateKey(prv);
  }

  isValidAddress(address: string): boolean {
    return xrpUtils.isValidAddress(address);
  }

  // /**
  //  * Get fee info from server
  //  */
  // public async getFeeInfo(): Promise<FeeInfo> {
  //   return this.bitgo.get(this.url('/public/feeinfo')).result();
  // }

  /**
   * Signs XRP transaction
   * @param params
   * @param callback
   */
  async signTransaction({ txPrebuild, prv }: SignTransactionOptions): Promise<SignedTransaction> {
    const factory = this.getBuilder();
    const rawTx = txPrebuild.txHex;
    if (!rawTx) {
      throw new Error('missing required rawTx parameter');
    }
    const txBuilder = factory.from(rawTx);
    txBuilder.sign({ key: prv });
    const transaction = await txBuilder.build();

    if (!transaction) {
      throw new Error('Invalid transaction');
    }

    const serializedTx = transaction.toBroadcastFormat();

    return {
      txHex: serializedTx,
    };
  }

  /**
   * Ripple requires additional parameters for wallet generation to be sent to the server. The additional parameters are
   * the root public key, which is the basis of the root address, two signed, and one half-signed initialization txs
   * @param walletParams
   * - rootPrivateKey: optional hex-encoded Ripple private key
   */
  async supplementGenerateWallet(
    walletParams: SupplementGenerateWalletOptions
  ): Promise<SupplementGenerateWalletOptions> {
    if (walletParams.rootPrivateKey) {
      if (walletParams.rootPrivateKey.length !== 64) {
        throw new Error('rootPrivateKey needs to be a hexadecimal private key string');
      }
    } else {
      const keyPair = new XrpKeyPair().getKeys();
      if (!keyPair.prv) {
        throw new Error('no privateKey');
      }
      walletParams.rootPrivateKey = keyPair.prv;
    }
    return walletParams;
  }

  /**
   * Explain/parse transaction
   * @param params
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<TransactionExplanation> {
    const factory = this.getBuilder();
    try {
      const transactionBuilder = factory.from(params.txHex);
      const rebuiltTransaction = (await transactionBuilder.build()) as Transaction;
      const explainedTransaction = rebuiltTransaction.explainTransaction();
      return explainedTransaction;
    } catch (e) {
      // throw new Error('Invalid transaction');
      throw e;
    }
  }

  /**
   * Verify that a transaction prebuild complies with the original intention
   * @param txParams params object passed to send
   * @param txPrebuild prebuild object returned by server
   * @param wallet
   * @returns {boolean}
   */
  public async verifyTransaction({ txParams, txPrebuild }: VerifyTransactionOptions): Promise<boolean> {
    if (!txPrebuild.txHex) {
      throw new Error('missing required txHex parameter');
    }
    const explanation = await this.explainTransaction({
      txHex: txPrebuild.txHex,
    });

    const output = [...explanation.outputs, ...explanation.changeOutputs][0];
    const expectedOutput = txParams.recipients && txParams.recipients[0];

    const comparator = (recipient1, recipient2) => {
      if (recipient1.address !== recipient2.address) {
        return false;
      }
      return new BigNumber(recipient1.amount).isEqualTo(recipient2.amount2);
    };

    if (!comparator(output, expectedOutput)) {
      throw new Error('transaction prebuild does not match expected output');
    }

    return true;
  }

  public async isWalletAddress({ address, rootAddress }: VerifyAddressOptions): Promise<boolean> {
    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(`address verification failure: address "${address}" is not valid`);
    }

    const addressDetails = xrpUtils.getAddressDetails(address);
    const rootAddressDetails = xrpUtils.getAddressDetails(rootAddress);

    if (addressDetails.address !== rootAddressDetails.address) {
      throw new UnexpectedAddressError(
        `address validation failure: ${addressDetails.address} vs. ${rootAddressDetails.address}`
      );
    }

    return true;
  }

  /**
   * URL of a well-known, public facing (non-bitgo) rippled instance which can be used for recovery
   */
  public getPublicNodeUrl(): string {
    return Environments[this.bitgo.getEnv()].xrpNodeUrl;
  }

  protected async getDataFromNode(endpoint: string, requestBody?: Record<string, unknown>): Promise<request.Response> {
    const restEndpoint = this.getPublicNodeUrl() + '/' + endpoint;
    try {
      const res = await request.post(restEndpoint).send(requestBody);
      return res;
    } catch (e) {
      console.debug(e);
    }
    throw new Error(`Unable to call endpoint ${restEndpoint}`);
  }

  private getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param params
   * - rootAddress: root XRP wallet address to recover funds from
   * - userKey: [encrypted] xprv
   * - backupKey: [encrypted] xprv, or xpub if the xprv is held by a KRS provider
   * - walletPassphrase: necessary if one of the xprvs is encrypted
   * - bitgoKey: xpub
   * - krsProvider: necessary if backup key is held by KRS
   * - recoveryDestination: target address to send recovered funds to
   */
  public async recover(params: RecoveryOptions): Promise<RecoveryInfo | string> {
    const rippledUrl = this.getPublicNodeUrl();
    const isKrsRecovery = getIsKrsRecovery(params);
    const isUnsignedSweep = getIsUnsignedSweep(params);

    const accountInfoParams = {
      method: 'account_info',
      params: [
        {
          account: params.rootAddress,
          strict: true,
          ledger_index: 'current',
          queue: true,
          signer_lists: true,
        },
      ],
    };

    if (isKrsRecovery) {
      checkKrsProvider(this, params.krsProvider);
    }

    // Validate the destination address
    if (!this.isValidAddress(params.recoveryDestination)) {
      throw new Error('Invalid destination address!');
    }

    const keys = getBip32Keys(this.bitgo, params, { requireBitGoXpub: false });

    const { addressDetails, feeDetails, serverDetails } = await promiseProps({
      addressDetails: this.bitgo.post(rippledUrl).send(accountInfoParams),
      feeDetails: this.bitgo.post(rippledUrl).send({ method: 'fee' }),
      serverDetails: this.bitgo.post(rippledUrl).send({ method: 'server_info' }),
    });

    const openLedgerFee = new BigNumber(feeDetails.body.result.drops.open_ledger_fee);
    const baseReserve = new BigNumber(serverDetails.body.result.info.validated_ledger.reserve_base_xrp).times(
      this.getBaseFactor()
    );
    const reserveDelta = new BigNumber(serverDetails.body.result.info.validated_ledger.reserve_inc_xrp).times(
      this.getBaseFactor()
    );
    const currentLedger = serverDetails.body.result.info.validated_ledger.seq;
    const sequenceId = addressDetails.body.result.account_data.Sequence;
    const balance = new BigNumber(addressDetails.body.result.account_data.Balance);
    const signerLists = addressDetails.body.result.account_data.signer_lists;
    const accountFlags = addressDetails.body.result.account_data.Flags;

    // make sure there is only one signer list set
    if (signerLists.length !== 1) {
      throw new Error('unexpected set of signer lists');
    }

    // make sure the signers are user, backup, bitgo
    const userAddress = xrpl.deriveAddress(keys[0].publicKey.toString('hex'));
    const backupAddress = xrpl.deriveAddress(keys[1].publicKey.toString('hex'));

    const signerList = signerLists[0];
    if (signerList.SignerQuorum !== 2) {
      throw new Error('invalid minimum signature count');
    }
    const foundAddresses = {};

    const signerEntries = signerList.SignerEntries;
    if (signerEntries.length !== 3) {
      throw new Error('invalid signer list length');
    }
    for (const { SignerEntry } of signerEntries) {
      const weight = SignerEntry.SignerWeight;
      const address = SignerEntry.Account;
      if (weight !== 1) {
        throw new Error('invalid signer weight');
      }

      // if it's a dupe of an address we already know, block
      if (foundAddresses[address] >= 1) {
        throw new Error('duplicate signer address');
      }
      foundAddresses[address] = (foundAddresses[address] || 0) + 1;
    }

    if (foundAddresses[userAddress] !== 1) {
      throw new Error('unexpected incidence frequency of user signer address');
    }
    if (foundAddresses[backupAddress] !== 1) {
      throw new Error('unexpected incidence frequency of user signer address');
    }

    // make sure the flags disable the master key and enforce destination tags

    if ((accountFlags & USER_KEY_SETTING_FLAG) !== 0) {
      throw new Error('a custom user key has been set');
    }
    if ((accountFlags & MASTER_KEY_DEACTIVATION_FLAG) !== MASTER_KEY_DEACTIVATION_FLAG) {
      throw new Error('the master key has not been deactivated');
    }
    if ((accountFlags & REQUIRE_DESTINATION_TAG_FLAG) !== REQUIRE_DESTINATION_TAG_FLAG) {
      throw new Error('the destination flag requirement has not been activated');
    }

    // recover the funds
    const reserve = baseReserve.plus(reserveDelta.times(5));
    const recoverableBalance = balance.minus(reserve);

    const transferBuilder = new TransactionBuilderFactory(coins.get(this.getChain())).getTransferBuilder();
    transferBuilder.setMultiSig();
    transferBuilder.sender(params.rootAddress); // source address
    transferBuilder.fee(openLedgerFee.times(3).toFixed(0)); // the factor three is for the multisigning
    transferBuilder.flags(2147483648);
    transferBuilder.sequence(sequenceId);
    transferBuilder.lastLedgerSequence(currentLedger + 1000000); // give it 1 million ledgers' time (~1 month, suitable for KRS)
    transferBuilder.amount(recoverableBalance.toFixed(0));
    transferBuilder.to(params.recoveryDestination);

    if (isUnsignedSweep) {
      const transaction = await transferBuilder.build();
      return transaction.toBroadcastFormat();
    }
    if (!keys[0].privateKey) {
      throw new Error(`userKey is not a private key`);
    }
    const userPrivateKey = keys[0].privateKey.toString('hex');
    transferBuilder.sign({ key: userPrivateKey });

    let signedTransaction: string;

    if (isKrsRecovery) {
      const halfSignedTx = await transferBuilder.build();
      signedTransaction = halfSignedTx.toBroadcastFormat();
    } else {
      if (!keys[1].privateKey) {
        throw new Error(`backupKey is not a private key`);
      }
      const backupPrivateKey = keys[1].privateKey.toString('hex');
      transferBuilder.sign({ key: backupPrivateKey });
      const fullySignedTx = await transferBuilder.build();
      signedTransaction = fullySignedTx.toBroadcastFormat();
    }

    const transactionExplanation: RecoveryInfo = (await this.explainTransaction({
      txHex: signedTransaction,
    })) as any;
    transactionExplanation.txHex = signedTransaction;

    if (isKrsRecovery) {
      transactionExplanation.backupKey = params.backupKey;
      transactionExplanation.coin = this.getChain();
    }
    return transactionExplanation;
  }

  /**
   * Generate a new keypair for this coin.
   * @param seed Seed from which the new keypair should be generated, otherwise a random seed is used
   */
  public generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new XrpKeyPair({ seed }) : new XrpKeyPair();
    const keys = keyPair.getExtendedKeys();
    if (!keys.xprv) {
      throw new Error('Missing prv in key generation.');
    }
    return {
      pub: keys.xpub,
      prv: keys.xprv,
    };
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    const xrpTransaction = await this.explainTransaction({
      txHex: params.txHex,
    });

    if (!xrpTransaction) {
      throw new Error('Invalid transaction');
    }

    if (xrpTransaction.outputs.length <= 0) {
      return {
        inputs: [],
        outputs: [],
      };
    }

    const senderAddress = xrpTransaction.outputs[0].address;
    const feeAmount = new BigNumber(xrpTransaction.fee.fee);

    const inputs = [
      {
        address: senderAddress,
        amount: new BigNumber(xrpTransaction.outputAmount).plus(feeAmount).toNumber(),
      },
    ];

    const outputs = xrpTransaction.outputs;

    return {
      inputs,
      outputs,
    };
  }
}
