import BigNumber from 'bignumber.js';
import * as request from 'superagent';
import {
  BaseBroadcastTransactionOptions,
  BaseBroadcastTransactionResult,
  BaseCoin,
  BitGoBase,
  Ecdsa,
  ECDSAUtils,
  Environments,
  KeyPair,
  MethodNotImplementedError,
  MPCAlgorithm,
  // MultisigType,
  // multisigTypes,
  ParseTransactionOptions,
  ParsedTransaction,
  SignTransactionOptions,
  SignedTransaction,
  TssVerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import {
  Network,
  PayloadsData,
  RecoveryOptions,
  Signatures,
  SigningPayload,
  ACCOUNT_BALANCE_ENDPOINT,
  SUBMIT_TRANSACTION_ENDPOINT,
  ROOT_PATH,
} from './lib/iface';
import { TransactionBuilderFactory } from './lib/transactionBuilderFactory';
import utils from './lib/utils';
import { createHash } from 'crypto';

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
    throw new MethodNotImplementedError();
  }

  async isWalletAddress(params: TssVerifyAddressOptions): Promise<boolean> {
    throw new MethodNotImplementedError();
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    throw new MethodNotImplementedError();
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
    throw new MethodNotImplementedError();
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

  /** inherited doc */
  getDefaultMultisigType(): 'tss' {
    return 'tss';
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

  private getBuilderFactory(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getBaseChain()));
  }

  /**
   * Generates an array of signatures for the provided payloads using MPC
   *
   * @param payloadsData - The data containing the payloads to be signed.
   * @param senderPublicKey - The public key of the sender in hexadecimal format.
   * @param userKeyShare - The user's key share as a Buffer.
   * @param backupKeyShare - The backup key share as a Buffer.
   * @param commonKeyChain - The common key chain identifier used for MPC signing.
   * @returns A promise that resolves to an array of `Signatures` objects, each containing the signing payload,
   *          signature type, public key, and the generated signature in hexadecimal format.
   */
  async signatures(
    payloadsData: PayloadsData,
    senderPublicKey: string,
    userKeyShare: Buffer<ArrayBufferLike>,
    backupKeyShare: Buffer<ArrayBufferLike>,
    commonKeyChain: string
  ): Promise<Signatures[]> {
    const res = await Promise.all(
      payloadsData.payloads.map(async (payload: SigningPayload) => {
        const message = Buffer.from(payload.hex_bytes, 'hex');
        const messageHash = createHash('sha256').update(message).digest();
        const signature = await ECDSAUtils.signRecoveryMpcV2(messageHash, userKeyShare, backupKeyShare, commonKeyChain);
        const signaturePayload: Signatures = {
          signing_payload: payload,
          signature_type: payload.signature_type,
          public_key: {
            hex_bytes: senderPublicKey,
            curve_type: 'secp256k1',
          },
          hex_bytes: signature.r + signature.s,
        };
        return signaturePayload;
      })
    );
    return res;
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param params
   */
  async recover(params: RecoveryOptions): Promise<string> {
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

    const userKey = params.userKey.replace(/\s/g, '');
    const backupKey = params.backupKey.replace(/\s/g, '');

    const { userKeyShare, backupKeyShare, commonKeyChain } = await ECDSAUtils.getMpcV2RecoveryKeyShares(
      userKey,
      backupKey,
      params.walletPassphrase
    );
    const MPC = new Ecdsa();
    const publicKey = MPC.deriveUnhardened(commonKeyChain, ROOT_PATH).slice(0, 66);
    const senderAddress = await this.getAddressFromPublicKey(publicKey);

    const balance = new BigNumber(await this.getAccountBalance(senderAddress));
    const gasAmount = new BigNumber(utils.gasData());
    const actualBalance = balance.plus(gasAmount); // gas amount returned from gasData is negative so we add it
    if (actualBalance.isLessThanOrEqualTo(0)) {
      throw new Error('Did not have enough funds to recover');
    }

    const factory = this.getBuilderFactory();
    const txBuilder = factory.getTransferBuilder();
    txBuilder.sender(senderAddress, publicKey as string);
    txBuilder.receiverId(params.recoveryDestination);
    txBuilder.amount(actualBalance.toString());
    if (params.memo !== undefined && utils.validateMemo(params.memo)) {
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
    txBuilder.combine();
    const broadcastableTxn = txBuilder.transaction.toBroadcastFormat();
    const result = await this.broadcastTransaction({ serializedSignedTransaction: broadcastableTxn });
    if (!result.txId) {
      throw new Error('Transaction failed to broadcast');
    }
    return result.txId;
  }
}
