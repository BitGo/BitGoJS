/**
 * @prettier
 */
import * as Bluebird from 'bluebird';

import * as utxolib from '@bitgo/utxo-lib';
import { bip32, BIP32Interface } from '@bitgo/utxo-lib';

const { unspentSum, scriptTypeForChain, outputScripts } = utxolib.bitgo;
export type RootWalletKeys = utxolib.bitgo.RootWalletKeys;
type Unspent<TNumber extends number | bigint = number> = utxolib.bitgo.Unspent<TNumber>;
type WalletUnspent<TNumber extends number | bigint = number> = utxolib.bitgo.WalletUnspent<TNumber>;
type WalletUnspentLegacy<TNumber extends number | bigint = number> = utxolib.bitgo.WalletUnspentLegacy<TNumber>;

import { Dimensions } from '@bitgo/unspents';

import { BitGoBase, IWallet, Keychain, Triple, Wallet } from '@bitgo/sdk-core';
import { AbstractUtxoCoin, TransactionInfo } from '../abstractUtxoCoin';

import { decrypt } from '@bitgo/sdk-api';
import { signAndVerifyWalletTransaction } from '../sign';

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

export interface CrossChainRecoveryUnsigned<TNumber extends number | bigint = number> {
  txHex: string;
  txInfo: TransactionInfo<TNumber>;
  walletId: string;
  feeInfo: FeeInfo;
  address: string;
  coin: string;
}

export interface CrossChainRecoverySigned<TNumber extends number | bigint = number> {
  version: 1 | 2;
  txHex: string;
  txInfo: TransactionInfo<TNumber>;
  walletId: string;
  sourceCoin: string;
  recoveryCoin: string;
  recoveryAddress?: string;
  recoveryAmount?: TNumber;
}

type WalletV1 = {
  keychains: { xpub: string }[];
  address({ address }: { address: string }): Promise<{ chain: number; index: number }>;
  getEncryptedUserKeychain(): Promise<{ encryptedXprv: string }>;
};

export async function getWallet(
  bitgo: BitGoBase,
  coin: AbstractUtxoCoin,
  walletId: string
): Promise<IWallet | WalletV1> {
  try {
    return await coin.wallets().get({ id: walletId });
  } catch (e) {
    // TODO: BG-46364 handle errors more gracefully
    // The v2 endpoint coin.wallets().get() may throw 404 or 400 errors, but this should not prevent us from searching for the walletId in v1 wallets.
    if (e.status >= 500) {
      throw e;
    }
  }

  try {
    return await bitgo.wallets().get({ id: walletId });
  } catch (e) {
    throw new Error(`could not get wallet ${walletId} from v1 or v2: ${e.toString()}`);
  }
}

/**
 * @param recoveryCoin
 * @param wallet
 * @return wallet pubkeys
 */
export async function getWalletKeys(
  recoveryCoin: AbstractUtxoCoin,
  wallet: IWallet | WalletV1
): Promise<RootWalletKeys> {
  let xpubs: Triple<string>;

  if (wallet instanceof Wallet) {
    const keychains = (await recoveryCoin.keychains().getKeysForSigning({ wallet })) as unknown as Keychain[];
    if (keychains.length !== 3) {
      throw new Error(`expected triple got ${keychains.length}`);
    }
    xpubs = keychains.map((k) => k.pub) as Triple<string>;
  } else {
    xpubs = (wallet as WalletV1).keychains.map((k) => k.xpub) as Triple<string>;
  }

  return new utxolib.bitgo.RootWalletKeys(xpubs.map((k) => bip32.fromBase58(k)) as Triple<BIP32Interface>);
}

export async function isWalletAddress(wallet: IWallet | WalletV1, address: string): Promise<boolean> {
  try {
    let addressData;
    if (wallet instanceof Wallet) {
      addressData = await wallet.getAddress({ address });
    } else {
      addressData = await (wallet as WalletV1).address({ address });
    }

    return addressData !== undefined;
  } catch (e) {
    return false;
  }
}

/**
 * @param coin
 * @param txid
 * @param amountType
 * @param wallet
 * @param apiKey - a blockchair api key
 * @return all unspents for transaction outputs, including outputs from other transactions
 */
