import _ from 'lodash';
import {
  BitGoBase,
  ErrorNoInputToRecover,
  getKrsProvider,
  getBip32Keys as getBip32KeysFromSdkCore,
  isTriple,
  krsProviders,
  Triple,
} from '@bitgo/sdk-core';
import { BIP32, fixedScriptWallet } from '@bitgo/wasm-utxo';

import { AbstractUtxoCoin } from '../abstractUtxoCoin';
import { signAndVerifyPsbt } from '../transaction/fixedScript/signTransaction';
import { generateAddressWithChainAndIndex } from '../address';
import { encodeTransaction } from '../transaction/decode';
import { getReplayProtectionPubkeys } from '../transaction/fixedScript/replayProtection';
import { getMainnetCoinName, UtxoCoinName } from '../names';
import { parseOutputId, unspentSum, type WalletUnspent } from '../unspent';

import { forCoin, RecoveryProvider } from './RecoveryProvider';
import { MempoolApi } from './mempoolApi';
import { CoingeckoApi } from './coingeckoApi';
import { createBackupKeyRecoveryPsbt, getRecoveryAmount } from './psbt';

type ScriptType2Of3 = fixedScriptWallet.OutputScriptType;
type ChainCode = fixedScriptWallet.ChainCode;
type WalletUnspentJSON = WalletUnspent & {
  valueString: string;
};

// V1 only deals with BTC. 50 sat/vbyte is very arbitrary.
export const DEFAULT_RECOVERY_FEERATE_SAT_VBYTE_V1 = 50;

// FIXME(BTC-2691): it is unclear why sweeps have a different default than regular recovery. 100 sat/vbyte is extremely high.
export const DEFAULT_RECOVERY_FEERATE_SAT_VBYTE_V1_SWEEP = 100;

// FIXME(BTC-2691): it makes little sense to have a single default for every coin.
export const DEFAULT_RECOVERY_FEERATE_SAT_VBYTE_V2 = 50;
export interface FormattedOfflineVaultTxInfo {
  txInfo: {
    unspents?: WalletUnspentJSON[];
  };
  txHex: string;
  feeInfo: Record<string, never>;
  coin: string;
}

/**
 * Get the current market price from a third party to be used for recovery
 * This function is only intended for non-bitgo recovery transactions, when it is necessary
 * to calculate the rough fee needed to pay to Keyternal. We are okay with approximating,
 * because the resulting price of this function only has less than 1 dollar influence on the
 * fee that needs to be paid to Keyternal.
 *
 * See calculateFeeAmount function:  return Math.round(feeAmountUsd / currentPrice * self.getBaseFactor());
 *
 * This end function should not be used as an accurate endpoint, since some coins' prices are missing from the provider
 */
async function getRecoveryMarketPrice(coin: AbstractUtxoCoin): Promise<number> {
  return await new CoingeckoApi().getUSDPrice(coin.getFamily());
}

/**
 * Calculates the amount (in base units) to pay a KRS provider when building a recovery transaction
 * @param coin
 * @param params
 * @param params.provider {String} the KRS provider that holds the backup key
 * @returns {*}
 */
async function calculateFeeAmount(coin: AbstractUtxoCoin, params: { provider: string }): Promise<number> {
  const krsProvider = krsProviders[params.provider];

  if (krsProvider === undefined) {
    throw new Error(`no fee structure specified for provider ${params.provider}`);
  }

  if (krsProvider.feeType === 'flatUsd') {
    const feeAmountUsd = krsProvider.feeAmount;
    const currentPrice: number = await getRecoveryMarketPrice(coin);

    return Math.round((feeAmountUsd / currentPrice) * coin.getBaseFactor());
  } else {
    // we can add more fee structures here as needed for different providers, such as percentage of recovery amount
    throw new Error('Fee structure not implemented');
  }
}

export interface RecoverParams {
  scan?: number;
  userKey: string;
  backupKey: string;
  bitgoKey: string;
  recoveryDestination: string;
  krsProvider?: string;
  ignoreAddressTypes: ScriptType2Of3[];
  walletPassphrase?: string;
  apiKey?: string;
  userKeyPath?: string;
  recoveryProvider?: RecoveryProvider;
  /** Satoshi per byte */
  feeRate?: number;
}

