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

import { UtxoCoinName } from '../names';

/**
 * Script type for 2-of-3 multisig outputs.
 * This is the wasm-utxo OutputScriptType which uses 'p2trLegacy' for taproot.
 */
export type ScriptType2Of3 = fixedScriptWallet.OutputScriptType;

/**
 * utxolib script type format - uses 'p2tr' instead of 'p2trLegacy'.
 * This is the format expected by utxolib functions.
 */
export type UtxolibScriptType = 'p2sh' | 'p2shP2wsh' | 'p2wsh' | 'p2tr' | 'p2trMusig2';

/**
 * All 2-of-3 multisig script types.
 * Uses wasm-utxo naming ('p2trLegacy' for taproot).
 */
export const scriptTypes2Of3: readonly ScriptType2Of3[] = ['p2sh', 'p2shP2wsh', 'p2wsh', 'p2trLegacy', 'p2trMusig2'];

/**
 * All 2-of-3 multisig script types in utxolib format.
 * Uses utxolib naming ('p2tr' for taproot).
 */
export const utxolibScriptTypes2Of3: readonly UtxolibScriptType[] = [
  'p2sh',
  'p2shP2wsh',
  'p2wsh',
  'p2tr',
  'p2trMusig2',
];

/**
 * Convert ScriptType2Of3 to utxolib-compatible format.
 * ScriptType2Of3 uses 'p2trLegacy' while utxolib uses 'p2tr'.
 */
export function toUtxolibScriptType(scriptType: ScriptType2Of3): UtxolibScriptType {
  return scriptType === 'p2trLegacy' ? 'p2tr' : scriptType;
}

/**
 * Check if a script type requires witness data.
 * Witness data is required for segwit and taproot script types.
 */
export function hasWitnessData(scriptType: ScriptType2Of3): boolean {
  return (
    scriptType === 'p2shP2wsh' || scriptType === 'p2wsh' || scriptType === 'p2trLegacy' || scriptType === 'p2trMusig2'
  );
}

type ChainCode = fixedScriptWallet.ChainCode;

export interface FixedScriptAddressCoinSpecific {
  outputScript?: string;
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
  return fixedScriptWallet.supportsScriptType(coinName, addressType);
}

/**
 * Normalize script type aliases. "p2tr" is an alias for "p2trLegacy".
 */
function normalizeScriptType(scriptType: ScriptType2Of3 | 'p2tr'): ScriptType2Of3 {
  return scriptType === 'p2tr' ? 'p2trLegacy' : scriptType;
}

export function generateAddressWithChainAndIndex(
  coinName: UtxoCoinName,
  keychains: fixedScriptWallet.WalletKeysArg | Triple<string>,
  chain: ChainCode,
  index: number,
  format: CreateAddressFormat | undefined
): string {
  // Convert CreateAddressFormat to AddressFormat for wasm-utxo
  // 'base58' -> 'default', 'cashaddr' -> 'cashaddr'
  const wasmFormat = format === 'base58' ? 'default' : format;
  return fixedScriptWallet.address(keychains, chain, index, coinName, wasmFormat);
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

  const addressType = normalizeScriptType(params.addressType || convertFlagsToAddressType());

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
