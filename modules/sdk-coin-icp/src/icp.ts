import assert from 'assert';
import {
  BaseBroadcastTransactionOptions,
  BaseBroadcastTransactionResult,
  BaseCoin,
  BitGoBase,
  Ecdsa,
  ECDSAUtils,
  Environments,
  KeyPair,
  MPCAlgorithm,
  MultisigType,
  multisigTypes,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SigningError,
  SignTransactionOptions,
  TssVerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { coins, BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { Principal } from '@dfinity/principal';
import axios from 'axios';
import BigNumber from 'bignumber.js';
import { createHash, Hash } from 'crypto';
import { HttpAgent, replica } from 'ic0';
import * as mpc from '@bitgo/sdk-lib-mpc';

import {
  CurveType,
  LEDGER_CANISTER_ID,
  PayloadsData,
  PUBLIC_NODE_REQUEST_ENDPOINT,
  PublicNodeSubmitResponse,
  RecoveryOptions,
  RecoveryTransaction,
  ROOT_PATH,
  Signatures,
  SigningPayload,
  IcpTransactionExplanation,
  TransactionHexParams,
  ACCOUNT_BALANCE_CALL,
  UnsignedSweepRecoveryTransaction,
} from './lib/iface';
import { TransactionBuilderFactory } from './lib/transactionBuilderFactory';
import utils from './lib/utils';

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

  async explainTransaction(params: TransactionHexParams): Promise<IcpTransactionExplanation> {
    const factory = this.getBuilderFactory();
    const txBuilder = await factory.from(params.transactionHex);
    const transaction = await txBuilder.build();
    if (params.signableHex !== undefined) {
      const generatedSignableHex = txBuilder.transaction.payloadsData.payloads[0].hex_bytes;
      if (generatedSignableHex !== params.signableHex) {
        throw new Error('generated signableHex is not equal to params.signableHex');
      }
    }
    return transaction.explainTransaction();
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    const { txParams, txPrebuild } = params;
    const txHex = txPrebuild?.txHex;
    if (!txHex) {
      throw new Error('txHex is required');
    }
    const txHexParams: TransactionHexParams = {
      transactionHex: txHex,
    };

    if (txPrebuild.txInfo && txPrebuild.txInfo !== undefined && typeof txPrebuild.txInfo === 'string') {
      txHexParams.signableHex = txPrebuild.txInfo;
    }

    const explainedTx = await this.explainTransaction(txHexParams);

    if (Array.isArray(txParams.recipients) && txParams.recipients.length > 0) {
      if (txParams.recipients.length > 1) {
        throw new Error(
          `${this.getChain()} doesn't support sending to more than 1 destination address within a single transaction. Try again, using only a single recipient.`
        );
      }
      assert(explainedTx.outputs.length === 1, 'Tx outputs does not match with expected txParams recipients');

      const output = explainedTx.outputs[0];
      const recipient = txParams.recipients[0];
      assert(
        typeof recipient.address === 'string' &&
          typeof output.address === 'string' &&
          output.address === recipient.address &&
          BigNumber(output.amount).eq(BigNumber(recipient.amount)),
        'Tx outputs does not match with expected txParams recipients'
      );
    }
    return true;
  }

  async isWalletAddress(params: TssVerifyAddressOptions): Promise<boolean> {
    return this.isValidAddress(params.address);
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
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

  async signTransaction(
    params: SignTransactionOptions & { txPrebuild: { txHex: string }; prv: string }
  ): Promise<SignedTransaction> {
    const txHex = params?.txPrebuild?.txHex;
    const privateKey = params?.prv;
    if (!txHex) {
      throw new SigningError('missing required txPrebuild parameter: params.txPrebuild.txHex');
    }
    if (!privateKey) {
      throw new SigningError('missing required prv parameter: params.prv');
    }
    const factory = this.getBuilderFactory();
    const txBuilder = await factory.from(params.txPrebuild.txHex);
    txBuilder.sign({ key: params.prv });
    txBuilder.combine();
    const serializedTx = txBuilder.transaction.toBroadcastFormat();
    return {
      txHex: serializedTx,
    };
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

  /** @inheritDoc **/
  // this method calls the public node to broadcast the transaction and not the rosetta node
  public async broadcastTransaction(payload: BaseBroadcastTransactionOptions): Promise<BaseBroadcastTransactionResult> {
    const endpoint = this.getPublicNodeBroadcastEndpoint();

    try {
      const bodyBytes = utils.blobFromHex(payload.serializedSignedTransaction);
      const response = await axios.post(endpoint, bodyBytes, {
        headers: { 'Content-Type': 'application/cbor' },
        responseType: 'arraybuffer', // This ensures you get a Buffer, not a string
      });

      if (response.status !== 200) {
        throw new Error(`Transaction broadcast failed with status: ${response.status} - ${response.statusText}`);
      }

      const decodedResponse = utils.cborDecode(response.data) as PublicNodeSubmitResponse;

      if (decodedResponse.status === 'replied') {
        // it is considered a success because ICP returns response in a CBOR map with a status of 'replied'
        return {}; // returned empty object as ICP does not return a txid
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

  /**
   * Fetches the account balance for a given public key.
   * @param publicKeyHex - Hex-encoded public key of the account.
   * @returns Promise resolving to the account balance as a string.
   * @throws Error if the balance could not be fetched.
   */
  protected async getAccountBalance(publicKeyHex: string): Promise<string> {
    try {
      const principalId = utils.getPrincipalIdFromPublicKey(publicKeyHex).toText();
      return await this.getBalanceFromPrincipal(principalId);
    } catch (error: any) {
      throw new Error(`Unable to fetch account balance: ${error.message || error}`);
    }
  }

  /**
   * Fetches the account balance for a given principal ID.
   * @param principalId - The principal ID of the account.
   * @returns Promise resolving to the account balance as a string.
   * @throws Error if the balance could not be fetched.
   */
  protected async getBalanceFromPrincipal(principalId: string): Promise<string> {
    try {
      const agent = this.createAgent(); // TODO: WIN-5512: move to a ICP agent file WIN-5512
      const ic = replica(agent, { local: true });

      const ledger = ic(Principal.fromUint8Array(LEDGER_CANISTER_ID).toText());
      const subaccountHex = '0000000000000000000000000000000000000000000000000000000000000000';

      const account = {
        owner: Principal.fromText(principalId),
        subaccount: [utils.hexToBytes(subaccountHex)],
      };

      const balance = await ledger.call(ACCOUNT_BALANCE_CALL, account);
      return balance.toString();
    } catch (error: any) {
      throw new Error(`Error fetching balance for principal ${principalId}: ${error.message || error}`);
    }
  }

  /**
   * Creates a new HTTP agent for communicating with the Internet Computer.
   * @param host - The host URL to connect to (defaults to the public node URL).
   * @returns An instance of HttpAgent.
   */
  protected createAgent(host: string = this.getPublicNodeUrl()): HttpAgent {
    return new HttpAgent({
      host,
      fetch,
      verifyQuerySignatures: false,
    });
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
  async recover(params: RecoveryOptions): Promise<RecoveryTransaction | UnsignedSweepRecoveryTransaction> {
    try {
      if (!params.recoveryDestination || !this.isValidAddress(params.recoveryDestination)) {
        throw new Error('invalid recoveryDestination');
      }

      const isUnsignedSweep = !params.userKey && !params.backupKey && !params.walletPassphrase;

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
      } else {
        const bitgoKey = params.bitgoKey;
        if (!bitgoKey) {
          throw new Error('missing bitgoKey');
        }

        const hdTree = new mpc.Secp256k1Bip32HdTree();
        const derivationPath = 'm/0';
        const derivedPub = hdTree.publicDerive(
          {
            pk: mpc.bigIntFromBufferBE(Buffer.from(bitgoKey.slice(0, 66), 'hex')),
            chaincode: mpc.bigIntFromBufferBE(Buffer.from(bitgoKey.slice(66), 'hex')),
          },
          derivationPath
        );

        publicKey = mpc.bigIntToBufferBE(derivedPub.pk).toString('hex');
      }

      if (!publicKey) {
        throw new Error('failed to derive public key');
      }

      const senderAddress = await this.getAddressFromPublicKey(publicKey);
      const balance = new BigNumber(await this.getAccountBalance(publicKey));
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

      if (isUnsignedSweep) {
        return {
          txHex: txBuilder.transaction.unsignedTransaction,
          coin: this.getChain(),
        };
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
      await this.broadcastTransaction({ serializedSignedTransaction: broadcastableTxn });
      const txId = txBuilder.transaction.id;
      const recoveredTransaction: RecoveryTransaction = {
        id: txId,
        tx: broadcastableTxn,
      };
      return recoveredTransaction;
    } catch (error) {
      throw new Error(`Error during ICP recovery: ${error.message || error}`);
    }
  }
}