/**
 * Generate an address and format it for API queries
 * @param coin - The coin instance
 * @param coinName - The coin name
 * @param walletKeys - The wallet keys
 * @param chain - The chain code
 * @param addrIndex - The address index
 * @returns The formatted address (with cashaddr prefix stripped for BCH/BCHA)
 */
function getFormattedAddress(
  coin: AbstractUtxoCoin,
  coinName: UtxoCoinName,
  walletKeys: fixedScriptWallet.RootWalletKeys,
  chain: ChainCode,
  addrIndex: number
): string {
  const format = coin.getChain() === 'bch' || coin.getChain() === 'bcha' ? 'cashaddr' : undefined;
  const address = generateAddressWithChainAndIndex(coinName, walletKeys, chain, addrIndex, format);

  // Blockchair uses cashaddr format when querying the API for address information. Strip the prefix for BCH/BCHA.
  return format === 'cashaddr' ? address.split(':')[1] : address;
}

function hasWitnessData(scriptType: ScriptType2Of3): boolean {
  return scriptType !== 'p2sh';
}

async function queryBlockchainUnspentsPath(
  coin: AbstractUtxoCoin,
  params: RecoverParams,
  walletKeys: fixedScriptWallet.RootWalletKeys,
  chain: ChainCode
): Promise<WalletUnspent<bigint>[]> {
  const scriptType = fixedScriptWallet.ChainCode.scriptType(chain);
  const fetchPrevTx = !hasWitnessData(scriptType) && getMainnetCoinName(coin.name) !== 'zec';
  const recoveryProvider = params.recoveryProvider ?? forCoin(coin.getChain(), params.apiKey);
  const MAX_SEQUENTIAL_ADDRESSES_WITHOUT_TXS = params.scan || 20;
  let numSequentialAddressesWithoutTxs = 0;
  const prevTxCache = new Map<string, string>();

  async function getPrevTx(txid: string): Promise<string> {
    let prevTxHex = prevTxCache.get(txid);
    if (!prevTxHex) {
      prevTxHex = await recoveryProvider.getTransactionHex(txid);
      prevTxCache.set(txid, prevTxHex);
    }
    return prevTxHex;
  }

  async function gatherUnspents(addrIndex: number) {
    const formattedAddress = getFormattedAddress(coin, coin.name, walletKeys, chain, addrIndex);
    const addrInfo = await recoveryProvider.getAddressInfo(formattedAddress);
    // we use txCount here because it implies usage - having tx'es means the addr was generated and used
    if (addrInfo.txCount === 0) {
      numSequentialAddressesWithoutTxs++;
    } else {
      numSequentialAddressesWithoutTxs = 0;

      if (addrInfo.balance > 0) {
        console.log(`Found an address with balance: ${formattedAddress} with balance ${addrInfo.balance}`);
        const addressUnspents = await recoveryProvider.getUnspentsForAddresses([formattedAddress]);
        const processedUnspents = await Promise.all(
          addressUnspents.map(async (u): Promise<WalletUnspent<bigint>> => {
            const { txid, vout } = parseOutputId(u.id);
            let val = BigInt(u.value);
            if (coin.amountType === 'bigint') {
              // blockchair returns the number with the correct precision, but in number format
              // json parse won't parse it correctly, so we requery the txid for the tx hex to decode here
              if (!Number.isSafeInteger(u.value)) {
                const txHex = await getPrevTx(txid);
                const tx = coin.createTransactionFromHex<bigint>(txHex);
                val = tx.outs[vout].value;
              }
            }
            // the api may return cashaddr's instead of legacy for BCH and BCHA
            // downstream processes's only expect legacy addresses
            u = { ...u, address: coin.canonicalAddress(u.address) };
            return {
              ...u,
              value: val,
              chain: chain,
              index: addrIndex,
              prevTx: fetchPrevTx ? Buffer.from(await getPrevTx(txid), 'hex') : undefined,
            } as WalletUnspent<bigint>;
          })
        );

        walletUnspents.push(...processedUnspents);
      }
    }

    if (numSequentialAddressesWithoutTxs >= MAX_SEQUENTIAL_ADDRESSES_WITHOUT_TXS) {
      // stop searching for addresses with unspents in them, we've found ${MAX_SEQUENTIAL_ADDRESSES_WITHOUT_TXS} in a row with none
      // we are done
      return;
    }

    return gatherUnspents(addrIndex + 1);
  }

  // get unspents for these addresses

  const walletUnspents: WalletUnspent<bigint>[] = [];
  // This will populate walletAddresses
  await gatherUnspents(0);

  if (walletUnspents.length === 0) {
    // Couldn't find any addresses with funds
    return [];
  }

  return walletUnspents;
}

