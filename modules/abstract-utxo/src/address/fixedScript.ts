import _ from 'lodash';
import {
  AddressTypeChainMismatchError,
  CreateAddressFormat,
  InvalidAddressDerivationPropertyError,
  UnexpectedAddressError,
  P2shP2wshUnsupportedError,
  P2trMusig2UnsupportedError,
  P2trUnsupportedError,
  P2wshUnsupportedError,
  UnsupportedAddressTypeError,
  isTriple,
  Triple,
} from '@bitgo/sdk-core';
import { bitgo } from '@bitgo/utxo-lib';
import * as wasmUtxo from '@bitgo/wasm-utxo';

import { getNetworkFromCoinName, UtxoCoinName } from '../names';

type ScriptType2Of3 = bitgo.outputScripts.ScriptType2Of3;

export interface FixedScriptAddressCoinSpecific {
  outputScript?: string;
  redeemScript?: string;
  witnessScript?: string;
}

export interface GenerateAddressOptions {
  addressType?: ScriptType2Of3;
  chain?: number;
  index?: number;
  segwit?: boolean;
  bech32?: boolean;
}

interface GenerateFixedScriptAddressOptions extends GenerateAddressOptions {
  format?: CreateAddressFormat;
  keychains: { pub: string }[];
}

function supportsAddressType(coinName: UtxoCoinName, addressType: ScriptType2Of3): boolean {
  const network = getNetworkFromCoinName(coinName);
  return bitgo.outputScripts.isSupportedScriptType(network, addressType);
}

export function generateAddressWithChainAndIndex(
  coinName: UtxoCoinName,
  keychains: bitgo.RootWalletKeys | Triple<string>,
  chain: bitgo.ChainCode,
  index: number,
  format: CreateAddressFormat | undefined
): string {
  // Convert CreateAddressFormat to AddressFormat for wasm-utxo
  // 'base58' -> 'default', 'cashaddr' -> 'cashaddr'
  const wasmFormat = format === 'base58' ? 'default' : format;
  const network = getNetworkFromCoinName(coinName);
  return wasmUtxo.fixedScriptWallet.address(keychains, chain, index, network, wasmFormat);
}

/**
 * Generate an address for a wallet based on a set of configurations
 * @param params.addressType {string}   Deprecated
 * @param params.keychains   {[object]} Array of objects with xpubs
 * @param params.threshold   {number}   Minimum number of signatures
 * @param params.chain       {number}   Derivation chain (see https://github.com/BitGo/unspents/blob/master/src/codes.ts for
 *                                                 the corresponding address type of a given chain code)
 * @param params.index       {number}   Derivation index
 * @param params.segwit      {boolean}  Deprecated
 * @param params.bech32      {boolean}  Deprecated
 * @returns {string} The generated address
 */
export function generateAddress(coinName: UtxoCoinName, params: GenerateFixedScriptAddressOptions): string {
  let derivationIndex = 0;
  if (_.isInteger(params.index) && (params.index as number) > 0) {
    derivationIndex = params.index as number;
  }

  const { keychains, chain, segwit = false, bech32 = false } = params as GenerateFixedScriptAddressOptions;

  let derivationChain = bitgo.getExternalChainCode('p2sh');
  if (_.isNumber(chain) && _.isInteger(chain) && bitgo.isChainCode(chain)) {
    derivationChain = chain;
  }

  function convertFlagsToAddressType(): ScriptType2Of3 {
    if (bitgo.isChainCode(chain)) {
      return bitgo.scriptTypeForChain(chain);
    }
    if (_.isBoolean(segwit) && segwit) {
      return 'p2shP2wsh';
    } else if (_.isBoolean(bech32) && bech32) {
      return 'p2wsh';
    } else {
      return 'p2sh';
    }
  }

  const addressType = params.addressType || convertFlagsToAddressType();

  if (addressType !== bitgo.scriptTypeForChain(derivationChain)) {
    throw new AddressTypeChainMismatchError(addressType, derivationChain);
  }

  if (!supportsAddressType(coinName, addressType)) {
    switch (addressType) {
      case 'p2sh':
        throw new Error(`internal error: p2sh should always be supported`);
      case 'p2shP2wsh':
        throw new P2shP2wshUnsupportedError();
      case 'p2wsh':
        throw new P2wshUnsupportedError();
      case 'p2tr':
        throw new P2trUnsupportedError();
      case 'p2trMusig2':
        throw new P2trMusig2UnsupportedError();
      default:
        throw new UnsupportedAddressTypeError();
    }
  }

  if (!isTriple(keychains)) {
    throw new Error('keychains must be a triple');
  }

  return generateAddressWithChainAndIndex(
    coinName,
    keychains.map((k) => k.pub) as Triple<string>,
    derivationChain,
    derivationIndex,
    params.format
  );
}

type Keychain = {
  pub: string;
};

export function assertFixedScriptWalletAddress(
  coinName: UtxoCoinName,
  {
    chain,
    index,
    keychains,
    format,
    addressType,
    address,
  }: {
    chain: number | undefined;
    index: number;
    keychains: Keychain[];
    format: CreateAddressFormat;
    addressType: string | undefined;
    address: string;
  }
): void {
  if ((_.isUndefined(chain) && _.isUndefined(index)) || !(_.isFinite(chain) && _.isFinite(index))) {
    throw new InvalidAddressDerivationPropertyError(
      `address validation failure: invalid chain (${chain}) or index (${index})`
    );
  }

  if (!keychains) {
    throw new Error('missing required param keychains');
  }

  const expectedAddress = generateAddress(coinName, {
    format,
    addressType: addressType as ScriptType2Of3,
    keychains,
    chain,
    index,
  });

  if (expectedAddress !== address) {
    throw new UnexpectedAddressError(`address validation failure: expected ${expectedAddress} but got ${address}`);
  }
}