async function getAllRecoveryOutputs<TNumber extends number | bigint = number>(
  coin: AbstractUtxoCoin,
  txid: string,
  amountType: 'number' | 'bigint' = 'number',
  wallet: IWallet | WalletV1,
  apiKey?: string
): Promise<Unspent<TNumber>[]> {
  const api = coin.getRecoveryProvider(apiKey);
  const tx = await api.getTransactionIO(txid);
  const walletAddresses = (
    await Promise.all(
      tx.outputs.map(async (output) => {
        // For some coins (bch) we need to convert the address to legacy format since the api returns the address
        // in non legacy format. However, we want to keep the address in the same format as the response since we
        // are going to hit the API again to fetch address unspents.
        const canonicalAddress = coin.canonicalAddress(output.address);
        const isWalletOwned = await isWalletAddress(wallet, canonicalAddress);
        return isWalletOwned ? output.address : null;
      })
    )
  ).filter((address) => address !== null);

  const unspents = await api.getUnspentsForAddresses(walletAddresses as string[]);
  if (unspents.length === 0) {
    throw new Error(`No recovery unspents found.`);
  }
  // the api may return cashaddr's instead of legacy for BCH and BCHA
  // downstream processes's only expect legacy addresses
  return unspents.map((recoveryOutput) => {
    return {
      ...recoveryOutput,
      address: coin.canonicalAddress(recoveryOutput.address),
      value: utxolib.bitgo.toTNumber<TNumber>(BigInt(recoveryOutput.value), amountType),
    };
  });
}

/**
 * Data required for address and signature derivation
 */
type ScriptId = {
  chain: number;
  index: number;
};