async function getRecoveryFeePerBytes(
  coin: AbstractUtxoCoin,
  { defaultValue }: { defaultValue: number }
): Promise<number> {
  if (coin.getFamily() === 'doge') {
    // https://github.com/dogecoin/dogecoin/blob/master/doc/fee-recommendation.md
    // 0.01 DOGE per KB
    return 1000;
  }

  try {
    return await MempoolApi.forCoin(coin.getChain()).getRecoveryFeePerBytes();
  } catch (e) {
    console.dir(e);
    return defaultValue;
  }
}

export type BackupKeyRecoveryTransansaction = {
  inputs?: WalletUnspentJSON[];
  transactionHex: string;
  coin: string;
  backupKey: string;
  recoveryAmount: number;
  recoveryAmountString: string;
};

/**
 * Parameters for backup key recovery PSBT creation.
 * All fields are pre-validated and derived - no string key parsing needed.
 */
export interface RecoverWithUnspentsParams {
  /** Pre-derived wallet keys */
  walletKeys: fixedScriptWallet.RootWalletKeys;
  /** Pre-derived key triple (user, backup, bitgo). Check privateKey to determine signing capability. */
  keys: Triple<BIP32>;
  /** Validated recovery destination address */
  recoveryDestination: string;
  /** Fee rate in satoshi per vbyte */
  feeRateSatVB: number;
  /** KRS fee amount in satoshis (0 if not KRS recovery) */
  krsFee?: bigint;
  /** KRS fee address (required if krsFee > 0) */
  krsFeeAddress?: string;
}

function hasPrivateKey(key: BIP32): boolean {
  return key.privateKey !== undefined;
}

/**
 * Builds a funds recovery PSBT without BitGo, using provided unspents.
 *
 * This is the core transaction building logic, separated from unspent gathering
 * and output formatting. Returns a PSBT at the appropriate signing stage.
 *
 * Signing behavior is determined by the keys:
 * - If user key has no private key: unsigned PSBT
 * - If user key has private key but backup doesn't: half-signed PSBT (user signature only)
 * - If both user and backup keys have private keys: fully signed PSBT (not finalized)
 *
 * @param coinName - The coin name for the PSBT
 * @param params - Recovery parameters with pre-derived keys
 * @param unspents - The wallet unspents to recover (must be non-empty)
 * @returns The PSBT at the appropriate signing stage (never finalized)
 */
export function backupKeyRecoveryWithWalletUnspents(
  coinName: UtxoCoinName,
  params: RecoverWithUnspentsParams,
  unspents: WalletUnspent<bigint>[]
): fixedScriptWallet.BitGoPsbt {
  const { walletKeys, keys, recoveryDestination, feeRateSatVB, krsFee, krsFeeAddress } = params;

  const totalInputAmount = unspentSum(unspents);
  if (totalInputAmount <= BigInt(0)) {
    throw new ErrorNoInputToRecover();
  }

  let psbt = createBackupKeyRecoveryPsbt(coinName, walletKeys, unspents, {
    feeRateSatVB: feeRateSatVB,
    recoveryDestination: recoveryDestination,
    keyRecoveryServiceFee: krsFee ?? BigInt(0),
    keyRecoveryServiceFeeAddress: krsFeeAddress,
  });

  const userHasPrivateKey = hasPrivateKey(keys[0]);
  const backupHasPrivateKey = hasPrivateKey(keys[1]);

  if (!userHasPrivateKey) {
    // Unsigned sweep - return unsigned PSBT
    return psbt;
  }

  const replayProtection = { publicKeys: getReplayProtectionPubkeys(coinName) };

  // Sign with user key
  psbt = signAndVerifyPsbt(psbt, keys[0], walletKeys, replayProtection);

  if (backupHasPrivateKey) {
    // Full recovery - sign with backup key too
    psbt = signAndVerifyPsbt(psbt, keys[1], walletKeys, replayProtection);
  }

  // Return PSBT (not finalized - let caller decide how to format)
  return psbt;
}

