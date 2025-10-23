import * as _ from 'lodash';
import BigNumber from 'bignumber.js';
import blake2b from '@bitgo/blake2b';
import axios from 'axios';
import { TransactionClause, Transaction as VetTransaction } from '@vechain/sdk-core';
import {
  AuditDecryptedKeyParams,
  BaseCoin,
  BaseTransaction,
  BitGoBase,
  BuildNftTransferDataOptions,
  InvalidAddressError,
  KeyPair,
  MPCAlgorithm,
  MultisigType,
  multisigTypes,
  NotImplementedError,
  ParsedTransaction,
  SignedTransaction,
  SignTransactionOptions,
  TokenTransferRecipientParams,
  VerifyAddressOptions,
  VerifyTransactionOptions,
  TokenType,
  Ecdsa,
  ECDSAUtils,
  Environments,
  BaseBroadcastTransactionOptions,
  BaseBroadcastTransactionResult,
} from '@bitgo/sdk-core';
import * as mpc from '@bitgo/sdk-lib-mpc';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import utils from './lib/utils';
import { bip32 } from '@bitgo/secp256k1';
import { randomBytes, Hash } from 'crypto';
import { KeyPair as EthKeyPair } from '@bitgo/abstract-eth';
import { Transaction, TransactionBuilderFactory } from './lib';
import {
  ExplainTransactionOptions,
  RecoverOptions,
  RecoveryTransaction,
  UnsignedSweepRecoveryTransaction,
  VetParseTransactionOptions,
} from './lib/types';
import { VetTransactionExplanation } from './lib/iface';
import { AVG_GAS_UNITS, EXPIRATION, GAS_PRICE_COEF, feeEstimateData } from './lib/constants';

interface FeeEstimateData {
  gas: string;
  gasUnitPrice: string;
  gasPriceCoef: string;
  coefDivisor: string;
}

/**
 * Full Name: Vechain
 * Docs: https://docs.vechain.org/
 * GitHub : https://github.com/vechain
 */
