/**
 * @prettier
 */
import * as _ from 'lodash';
import * as request from 'superagent';
import * as Bluebird from 'bluebird';

import * as bip32 from 'bip32';
import * as utxolib from '@bitgo/utxo-lib';
import {
  RootWalletKeys,
  Unspent,
  unspentSum,
  scriptTypeForChain,
  outputScripts,
  WalletUnspent,
  WalletUnspentLegacy,
  WalletUnspentSigner,
} from '@bitgo/utxo-lib/dist/src/bitgo';
import { Dimensions } from '@bitgo/unspents';

import { BitGo } from '../../../../bitgo';
import { AbstractUtxoCoin, TransactionInfo } from '../../abstractUtxoCoin';
import { Wallet } from '../../../wallet';

import { Keychain } from '../../../keychains';
import { Triple } from '../../../triple';
import { decrypt } from '../../../../encrypt';
import { signAndVerifyWalletTransaction } from '../sign';

export interface ExplorerTxInfo {
  input: { address: string }[];
  outputs: { address: string }[];
}

class BitgoPublicApi {
  constructor(public coin: AbstractUtxoCoin) {}

  async getTransactionInfo(txid: string): Promise<ExplorerTxInfo> {
    const url = this.coin.url(`/public/tx/${txid}`);
    return ((await request.get(url)) as { body: ExplorerTxInfo }).body;
  }

  /**
   * Fetch unspent transaction outputs using IMS unspents API
   * @param addresses
   * @returns {*}
   */
  async getUnspentInfo(addresses: string[]): Promise<Unspent[]> {
    const url = this.coin.url(`/public/addressUnspents/${_.uniq(addresses).join(',')}`);
    return (await request.get(url)).body as Unspent[];
  }
}

export interface BuildRecoveryTransactionOptions {
  wallet: string;
  faultyTxId: string;
  recoveryAddress: string;
}

type FeeInfo = {
  size: number;
  feeRate: number;
  fee: number;
  payGoFee: number;
};

export interface CrossChainRecoveryUnsigned {
  txHex: string;
  txInfo: TransactionInfo;
  walletId: string;
  feeInfo: FeeInfo;
  address: string;
  coin: string;
}

export interface CrossChainRecoverySigned {
  version: 1 | 2;
  txHex: string;
  txInfo: TransactionInfo;
  walletId: string;
  sourceCoin: string;
  recoveryCoin: string;
  recoveryAddress?: string;
  recoveryAmount?: number;
}

type WalletV1 = {
  keychains: { xpub: string }[];
  address({ address: string }): Promise<{ chain: number; index: number }>;
  getEncryptedUserKeychain(): Promise<{ encryptedXprv: string }>;
};

type RecoverParams = {
  /** Wallet ID (can be v1 wallet or v2 wallet) */
  walletId: string;
  /** Coin to create the transction for */
  sourceCoin: AbstractUtxoCoin;
  /** Coin that wallet keys were set up for */
  recoveryCoin: AbstractUtxoCoin;
  /** Source coin transaction to recover outputs from (sourceCoin) */
  txid: string;
  /** Source coin address to send the funds to */
  recoveryAddress: string;
  /** If set, decrypts private key and signs transaction */
  walletPassphrase?: string;
  /** If set, signs transaction */
  xprv?: string;
};

async function getWallet(bitgo: BitGo, coin: AbstractUtxoCoin, walletId: string): Promise<Wallet | WalletV1> {
  try {
    return await coin.wallets().get({ id: walletId });
  } catch (e) {
    if (e.status !== 404) {
      throw e;
    }
  }

  try {
    return await this.bitgo.wallets().get({ id: walletId });
  } catch (e) {
    throw new Error(`could not get wallet ${walletId} from v1 or v2`);
  }
}

/**
 * @param recoveryCoin
 * @param wallet
 * @return wallet pubkeys
 */
async function getWalletKeys(recoveryCoin: AbstractUtxoCoin, wallet: Wallet | WalletV1): Promise<RootWalletKeys> {
  let xpubs: Triple<string>;

  if (wallet instanceof Wallet) {
    const keychains = (await recoveryCoin.keychains().getKeysForSigning({ wallet })) as unknown as Keychain[];
    if (keychains.length !== 3) {
      throw new Error(`expected triple got ${keychains.length}`);
    }
    xpubs = keychains.map((k) => k.pub) as Triple<string>;
  } else {
    xpubs = wallet.keychains.map((k) => k.xpub) as Triple<string>;
  }

  return new RootWalletKeys(xpubs.map((k) => bip32.fromBase58(k)) as Triple<bip32.BIP32Interface>);
}