/**
 * Parameters for formatting a backup key recovery result.
 */
export interface FormatBackupKeyRecoveryParams {
  /** Pre-derived wallet keys */
  walletKeys: fixedScriptWallet.RootWalletKeys;
  /** Pre-derived key triple (user, backup, bitgo). Check privateKey to determine signing capability. */
  keys: Triple<BIP32>;
  /** Recovery destination address */
  recoveryDestination: string;
  /** KRS provider name (if backup key is held by KRS) */
  krsProvider?: string;
  /** Original backup key string (needed for KRS recovery response) */
  backupKey?: string;
  /** The wallet unspents (needed for inputs array in response) */
  unspents: WalletUnspent<bigint>[];
}

/**
 * Formats a backup key recovery PSBT into the appropriate response format.
 *
 * Output format depends on signing state and KRS provider:
 * - Unsigned sweep: FormattedOfflineVaultTxInfo with PSBT hex
 * - KRS keyternal: BackupKeyRecoveryTransansaction with legacy half-signed tx hex
 * - KRS other: BackupKeyRecoveryTransansaction with PSBT hex
 * - Full recovery: BackupKeyRecoveryTransansaction with finalized tx hex
 *
 * @param coin - The coin instance
 * @param psbt - The PSBT to format (at appropriate signing stage)
 * @param params - Formatting parameters
 * @returns The formatted recovery result
 */
export function formatBackupKeyRecoveryResult(
  coin: AbstractUtxoCoin,
  psbt: fixedScriptWallet.BitGoPsbt,
  params: FormatBackupKeyRecoveryParams
): BackupKeyRecoveryTransansaction | FormattedOfflineVaultTxInfo {
  const { walletKeys, keys, recoveryDestination, krsProvider, backupKey, unspents } = params;

  const userHasPrivateKey = hasPrivateKey(keys[0]);
  const backupHasPrivateKey = hasPrivateKey(keys[1]);

  const isUnsignedSweep = !userHasPrivateKey && !backupHasPrivateKey;
  const isKrsRecovery = krsProvider !== undefined && userHasPrivateKey && !backupHasPrivateKey;
  const isFullRecovery = userHasPrivateKey && backupHasPrivateKey;

  // Unsigned sweep - return FormattedOfflineVaultTxInfo
  if (isUnsignedSweep) {
    return {
      txHex: encodeTransaction(psbt).toString('hex'),
      txInfo: {},
      feeInfo: {},
      coin: coin.getChain(),
    };
  }

  const responseTxFormat = !isKrsRecovery || krsProvider === 'keyternal' ? 'legacy' : 'psbt';
  const txInfo = {} as BackupKeyRecoveryTransansaction;

  // Include inputs array for legacy format responses
  txInfo.inputs =
    responseTxFormat === 'legacy'
      ? unspents.map((u) => ({ ...u, value: Number(u.value), valueString: u.value.toString(), prevTx: undefined }))
      : undefined;

  if (isKrsRecovery) {
    // KRS recovery - half-signed
    // keyternal uses legacy format, other KRS providers use PSBT format
    txInfo.transactionHex =
      krsProvider === 'keyternal'
        ? Buffer.from(psbt.getHalfSignedLegacyFormat()).toString('hex')
        : encodeTransaction(psbt).toString('hex');

    txInfo.coin = coin.getChain();
    txInfo.backupKey = backupKey ?? '';
    const recoveryAmount = getRecoveryAmount(psbt, walletKeys, recoveryDestination);
    txInfo.recoveryAmount = Number(recoveryAmount);
    txInfo.recoveryAmountString = recoveryAmount.toString();
  } else if (isFullRecovery) {
    // Full recovery - finalize and extract transaction
    psbt.finalizeAllInputs();
    txInfo.transactionHex = Buffer.from(psbt.extractTransaction().toBytes()).toString('hex');
  }

  return txInfo;
}

