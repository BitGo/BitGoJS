/**
 * @prettier
 */

import * as _ from 'lodash';
import * as utxolib from '@bitgo/utxo-lib';
const {
  getInternalChainCode,
  parseOutputId,
  scriptTypeForChain,
  WalletUnspentSigner,
  outputScripts,
  getExternalChainCode,
} = utxolib.bitgo;

type ChainCode = utxolib.bitgo.ChainCode;
type RootWalletKeys = utxolib.bitgo.RootWalletKeys;
type WalletUnspent<TNumber extends number | bigint = number> = utxolib.bitgo.WalletUnspent<TNumber>;
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
import { AbstractUtxoCoin } from '../abstractUtxoCoin';

import { forCoin, RecoveryProvider } from './RecoveryProvider';
import { ApiNotImplementedError, ApiRequestError } from './baseApi';
import { SmartbitApi } from './smartbitApi';
import { MempoolApi } from './mempoolApi';
import { CoingeckoApi } from './coingeckoApi';
import { signAndVerifyWalletTransaction } from '../sign';

export interface OfflineVaultTxInfo<TNumber extends number | bigint = number> {
  inputs: WalletUnspent<TNumber>[];
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
function formatForOfflineVault<TNumber extends number | bigint = number>(
  coinName: string,
  txInfo: OfflineVaultTxInfo<TNumber>,
  txHex: string
): FormattedOfflineVaultTxInfo {
  return {
    txHex,
    txInfo: {
      unspents: txInfo.inputs.map((input) => {
        return { ...input, value: Number(input.value), valueString: input.value.toString() };
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

async function queryBlockchainUnspentsPath<TNumber extends number | bigint = number>(
  coin: AbstractUtxoCoin,
  params: RecoverParams,
  walletKeys: RootWalletKeys,
  chain: ChainCode
): Promise<WalletUnspent<TNumber>[]> {
  const recoveryProvider = params.recoveryProvider ?? forCoin(coin.getChain(), params.apiKey);
  const MAX_SEQUENTIAL_ADDRESSES_WITHOUT_TXS = params.scan || 20;
  let numSequentialAddressesWithoutTxs = 0;

  async function gatherUnspents(addrIndex: number) {
    const walletKeysForUnspent = walletKeys.deriveForChainAndIndex(chain, addrIndex);
    const address = coin.createMultiSigAddress(scriptTypeForChain(chain), 2, walletKeysForUnspent.publicKeys);

    const addrInfo = await recoveryProvider.getAddressInfo(address.address);
    // we use txCount here because it implies usage - having tx'es means the addr was generated and used
    if (addrInfo.txCount === 0) {
      numSequentialAddressesWithoutTxs++;
    } else {
      numSequentialAddressesWithoutTxs = 0;

      if (addrInfo.balance > 0) {
        console.log(`Found an address with balance: ${address.address} with balance ${addrInfo.balance}`);
        const addressUnspents = await recoveryProvider.getUnspentsForAddresses([address.address]);

        const processedUnspents = await Promise.all(
          addressUnspents.map(async (u): Promise<WalletUnspent<TNumber>> => {
            if (coin.amountType === 'bigint') {
              // blockchair returns the number with the correct precision, but in number format
              // json parse won't parse it correctly, so we requery the txid for the tx hex to decode here
              let val = BigInt(u.value) as TNumber;
              if (!Number.isSafeInteger(u.value)) {
                const { txid, vout } = utxolib.bitgo.parseOutputId(u.id);
                const txHex = await recoveryProvider.getTransactionHex(txid);
                const tx = coin.createTransactionFromHex<TNumber>(txHex);
                val = tx.outs[vout].value;
              }
              return {
                ...u,
                value: val,
                chain: chain,
                index: addrIndex,
              } as WalletUnspent<TNumber>;
            } else {
              return {
                ...u,
                chain: chain,
                index: addrIndex,
              } as WalletUnspent<TNumber>;
            }
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

  const walletUnspents: WalletUnspent<TNumber>[] = [];
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

export type BackupKeyRecoveryTransansaction<TNumber extends number | bigint = number> = {
  inputs: WalletUnspent<TNumber>[];
  transactionHex: string;
  coin: string;
  backupKey: string;
  recoveryAmount: TNumber;
  // smartbit api response
  tx?: unknown;
};

/**
 * Builds a funds recovery transaction without BitGo
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
export async function backupKeyRecovery<TNumber extends number | bigint = number>(
  coin: AbstractUtxoCoin,
  bitgo: BitGoBase,
  params: RecoverParams
): Promise<BackupKeyRecoveryTransansaction<TNumber> | FormattedOfflineVaultTxInfo> {
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

  const unspents: WalletUnspent<TNumber>[] = (
    await Promise.all(
      outputScripts.scriptTypes2Of3
        .filter(
          (addressType) => coin.supportsAddressType(addressType) && !params.ignoreAddressTypes?.includes(addressType)
        )
        .reduce(
          (queries, addressType) => [
            ...queries,
            queryBlockchainUnspentsPath<TNumber>(coin, params, walletKeys, getExternalChainCode(addressType)),
            queryBlockchainUnspentsPath<TNumber>(coin, params, walletKeys, getInternalChainCode(addressType)),
          ],
          [] as Promise<WalletUnspent<TNumber>[]>[]
        )
    )
  ).flat();

  // Execute the queries and gather the unspents
  const totalInputAmount = utxolib.bitgo.unspentSum<TNumber>(unspents, coin.amountType);
  if (totalInputAmount <= 0) {
    throw new ErrorNoInputToRecover();
  }

  // Build the transaction
  const transactionBuilder = utxolib.bitgo.createTransactionBuilderForNetwork<TNumber>(coin.network);
  const txInfo = {} as BackupKeyRecoveryTransansaction<TNumber>;

  const feePerByte: number = await getRecoveryFeePerBytes(coin, { defaultValue: 100 });

  // KRS recovery transactions have a 2nd output to pay the recovery fee, like paygo fees. Use p2wsh outputs because
  // they are the largest outputs and thus the most conservative estimate to use in calculating fees. Also use
  // segwit overhead size and p2sh inputs for the same reason.
  const outputSize = (isKrsRecovery ? 2 : 1) * VirtualSizes.txP2wshOutputSize;
  const approximateSize = VirtualSizes.txSegOverheadVSize + outputSize + VirtualSizes.txP2shInputSize * unspents.length;
  const approximateFee: TNumber = utxolib.bitgo.toTNumber<TNumber>(approximateSize * feePerByte, coin.amountType);

  // Construct a transaction
  txInfo.inputs = unspents;

  unspents.forEach((unspent) => {
    const { txid, vout } = parseOutputId(unspent.id);
    transactionBuilder.addInput(
      txid,
      vout,
      0xffffffff,
      utxolib.address.toOutputScript(unspent.address, coin.network),
      unspent.value
    );
  });

  let krsFee: TNumber = utxolib.bitgo.toTNumber<TNumber>(0, coin.amountType);
  if (isKrsRecovery && params.krsProvider) {
    try {
      krsFee = utxolib.bitgo.toTNumber<TNumber>(
        await calculateFeeAmount(coin, { provider: params.krsProvider }),
        coin.amountType
      );
    } catch (err) {
      // Don't let this error block the recovery -
      console.dir(err);
    }
  }

  const recoveryAmount = utxolib.bitgo.toTNumber<TNumber>(
    BigInt(totalInputAmount) - BigInt(approximateFee) - BigInt(krsFee),
    coin.amountType
  );

  if (recoveryAmount < 0) {
    throw new Error(`this wallet\'s balance is too low to pay the fees specified by the KRS provider. 
          Existing balance on wallet: ${totalInputAmount.toString()}. Estimated network fee for the recovery transaction
          : ${approximateFee.toString()}, KRS fee to pay: ${krsFee.toString()}. After deducting fees, your total 
          recoverable balance is ${recoveryAmount.toString()}`);
  }

  transactionBuilder.addOutput(params.recoveryDestination, recoveryAmount);

  if (krsProvider && krsFee > 0) {
    if (!krsProvider.feeAddresses) {
      throw new Error(`keyProvider must define feeAddresses`);
    }

    const krsFeeAddress = krsProvider.feeAddresses[coin.getChain()];

    if (!krsFeeAddress) {
      throw new Error('this KRS provider has not configured their fee structure yet - recovery cannot be completed');
    }

    transactionBuilder.addOutput(krsFeeAddress, krsFee);
  }

  if (isUnsignedSweep) {
    const txHex = transactionBuilder.buildIncomplete().toBuffer().toString('hex');
    return formatForOfflineVault(coin.getChain(), txInfo as OfflineVaultTxInfo<TNumber>, txHex);
  } else {
    let transaction = signAndVerifyWalletTransaction(
      transactionBuilder,
      unspents,
      new WalletUnspentSigner<RootWalletKeys>(walletKeys, walletKeys.user, walletKeys.backup),
      { isLastSignature: false }
    );
    if (!isKrsRecovery) {
      transaction = signAndVerifyWalletTransaction(
        transaction,
        unspents,
        new WalletUnspentSigner<RootWalletKeys>(walletKeys, walletKeys.backup, walletKeys.user),
        { isLastSignature: true }
      );
    }

    txInfo.transactionHex = transaction.toBuffer().toString('hex');

    let transactionDetails;
    try {
      transactionDetails = await SmartbitApi.forCoin(coin.getChain()).getTransactionDetails(transaction);
    } catch (e) {
      // some coins don't have a reliable third party verification endpoint, or sometimes the third party endpoint
      // could be unavailable due to service outage, so we continue without verification for those coins, but we will
      // let users know that they should verify their own
      // this message should be piped to WRW and displayed on the UI
      if (e instanceof ApiNotImplementedError || e instanceof ApiRequestError) {
        console.log('Please verify your transaction by decoding the tx hex using a third-party api of your choice');
      } else {
        throw e;
      }
    }

    if (transactionDetails) {
      /**
       * Verify that the txhex user signs correspond to the correct tx they intended
       * by 1) getting back the decoded transaction based on the txhex
       * and then 2) compute the txid (hash), h1 of the decoded transaction 3) compare h1
       * to the txid (hash) of the transaction (including unspent info) we constructed
       */
      if (transactionDetails.TxId !== transaction.getId()) {
        console.log('txhash/txid returned by blockexplorer: ', transactionDetails.TxId);
        console.log('txhash/txid of the transaction bitgo constructed', transaction.getId());
        throw new Error('inconsistent recovery transaction id');
      }
      txInfo.tx = transactionDetails;
    }
  }

  if (isKrsRecovery) {
    txInfo.coin = coin.getChain();
    txInfo.backupKey = params.backupKey;
    txInfo.recoveryAmount = recoveryAmount;
  }

  return txInfo;
}