async function getScriptId(coin: AbstractUtxoCoin, wallet: IWallet | WalletV1, script: Buffer): Promise<ScriptId> {
  const address = utxolib.address.fromOutputScript(script, coin.network);
  let addressData: { chain: number; index: number };
  if (wallet instanceof Wallet) {
    addressData = await wallet.getAddress({ address });
  } else {
    addressData = await (wallet as WalletV1).address({ address });
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
async function toWalletUnspents<TNumber extends number | bigint = number>(
  sourceCoin: AbstractUtxoCoin,
  recoveryCoin: AbstractUtxoCoin,
  unspents: Unspent<TNumber>[],
  wallet: IWallet | WalletV1
): Promise<WalletUnspent<TNumber>[]> {
  const addresses = new Set(unspents.map((u) => u.address));
  return (
    await Bluebird.mapSeries(addresses, async (address): Promise<WalletUnspent<TNumber>[]> => {
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
    bcha: 20,
    tbcha: 20,
    bsv: 20,
    tbsv: 20,
    btc: 80,
    tbtc: 80,
    ltc: 100,
    tltc: 100,
    doge: 1000,
    tdoge: 1000,
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
async function getPrv(xprv?: string, passphrase?: string, wallet?: IWallet | WalletV1): Promise<BIP32Interface> {
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
    encryptedPrv = (await (wallet as WalletV1).getEncryptedUserKeychain()).encryptedXprv;
  }

  return getPrv(decrypt(passphrase, encryptedPrv));
}

/**
 * @param network
 * @param unspents
 * @param targetAddress
 * @param feeRateSatVB
 * @param signer - if set, sign transaction
 * @param amountType
 * @return transaction spending full input amount to targetAddress
 */
function createSweepTransaction<TNumber extends number | bigint = number>(
  network: utxolib.Network,
  unspents: WalletUnspent<TNumber>[],
  targetAddress: string,
  feeRateSatVB: number,
  signer?: utxolib.bitgo.WalletUnspentSigner<RootWalletKeys>,
  amountType: 'number' | 'bigint' = 'number'
): utxolib.bitgo.UtxoTransaction<TNumber> {
  const inputValue = unspentSum<TNumber>(unspents, amountType);
  const vsize = Dimensions.fromUnspents(unspents, {
    p2tr: { scriptPathLevel: 1 },
    p2trMusig2: { scriptPathLevel: undefined },
  })
    .plus(Dimensions.fromOutput({ script: utxolib.address.toOutputScript(targetAddress, network) }))
    .getVSize();
  const fee = vsize * feeRateSatVB;

  const transactionBuilder = utxolib.bitgo.createTransactionBuilderForNetwork<TNumber>(network);
  transactionBuilder.addOutput(
    targetAddress,
    utxolib.bitgo.toTNumber<TNumber>(BigInt(inputValue) - BigInt(fee), amountType)
  );
  unspents.forEach((unspent) => {
    utxolib.bitgo.addToTransactionBuilder(transactionBuilder, unspent);
  });
  let transaction = transactionBuilder.buildIncomplete();
  if (signer) {
    transaction = signAndVerifyWalletTransaction<TNumber>(transactionBuilder, unspents, signer, {
      isLastSignature: false,
    });
  }
  return transaction;
}

function getTxInfo<TNumber extends number | bigint = number>(
  transaction: utxolib.bitgo.UtxoTransaction<TNumber>,
  unspents: WalletUnspent<TNumber>[],
  walletId: string,
  walletKeys: RootWalletKeys,
  amountType: 'number' | 'bigint' = 'number'
): TransactionInfo<TNumber> {
  const inputAmount = utxolib.bitgo.unspentSum<TNumber>(unspents, amountType);
  const outputAmount = utxolib.bitgo.toTNumber<TNumber>(
    transaction.outs.reduce((sum, o) => sum + BigInt(o.value), BigInt(0)),
    amountType
  );
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
    } as WalletUnspentLegacy<TNumber>;
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
  } /* cast to TransactionInfo to allow extra fields may be required by legacy consumers of this data */ as TransactionInfo<TNumber>;
}

function getFeeInfo<TNumber extends number | bigint = number>(
  transaction: utxolib.bitgo.UtxoTransaction<TNumber>,
  unspents: WalletUnspent<TNumber>[],
  amountType: 'number' | 'bigint' = 'number'
): FeeInfo {
  const vsize = Dimensions.fromUnspents(unspents, {
    p2tr: { scriptPathLevel: 1 },
    p2trMusig2: { scriptPathLevel: undefined },
  })
    .plus(Dimensions.fromOutputs(transaction.outs))
    .getVSize();
  const inputAmount = utxolib.bitgo.unspentSum<TNumber>(unspents, amountType);
  const outputAmount = transaction.outs.reduce((sum, o) => sum + BigInt(o.value), BigInt(0));
  const fee = Number(BigInt(inputAmount) - outputAmount);
  return {
    size: vsize,
    fee,
    feeRate: fee / vsize,
    payGoFee: 0,
  };
}

type RecoverParams = {
  /** Wallet ID (can be v1 wallet or v2 wallet) */
  walletId: string;
  /** Coin to create the transaction for */
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
  /** for utxo coins other than [BTC,TBTC] this is a Block Chair api key **/
  apiKey?: string;
};

/**
 * Recover wallet deposits that were received on the wrong blockchain
 * (for instance bitcoin deposits that were received for a litecoin wallet).
 *
 * Fetches the unspent data from BitGo's public blockchain API and the script data from the user's
 * wallet.
 *
 * @param {BitGoBase} bitgo
 * @param {RecoverParams} params
 */
export async function recoverCrossChain<TNumber extends number | bigint = number>(
  bitgo: BitGoBase,
  params: RecoverParams
): Promise<CrossChainRecoverySigned<TNumber> | CrossChainRecoveryUnsigned<TNumber>> {
  const wallet = await getWallet(bitgo, params.recoveryCoin, params.walletId);
  const unspents = await getAllRecoveryOutputs<TNumber>(
    params.sourceCoin,
    params.txid,
    params.sourceCoin.amountType,
    wallet,
    params.apiKey
  );
  const walletUnspents = await toWalletUnspents<TNumber>(params.sourceCoin, params.recoveryCoin, unspents, wallet);
  const walletKeys = await getWalletKeys(params.recoveryCoin, wallet);
  const prv =
    params.xprv || params.walletPassphrase ? await getPrv(params.xprv, params.walletPassphrase, wallet) : undefined;
  const signer = prv
    ? new utxolib.bitgo.WalletUnspentSigner<RootWalletKeys>(walletKeys, prv, walletKeys.bitgo)
    : undefined;
  const feeRateSatVB = await getFeeRateSatVB(params.sourceCoin);
  const transaction = createSweepTransaction<TNumber>(
    params.sourceCoin.network,
    walletUnspents,
    params.recoveryAddress,
    feeRateSatVB,
    signer,
    params.sourceCoin.amountType
  );
  const recoveryAmount = transaction.outs[0].value;
  const txHex = transaction.toBuffer().toString('hex');
  const txInfo = getTxInfo<TNumber>(
    transaction,
    walletUnspents,
    params.walletId,
    walletKeys,
    params.sourceCoin.amountType
  );
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
      feeInfo: getFeeInfo(transaction, walletUnspents, params.sourceCoin.amountType),
      address: params.recoveryAddress,
      coin: params.sourceCoin.getChain(),
    };
  }
}