function getBip32Keys(bitgo: BitGoBase, params: RecoverParams): Triple<BIP32> {
  const keys = getBip32KeysFromSdkCore(bitgo, params, { requireBitGoXpub: true });
  if (!isTriple(keys)) {
    throw new Error(`expected key triple`);
  }
  return keys.map((k) => BIP32.from(k.toBase58())) as Triple<BIP32>;
}

/**
 * Builds a funds recovery transaction without BitGo.
 *
 * Returns transaction hex in legacy format for unsigned sweep transaction, half signed backup recovery transaction with KRS provider (only keyternal),
 * fully signed backup recovery transaction without a KRS provider.
 *
 * Returns PSBT hex for half signed backup recovery transaction with KRS provider (excluding keyternal)
 * For PSBT hex cases, Unspents are not required in response.
 *
 * @param coin
 * @param bitgo
 * @param params
 * - userKey: [encrypted] xprv, or xpub
 * - backupKey: [encrypted] xprv, or xpub if the xprv is held by a KRS provider
 * - walletPassphrase: necessary if one of the xprvs is encrypted
 * - bitgoKey: xpub
 * - krsProvider: necessary if backup key is held by KRS
 * - recoveryDestination: target address to send recovered funds to
 * - scan: the amount of consecutive addresses without unspents to scan through before stopping
 * - ignoreAddressTypes: (optional) scripts to ignore
 *        for example: ['p2shP2wsh', 'p2wsh'] will prevent code from checking for wrapped-segwit and native-segwit chains on the public block explorers
 */
export async function backupKeyRecovery(
  coin: AbstractUtxoCoin,
  bitgo: BitGoBase,
  params: RecoverParams
): Promise<BackupKeyRecoveryTransansaction | FormattedOfflineVaultTxInfo> {
  if (_.isUndefined(params.userKey)) {
    throw new Error('missing userKey');
  }

  if (_.isUndefined(params.backupKey)) {
    throw new Error('missing backupKey');
  }

  if (
    _.isUndefined(params.recoveryDestination) ||
    !coin.isValidAddress(params.recoveryDestination, { anyFormat: true })
  ) {
    throw new Error('invalid recoveryDestination');
  }

  if (!_.isUndefined(params.scan) && (!_.isInteger(params.scan) || params.scan < 0)) {
    throw new Error('scan must be a positive integer');
  }

  if (params.feeRate !== undefined && (!Number.isFinite(params.feeRate) || params.feeRate <= 0)) {
    throw new Error('feeRate must be a positive number');
  }

  // check whether key material and password authenticate the users and return parent keys of all three keys of the wallet
  const keys = getBip32Keys(bitgo, params);
  const walletKeys = fixedScriptWallet.RootWalletKeys.from({
    triple: keys,
    derivationPrefixes: [params.userKeyPath || 'm/0/0', 'm/0/0', 'm/0/0'],
  });

  const unspents: WalletUnspent<bigint>[] = (
    await Promise.all(
      fixedScriptWallet.outputScriptTypes
        .filter(
          (addressType) =>
            fixedScriptWallet.supportsScriptType(coin.name, addressType) &&
            !params.ignoreAddressTypes?.includes(addressType)
        )
        .reduce(
          (queries, addressType) => [
            ...queries,
            queryBlockchainUnspentsPath(
              coin,
              params,
              walletKeys,
              fixedScriptWallet.ChainCode.value(addressType, 'external')
            ),
            queryBlockchainUnspentsPath(
              coin,
              params,
              walletKeys,
              fixedScriptWallet.ChainCode.value(addressType, 'internal')
            ),
          ],
          [] as Promise<WalletUnspent<bigint>[]>[]
        )
    )
  ).flat();

  const feeRateSatVB =
    params.feeRate !== undefined
      ? params.feeRate
      : await getRecoveryFeePerBytes(coin, { defaultValue: DEFAULT_RECOVERY_FEERATE_SAT_VBYTE_V2 });

  // Calculate KRS fee if needed
  const userHasPrivateKey = hasPrivateKey(keys[0]);
  const backupHasPrivateKey = hasPrivateKey(keys[1]);
  const isKrsRecovery = params.krsProvider !== undefined && userHasPrivateKey && !backupHasPrivateKey;

  let krsFee = BigInt(0);
  let krsFeeAddress: string | undefined;

  if (isKrsRecovery && params.krsProvider) {
    try {
      krsFee = BigInt(await calculateFeeAmount(coin, { provider: params.krsProvider }));
    } catch (err) {
      // Don't let this error block the recovery -
      console.dir(err);
    }

    if (krsFee > BigInt(0)) {
      const krsProviderConfig = getKrsProvider(coin, params.krsProvider);
      if (!krsProviderConfig.feeAddresses) {
        throw new Error(`keyProvider must define feeAddresses`);
      }

      krsFeeAddress = krsProviderConfig.feeAddresses[coin.getChain()];

      if (!krsFeeAddress) {
        throw new Error('this KRS provider has not configured their fee structure yet - recovery cannot be completed');
      }
    }
  }

  // Build and sign PSBT
  const psbt = backupKeyRecoveryWithWalletUnspents(
    coin.name,
    {
      walletKeys,
      keys,
      recoveryDestination: params.recoveryDestination,
      feeRateSatVB,
      krsFee,
      krsFeeAddress,
    },
    unspents
  );

  // Format the result
  return formatBackupKeyRecoveryResult(coin, psbt, {
    walletKeys,
    keys,
    recoveryDestination: params.recoveryDestination,
    krsProvider: params.krsProvider,
    backupKey: params.backupKey,
    unspents,
  });
}