export class Vet extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Vet(bitgo, staticsCoin);
  }

  /**
   * Factor between the coin's base unit and its smallest sub division
   */
  public getBaseFactor(): number {
    return 1e18;
  }

  public getChain(): string {
    return 'vet';
  }

  public getFamily(): string {
    return 'vet';
  }

  public getFullName(): string {
    return 'VeChain';
  }

  valuelessTransferAllowed(): boolean {
    return true;
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  /** inherited doc */
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.tss;
  }

  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }

  allowsAccountConsolidations(): boolean {
    return true;
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    const { txPrebuild: txPrebuild, txParams: txParams } = params;
    const txHex = txPrebuild.txHex;
    if (!txHex) {
      throw new Error('missing required tx prebuild property txHex');
    }
    const explainedTx = await this.explainTransaction({ txHex });
    if (!explainedTx) {
      throw new Error('failed to explain transaction');
    }
    if (txParams.recipients !== undefined && txParams.recipients.length > 0) {
      const filteredRecipients = txParams.recipients?.map((recipient) => {
        return {
          address: recipient.address.toLowerCase(),
          amount: BigInt(recipient.amount),
        };
      });
      const filteredOutputs = explainedTx.outputs.map((output) => {
        return {
          address: output.address.toLowerCase(),
          amount: BigInt(output.amount),
        };
      });

      if (!_.isEqual(filteredOutputs, filteredRecipients)) {
        throw new Error('Tx outputs does not match with expected txParams recipients');
      }
      let totalAmount = new BigNumber(0);
      for (const recipients of txParams.recipients) {
        totalAmount = totalAmount.plus(recipients.amount);
      }
      if (!totalAmount.isEqualTo(explainedTx.outputAmount)) {
        throw new Error('Tx total amount does not match with expected total amount field');
      }
    }
    return true;
  }

  async isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    const { address: newAddress } = params;

    if (!this.isValidAddress(newAddress)) {
      throw new InvalidAddressError(`invalid address: ${newAddress}`);
    }
    return true;
  }

  async parseTransaction(params: VetParseTransactionOptions): Promise<ParsedTransaction> {
    const transactionExplanation = await this.explainTransaction({ txHex: params.txHex });
    if (!transactionExplanation) {
      throw new Error('Invalid transaction');
    }
    return {
      inputs: [
        {
          address: transactionExplanation.sender,
          amount: transactionExplanation.outputAmount,
        },
      ],
      outputs: [
        {
          address: transactionExplanation.outputs[0].address,
          amount: transactionExplanation.outputs[0].amount,
        },
      ],
    };
  }

  /**
   * Explain a Vechain transaction
   * @param params
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<VetTransactionExplanation | undefined> {
    let rebuiltTransaction: BaseTransaction;
    try {
      rebuiltTransaction = await this.rebuildTransaction(params.txHex);
    } catch {
      return undefined;
    }
    return rebuiltTransaction.explainTransaction();
  }

  generateKeyPair(seed?: Buffer): KeyPair {
    if (!seed) {
      // An extended private key has both a normal 256 bit private key and a 256
      // bit chain code, both of which must be random. 512 bits is therefore the
      // maximum entropy and gives us maximum security against cracking.
      seed = randomBytes(512 / 8);
    }
    const extendedKey = bip32.fromSeed(seed);
    const xpub = extendedKey.neutered().toBase58();
    return {
      pub: xpub,
      prv: extendedKey.toBase58(),
    };
  }

  isValidPub(pub: string): boolean {
    let valid = true;
    try {
      new EthKeyPair({ pub });
    } catch (e) {
      valid = false;
    }
    return valid;
  }

  isValidAddress(address: string): boolean {
    return utils.isValidAddress(address);
  }

  signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    throw new Error('Method not implemented.');
  }

  protected getTxBuilderFactory(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(this._staticsCoin);
  }

  protected async rebuildTransaction(txHex: string): Promise<BaseTransaction> {
    const txBuilderFactory = this.getTxBuilderFactory();
    try {
      const txBuilder = txBuilderFactory.from(txHex);
      return txBuilder.transaction;
    } catch {
      throw new Error('Failed to rebuild transaction');
    }
  }

  /** @inheritDoc */
  auditDecryptedKey(params: AuditDecryptedKeyParams): void {
    /** https://bitgoinc.atlassian.net/browse/COIN-4213 */
    throw new Error('Method not implemented.');
  }

  /**
   * Function to get coin specific hash function used to generate transaction digests.
   * @returns {@see Hash} hash function if implemented, otherwise throws exception
   */
  getHashFunction(): Hash {
    const blake = blake2b(32);

    // We return an object that mimics the Hash interface
    return {
      update(data: Buffer | Uint8Array) {
        blake.update(data);
        return this;
      },
      digest() {
        const uint8Result = blake.digest();
        return Buffer.from(uint8Result);
      },
    } as unknown as Hash;
  }

  buildNftTransferData(params: BuildNftTransferDataOptions): TokenTransferRecipientParams {
    const { recipientAddress, fromAddress, tokenContractAddress } = params;
    if (!utils.isValidAddress(recipientAddress)) {
      throw new InvalidAddressError('Invalid recipient address');
    }
    if (!utils.isValidAddress(fromAddress)) {
      throw new InvalidAddressError('Invalid from address');
    }
    if (!utils.isValidAddress(tokenContractAddress)) {
      throw new InvalidAddressError('Invalid NFT contract address address');
    }
    switch (params.type) {
      case 'ERC721': {
        const tokenId = params.tokenId;
        return {
          tokenType: TokenType.ERC721,
          tokenQuantity: '1', // This NFT standard will always have quantity of 1
          tokenContractAddress,
          tokenId,
        };
      }
      default:
        throw new NotImplementedError(`NFT type ${params.type} not supported on ${this.getChain()}`);
    }
  }

  /**
   * Broadcasts a signed transaction to the VeChain network.
   *
   * @param {BaseBroadcastTransactionOptions} payload - The payload containing the serialized signed transaction.
   * @param {string} payload.serializedSignedTransaction - The serialized signed transaction to broadcast.
   * @returns {Promise<BaseBroadcastTransactionResult>} A promise that resolves to an empty object if the broadcast is successful.
   * @throws {Error} If the broadcast fails, an error is thrown with the failure message.
   */
  public async broadcastTransaction(payload: BaseBroadcastTransactionOptions): Promise<BaseBroadcastTransactionResult> {
    const baseUrl = this.getPublicNodeUrl();
    const url = `${baseUrl}/transactions`;

    // The body should be a JSON object with a 'raw' key
    const requestBody = {
      raw: payload.serializedSignedTransaction,
    };

    try {
      await axios.post(url, requestBody);
      return {};
    } catch (error) {
      throw new Error(`Failed to broadcast transaction: ${error.message}`);
    }
  }

  /** @inheritDoc */
  async recover(params: RecoverOptions): Promise<RecoveryTransaction | UnsignedSweepRecoveryTransaction> {
    try {
      if (!params.recoveryDestination || !this.isValidAddress(params.recoveryDestination)) {
        throw new Error('invalid recoveryDestination');
      }

      const isUnsignedSweep = !params.userKey && !params.backupKey && !params.walletPassphrase;

      let publicKey: string | undefined;
      let userKeyShare, backupKeyShare, commonKeyChain;
      const MPC = new Ecdsa();

      if (isUnsignedSweep) {
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
      } else {
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
        publicKey = MPC.deriveUnhardened(commonKeyChain, 'm/0').slice(0, 66);
      }

      if (!publicKey) {
        throw new Error('failed to derive public key');
      }

      const backupKeyPair = new EthKeyPair({ pub: publicKey });
      const baseAddress = backupKeyPair.getAddress();

      const tx = await this.buildRecoveryTransaction({
        baseAddress,
        params,
      });

      const signableHex = await tx.signablePayload;
      const serializedTxHex = await tx.toBroadcastFormat();

      if (isUnsignedSweep) {
        return {
          txHex: serializedTxHex,
          coin: this.getChain(),
        };
      }

      const signableMessage = this.getHashFunction().update(signableHex).digest();

      const signatureObj = await ECDSAUtils.signRecoveryMpcV2(
        signableMessage,
        userKeyShare,
        backupKeyShare,
        commonKeyChain
      );
      const signature = Buffer.from(signatureObj.r + signatureObj.s + (signatureObj.recid === 0 ? '00' : '01'), 'hex');
      const txBuilder = this.getTxBuilderFactory().getTransferBuilder();
      await txBuilder.from(serializedTxHex);
      txBuilder.isRecovery(true);
      await txBuilder.addSenderSignature(signature);

      const signedTx = await txBuilder.build();

      return {
        id: signedTx.id,
        tx: signedTx.toBroadcastFormat(),
      };
    } catch (error) {
      throw new Error(`Error during Vechain recovery: ${error.message || error}`);
    }
  }

  /**
   * Returns the public node URL for the VeChain network.
   * @returns {string} The URL of the public VeChain node.
   */
  protected getPublicNodeUrl(): string {
    return Environments[this.bitgo.getEnv()].vetNodeUrl;
  }

  /**
   * Calculates the transaction fee based on the estimated gas limit and fee estimate data.
   * @param {FeeEstimateData} feeEstimateData - The fee estimate data.
   * @param {BigNumber} estimatedGasLimit - The estimated gas limit for the transaction.
   * @returns {BigNumber} The calculated transaction fee.
   */
  protected calculateFee(feeEstimateData: FeeEstimateData, estimatedGasLimit: BigNumber): BigNumber {
    const gasLimit = estimatedGasLimit;
    const adjustmentFactor = new BigNumber(1).plus(
      new BigNumber(feeEstimateData.gasPriceCoef)
        .dividedBy(new BigNumber(feeEstimateData.coefDivisor))
        .decimalPlaces(18, BigNumber.ROUND_DOWN)
    );
    const adjustedGasPrice = new BigNumber(feeEstimateData.gasUnitPrice).times(adjustmentFactor);
    return gasLimit.times(adjustedGasPrice).integerValue(BigNumber.ROUND_CEIL);
  }

  /**
   * Ensures that the given address has sufficient VTHO balance to cover the transaction fee.
   * @param {string} baseAddress - The address to check for VTHO balance.
   * @param {BigNumber} requiredGasUnits - The required gas units for the transaction.
   * @throws {Error} If the VTHO balance is insufficient or if there's an error checking the balance.
   */
  async ensureVthoBalanceForFee(baseAddress: string, requiredGasUnits: BigNumber): Promise<void> {
    const vthoTokenAddress = '0x0000000000000000000000000000456E65726779'; // VTHO token contract address
    try {
      const vthoBalance = await this.getBalance(baseAddress, vthoTokenAddress);

      const requiredFee = this.calculateFee(feeEstimateData, requiredGasUnits);

      if (vthoBalance.isLessThan(requiredFee)) {
        throw new Error(
          `Insufficient VTHO balance for fees. Required: ${requiredFee.toString()}, Available: ${vthoBalance.toString()}`
        );
      }
    } catch (error) {
      throw new Error(`Failed to ensure VTHO balance: ${error.message}`);
    }
  }

  /**
   * Fetches the balance for a given Vechain address.
   *
   * @param address The Vechain address (e.g., "0x...") to check.
   * @param tokenContractAddress (Optional) The contract address of a VIP180 token.
   * @returns A Promise that resolves to a BigNumber instance of the balance.
   */
  async getBalance(address: string, tokenContractAddress?: string): Promise<BigNumber> {
    const baseUrl = this.getPublicNodeUrl();

    if (!tokenContractAddress) {
      const url = `${baseUrl}/accounts/${address}`;

      try {
        const response = await axios.get(url);

        // The 'balance' is returned as a hex string.
        const balance = new BigNumber(response.data.balance);

        return balance;
      } catch (error) {
        throw new Error('Failed to get native balance.');
      }
    }

    const url = `${baseUrl}/accounts/*`;

    // Construct the ABI-encoded data for the 'balanceOf(address)' call
    // 1. Function selector for 'balanceOf(address)': '0x70a08231'
    // 2. Padded address: The address, stripped of '0x', left-padded with zeros to 64 chars
    const paddedAddress = address.startsWith('0x') ? address.substring(2).padStart(64, '0') : address.padStart(64, '0');
    const data = `0x70a08231${paddedAddress}`;

    const requestBody = {
      clauses: [
        {
          to: tokenContractAddress, // The token contract address
          value: '0x0',
          data: data, // The 'balanceOf' call
        },
      ],
    };

    try {
      const response = await axios.post(url, requestBody);

      const simResponse = response.data;

      // Validate response and extract the balance data
      if (!simResponse || !Array.isArray(simResponse) || simResponse.length === 0 || !simResponse[0].data) {
        throw new Error('Invalid simulation response from VeChain node');
      }

      // The returned data is the hex-encoded balance
      return new BigNumber(simResponse[0].data);
    } catch (error) {
      console.error('Error fetching token balance:', error);
      throw new Error(`Failed to get token balance: ${error.message}`);
    }
  }

  /**
   * Retrieves the block reference from the VeChain network.
   * @returns {Promise<string>} A promise that resolves to the block reference string.
   * @throws {Error} If there's an error fetching the block reference or if the response is invalid.
   */
  public async getBlockRef(): Promise<string> {
    const baseUrl = this.getPublicNodeUrl();
    const url = `${baseUrl}/blocks/best`;

    try {
      const response = await axios.get(url);

      const data = response.data;

      // Validate the response data
      if (!data || !data.id) {
        throw new Error('Invalid response from the VeChain node');
      }

      // Return the first 18 characters of the block ID
      return data.id.slice(0, 18);
    } catch (error) {
      // Rethrow or return a sensible default
      throw new Error('Failed to get block ref: ');
    }
  }

  /**
   * Generates a random nonce for use in transactions.
   * @returns {string} A hexadecimal string representing the random nonce.
   */
  getRandomNonce(): string {
    return '0x' + randomBytes(8).toString('hex');
  }

  /**
   * Estimates the gas required for a set of transaction clauses.
   * @param {TransactionClause[]} clauses - An array of transaction clauses.
   * @param {string} caller - The address of the transaction caller.
   * @returns {Promise<BigNumber>} A promise that resolves to the estimated gas amount.
   * @throws {Error} If the clauses are invalid, the caller is not provided, or if there's an error in gas estimation.
   */
  public async estimateGas(clauses: TransactionClause[], caller: string): Promise<BigNumber> {
    if (!clauses || !Array.isArray(clauses) || clauses.length === 0) {
      throw new Error('Clauses must be a non-empty array');
    }

    if (!caller) {
      throw new Error('Caller address is required');
    }

    const baseUrl = this.getPublicNodeUrl();
    const url = `${baseUrl}/accounts/*`;

    const requestBody = {
      clauses: clauses,
      caller: caller,
    };

    try {
      const response = await axios.post(url, requestBody);

      const simResponse = response.data;

      if (!simResponse || !Array.isArray(simResponse)) {
        throw new Error('Invalid simulation response from VeChain node');
      }

      const totalSimulatedGas = simResponse.reduce((sum, result) => sum + (result.gasUsed || 0), 0);

      const intrinsicGas = Number(VetTransaction.intrinsicGas(clauses).wei);

      const totalGas = Math.ceil(intrinsicGas + (totalSimulatedGas !== 0 ? totalSimulatedGas + 15000 : 0));

      return new BigNumber(totalGas);
    } catch (error) {
      throw new Error(`Failed to estimate gas: ${error.message}`);
    }
  }

  /**
   * Builds a recovery transaction for the given address.
   * @param {Object} buildParams - The parameters for building the recovery transaction.
   * @param {string} buildParams.baseAddress - The address to recover funds from.
   * @param {RecoverOptions} buildParams.params - The recovery options.
   * @returns {Promise<Transaction>} A promise that resolves to the built recovery transaction.
   * @throws {Error} If there's no VET balance to recover or if there's an error building the transaction.
   */
  protected async buildRecoveryTransaction(buildParams: {
    baseAddress: string;
    params: RecoverOptions;
  }): Promise<Transaction> {
    const { baseAddress, params } = buildParams;
    const balance = await this.getBalance(baseAddress);

    if (balance.isLessThanOrEqualTo(0)) {
      throw new Error(`no VET balance to recover for address ${baseAddress}`);
    }

    const recipients = [
      {
        address: params.recoveryDestination,
        amount: balance.toString(),
      },
    ];

    const blockRef = await this.getBlockRef();

    const txBuilder = this.getTxBuilderFactory().getTransferBuilder();

    txBuilder.chainTag(this.bitgo.getEnv() === 'prod' ? 0x4a : 0x27);
    txBuilder.recipients(recipients);
    txBuilder.sender(baseAddress);
    txBuilder.addFeePayerAddress(baseAddress);
    txBuilder.gas(Number(AVG_GAS_UNITS));
    txBuilder.blockRef(blockRef);
    txBuilder.expiration(EXPIRATION);
    txBuilder.gasPriceCoef(Number(GAS_PRICE_COEF));
    txBuilder.nonce(this.getRandomNonce());
    txBuilder.isRecovery(true);

    let tx = (await txBuilder.build()) as Transaction;

    const clauses = tx.clauses;

    const actualGasUnits = await this.estimateGas(clauses, baseAddress);

    await this.ensureVthoBalanceForFee(baseAddress, actualGasUnits);

    txBuilder.gas(actualGasUnits.toNumber());

    tx = (await txBuilder.build()) as Transaction;

    return tx;
  }
}
