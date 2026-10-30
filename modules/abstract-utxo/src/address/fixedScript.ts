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
import { fixedScriptWallet } from '@bitgo/wasm-utxo';

import { toWasmUtxoCoinName, UtxoCoinName, WasmUtxoCoinName } from '../names';

import { assertCanonicalDerivationPrefix } from './derivationPrefix';

type ScriptType2Of3 = fixedScriptWallet.OutputScriptType;
type ChainCode = fixedScriptWallet.ChainCode;

export interface FixedScriptAddressCoinSpecific {
  outputScript?: string;
  derivationPrefix?: string;
}

export interface GenerateAddressOptions {
  chain?: number;
  index?: number;
  segwit?: boolean;
  bech32?: boolean;
}

interface GenerateFixedScriptAddressOptions extends GenerateAddressOptions {
  format?: CreateAddressFormat;
  keychains: { pub: string }[];
  /**
   * Absent = legacy scheme (`0/0`). Present = the bip44 prefix `44/<coinType>/<h1>/<h2>`, which must equal the
   * canonical prefix recomputed from `keychains` and `bip44CoinType`.
   */
  derivationPrefix?: string;
  /** BIP44 coin type of the coin (`coin.getConfig().bip44CoinType`); required when `derivationPrefix` is present. */
  bip44CoinType?: number;
}

function supportsAddressType(coinName: UtxoCoinName | WasmUtxoCoinName, addressType: ScriptType2Of3): boolean {
  return fixedScriptWallet.supportsScriptType(toWasmUtxoCoinName(coinName), addressType);
}

/**
 * Normalize script type aliases. "p2tr" is an alias for "p2trLegacy".
 */
function normalizeScriptType(scriptType: ScriptType2Of3 | 'p2tr'): ScriptType2Of3 {
  return scriptType === 'p2tr' ? 'p2trLegacy' : scriptType;
}

export function generateAddressWithChainAndIndex(
  coinName: UtxoCoinName | WasmUtxoCoinName,
  keychains: fixedScriptWallet.WalletKeysArg | Triple<string>,
  chain: ChainCode,
  index: number,
  format: CreateAddressFormat | undefined
): string {
  // Convert CreateAddressFormat to AddressFormat for wasm-utxo
  // 'base58' -> 'default', 'cashaddr' -> 'cashaddr'
  const wasmFormat = format === 'base58' ? 'default' : format;
  return fixedScriptWallet.address(keychains, chain, index, toWasmUtxoCoinName(coinName), wasmFormat);
}

/**
 * Generate an address for a wallet based on a set of configurations
 * @param params.keychains   {[object]} Array of objects with xpubs
 * @param params.threshold   {number}   Minimum number of signatures
 * @param params.chain       {number}   Derivation chain (see https://github.com/BitGo/unspents/blob/master/src/codes.ts for
 *                                                 the corresponding address type of a given chain code)
 * @param params.index       {number}   Derivation index
 * @param params.segwit      {boolean}  Deprecated
 * @param params.bech32      {boolean}  Deprecated
 * @param params.derivationPrefix {string} Absent = legacy `0/0` scheme. Present = must equal the canonical bip44
 *                                         prefix recomputed from `keychains` and `bip44CoinType`, else this throws
 * @param params.bip44CoinType {number} Coin's BIP44 coin type; required when `derivationPrefix` is present
 */
export function generateAddress(
  coinName: UtxoCoinName | WasmUtxoCoinName,
  params: GenerateFixedScriptAddressOptions
): string {
  let derivationIndex = 0;
  if (_.isInteger(params.index) && (params.index as number) > 0) {
    derivationIndex = params.index as number;
  }

  const {
    keychains,
    chain,
    segwit = false,
    bech32 = false,
    derivationPrefix,
    bip44CoinType,
  } = params as GenerateFixedScriptAddressOptions;
  if (_.isNumber(chain) && _.isInteger(chain) && !fixedScriptWallet.ChainCode.is(chain)) {
    throw new InvalidAddressDerivationPropertyError(`address validation failure: unrecognised chain code (${chain})`);
  }

  let derivationChain: ChainCode = fixedScriptWallet.ChainCode.value('p2sh', 'external');
  if (_.isNumber(chain) && _.isInteger(chain) && fixedScriptWallet.ChainCode.is(chain)) {
    derivationChain = chain;
  }

  function convertFlagsToAddressType(): ScriptType2Of3 {
    if (fixedScriptWallet.ChainCode.is(chain)) {
      return fixedScriptWallet.ChainCode.scriptType(chain);
    }
    if (_.isBoolean(segwit) && segwit) {
      return 'p2shP2wsh';
    } else if (_.isBoolean(bech32) && bech32) {
      return 'p2wsh';
    } else {
      return 'p2sh';
    }
  }

  const addressType = normalizeScriptType(convertFlagsToAddressType());

  if (addressType !== fixedScriptWallet.ChainCode.scriptType(derivationChain)) {
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
      case 'p2trLegacy':
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

  const keys = keychains.map((k) => k.pub) as Triple<string>;
  let walletKeys: fixedScriptWallet.WalletKeysArg = keys;
  if (derivationPrefix !== undefined) {
    // never derive under a prefix that was merely supplied: it must be the canonical one for these keys
    const canonicalPrefix = assertCanonicalDerivationPrefix(keys, derivationPrefix, bip44CoinType);
    walletKeys = { triple: keys, derivationPrefixes: [canonicalPrefix, canonicalPrefix, canonicalPrefix] };
  }

  return generateAddressWithChainAndIndex(coinName, walletKeys, derivationChain, derivationIndex, params.format);
}

type Keychain = {
  pub: string;
};

export function assertFixedScriptWalletAddress(
  coinName: UtxoCoinName | WasmUtxoCoinName,
  {
    chain,
    index,
    keychains,
    format,
    address,
    derivationPrefix,
    bip44CoinType,
  }: {
    chain: number | undefined;
    index: number;
    keychains: Keychain[];
    format: CreateAddressFormat;
    address: string;
    /** Absent = legacy scheme. Present = must be the canonical bip44 prefix of `keychains`. */
    derivationPrefix?: string;
    /** BIP44 coin type of the coin; required when `derivationPrefix` is present. */
    bip44CoinType?: number;
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
    keychains,
    chain,
    index,
    derivationPrefix,
    bip44CoinType,
  });

  if (expectedAddress !== address) {
    throw new UnexpectedAddressError(`address validation failure: expected ${expectedAddress} but got ${address}`);
  }
}