export interface BitGoV1Unspent {
  tx_hash: string;
  tx_output_n: number;
  value: number;
}

export interface V1SweepParams {
  walletId: string;
  walletPassphrase: string;
  unspents: BitGoV1Unspent[];
  recoveryDestination: string;
  userKey: string;
  otp: string;
}

export interface V1RecoverParams extends Omit<V1SweepParams, 'otp'> {
  backupKey: string;
}

export async function v1BackupKeyRecovery(
  coin: AbstractUtxoCoin,
  bitgo: BitGoBase,
  params: V1RecoverParams
): Promise<string> {
  if (
    _.isUndefined(params.recoveryDestination) ||
    !coin.isValidAddress(params.recoveryDestination, { anyFormat: true })
  ) {
    throw new Error('invalid recoveryDestination');
  }

  const recoveryFeePerByte = await getRecoveryFeePerBytes(coin, {
    defaultValue: DEFAULT_RECOVERY_FEERATE_SAT_VBYTE_V1,
  });
  const v1wallet = await bitgo.wallets().get({ id: params.walletId });
  return await v1wallet.recover({
    ...params,
    feeRate: recoveryFeePerByte,
  });
}

export async function v1Sweep(
  coin: AbstractUtxoCoin,
  bitgo: BitGoBase,
  params: V1SweepParams
): Promise<{
  tx: string;
  hash: string;
  status: string;
}> {
  if (
    _.isUndefined(params.recoveryDestination) ||
    !coin.isValidAddress(params.recoveryDestination, { anyFormat: true })
  ) {
    throw new Error('invalid recoveryDestination');
  }

  let recoveryFeePerByte = 100;
  if (bitgo.env === 'prod') {
    recoveryFeePerByte = await getRecoveryFeePerBytes(coin, {
      defaultValue: DEFAULT_RECOVERY_FEERATE_SAT_VBYTE_V1_SWEEP,
    });
  }

  const v1wallet = await bitgo.wallets().get({ id: params.walletId });
  return await v1wallet.sweep({
    ...params,
    feeRate: recoveryFeePerByte,
  });
}
