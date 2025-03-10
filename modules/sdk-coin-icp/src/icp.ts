import BigNumber from 'bignumber.js';
import * as request from 'superagent';

import {
  BaseBroadcastTransactionOptions,
  BaseBroadcastTransactionResult,
  BaseCoin,
  BitGoBase,
  MethodNotImplementedError,
  Ecdsa,
  ECDSAUtils,
  Environments,
  KeyPair,
  MPCAlgorithm,
  ParseTransactionOptions,
  ParsedTransaction,
  SignTransactionOptions,
  SignedTransaction,
  TssVerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';

import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { Network, PayloadsData, RecoveryOptions, SigningPayload, Signatures } from './lib/iface';
import { TransactionBuilderFactory } from './lib/transactionBuilderFactory';
import utils from './lib/utils';

const ROOT_PATH = 'm/0';
const ACCOUNT_BALANCE_ENDPOINT = '/account/balance';
const SUBMIT_TRANSACTION_ENDPOINT = '/construction/submit';

/**
 * Class representing the Internet Computer (ICP) coin.
 * Extends the BaseCoin class and provides specific implementations for ICP.
 *
 * @see {@link https://internetcomputer.org/}
 * @see {@link https://internetcomputer.org/docs/current/developer-docs/defi/rosetta/icp_rosetta/data_api/}
 */
export class Icp extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Icp(bitgo, staticsCoin);
  }

  getChain(): string {
    return 'icp';
  }

  getBaseChain(): string {
    return 'icp';
  }

  getFamily(): string {
    return this._staticsCoin.family;
  }

  getFullName(): string {
    return 'Internet Computer';
  }

  getBaseFactor(): number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  async isWalletAddress(params: TssVerifyAddressOptions): Promise<boolean> {
    throw new MethodNotImplementedError();
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    throw new Error('Method not implemented.');
  }

  /**
   * Generate a new keypair for this coin.
   * @param seed Seed from which the new keypair should be generated, otherwise a random seed is used
   */
  public generateKeyPair(seed?: Buffer): KeyPair {
    return utils.generateKeyPair(seed);
  }

  isValidAddress(address: string): boolean {
    return utils.isValidAddress(address);
  }

  signTransaction(_: SignTransactionOptions): Promise<SignedTransaction> {
    throw new Error('Method not implemented.');
  }

  isValidPub(key: string): boolean {
    return utils.isValidPublicKey(key);
  }

  isValidPrv(key: string): boolean {
    return utils.isValidPrivateKey(key);
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  /** @inheritDoc */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }

  private async getAddressFromPublicKey(hexEncodedPublicKey: string) {
    return utils.getAddressFromPublicKey(hexEncodedPublicKey);
  }

  /** @inheritDoc **/
  protected getPublicNodeUrl(): string {
    return Environments[this.bitgo.getEnv()].rosettaNodeURL;
  }

  /**
   * Get balance from public node
   * @param senderAddress - The address of the account to fetch the balance for
   * @returns The response from the node containing the balance information
   * @throws If there is an error fetching the balance from the node
   */
  protected async getBalanceFromNode(senderAddress: string): Promise<request.Response> {
    const nodeUrl = this.getPublicNodeUrl();
    const fullEndpoint = `${nodeUrl}${ACCOUNT_BALANCE_ENDPOINT}`;
    const payload = {
      network_identifier: {
        blockchain: this.getFullName(),
        network: Network.ID,
      },
      account_identifier: {
        address: senderAddress,
      },
    };

    try {
      return await request.post(fullEndpoint).set('Content-Type', 'application/json').send(payload);
    } catch (error) {
      throw new Error(
        `Unable to call endpoint ${ACCOUNT_BALANCE_ENDPOINT} for address ${senderAddress} from node: ${nodeUrl}`
      );
    }
  }

  /** @inheritDoc */
  public async broadcastTransaction(payload: BaseBroadcastTransactionOptions): Promise<BaseBroadcastTransactionResult> {
    const nodeUrl = this.getPublicNodeUrl();
    const fullEndpoint = `${nodeUrl}${SUBMIT_TRANSACTION_ENDPOINT}`;
    try {
      const response = await request
        .post(fullEndpoint)
        .set('Content-Type', 'application/json')
        .send(payload.serializedSignedTransaction);
      if (response.status !== 200 || !response.body.transaction_identifier) {
        throw new Error(`Transaction broadcast failed for ICP. HTTP Status: ${response.status}`);
      }
      return {
        txId: response.body.transaction_identifier.hash,
      };
    } catch (error) {
      throw new Error(`Unable to call endpoint ${SUBMIT_TRANSACTION_ENDPOINT} from node: ${nodeUrl}`);
    }
  }

  /**
   * Helper to fetch account balance
   * @param senderAddress - The address of the account to fetch the balance for
   * @returns The balance of the account as a string
   * @throws If the account is not found or there is an error fetching the balance
   */
  protected async getAccountBalance(senderAddress: string): Promise<string> {
    try {
      const response = await this.getBalanceFromNode(senderAddress);
      if (response.status !== 200 || !response.body?.balances?.length) {
        throw new Error(`Account not found. HTTP Status: ${response.status}`);
      }
      const balanceEntry = response.body.balances.find((b) => b.currency?.symbol === 'ICP');
      if (!balanceEntry) {
        throw new Error('No balance found for ICP.');
      }
      const balance = balanceEntry.value;
      return balance;
    } catch (error) {
      throw new Error('Unable to fetch account balance');
    }
  }

  private getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getBaseChain()));
  }

  async signatures(
    payloadsData: PayloadsData,
    senderPublicKey: string,
    userKeyShare: Buffer<ArrayBufferLike>,
    backupKeyShare: Buffer<ArrayBufferLike>,
    commonKeyChain: string
  ): Promise<Signatures[]> {
    return await Promise.all(
      payloadsData.payloads.map(async (payload: SigningPayload) => {
        const message = Buffer.from(payload.hex_bytes, 'hex');
        const signature = await ECDSAUtils.signRecoveryMpcV2(message, userKeyShare, backupKeyShare, commonKeyChain);
        return {
          signing_payload: payload,
          signature_type: payload.signature_type,
          public_key: {
            hex_bytes: senderPublicKey,
            curve_type: 'secp256k1',
          },
          hex_bytes: signature.r + signature.s,
        };
      })
    );
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param params
   */
  async recover(params: RecoveryOptions): Promise<string> {
    if (!params.recoveryDestination || !this.isValidAddress(params.recoveryDestination)) {
      throw new Error('invalid recoveryDestination');
    }

    const isUnsignedSweep = !params.userKey && !params.backupKey && !params.walletPassphrase;
    let senderAddress: string;
    let publicKey: string | undefined;
    let userKeyShare, backupKeyShare, commonKeyChain;
    const MPC = new Ecdsa();

    if (!isUnsignedSweep) {
      if (!params.userKey) {
        throw new Error('missing userKey');
      }

      if (!params.backupKey) {
        throw new Error('missing backupKey');
      }

      if (!params.walletPassphrase) {
        throw new Error('missing wallet passphrase');
      }

      const userKey = params.userKey.replace(/\s/g, '');
      const backupKey = params.backupKey.replace(/\s/g, '');

      ({ userKeyShare, backupKeyShare, commonKeyChain } = await ECDSAUtils.getMpcV2RecoveryKeyShares(
        userKey,
        backupKey,
        params.walletPassphrase
      ));
      publicKey = MPC.deriveUnhardened(commonKeyChain, ROOT_PATH).slice(0, 66);
      senderAddress = await this.getAddressFromPublicKey(publicKey);
    } else {
      if (!params.rootAddress || !this.isValidAddress(params.rootAddress)) {
        throw new Error('invalid rootAddress');
      }
      senderAddress = params.rootAddress as string;
    }
    const balance = new BigNumber(await this.getAccountBalance(senderAddress));
    const gasAmount = new BigNumber(utils.gasData());
    const actualBalance = balance.minus(gasAmount);
    if (actualBalance.isLessThanOrEqualTo(0)) {
      throw new Error('Did not have enough funds to recover');
    }

    const factory = this.getBuilder();
    const txBuilder = factory.getTransferBuilder();
    txBuilder.sender(senderAddress, publicKey as string);
    txBuilder.receiverId(params.recoveryDestination);
    txBuilder.amount(actualBalance.toString());
    if (params.memo) {
      txBuilder.memo(Number(params.memo));
    }
    await txBuilder.build();
    if (!publicKey || !backupKeyShare) {
      throw new Error('Missing publicKey or backupKeyShare');
    }
    const signatures = await this.signatures(
      txBuilder.transaction.payloadsData,
      publicKey,
      userKeyShare,
      backupKeyShare,
      commonKeyChain
    );
    txBuilder.transaction.addSignature(signatures);
    txBuilder.sign({ key: backupKeyShare.toString('hex') });
    const broadcastableTxn = txBuilder.transaction.toBroadcastFormat();
    const result = await this.broadcastTransaction({ serializedSignedTransaction: broadcastableTxn });
    if (!result.txId) {
      throw new Error('Transaction failed to broadcast');
    }
    return result.txId;
  }
}
