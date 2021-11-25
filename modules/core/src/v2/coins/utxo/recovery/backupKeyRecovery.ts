/**
 * @prettier
 */

import * as _ from 'lodash';
import * as bip32 from 'bip32';
import * as utxolib from '@bitgo/utxo-lib';
import * as request from 'superagent';
import { Codes, VirtualSizes } from '@bitgo/unspents';

import { BitGo } from '../../../../bitgo';
import * as errors from '../../../../errors';
import { RecoveryAccountData, RecoveryProvider, RecoveryUnspent } from './RecoveryProvider';
import { getKrsProvider, getBip32Keys, getIsKrsRecovery, getIsUnsignedSweep } from '../../../recovery/initiate';
import { sanitizeLegacyPath } from '../../../../bip32path';
import { AbstractUtxoCoin, Output } from '../../abstractUtxoCoin';

import ScriptType2Of3 = utxolib.bitgo.outputScripts.ScriptType2Of3;
import { BlockstreamApi } from './blockstreamApi';
import { BlockchairApi } from './blockchairApi';
import { InsightApi } from './insightApi';
import { ApiNotImplementedError, ApiRequestError } from './errors';
import { SmartbitApi } from './smartbitApi';
import * as config from '../../../../config';
import { toBitgoRequest } from '../../../../api';
import { MempoolApi } from './mempoolApi';

export interface OfflineVaultTxInfo {
  inputs: {
    chainPath: string;
  }[];
}

export interface FormattedOfflineVaultTxInfo {
  txInfo: {
    unspents: {
      chainPath: string;
      index?: string;
      chain?: string;
    }[];
  };
  txHex: string;
  feeInfo: Record<string, never>;
  coin: string;
}

interface SignatureAddressInfo extends RecoveryAccountData {
  backupKey: bip32.BIP32Interface;
  userKey: bip32.BIP32Interface;
  redeemScript?: Buffer;
  witnessScript?: Buffer;
}

