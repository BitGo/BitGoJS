import {
  BaseCoin,
  BitGoBase,
  EDDSAMethods,
  Environments,
  MPCSweepRecoveryOptions,
  MPCTx,
  MPCTxs,
  SignTransactionOptions as BaseSignTransactionOptions,
} from '@bitgo/sdk-core';
import { coins, BaseCoin as StaticsBaseCoin, SubstrateSpecNameType } from '@bitgo/statics';
import { Interface, KeyPair as SubstrateKeyPair, SubstrateCoin } from '@bitgo/abstract-substrate';
import { TransactionBuilderFactory } from './lib';
import { ApiPromise, WsProvider } from '@polkadot/api';
import nacl from 'tweetnacl';
export const DEFAULT_SCAN_FACTOR = 20; // default number of receive addresses to scan for funds

export interface SignTransactionOptions extends BaseSignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

export interface TransactionPrebuild {
  txHex: string;
  transaction: Interface.TxData;
}

export interface ExplainTransactionOptions {
  txPrebuild: TransactionPrebuild;
  publicKey: string;
  feeInfo: {
    fee: string;
  };
}

export interface VerifiedTransactionParameters {
  txHex: string;
  prv: string;
}

export class Tao extends SubstrateCoin {
  readonly staticsCoin?: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }
    this.staticsCoin = staticsCoin;
  }

  protected static nodeApiInitialized = false;
  protected static API: ApiPromise;

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Tao(bitgo, staticsCoin);
  }

  getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
  }

  getMaxValidityDurationBlocks(): number {
    return 2400;
  }

  allowsAccountConsolidations(): boolean {
    return true;
  }

  protected async getInitializedNodeAPI(): Promise<ApiPromise> {
    if (!Tao.nodeApiInitialized) {
      const wsProvider = new WsProvider(Environments[this.bitgo.getEnv()].substrateNodeUrls);
      Tao.API = await ApiPromise.create({ provider: wsProvider });
      Tao.nodeApiInitialized = true;
    }
    return Tao.API;
  }

  protected async getAccountInfo(walletAddr: string): Promise<{ nonce: number; freeBalance: number }> {
    const api = await this.getInitializedNodeAPI();
    const { nonce, data: balance } = await api.query.system.account(walletAddr);
    return { nonce: nonce.toNumber(), freeBalance: balance.free.toNumber() };
  }

  protected async getFee(destAddr: string, srcAddr: string, amount: number): Promise<number> {
    const api = await this.getInitializedNodeAPI();
    const info = await api.tx.balances.transferAllowDeath(destAddr, amount).paymentInfo(srcAddr);
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

  /** inherited doc */
  async createBroadcastableSweepTransaction(params: MPCSweepRecoveryOptions): Promise<MPCTxs> {
    const req = params.signatureShares;
    const broadcastableTransactions: MPCTx[] = [];
    let lastScanIndex = 0;

    for (let i = 0; i < req.length; i++) {
      const MPC = await EDDSAMethods.getInitializedMpcInstance();
      const transaction = req[i].txRequest.transactions[0].unsignedTx;
      const ovc = req[i].ovc?.[0];
      const mpcv2SignatureHex = ovc?.eddsaMpcv2Signature;
      if (!ovc || (!mpcv2SignatureHex && !ovc.eddsaSignature)) {
        throw new Error('Missing signature(s)');
      }
      if (!transaction.signableHex) {
        throw new Error('Missing signable hex');
      }
      const messageBuffer = Buffer.from(transaction.signableHex!, 'hex');
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
      let signatureHex: Buffer;
      if (mpcv2SignatureHex) {
        // MPCv2 (OVC 5-pass): raw 64-byte Ed25519 signature. Verify against the
        // same derived public key the transaction is signed under, then embed as-is.
        const signature = Buffer.from(mpcv2SignatureHex, 'hex');
        const isValid = nacl.sign.detached.verify(messageBuffer, signature, Buffer.from(accountId, 'hex'));
        if (!isValid) {
          throw new Error('Invalid signature');
        }
        signatureHex = signature;
      } else {
        const result = MPC.verify(messageBuffer, ovc.eddsaSignature);
        if (!result) {
          throw new Error('Invalid signature');
        }
        signatureHex = Buffer.concat([
          Buffer.from(ovc.eddsaSignature.R, 'hex'),
          Buffer.from(ovc.eddsaSignature.sigma, 'hex'),
        ]);
      }

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
}