/**
 * @param coin
 * @param txid
 * @return all unspents for transaction outputs, including outputs from other transactions
 */
async function getAllRecoveryOutputs(coin: AbstractUtxoCoin, txid: string): Promise<Unspent[]> {
  const api = new BitgoPublicApi(coin);
  const info = await api.getTransactionInfo(txid);
  const addresses = new Set(info.outputs.map((o) => o.address));
  return await api.getUnspentInfo([...addresses]);
}

/**
 * Data required for address and signature derivation
 */
type ScriptId = {
  chain: number;
  index: number;
};

async function getScriptId(coin: AbstractUtxoCoin, wallet: Wallet | WalletV1, script: Buffer): Promise<ScriptId> {
  const address = utxolib.address.fromOutputScript(script, coin.network);
  let addressData: { chain: number; index: number };
  if (wallet instanceof Wallet) {
    addressData = await wallet.getAddress({ address });
  } else {
    addressData = await wallet.address({ address });
  }
  if (typeof addressData.chain === 'number' && typeof addressData.index === 'number') {
    return { chain: addressData.chain, index: addressData.index };
  }

  throw new Error(`invalid address data: ${JSON.stringify(addressData)}`);
}

/**
 * Lookup address data from unspents on sourceCoin in address database of recoveryCoin.
 * Return full walletUnspents including scriptId in sourceCoin format.
 *
 * @param sourceCoin
 * @param recoveryCoin
 * @param unspents
 * @param wallet
 * @return walletUnspents
 */
async function toWalletUnspents(
  sourceCoin: AbstractUtxoCoin,
  recoveryCoin: AbstractUtxoCoin,
  unspents: Unspent[],
  wallet: Wallet | WalletV1
): Promise<WalletUnspent[]> {
  const addresses = new Set(unspents.map((u) => u.address));
  return (
    await Bluebird.mapSeries(addresses, async (address): Promise<WalletUnspent[]> => {
      let scriptId;
      try {
        scriptId = await getScriptId(recoveryCoin, wallet, utxolib.address.toOutputScript(address, sourceCoin.network));
      } catch (e) {
        console.error(`error getting scriptId for ${address}:`, e);
        return [];
      }
      return unspents
        .filter((u) => u.address === address)
        .map((u) => ({
          ...u,
          ...scriptId,
        }));
    })
  ).flat();
}

/**
 * @param coin
 * @return feeRate for transaction
 */
async function getFeeRateSatVB(coin: AbstractUtxoCoin): Promise<number> {
  // TODO: use feeRate API
  const feeRate = {
    bch: 20,
    tbch: 20,
    bsv: 20,
    tbsv: 20,
    btc: 80,
    tbtc: 80,
    ltc: 100,
    tltc: 100,
  }[coin.getChain()];

  if (!feeRate) {
    throw new Error(`no feeRate for ${coin.getChain()}`);
  }

  return feeRate;
}

/**
 * @param xprv
 * @param passphrase
 * @param wallet
 * @return signing key
 */
async function getPrv(xprv?: string, passphrase?: string, wallet?: Wallet | WalletV1): Promise<bip32.BIP32Interface> {
  if (xprv) {
    const key = bip32.fromBase58(xprv);
    if (key.isNeutered()) {
      throw new Error(`not a private key`);
    }
    return key;
  }

  if (!wallet || !passphrase) {
    throw new Error(`no xprv given: need wallet and passphrase to continue`);
  }

  let encryptedPrv: string;
  if (wallet instanceof Wallet) {
    encryptedPrv = (await wallet.getEncryptedUserKeychain()).encryptedPrv;
  } else {
    encryptedPrv = (await wallet.getEncryptedUserKeychain()).encryptedXprv;
  }

  return getPrv(decrypt(passphrase, encryptedPrv));
}

/**
 * @param network
 * @param unspents
 * @param targetAddress
 * @param feeRateSatVB
 * @param signer - if set, sign transaction
 * @return transaction spending full input amount to targetAddress
 */
function createSweepTransaction(
  network: utxolib.Network,
  unspents: WalletUnspent[],
  targetAddress: string,
  feeRateSatVB: number,
  signer?: WalletUnspentSigner<RootWalletKeys>
): utxolib.bitgo.UtxoTransaction {
  const inputValue = unspentSum(unspents);
  const vsize = Dimensions.fromUnspents(unspents)
    .plus(Dimensions.fromOutput({ script: utxolib.address.toOutputScript(targetAddress, network) }))
    .getVSize();
  const fee = vsize * feeRateSatVB;

  const transactionBuilder = utxolib.bitgo.createTransactionBuilderForNetwork(network);
  transactionBuilder.addOutput(targetAddress, inputValue - fee);
  unspents.forEach((unspent) => {
    utxolib.bitgo.addToTransactionBuilder(transactionBuilder, unspent);
  });
  let transaction = transactionBuilder.buildIncomplete();
  if (signer) {
    transaction = signAndVerifyWalletTransaction(transactionBuilder, unspents, signer, { isLastSignature: false });
  }
  return transaction;
}

