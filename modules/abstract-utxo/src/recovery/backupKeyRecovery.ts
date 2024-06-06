/**
 * @prettier
 */

import * as assert from 'assert';
import * as _ from 'lodash';
import * as utxolib from '@bitgo/utxo-lib';
const { getInternalChainCode, scriptTypeForChain, outputScripts, getExternalChainCode } = utxolib.bitgo;

type ChainCode = utxolib.bitgo.ChainCode;
type RootWalletKeys = utxolib.bitgo.RootWalletKeys;
type WalletUnspent<TNumber extends number | bigint> = utxolib.bitgo.WalletUnspent<TNumber>;
type WalletUnspentJSON = utxolib.bitgo.WalletUnspent & {
  valueString: string;
};
type ScriptType2Of3 = utxolib.bitgo.outputScripts.ScriptType2Of3;

import { VirtualSizes } from '@bitgo/unspents';

import {
  BitGoBase,
  ErrorNoInputToRecover,
  getKrsProvider,
  getBip32Keys,
  getIsKrsRecovery,
  getIsUnsignedSweep,
  isTriple,
  krsProviders,
} from '@bitgo/sdk-core';
import { AbstractUtxoCoin, MultiSigAddress } from '../abstractUtxoCoin';

import { forCoin, RecoveryProvider } from './RecoveryProvider';
import { MempoolApi } from './mempoolApi';
import { CoingeckoApi } from './coingeckoApi';
import { signAndVerifyPsbt } from '../sign';
import { getMainnet, networks } from '@bitgo/utxo-lib';

export interface OfflineVaultTxInfo {
  inputs: WalletUnspent<number>[];
}

export interface FormattedOfflineVaultTxInfo {
  txInfo: {
    unspents: WalletUnspentJSON[];
  };
  txHex: string;
  feeInfo: Record<string, never>;
  coin: string;
}

/**
 * This transforms the txInfo from recover into the format that offline-signing-tool expects
 * @param coinName
 * @param txInfo
 * @param txHex
 * @returns {{txHex: *, txInfo: {unspents: *}, feeInfo: {}, coin: void}}
 */
function formatForOfflineVault(
  coinName: string,
  txInfo: OfflineVaultTxInfo,
  txHex: string
): FormattedOfflineVaultTxInfo {
  return {
    txHex,
    txInfo: {
      unspents: txInfo.inputs.map((input) => {
        assert(input.valueString);
        return { ...input, valueString: input.valueString };
      }),
    },
    feeInfo: {},
    coin: coinName,
  };
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
}

function getFormattedAddress(coin: AbstractUtxoCoin, address: MultiSigAddress) {
  // Blockchair uses cashaddr format when querying the API for address information. Convert legacy addresses to cashaddr
  // before querying the API.
  return coin.getChain() === 'bch' || coin.getChain() === 'bcha'
    ? coin.canonicalAddress(address.address, 'cashaddr').split(':')[1]
    : address.address;
}

