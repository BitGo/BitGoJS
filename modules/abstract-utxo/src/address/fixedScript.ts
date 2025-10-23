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
  sanitizeLegacyPath,
} from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';
import { bitgo } from '@bitgo/utxo-lib';
import { bip32 } from '@bitgo/secp256k1';

type ScriptType2Of3 = bitgo.outputScripts.ScriptType2Of3;

export interface FixedScriptAddressCoinSpecific {
  outputScript?: string;
  redeemScript?: string;
  witnessScript?: string;
}

export interface GenerateAddressOptions {
  addressType?: ScriptType2Of3;
  threshold?: number;
  chain?: number;
  index?: number;
  segwit?: boolean;
  bech32?: boolean;
}

export interface GenerateFixedScriptAddressOptions extends GenerateAddressOptions {
  format?: CreateAddressFormat;
  keychains: { pub: string }[];
}

function canonicalAddress(network: utxolib.Network, address: string, format?: CreateAddressFormat): string {
  if (format === 'cashaddr') {
    const script = utxolib.addressFormat.toOutputScriptTryFormats(address, network);
    return utxolib.addressFormat.fromOutputScriptWithFormat(script, format, network);
  }
  // Default to canonical format (base58 for most coins)
  return utxolib.addressFormat.toCanonicalFormat(address, network);
}

function supportsAddressType(network: utxolib.Network, addressType: ScriptType2Of3): boolean {
  return utxolib.bitgo.outputScripts.isSupportedScriptType(network, addressType);
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
export function generateAddress(network: utxolib.Network, params: GenerateFixedScriptAddressOptions): string {
  let derivationIndex = 0;
  if (_.isInteger(params.index) && (params.index as number) > 0) {
    derivationIndex = params.index as number;
  }

  const { keychains, threshold, chain, segwit = false, bech32 = false } = params as GenerateFixedScriptAddressOptions;

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

  if (addressType !== utxolib.bitgo.scriptTypeForChain(derivationChain)) {
    throw new AddressTypeChainMismatchError(addressType, derivationChain);
  }

  if (!supportsAddressType(network, addressType)) {
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

  let signatureThreshold = 2;
  if (_.isInteger(threshold)) {
    signatureThreshold = threshold as number;
    if (signatureThreshold <= 0) {
      throw new Error('threshold has to be positive');
    }
    if (signatureThreshold > keychains.length) {
      throw new Error('threshold cannot exceed number of keys');
    }
  }

  const path = '0/0/' + derivationChain + '/' + derivationIndex;
  const hdNodes = keychains.map(({ pub }) => bip32.fromBase58(pub));
  const derivedKeys = hdNodes.map((hdNode) => hdNode.derivePath(sanitizeLegacyPath(path)).publicKey);

  const { scriptPubKey: outputScript } = utxolib.bitgo.outputScripts.createOutputScript2of3(derivedKeys, addressType);

  const address = utxolib.address.fromOutputScript(outputScript, network);

  return canonicalAddress(network, address, params.format);
}

type Keychain = {
  pub: string;
};

export function assertFixedScriptWalletAddress(
  network: utxolib.Network,
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

  const expectedAddress = generateAddress(network, {
    format,
    addressType: addressType as ScriptType2Of3,
    keychains,
    threshold: 2,
    chain,
    index,
  });

  if (expectedAddress !== address) {
    throw new UnexpectedAddressError(`address validation failure: expected ${expectedAddress} but got ${address}`);
  }
}