function getRecoveryProvider(coinName: string, apiKey?: string): RecoveryProvider {
  switch (coinName) {
    case 'btc':
    case 'tbtc':
      return BlockstreamApi.forCoin(coinName);
    case 'bch':
    case 'tbch':
    case 'bcha':
    case 'tbcha': // this coin only exists in tests
    case 'bsv':
    case 'tbsv':
      return BlockchairApi.forCoin(coinName, apiKey);
    case 'btg':
    case 'dash':
    case 'tdash':
    case 'ltc':
    case 'tltc':
    case 'zec':
    case 'tzec':
      return InsightApi.forCoin(coinName);
  }

  throw new ApiNotImplementedError(coinName);
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
  const response: FormattedOfflineVaultTxInfo = {
    txHex,
    txInfo: {
      unspents: txInfo.inputs,
    },
    feeInfo: {},
    coin: coinName,
  };
  _.map(response.txInfo.unspents, function (unspent) {
    const pathArray = unspent.chainPath.split('/');
    // Note this code works because we assume our chainPath is m/0/0/chain/index - this will be incorrect for custom derivation schemes
    unspent.index = pathArray[4];
    unspent.chain = pathArray[3];
  });
  return response;
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
async function getRecoveryMarketPrice(coin: AbstractUtxoCoin): Promise<string> {
  const familyNamesToCoinGeckoIds = new Map()
    .set('BTC', 'bitcoin')
    .set('LTC', 'litecoin')
    .set('BCH', 'bitcoin-cash')
    .set('ZEC', 'zcash')
    .set('DASH', 'dash')
    // note: we don't have a source for price data of BCHA and BSV, but we will use BCH as a proxy. We will substitute
    // it out for a better source when it becomes available.  TODO BG-26359.
    .set('BCHA', 'bitcoin-cash')
    .set('BSV', 'bitcoin-cash');

  const coinGeckoId = familyNamesToCoinGeckoIds.get(coin.getFamily().toUpperCase());
  if (!coinGeckoId) {
    throw new Error(`There is no CoinGecko id for family name ${coin.getFamily().toUpperCase()}.`);
  }
  const coinGeckoUrl = config.coinGeckoBaseUrl + `simple/price?ids=${coinGeckoId}&vs_currencies=USD`;
  const response = await toBitgoRequest(request.get(coinGeckoUrl).retry(2)).result();

  // An example of response
  // {
  //   "ethereum": {
  //     "usd": 220.64
  //   }
  // }
  if (!response) {
    throw new Error('Unable to reach Coin Gecko API for price data');
  }
  if (!response[coinGeckoId]['usd'] || typeof response[coinGeckoId]['usd'] !== 'number') {
    throw new Error('Unexpected response from Coin Gecko API for price data');
  }

  return response[coinGeckoId]['usd'];
}

/**
 * Calculates the amount (in base units) to pay a KRS provider when building a recovery transaction
 * @params coin
 * @param params
 * @param params.provider {String} the KRS provider that holds the backup key
 * @param params.amount {Number} amount (in base units) to be recovered
 * @param callback
 * @returns {*}
 */
async function calculateFeeAmount(
  coin: AbstractUtxoCoin,
  params: { provider: string; amount?: number }
): Promise<number> {
  const krsProvider = config.krsProviders[params.provider];

  if (krsProvider === undefined) {
    throw new Error(`no fee structure specified for provider ${params.provider}`);
  }

  if (krsProvider.feeType === 'flatUsd') {
    const feeAmountUsd = krsProvider.feeAmount;
    const currentPrice: number = (await getRecoveryMarketPrice(coin)) as any;

    return Math.round((feeAmountUsd / currentPrice) * coin.getBaseFactor());
  } else {
    // we can add more fee structures here as needed for different providers, such as percentage of recovery amount
    throw new Error('Fee structure not implemented');
  }
}

/**
 * Derive child keys at specific index, from provided parent keys
 * @param {bip32.BIP32Interface[]} keyArray
 * @param {number} index
 * @returns {bip32.BIP32Interface[]}
 */
function deriveKeys(keyArray: bip32.BIP32Interface[], index: number): bip32.BIP32Interface[] {
  return keyArray.map((k) => k.derive(index));
}

/**
 * Apply signatures to a funds recovery transaction using user + backup key
 * @param txb - a transaction builder object (with inputs and outputs)
 * @param sigHashType - signature hash type
 * @param unspents - the unspents to use in the transaction
 * @param addressesById - the address and redeem script info for the unspents
 * @param cosign - whether to cosign this transaction with the user's backup key (false if KRS recovery)
 * @returns transactionBuilder originally passed in as the first argument
 */
function signRecoveryTransaction(
  txb: utxolib.bitgo.UtxoTransactionBuilder,
  sigHashType: number,
  unspents: Output[],
  addressesById: Record<string, SignatureAddressInfo>,
  cosign: boolean
): utxolib.bitgo.UtxoTransactionBuilder {
  interface SignatureIssue {
    inputIndex: number;
    unspent: Output;
    error: Error | null;
  }

  const signatureIssues: SignatureIssue[] = [];
  unspents.forEach((unspent, i) => {
    const address = addressesById[unspent.address];
    const backupPrivateKey = address.backupKey;
    const userPrivateKey = address.userKey;
    // force-override networks
    backupPrivateKey.network = txb.network;
    userPrivateKey.network = txb.network;

    const currentSignatureIssue: SignatureIssue = {
      inputIndex: i,
      unspent: unspent,
      error: null,
    };

    if (cosign) {
      try {
        txb.sign(i, backupPrivateKey, address.redeemScript, sigHashType, Number(unspent.amount), address.witnessScript);
      } catch (e) {
        currentSignatureIssue.error = e;
        signatureIssues.push(currentSignatureIssue);
      }
    }

    try {
      txb.sign(i, userPrivateKey, address.redeemScript, sigHashType, Number(unspent.amount), address.witnessScript);
    } catch (e) {
      currentSignatureIssue.error = e;
      signatureIssues.push(currentSignatureIssue);
    }
  });

  if (signatureIssues.length > 0) {
    const failedIndices = signatureIssues.map((currentIssue) => currentIssue.inputIndex);
    const error: any = new Error(`Failed to sign inputs at indices ${failedIndices.join(', ')}`);
    error.code = 'input_signature_failure';
    error.signingErrors = signatureIssues;
    throw error;
  }

  return txb;
}

export interface RecoverParams {
  scan?: number;
  userKey: string;
  backupKey: string;
  recoveryDestination: string;
  krsProvider: string;
  ignoreAddressTypes: string[];
  bitgoKey: string;
  walletPassphrase?: string;
  apiKey?: string;
  userKeyPath?: string;
}

async function queryBlockchainUnspentsPath(
  coin: AbstractUtxoCoin,
  params: RecoverParams,
  keyArray: bip32.BIP32Interface[],
  basePath: string,
  addressesById
) {
  const recoveryProvider = getRecoveryProvider(coin.getChain(), params.apiKey);
  const MAX_SEQUENTIAL_ADDRESSES_WITHOUT_TXS = params.scan || 20;
  let numSequentialAddressesWithoutTxs = 0;

  async function gatherUnspents(addrIndex: number) {
    const derivedKeys = deriveKeys(keyArray, addrIndex);

    const chain = Number(basePath.split('/').pop()); // extracts the chain from the basePath
    const keys = derivedKeys.map((k) => k.publicKey);
    const address: any = coin.createMultiSigAddress(Codes.typeForCode(chain) as ScriptType2Of3, 2, keys);

    const addrInfo: RecoveryAccountData = await recoveryProvider.getAccountInfo(address.address);
    // we use txCount here because it implies usage - having tx'es means the addr was generated and used
    if (addrInfo.txCount === 0) {
      numSequentialAddressesWithoutTxs++;
    } else {
      numSequentialAddressesWithoutTxs = 0;

      if (addrInfo.totalBalance > 0) {
        console.log(`Found an address with balance: ${address.address} with balance ${addrInfo.totalBalance}`);
        // This address has a balance.
        address.chainPath = basePath + '/' + addrIndex;
        address.userKey = derivedKeys[0];
        address.backupKey = derivedKeys[1];
        addressesById[address.address] = address;

        // Try to find unspents on it.
        const addressUnspents: RecoveryUnspent[] = await recoveryProvider.getUnspents(address.address);

        addressUnspents.forEach(function addAddressToUnspent(unspent) {
          unspent.address = address.address;
          walletUnspents.push(unspent);
        });
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

  const walletUnspents: RecoveryUnspent[] = [];
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
 * - ignoreAddressTypes: (optional) array of AddressTypes to ignore, these are strings defined in Codes.UnspentTypeTcomb
 *        for example: ['p2shP2wsh', 'p2wsh'] will prevent code from checking for wrapped-segwit and native-segwit chains on the public block explorers
 */
export async function backupKeyRecovery(coin: AbstractUtxoCoin, bitgo: BitGo, params: RecoverParams) {
  if (_.isUndefined(params.userKey)) {
    throw new Error('missing userKey');
  }

  if (_.isUndefined(params.backupKey)) {
    throw new Error('missing backupKey');
  }

  if (_.isUndefined(params.recoveryDestination) || !coin.isValidAddress(params.recoveryDestination)) {
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

  const [userKey, backupKey, bitgoKey] = keys;
  let derivedUserKey;
  let baseKeyPath;
  if (params.userKeyPath) {
    derivedUserKey = userKey.derivePath(sanitizeLegacyPath(params.userKeyPath));
    const twoKeys = deriveKeys(deriveKeys([backupKey, bitgoKey], 0), 0);
    baseKeyPath = [derivedUserKey, ...twoKeys];
  } else {
    baseKeyPath = deriveKeys(deriveKeys(keys, 0), 0);
  }

  const queries: any[] = [];
  const addressesById = {};

  _.forEach(Object.keys(Codes.UnspentTypeTcomb.meta.map), function (addressType) {
    // If we aren't ignoring the address type, we derive the public key and construct the query for the external and
    // internal indices
    if (!_.includes(params.ignoreAddressTypes, addressType)) {
      if (addressType === Codes.UnspentTypeTcomb('p2shP2wsh') && !coin.supportsP2shP2wsh()) {
        // P2shP2wsh is not supported for this coin so we skip this unspent type.
        return;
      }

      if (addressType === Codes.UnspentTypeTcomb('p2wsh') && !coin.supportsP2wsh()) {
        // P2wsh is not supported for this coin so we skip this unspent type.
        return;
      }

      if (addressType === Codes.UnspentTypeTcomb('p2tr') && !coin.supportsP2tr()) {
        // P2tr is not supported for this coin so we skip this unspent type.
        return;
      }

      let codes;
      try {
        codes = Codes.forType(Codes.UnspentTypeTcomb(addressType) as any);
      } catch (e) {
        // The unspent type is not supported by bitgo so attempting to get its chain codes throws. Catch that error
        // and continue.
        return;
      }
      const externalChainCode = codes.external;
      const internalChainCode = codes.internal;
      const externalKey = deriveKeys(baseKeyPath, externalChainCode);
      const internalKey = deriveKeys(baseKeyPath, internalChainCode);
      queries.push(queryBlockchainUnspentsPath(coin, params, externalKey, '/0/0/' + externalChainCode, addressesById));
      queries.push(queryBlockchainUnspentsPath(coin, params, internalKey, '/0/0/' + internalChainCode, addressesById));
    }
  });

  // Execute the queries and gather the unspents
  const queryResponses = await Promise.all(queries);
  const unspents: any[] = _.flatten(queryResponses); // this flattens the array (turns an array of arrays into just one array)
  const totalInputAmount = _.sumBy(unspents, 'amount');
  if (totalInputAmount <= 0) {
    throw new errors.ErrorNoInputToRecover();
  }

  // Build the transaction
  const transactionBuilder = utxolib.bitgo.createTransactionBuilderForNetwork(coin.network);
  const txInfo: any = {};

  const feePerByte: number = await getRecoveryFeePerBytes(coin, { defaultValue: 100 });

  // KRS recovery transactions have a 2nd output to pay the recovery fee, like paygo fees. Use p2wsh outputs because
  // they are the largest outputs and thus the most conservative estimate to use in calculating fees. Also use
  // segwit overhead size and p2sh inputs for the same reason.
  const outputSize = (isKrsRecovery ? 2 : 1) * VirtualSizes.txP2wshOutputSize;
  const approximateSize = VirtualSizes.txSegOverheadVSize + outputSize + VirtualSizes.txP2shInputSize * unspents.length;
  const approximateFee = approximateSize * feePerByte;

  // Construct a transaction
  txInfo.inputs = unspents.map(function addInputForUnspent(unspent) {
    const address = addressesById[unspent.address];

    transactionBuilder.addInput(unspent.txid, unspent.n, 0xffffffff, address.outputScript);

    return {
      chainPath: address.chainPath,
      redeemScript: address.redeemScript && address.redeemScript.toString('hex'),
      witnessScript: address.witnessScript && address.witnessScript.toString('hex'),
      value: unspent.amount,
    };
  });

  let recoveryAmount = totalInputAmount - approximateFee;
  let krsFee;
  if (isKrsRecovery) {
    try {
      krsFee = await calculateFeeAmount(coin, {
        provider: params.krsProvider,
        amount: recoveryAmount,
      });
      recoveryAmount -= krsFee;
    } catch (err) {
      // Don't let this error block the recovery -
      console.dir(err);
    }
  }

  if (recoveryAmount < 0) {
    throw new Error(`this wallet\'s balance is too low to pay the fees specified by the KRS provider. 
          Existing balance on wallet: ${totalInputAmount}. Estimated network fee for the recovery transaction
          : ${approximateFee}, KRS fee to pay: ${krsFee}. After deducting fees, your total recoverable balance
          is ${recoveryAmount}`);
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
    return formatForOfflineVault(coin.getChain(), txInfo, txHex);
  } else {
    const signedTx = signRecoveryTransaction(
      transactionBuilder,
      utxolib.bitgo.getDefaultSigHash(coin.network),
      unspents,
      addressesById,
      !isKrsRecovery
    ).buildIncomplete();
    txInfo.transactionHex = signedTx.toBuffer().toString('hex');
    try {
      txInfo.tx = await SmartbitApi.forCoin(coin.getChain()).verifyRecoveryTransaction(signedTx);
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
  }

  if (isKrsRecovery) {
    txInfo.coin = coin.getChain();
    txInfo.backupKey = params.backupKey;
    txInfo.recoveryAmount = recoveryAmount;
  }

  return txInfo;
}
