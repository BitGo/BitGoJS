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
  MultisigType,
  multisigTypes,
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
  ROOT_PATH,
  LEDGER_CANISTER_ID,
  PublicNodeSubmitResponse,
  CurveType,
  PUBLIC_NODE_REQUEST_ENDPOINT,
} from './lib/iface';
import { TransactionBuilderFactory } from './lib/transactionBuilderFactory';
import utils from './lib/utils';
import { createHash, Hash } from 'crypto';
import { Principal } from '@dfinity/principal';
import axios from 'axios';

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
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.tss;
  }

  /** @inheritDoc */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }

  /** @inheritDoc **/
  getHashFunction(): Hash {
    return createHash('sha256');
  }

  private async getAddressFromPublicKey(hexEncodedPublicKey: string) {
    return utils.getAddressFromPublicKey(hexEncodedPublicKey);
  }

  /** @inheritDoc **/
  protected getPublicNodeUrl(): string {
    return Environments[this.bitgo.getEnv()].icpNodeUrl;
  }

  protected getRosettaNodeUrl(): string {
    return Environments[this.bitgo.getEnv()].icpRosettaNodeUrl;
  }

  /**
   * Sends a POST request to the Rosetta node with the specified payload and endpoint.
   *
   * @param payload - A JSON string representing the request payload to be sent to the Rosetta node.
   * @param endpoint - The endpoint path to append to the Rosetta node URL.
   * @returns A promise that resolves to the HTTP response from the Rosetta node.
   * @throws An error if the HTTP request fails or if the response status is not 200.
   */
  protected async getRosettaNodeResponse(payload: string, endpoint: string): Promise<request.Response> {
    const nodeUrl = this.getRosettaNodeUrl();
    const fullEndpoint = `${nodeUrl}${endpoint}`;
    const body = {
      network_identifier: {
        blockchain: this.getFullName(),
        network: Network.ID,
      },
      ...JSON.parse(payload),
    };

    try {
      const response = await request.post(fullEndpoint).set('Content-Type', 'application/json').send(body);
      if (response.status !== 200) {
        throw new Error(`Call to Rosetta node failed, got HTTP Status: ${response.status} with body: ${response.body}`);
      }
      return response;
    } catch (error) {
      throw new Error(`Unable to call rosetta node: ${error.message || error}`);
    }
  }

  /* inheritDoc */
  // this method calls the public node to broadcast the transaction and not the rosetta node
  public async broadcastTransaction(payload: BaseBroadcastTransactionOptions): Promise<BaseBroadcastTransactionResult> {
    const endpoint = this.getPublicNodeBroadcastEndpoint();

    try {
      const response = await axios.post(endpoint, payload.serializedSignedTransaction, {
        responseType: 'arraybuffer', // This ensures you get a Buffer, not a string
        headers: {
          'Content-Type': 'application/cbor',
        },
      });

      if (response.status !== 200) {
        throw new Error(`Transaction broadcast failed with status: ${response.status} - ${response.statusText}`);
      }

      const decodedResponse = utils.cborDecode(response.data) as PublicNodeSubmitResponse;

      if (decodedResponse.status === 'replied') {
        const txnId = this.extractTransactionId(decodedResponse);
        return { txId: txnId };
      } else {
        throw new Error(`Unexpected response status from node: ${decodedResponse.status}`);
      }
    } catch (error) {
      throw new Error(`Transaction broadcast error: ${error?.message || JSON.stringify(error)}`);
    }
  }

  private getPublicNodeBroadcastEndpoint(): string {
    const nodeUrl = this.getPublicNodeUrl();
    const principal = Principal.fromUint8Array(LEDGER_CANISTER_ID);
    const canisterIdHex = principal.toText();
    const endpoint = `${nodeUrl}${PUBLIC_NODE_REQUEST_ENDPOINT}${canisterIdHex}/call`;
    return endpoint;
  }

  // TODO: Implement the real logic to extract the transaction ID, Ticket: https://bitgoinc.atlassian.net/browse/WIN-5075
  private extractTransactionId(decodedResponse: PublicNodeSubmitResponse): string {
    return '4c10cf22a768a20e7eebc86e49c031d0e22895a39c6355b5f7455b2acad59c1e';
  }

  /**
   * Helper to fetch account balance
   * @param senderAddress - The address of the account to fetch the balance for
   * @returns The balance of the account as a string
   * @throws If the account is not found or there is an error fetching the balance
   */
  protected async getAccountBalance(address: string): Promise<string> {
    try {
      const payload = {
        account_identifier: {
          address: address,
        },
      };
      const response = await this.getRosettaNodeResponse(JSON.stringify(payload), ACCOUNT_BALANCE_ENDPOINT);
      const coinName = this._staticsCoin.name.toUpperCase();
      const balanceEntry = response.body.balances.find((b) => b.currency?.symbol === coinName);
      if (!balanceEntry) {
        throw new Error(`No balance found for ICP account ${address}.`);
      }
      const balance = balanceEntry.value;
      return balance;
    } catch (error) {
      throw new Error(`Unable to fetch account balance: ${error.message || error}`);
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
    try {
      const payload = payloadsData.payloads[0] as SigningPayload;
      const message = Buffer.from(payload.hex_bytes, 'hex');
      const messageHash = createHash('sha256').update(message).digest();
      const signature = await ECDSAUtils.signRecoveryMpcV2(messageHash, userKeyShare, backupKeyShare, commonKeyChain);
      const signaturePayload: Signatures = {
        signing_payload: payload,
        signature_type: payload.signature_type,
        public_key: {
          hex_bytes: senderPublicKey,
          curve_type: CurveType.SECP256K1,
        },
        hex_bytes: signature.r + signature.s,
      };

      return [signaturePayload];
    } catch (error) {
      throw new Error(`Error generating signatures: ${error.message || error}`);
    }
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

    if (!publicKey || !backupKeyShare) {
      throw new Error('Missing publicKey or backupKeyShare');
    }

    const senderAddress = await this.getAddressFromPublicKey(publicKey);

    const balance = new BigNumber(await this.getAccountBalance(senderAddress));
    const feeData = new BigNumber(utils.feeData());
    const actualBalance = balance.plus(feeData); // gas amount returned from gasData is negative so we add it
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
    if (txBuilder.transaction.payloadsData.payloads.length === 0) {
      throw new Error('Missing payloads to generate signatures');
    }
    const signatures = await this.signatures(
      txBuilder.transaction.payloadsData,
      publicKey,
      userKeyShare,
      backupKeyShare,
      commonKeyChain
    );
    if (!signatures || signatures.length === 0) {
      throw new Error('Failed to generate signatures');
    }
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
