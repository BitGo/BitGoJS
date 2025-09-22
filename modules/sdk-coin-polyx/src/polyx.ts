import {
  AuditDecryptedKeyParams,
  BaseCoin,
  BitGoBase,
  EDDSAMethods,
  EDDSAMethodTypes,
  MPCRecoveryOptions,
  MPCSweepTxs,
  MPCTx,
  MPCUnsignedTx,
  RecoveryTxRequest,
  Environments,
  MPCSweepRecoveryOptions,
  MPCTxs,
  TokenEnablementConfig,
} from '@bitgo-beta/sdk-core';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { BaseCoin as StaticsBaseCoin, coins, SubstrateSpecNameType } from '@bitgo-beta/statics';
import { KeyPair as SubstrateKeyPair, SubstrateCoin, Transaction, Interface } from '@bitgo-beta/abstract-substrate';
import { BatchStakingBuilder } from './lib/batchStakingBuilder';
import { BondExtraBuilder } from './lib/bondExtraBuilder';
import { POLYX_ADDRESS_FORMAT } from './lib/constants';
import { getDerivationPath } from '@bitgo-beta/sdk-lib-mpc';
import BigNumber from 'bignumber.js';
import { TransactionBuilderFactory, TransferBuilder } from './lib';

export class Polyx extends SubstrateCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  protected static nodeApiInitialized = false;
  protected static API: ApiPromise;

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Polyx(bitgo, staticsCoin);
  }

  getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
  }

  /**
   * Factor between the coin's base unit and its smallest subdivison
   */
  public getBaseFactor(): number {
    return 1e6;
  }

  public getChain(): string {
    return 'polyx';
  }

  public getFullName(): string {
    return 'Polymesh';
  }

  /** @inheritDoc */
  auditDecryptedKey({ publicKey, prv, multiSigType }: AuditDecryptedKeyParams) {
    super.auditDecryptedKey({ publicKey, prv, multiSigType });
  }

  stakingBatch(): BatchStakingBuilder {
    return this.getBuilder().getBatchBuilder();
  }

  bondExtra(): BondExtraBuilder {
    return this.getBuilder().getBondExtraBuilder();
  }

  /**
   * Retrieves the address format for Polyx.
   *
   * @returns {number} The address format as a number for Polyx.
   * @override
   */
  protected getAddressFormat(): number {
    return POLYX_ADDRESS_FORMAT;
  }

  protected async getInitializedNodeAPI(): Promise<ApiPromise> {
    if (!Polyx.nodeApiInitialized) {
      const wsProvider = new WsProvider(Environments[this.bitgo.getEnv()].polymeshNodeUrls);
      Polyx.API = await ApiPromise.create({ provider: wsProvider });
      Polyx.nodeApiInitialized = true;
    }
    return Polyx.API;
  }

  protected async getAccountInfo(walletAddr: string): Promise<{ nonce: number; freeBalance: number }> {
    const api = await this.getInitializedNodeAPI();
    const { nonce, data: balance } = await api.query.system.account(walletAddr);

    return { nonce: nonce.toNumber(), freeBalance: balance.free.toNumber() };
  }

  protected async getFee(destAddr: string, srcAddr: string, amount: number): Promise<number> {
    const api = await this.getInitializedNodeAPI();
    const info = await api.tx.balances.transfer(destAddr, amount).paymentInfo(srcAddr);
    return info.partialFee.toNumber();
  }

  protected async getHeaderInfo(): Promise<{ headerNumber: number; headerHash: string }> {
    const api = await this.getInitializedNodeAPI();
    const { number, hash } = await api.rpc.chain.getHeader();
    return { headerNumber: number.toNumber(), headerHash: hash.toString() };
  }

  protected async getMaterial(): Promise<Interface.Material> {
    const api = await this.getInitializedNodeAPI();
    return {
      genesisHash: api.genesisHash.toString(),
      chainName: api.runtimeChain.toString(),
      specName: api.runtimeVersion.specName.toString() as SubstrateSpecNameType,
      specVersion: api.runtimeVersion.specVersion.toNumber(),
      txVersion: api.runtimeVersion.transactionVersion.toNumber(),
      metadata: api.runtimeMetadata.toHex(),
    };
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param {MPCRecoveryOptions} params parameters needed to construct and
   * (maybe) sign the transaction
   *
   * @returns {MPCTx} the serialized transaction hex string and index
   * of the address being swept
   */
  async recover(params: MPCRecoveryOptions): Promise<MPCTx | MPCSweepTxs> {
    if (!params.bitgoKey) {
      throw new Error('Missing bitgoKey');
    }

    if (!params.recoveryDestination || !this.isValidAddress(params.recoveryDestination)) {
      throw new Error('Invalid recovery destination address');
    }

    const bitgoKey = params.bitgoKey.replace(/\s/g, '');
    const isUnsignedSweep = !params.userKey && !params.backupKey && !params.walletPassphrase;

    const MPC = await EDDSAMethods.getInitializedMpcInstance();

    const index = params.index || 0;
    const currPath = params.seed ? getDerivationPath(params.seed) + `/${index}` : `m/${index}`;
    const accountId = MPC.deriveUnhardened(bitgoKey, currPath).slice(0, 64);
    const senderAddr = this.getAddressFromPublicKey(accountId);

    const { nonce, freeBalance } = await this.getAccountInfo(senderAddr);

    const destAddr = params.recoveryDestination;
    const amount = freeBalance;
    const partialFee = await this.getFee(destAddr, senderAddr, amount);
    const paddedFee = new BigNumber(partialFee).times(10).toNumber();
    const amountToSend = new BigNumber(amount).minus(new BigNumber(paddedFee));

    const value = new BigNumber(freeBalance).minus(new BigNumber(partialFee));
    if (value.isLessThanOrEqualTo(0)) {
      throw new Error('Did not find address with funds to recover');
    }

    const { headerNumber, headerHash } = await this.getHeaderInfo();
    const material = await this.getMaterial();
    const validityWindow = { firstValid: headerNumber, maxDuration: this.MAX_VALIDITY_DURATION };

    const txBuilder = this.getBuilder().getTransferBuilder().material(material) as TransferBuilder;

    txBuilder
      .amount(amountToSend.toString())
      .to({ address: params.recoveryDestination })
      .sender({ address: senderAddr })
      .memo('0')
      .validity(validityWindow)
      .referenceBlock(headerHash)
      .sequenceId({ name: 'Nonce', keyword: 'nonce', value: nonce })
      .fee({ amount: 0, type: 'tip' });

    const unsignedTransaction = (await txBuilder.build()) as Transaction;

    let serializedTx = unsignedTransaction.toBroadcastFormat();
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

      // Decrypt private keys from KeyCard values
      let userPrv;
      try {
        userPrv = this.bitgo.decrypt({
          input: userKey,
          password: params.walletPassphrase,
        });
      } catch (e) {
        throw new Error(`Error decrypting user keychain: ${e.message}`);
      }
      const userSigningMaterial = JSON.parse(userPrv) as EDDSAMethodTypes.UserSigningMaterial;

      let backupPrv;
      try {
        backupPrv = this.bitgo.decrypt({
          input: backupKey,
          password: params.walletPassphrase,
        });
      } catch (e) {
        throw new Error(`Error decrypting backup keychain: ${e.message}`);
      }
      const backupSigningMaterial = JSON.parse(backupPrv) as EDDSAMethodTypes.BackupSigningMaterial;

      // add signature
      const signatureHex = await EDDSAMethods.getTSSSignature(
        userSigningMaterial,
        backupSigningMaterial,
        currPath,
        unsignedTransaction
      );

      const substrateKeyPair = new SubstrateKeyPair({ pub: accountId });
      txBuilder.addSignature({ pub: substrateKeyPair.getKeys().pub }, signatureHex);
      const signedTransaction = await txBuilder.build();
      serializedTx = signedTransaction.toBroadcastFormat();
    } else {
      const walletCoin = this.getChain();
      const inputs = [
        {
          address: unsignedTransaction.inputs[0].address,
          valueString: amountToSend.toString(),
          value: amountToSend.toNumber(),
        },
      ];
      const outputs = [
        {
          address: unsignedTransaction.outputs[0].address,
          valueString: amountToSend.toString(),
          coinName: walletCoin,
        },
      ];
      const spendAmount = amountToSend.toString();
      const parsedTx = { inputs: inputs, outputs: outputs, spendAmount: spendAmount, type: '' };
      const feeInfo = { fee: 0, feeString: '0' };
      const transaction: MPCTx = {
        serializedTx: serializedTx,
        scanIndex: index,
        coin: walletCoin,
        signableHex: unsignedTransaction.signablePayload.toString('hex'),
        derivationPath: currPath,
        parsedTx: parsedTx,
        feeInfo: feeInfo,
        coinSpecific: { ...validityWindow, commonKeychain: bitgoKey },
      };

      const unsignedTx: MPCUnsignedTx = { unsignedTx: transaction, signatureShares: [] };
      const transactions: MPCUnsignedTx[] = [unsignedTx];
      const txRequest: RecoveryTxRequest = {
        transactions: transactions,
        walletCoin: walletCoin,
      };
      const txRequests: MPCSweepTxs = { txRequests: [txRequest] };
      return txRequests;
    }

    const transaction: MPCTx = { serializedTx: serializedTx, scanIndex: index };
    return transaction;
  }

  /** inherited doc */
  async createBroadcastableSweepTransaction(params: MPCSweepRecoveryOptions): Promise<MPCTxs> {
    const req = params.signatureShares;
    const broadcastableTransactions: MPCTx[] = [];
    let lastScanIndex = 0;

    for (let i = 0; i < req.length; i++) {
      const MPC = await EDDSAMethods.getInitializedMpcInstance();
      const transaction = req[i].txRequest.transactions[0].unsignedTx;
      if (!req[i].ovc || !req[i].ovc[0].eddsaSignature) {
        throw new Error('Missing signature(s)');
      }
      const signature = req[i].ovc[0].eddsaSignature;
      if (!transaction.signableHex) {
        throw new Error('Missing signable hex');
      }
      const messageBuffer = Buffer.from(transaction.signableHex!, 'hex');
      const result = MPC.verify(messageBuffer, signature);
      if (!result) {
        throw new Error('Invalid signature');
      }
      const signatureHex = Buffer.concat([Buffer.from(signature.R, 'hex'), Buffer.from(signature.sigma, 'hex')]);
      if (
        !transaction.coinSpecific ||
        !transaction.coinSpecific?.firstValid ||
        !transaction.coinSpecific?.maxDuration
      ) {
        throw new Error('missing validity window');
      }
      const validityWindow = {
        firstValid: transaction.coinSpecific?.firstValid,
        maxDuration: transaction.coinSpecific?.maxDuration,
      };
      const material = await this.getMaterial();
      if (!transaction.coinSpecific?.commonKeychain) {
        throw new Error('Missing common keychain');
      }
      const commonKeychain = transaction.coinSpecific!.commonKeychain! as string;
      if (!transaction.derivationPath) {
        throw new Error('Missing derivation path');
      }
      const derivationPath = transaction.derivationPath as string;
      const accountId = MPC.deriveUnhardened(commonKeychain, derivationPath).slice(0, 64);
      const senderAddr = this.getAddressFromPublicKey(accountId);

      const txnBuilder = this.getBuilder()
        .material(material)
        .from(transaction.serializedTx as string)
        .sender({ address: senderAddr })
        .validity(validityWindow);

      const substrateKeyPair = new SubstrateKeyPair({ pub: accountId });
      txnBuilder.addSignature({ pub: substrateKeyPair.getKeys().pub }, signatureHex);
      const signedTransaction = await txnBuilder.build();
      const serializedTx = signedTransaction.toBroadcastFormat();

      broadcastableTransactions.push({
        serializedTx: serializedTx,
        scanIndex: transaction.scanIndex,
      });

      if (i === req.length - 1 && transaction.coinSpecific!.lastScanIndex) {
        lastScanIndex = transaction.coinSpecific!.lastScanIndex as number;
      }
    }
    return { transactions: broadcastableTransactions, lastScanIndex };
  }

  /**
   * Gets config for how token enablements work for this coin
   * @returns
   *    requiresTokenEnablement: True if tokens need to be enabled for this coin
   *    supportsMultipleTokenEnablements: True if multiple tokens can be enabled in one transaction
   *    validateWallet: Function to validate wallet type for token enablement
   */
  getTokenEnablementConfig(): TokenEnablementConfig {
    return {
      requiresTokenEnablement: true,
      supportsMultipleTokenEnablements: false,
      validateWallet: (walletType: string) => {
        if (walletType !== 'custodial') {
          throw new Error('Token enablement for Polymesh (polyx) is only supported for custodial wallets');
        }
      },
    };
  }
}