async function queryBlockchainUnspentsPath(
  coin: AbstractUtxoCoin,
  params: RecoverParams,
  walletKeys: RootWalletKeys,
  chain: ChainCode
): Promise<WalletUnspent<bigint>[]> {
  const scriptType = scriptTypeForChain(chain);
  const fetchPrevTx =
    !utxolib.bitgo.outputScripts.hasWitnessData(scriptType) && getMainnet(coin.network) !== networks.zcash;
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
    const walletKeysForUnspent = walletKeys.deriveForChainAndIndex(chain, addrIndex);
    const address = coin.createMultiSigAddress(scriptType, 2, walletKeysForUnspent.publicKeys);

    const formattedAddress = getFormattedAddress(coin, address);
    const addrInfo = await recoveryProvider.getAddressInfo(formattedAddress);
    // we use txCount here because it implies usage - having tx'es means the addr was generated and used
    if (addrInfo.txCount === 0) {
      numSequentialAddressesWithoutTxs++;
    } else {
      numSequentialAddressesWithoutTxs = 0;

      if (addrInfo.balance > 0) {
        console.log(`Found an address with balance: ${address.address} with balance ${addrInfo.balance}`);
        const addressUnspents = await recoveryProvider.getUnspentsForAddresses([formattedAddress]);
        const processedUnspents = await Promise.all(
          addressUnspents.map(async (u): Promise<WalletUnspent<bigint>> => {
            const { txid, vout } = utxolib.bitgo.parseOutputId(u.id);
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
  try {
    return await MempoolApi.forCoin(coin.getChain()).getRecoveryFeePerBytes();
  } catch (e) {
    console.dir(e);
    return defaultValue;
  }
}

export type BackupKeyRecoveryTransansaction = {
  inputs?: WalletUnspent<number>[];
  transactionHex: string;
  coin: string;
  backupKey: string;
  recoveryAmount: number;
  recoveryAmountString: string;
};

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

  const isKrsRecovery = getIsKrsRecovery(params);
  const isUnsignedSweep = getIsUnsignedSweep(params);
  const responseTxFormat = isUnsignedSweep || !isKrsRecovery || params.krsProvider === 'keyternal' ? 'legacy' : 'psbt';

  const krsProvider = isKrsRecovery ? getKrsProvider(coin, params.krsProvider) : undefined;

  // check whether key material and password authenticate the users and return parent keys of all three keys of the wallet
  const keys = getBip32Keys(bitgo, params, { requireBitGoXpub: true });
  if (!isTriple(keys)) {
    throw new Error(`expected key triple`);
  }
  const walletKeys = new utxolib.bitgo.RootWalletKeys(keys, [
    params.userKeyPath || utxolib.bitgo.RootWalletKeys.defaultPrefix,
    utxolib.bitgo.RootWalletKeys.defaultPrefix,
    utxolib.bitgo.RootWalletKeys.defaultPrefix,
  ]);

  const unspents: WalletUnspent<bigint>[] = (
    await Promise.all(
      outputScripts.scriptTypes2Of3
        .filter(
          (addressType) => coin.supportsAddressType(addressType) && !params.ignoreAddressTypes?.includes(addressType)
        )
        .reduce(
          (queries, addressType) => [
            ...queries,
            queryBlockchainUnspentsPath(coin, params, walletKeys, getExternalChainCode(addressType)),
            queryBlockchainUnspentsPath(coin, params, walletKeys, getInternalChainCode(addressType)),
          ],
          [] as Promise<WalletUnspent<bigint>[]>[]
        )
    )
  ).flat();

  // Execute the queries and gather the unspents
  const totalInputAmount = utxolib.bitgo.unspentSum(unspents, 'bigint');
  if (totalInputAmount <= BigInt(0)) {
    throw new ErrorNoInputToRecover();
  }

  // Build the psbt
  const psbt = utxolib.bitgo.createPsbtForNetwork({ network: coin.network });
  // xpubs can become handy for many things.
  utxolib.bitgo.addXpubsToPsbt(psbt, walletKeys);
  const txInfo = {} as BackupKeyRecoveryTransansaction;
  const feePerByte: number = await getRecoveryFeePerBytes(coin, { defaultValue: 100 });

  // KRS recovery transactions have a 2nd output to pay the recovery fee, like paygo fees. Use p2wsh outputs because
  // they are the largest outputs and thus the most conservative estimate to use in calculating fees. Also use
  // segwit overhead size and p2sh inputs for the same reason.
  const outputSize = (isKrsRecovery ? 2 : 1) * VirtualSizes.txP2wshOutputSize;
  const approximateSize = VirtualSizes.txSegOverheadVSize + outputSize + VirtualSizes.txP2shInputSize * unspents.length;
  const approximateFee = BigInt(approximateSize * feePerByte);

  txInfo.inputs =
    responseTxFormat === 'legacy'
      ? unspents.map((u) => ({ ...u, value: Number(u.value), valueString: u.value.toString(), prevTx: undefined }))
      : undefined;

  unspents.forEach((unspent) => {
    utxolib.bitgo.addWalletUnspentToPsbt(psbt, unspent, walletKeys, 'user', 'backup');
  });

  let krsFee = BigInt(0);
  if (isKrsRecovery && params.krsProvider) {
    try {
      krsFee = BigInt(await calculateFeeAmount(coin, { provider: params.krsProvider }));
    } catch (err) {
      // Don't let this error block the recovery -
      console.dir(err);
    }
  }

  const recoveryAmount = totalInputAmount - approximateFee - krsFee;

  if (recoveryAmount < BigInt(0)) {
    throw new Error(`this wallet\'s balance is too low to pay the fees specified by the KRS provider. 
          Existing balance on wallet: ${totalInputAmount.toString()}. Estimated network fee for the recovery transaction
          : ${approximateFee.toString()}, KRS fee to pay: ${krsFee.toString()}. After deducting fees, your total 
          recoverable balance is ${recoveryAmount.toString()}`);
  }

  const recoveryOutputScript = utxolib.address.toOutputScript(params.recoveryDestination, coin.network);
  psbt.addOutput({ script: recoveryOutputScript, value: recoveryAmount });

  if (krsProvider && krsFee > BigInt(0)) {
    if (!krsProvider.feeAddresses) {
      throw new Error(`keyProvider must define feeAddresses`);
    }

    const krsFeeAddress = krsProvider.feeAddresses[coin.getChain()];

    if (!krsFeeAddress) {
      throw new Error('this KRS provider has not configured their fee structure yet - recovery cannot be completed');
    }

    const krsFeeOutputScript = utxolib.address.toOutputScript(krsFeeAddress, coin.network);
    psbt.addOutput({ script: krsFeeOutputScript, value: krsFee });
  }

  if (isUnsignedSweep) {
    // TODO BTC-317 - When ready to PSBTify OVC, send psbt hex and skip unspents in response.
    const txHex = psbt.getUnsignedTx().toBuffer().toString('hex');
    return formatForOfflineVault(coin.getChain(), txInfo as OfflineVaultTxInfo, txHex);
  } else {
    signAndVerifyPsbt(psbt, walletKeys.user, { isLastSignature: false });
    if (isKrsRecovery) {
      // The KRS provider keyternal solely supports P2SH, P2WSH, and P2SH-P2WSH input script types.
      // It currently uses an outdated BitGoJS SDK, which relies on a legacy transaction builder for cosigning.
      // Unfortunately, upgrading the keyternal code presents challenges,
      // which hinders the integration of the latest BitGoJS SDK with PSBT signing support.
      txInfo.transactionHex =
        params.krsProvider === 'keyternal'
          ? utxolib.bitgo.extractP2msOnlyHalfSignedTx(psbt).toBuffer().toString('hex')
          : psbt.toHex();
    } else {
      const tx = signAndVerifyPsbt(psbt, walletKeys.backup, { isLastSignature: true });
      txInfo.transactionHex = tx.toBuffer().toString('hex');
    }
  }

  if (isKrsRecovery) {
    txInfo.coin = coin.getChain();
    txInfo.backupKey = params.backupKey;
    txInfo.recoveryAmount = Number(recoveryAmount);
    txInfo.recoveryAmountString = recoveryAmount.toString();
  }

  return txInfo;
}

interface BitGoV1Unspent {
  value: number;
  tx_hash: string;
  tx_output_n: number;
}

export interface V1RecoverParams {
  walletId: string;
  walletPassphrase: string;
  unspents: BitGoV1Unspent[];
  recoveryDestination: string;
  userKey: string;
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

  const recoveryFeePerByte = await getRecoveryFeePerBytes(coin, { defaultValue: 100 });
  const v1wallet = await bitgo.wallets().get({ id: params.walletId });
  return await v1wallet.recover({
    ...params,
    feeRate: recoveryFeePerByte,
  });
}
