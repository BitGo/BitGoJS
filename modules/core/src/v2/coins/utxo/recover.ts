/**
 * @prettier
 */

import * as _ from 'lodash';
import * as bitcoin from '@bitgo/utxo-lib';
import { Codes, VirtualSizes } from '@bitgo/unspents';

import * as config from '../../../config';
import { deriveKeyByPath } from '../../../bitcoin';
import * as errors from '../../../errors';
import { AbstractUtxoCoin, AddressInfo, UnspentInfo } from '../abstractUtxoCoin';

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
  keyArray: bitcoin.HDNode[],
  basePath: string,
  addressesById
) {
  const MAX_SEQUENTIAL_ADDRESSES_WITHOUT_TXS = params.scan || 20;
  let numSequentialAddressesWithoutTxs = 0;

  async function gatherUnspents(addrIndex: number) {
    const derivedKeys = coin.deriveKeys(keyArray, addrIndex);

    const chain = Number(basePath.split('/').pop()); // extracts the chain from the basePath
    const keys = derivedKeys.map((k) => k.getPublicKeyBuffer());
    const address: any = coin.createMultiSigAddress(Codes.typeForCode(chain), 2, keys);

    const addrInfo: AddressInfo = (await coin.getAddressInfoFromExplorer(address.address, params.apiKey)) as any;
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
        const addressUnspents: UnspentInfo[] = (await coin.getUnspentInfoFromExplorer(
          address.address,
          params.apiKey
        )) as any;

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

  const walletUnspents: UnspentInfo[] = [];
  // This will populate walletAddresses
  await gatherUnspents(0);

  if (walletUnspents.length === 0) {
    // Couldn't find any addresses with funds
    return [];
  }

  return walletUnspents;
}

/**
 * Builds a funds recovery transaction without BitGo
 * @param coin
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
export async function recover(coin: AbstractUtxoCoin, params: RecoverParams) {
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

  const isKrsRecovery = params.backupKey.startsWith('xpub') && !params.userKey.startsWith('xpub');
  const isUnsignedSweep = params.backupKey.startsWith('xpub') && params.userKey.startsWith('xpub');
  const krsProvider = config.krsProviders[params.krsProvider];

  if (isKrsRecovery && _.isUndefined(krsProvider)) {
    throw new Error('unknown key recovery service provider');
  }

  if (isKrsRecovery && !krsProvider.supportedCoins.includes(coin.getFamily())) {
    throw new Error('specified key recovery service does not support recoveries for this coin');
  }

  // check whether key material and password authenticate the users and return parent keys of all three keys of the wallet
  const keys = await coin.initiateRecovery(params);

  const [userKey, backupKey, bitgoKey] = keys as any;
  let derivedUserKey;
  let baseKeyPath;
  if (params.userKeyPath) {
    derivedUserKey = deriveKeyByPath(userKey, params.userKeyPath);
    const twoKeys = coin.deriveKeys(coin.deriveKeys([backupKey, bitgoKey], 0), 0);
    baseKeyPath = [derivedUserKey, ...twoKeys];
  } else {
    baseKeyPath = coin.deriveKeys(coin.deriveKeys(keys as any, 0), 0);
  }

  const queries: any[] = [];
  const addressesById = {};

  _.forEach(Object.keys(Codes.UnspentTypeTcomb.meta.map), function (addressType) {
    // If we aren't ignoring the address type, we derive the public key and construct the query for the external and
    // internal indices
    if (!_.includes(params.ignoreAddressTypes, addressType)) {
      if (addressType === Codes.UnspentTypeTcomb('p2shP2wsh') && !coin.supportsP2shP2wsh()) {
        // P2shP2wsh is not supported. Skip.
        return;
      }

      if (addressType === Codes.UnspentTypeTcomb('p2wsh') && !coin.supportsP2wsh()) {
        // P2wsh is not supported. Skip.
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
      const externalKey = coin.deriveKeys(baseKeyPath, externalChainCode);
      const internalKey = coin.deriveKeys(baseKeyPath, internalChainCode);
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
  const transactionBuilder = new bitcoin.TransactionBuilder(coin.network);
  coin.prepareTransactionBuilder(transactionBuilder);
  const txInfo: any = {};

  const feePerByte: number = (await coin.getRecoveryFeePerBytes()) as any;

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
      krsFee = await coin.calculateFeeAmount({
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

  if (isKrsRecovery && krsFee > 0) {
    const krsFeeAddress = krsProvider.feeAddresses[coin.getChain()];

    if (!krsFeeAddress) {
      throw new Error('this KRS provider has not configured their fee structure yet - recovery cannot be completed');
    }

    transactionBuilder.addOutput(krsFeeAddress, krsFee);
  }

  if (isUnsignedSweep) {
    const txHex = transactionBuilder.buildIncomplete().toBuffer().toString('hex');
    return coin.formatForOfflineVault(txInfo, txHex);
  } else {
    const signedTx = coin.signRecoveryTransaction(transactionBuilder, unspents, addressesById, !isKrsRecovery);
    txInfo.transactionHex = signedTx.build().toBuffer().toString('hex');
    try {
      txInfo.tx = await coin.verifyRecoveryTransaction(txInfo);
    } catch (e) {
      // some coins don't have a reliable third party verification endpoint, or sometimes the third party endpoint
      // could be unavailable due to service outage, so we continue without verification for those coins, but we will
      // let users know that they should verify their own
      // this message should be piped to WRW and displayed on the UI
      if (e instanceof errors.MethodNotImplementedError || e instanceof errors.BlockExplorerUnavailable) {
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
