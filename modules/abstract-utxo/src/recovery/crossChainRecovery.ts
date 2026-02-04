import { BIP32Interface, bip32 } from '@bitgo/secp256k1';
import { CoinName, fixedScriptWallet, address as wasmAddress } from '@bitgo/wasm-utxo';
import { BitGoBase, IWallet, Keychain, Triple, Wallet } from '@bitgo/sdk-core';
import { decrypt } from '@bitgo/sdk-api';

import { AbstractUtxoCoin, TransactionInfo } from '../abstractUtxoCoin';
import { signAndVerifyPsbt } from '../transaction/fixedScript/signTransaction';
import { UtxoCoinName } from '../names';
import { encodeTransaction } from '../transaction/decode';
import { getReplayProtectionPubkeys } from '../transaction/fixedScript/replayProtection';
import { toTNumber } from '../tnumber';
import { unspentSum, type Unspent, type WalletUnspent } from '../unspent';

import { createEmptyWasmPsbt, addWalletInputsToWasmPsbt, addOutputToWasmPsbt, getRecoveryAmount } from './psbt';

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
  txInfo?: TransactionInfo<TNumber>;
  walletId: string;
  feeInfo?: FeeInfo;
  address: string;
  coin: string;
}

export interface CrossChainRecoverySigned<TNumber extends number | bigint = number> {
  version: 1 | 2;
  txHex: string;
  txInfo?: TransactionInfo<TNumber>;
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
): Promise<fixedScriptWallet.RootWalletKeys> {
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

  return fixedScriptWallet.RootWalletKeys.from(xpubs);
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
 * Convert a Litecoin P2SH address from M... format (scriptHash 0x32) to the legacy 3... format (scriptHash 0x05).
 * This is needed for cross-chain recovery when LTC was sent to a BTC address, because the BTC wallet
 * stores addresses in the 3... format while the LTC blockchain returns addresses in M... format.
 *
 * @param address - LTC address to convert
 * @param coinName - The coin name (e.g. 'ltc', 'tltc')
 * @returns The address in legacy 3... format, or the original address if it's not a P2SH address
 */
export function convertLtcAddressToLegacyFormat(address: string, coinName: UtxoCoinName): string {
  const network = getNetworkFromCoinName(coinName);
  try {
    // Try to decode as bech32 - these don't need conversion
    utxolib.address.fromBech32(address);
    return address;
  } catch (e) {
    // Not bech32, continue to base58
  }

  try {
    const decoded = utxolib.address.fromBase58Check(address, network);
    // Only convert P2SH addresses (scriptHash), not P2PKH (pubKeyHash)
    if (decoded.version === network.scriptHash) {
      // Convert to legacy format using Bitcoin's scriptHash (0x05)
      const legacyScriptHash = utxolib.networks.bitcoin.scriptHash;
      return utxolib.address.toBase58Check(decoded.hash, legacyScriptHash, network);
    }
    // P2PKH or other - return unchanged
    return address;
  } catch (e) {
    // If decoding fails, return the original address
    return address;
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
        let isWalletOwned = await isWalletAddress(wallet, canonicalAddress);

        // For LTC cross-chain recovery: if the address isn't found, try the legacy format.
        // When LTC is sent to a BTC address, the LTC blockchain returns M... addresses
        // but the BTC wallet stores addresses in 3... format.
        if (!isWalletOwned && coin.getFamily() === 'ltc') {
          const legacyAddress = convertLtcAddressToLegacyFormat(output.address, coin.name);
          if (legacyAddress !== output.address) {
            isWalletOwned = await isWalletAddress(wallet, legacyAddress);
          }
        }

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
      value: toTNumber(BigInt(recoveryOutput.value), amountType) as TNumber,
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

async function getScriptId(coin: AbstractUtxoCoin, wallet: IWallet | WalletV1, script: Uint8Array): Promise<ScriptId> {
  const address = wasmAddress.fromOutputScriptWithCoin(script, coin.name);
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
  const walletUnspents: WalletUnspent<TNumber>[] = [];

  for (const address of addresses) {
    let scriptId;
    try {
      scriptId = await getScriptId(recoveryCoin, wallet, wasmAddress.toOutputScriptWithCoin(address, sourceCoin.name));
    } catch (e) {
      console.error(`error getting scriptId for ${address}:`, e);
      continue;
    }
    const filteredUnspents = unspents
      .filter((u) => u.address === address)
      .map((u) => ({
        ...u,
        ...scriptId,
      }));
    walletUnspents.push(...filteredUnspents);
  }

  return walletUnspents;
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
    tbtcsig: 80,
    tbtc4: 80,
    tbtcbgsig: 80,
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
 * Create a sweep transaction for cross-chain recovery using wasm-utxo
 * @param coinName - BitGo coin name (e.g. 'btc', 'tbtc', 'ltc')
 * @param walletKeys
 * @param unspents
 * @param targetAddress
 * @param feeRateSatVB
 * @return unsigned PSBT
 */
function createSweepTransaction<TNumber extends number | bigint = number>(
  coinName: CoinName,
  walletKeys: fixedScriptWallet.RootWalletKeys,
  unspents: WalletUnspent<TNumber>[],
  targetAddress: string,
  feeRateSatVB: number
): fixedScriptWallet.BitGoPsbt {
  const inputValue = unspentSum(unspents);

  // Create PSBT with wasm-utxo and add wallet inputs using shared utilities
  const unspentsBigint = unspents.map((u) => ({ ...u, value: BigInt(u.value) }));
  const wasmPsbt = createEmptyWasmPsbt(coinName, walletKeys);
  addWalletInputsToWasmPsbt(wasmPsbt, unspentsBigint, walletKeys);

  // Calculate dimensions using wasm-utxo Dimensions
  const vsize = fixedScriptWallet.Dimensions.fromPsbt(wasmPsbt)
    .plus(fixedScriptWallet.Dimensions.fromOutput(targetAddress, coinName))
    .getVSize();
  const fee = BigInt(Math.round(vsize * feeRateSatVB));

  // Add output to wasm PSBT
  addOutputToWasmPsbt(wasmPsbt, targetAddress, inputValue - fee, coinName);

  return wasmPsbt;
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
  const walletKeys = fixedScriptWallet.RootWalletKeys.from(await getWalletKeys(params.recoveryCoin, wallet));
  const prv =
    params.xprv || params.walletPassphrase ? await getPrv(params.xprv, params.walletPassphrase, wallet) : undefined;
  const feeRateSatVB = await getFeeRateSatVB(params.sourceCoin);

  // Create PSBT for both signed and unsigned recovery
  let psbt = createSweepTransaction<TNumber>(
    params.sourceCoin.getChain(),
    walletKeys,
    walletUnspents,
    params.recoveryAddress,
    feeRateSatVB
  );

  // For unsigned recovery, return unsigned PSBT hex
  if (!prv) {
    return {
      txHex: encodeTransaction(psbt).toString('hex'),
      walletId: params.walletId,
      address: params.recoveryAddress,
      coin: params.sourceCoin.getChain(),
    };
  }

  // For signed recovery, sign the PSBT with user key and return half-signed PSBT
  psbt = signAndVerifyPsbt(psbt, prv, walletKeys, {
    publicKeys: getReplayProtectionPubkeys(params.sourceCoin.name),
  });

  return {
    version: wallet instanceof Wallet ? 2 : 1,
    walletId: params.walletId,
    txHex: encodeTransaction(psbt).toString('hex'),
    sourceCoin: params.sourceCoin.getChain(),
    recoveryCoin: params.recoveryCoin.getChain(),
    recoveryAmount: toTNumber(
      getRecoveryAmount(psbt, walletKeys, params.recoveryAddress),
      params.sourceCoin.amountType
    ) as TNumber,
  };
}