function getTxInfo(
  transaction: utxolib.bitgo.UtxoTransaction,
  unspents: WalletUnspent[],
  walletId: string,
  walletKeys: RootWalletKeys
): TransactionInfo {
  const inputAmount = utxolib.bitgo.unspentSum(unspents);
  const outputAmount = transaction.outs.reduce((sum, o) => sum + o.value, 0);
  const outputs = transaction.outs.map((o) => ({
    address: utxolib.address.fromOutputScript(o.script, transaction.network),
    valueString: o.value.toString(),
    change: false,
  }));
  const inputs = unspents.map((u) => {
    // NOTE:
    // The `redeemScript` and `walletScript` properties are required for legacy versions of BitGoJS
    // which might require these scripts for signing. The Wallet Recovery Wizard (WRW) can create
    // unsigned prebuilds that are submitted to BitGoJS instances which are not necessarily the same
    // version.
    const addressKeys = walletKeys.deriveForChainAndIndex(u.chain, u.index);
    const scriptType = scriptTypeForChain(u.chain);
    const { redeemScript, witnessScript } = outputScripts.createOutputScript2of3(addressKeys.publicKeys, scriptType);

    return {
      ...u,
      wallet: walletId,
      fromWallet: walletId,
      redeemScript: redeemScript?.toString('hex'),
      witnessScript: witnessScript?.toString('hex'),
    } as WalletUnspentLegacy;
  });
  return {
    inputAmount,
    outputAmount,
    minerFee: inputAmount - outputAmount,
    spendAmount: outputAmount,
    inputs,
    unspents: inputs,
    outputs,
    externalOutputs: outputs,
    changeOutputs: [],
    payGoFee: 0,
  } as TransactionInfo;
}

function getFeeInfo(transaction: utxolib.bitgo.UtxoTransaction, unspents: WalletUnspent[]): FeeInfo {
  const vsize = Dimensions.fromUnspents(unspents).plus(Dimensions.fromOutputs(transaction.outs)).getVSize();
  const inputAmount = utxolib.bitgo.unspentSum(unspents);
  const outputAmount = transaction.outs.reduce((sum, o) => sum + o.value, 0);
  const fee = inputAmount - outputAmount;
  return {
    size: vsize,
    fee,
    feeRate: fee / vsize,
    payGoFee: 0,
  };
}

export async function recoverCrossChain(
  bitgo: BitGo,
  params: RecoverParams
): Promise<CrossChainRecoverySigned | CrossChainRecoveryUnsigned> {
  const wallet = await getWallet(bitgo, params.recoveryCoin, params.walletId);
  const unspents = await getAllRecoveryOutputs(params.sourceCoin, params.txid);
  const walletUnspents = await toWalletUnspents(params.sourceCoin, params.recoveryCoin, unspents, wallet);
  const walletKeys = await getWalletKeys(params.recoveryCoin, wallet);
  const prv =
    params.xprv || params.walletPassphrase ? await getPrv(params.xprv, params.walletPassphrase, wallet) : undefined;
  const signer = prv ? new WalletUnspentSigner<RootWalletKeys>(walletKeys, prv, walletKeys.bitgo) : undefined;
  const feeRateSatVB = await getFeeRateSatVB(params.sourceCoin);
  const transaction = createSweepTransaction(
    params.sourceCoin.network,
    walletUnspents,
    params.recoveryAddress,
    feeRateSatVB,
    signer
  );
  const recoveryAmount = transaction.outs[0].value;
  const txHex = transaction.toBuffer().toString('hex');
  const txInfo = getTxInfo(transaction, walletUnspents, params.walletId, walletKeys);
  if (prv) {
    return {
      version: wallet instanceof Wallet ? 2 : 1,
      walletId: params.walletId,
      txHex,
      txInfo,
      sourceCoin: params.sourceCoin.getChain(),
      recoveryCoin: params.recoveryCoin.getChain(),
      recoveryAmount,
    };
  } else {
    return {
      txHex,
      txInfo,
      walletId: params.walletId,
      feeInfo: getFeeInfo(transaction, walletUnspents),
      address: params.recoveryAddress,
      coin: params.sourceCoin.getChain(),
    };
  }
}
