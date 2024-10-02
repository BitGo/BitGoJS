import * as assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';

import { Parser } from './Parser';
import { parseUnknown } from './parseUnknown';
import { formatTree } from './format';
import { KeyOptions, getRootWalletKeys } from './args';

function getDefaultChainCodes(): number[] {
  return utxolib.bitgo.chainCodes.filter(
    // these are rare and show an annoying warning in stderr
    (c) => utxolib.bitgo.scriptTypeForChain(c) !== 'p2tr' && utxolib.bitgo.scriptTypeForChain(c) !== 'p2trMusig2'
  );
}

type FixedScriptAddressProperties = {
  chain: utxolib.bitgo.ChainCode;
  index: number;
  type: utxolib.bitgo.outputScripts.ScriptType;
  userPath: string;
  backupPath: string;
  bitgoPath: string;
  userKey: string;
  backupKey: string;
  bitgoKey: string;
  redeemScript?: string;
  witnessScript?: string;
  scriptPubKey: string;
  address: string;
};

const fixedScriptPlaceholders = {
  '%c': 'chain',
  '%i': 'index',
  '%p': 'userPath',
  '%t': 'type',
  '%p0': 'userPath',
  '%p1': 'backupPath',
  '%p2': 'bitgoPath',
  '%k0': 'userKey',
  '%k1': 'backupKey',
  '%k2': 'bitgoKey',
  '%s': 'scriptPubKey',
  '%r': 'redeemScript',
  '%w': 'witnessScript',
  '%a': 'address',
} as const;

export function getAsPlaceholderDescription(v: Record<string, string>): string {
  return Object.entries(v)
    .map(([placeholder, prop]) => `${placeholder} -> ${prop}`)
    .join('\n');
}

export function getFixedScriptAddressPlaceholderDescription(): string {
  return getAsPlaceholderDescription(fixedScriptPlaceholders);
}

function getAddressProperties(
  keys: utxolib.bitgo.RootWalletKeys,
  chain: utxolib.bitgo.ChainCode,
  index: number,
  network: utxolib.Network
): FixedScriptAddressProperties {
  const [userPath, backupPath, bitgoPath] = keys.triple.map((k) => keys.getDerivationPath(k, chain, index));
  const scripts = utxolib.bitgo.getWalletOutputScripts(keys, chain, index);
  const [userKey, backupKey, bitgoKey] = keys.triple.map((k) => k.derivePath(userPath).publicKey.toString('hex'));
  const address = utxolib.address.fromOutputScript(scripts.scriptPubKey, network);
  return {
    chain,
    index,
    type: utxolib.bitgo.scriptTypeForChain(chain),
    userPath,
    backupPath,
    bitgoPath,
    userKey,
    backupKey,
    bitgoKey,
    scriptPubKey: scripts.scriptPubKey.toString('hex'),
    redeemScript: scripts.redeemScript?.toString('hex'),
    witnessScript: scripts.witnessScript?.toString('hex'),
    address,
  };
}

export function formatAddressTree(props: FixedScriptAddressProperties): string {
  const parser = new Parser();
  return formatTree(parseUnknown(parser, 'address', props));
}

export function formatAddressWithFormatString(
  props: Record<string, unknown>,
  placeholders: Record<string, string>,
  format: string
): string {
  // replace all patterns with a % prefix from format string with the corresponding property
  // e.g. %p0 -> userPath, %k1 -> backupKey, etc.
  return format.replace(/%[a-z0-9]+/gi, (match) => {
    if (match in placeholders) {
      const prop = placeholders[match];
      return String(props[prop]);
    }
    return match;
  });
}

export function formatFixedScriptAddress(props: FixedScriptAddressProperties, format: string): string {
  return formatAddressWithFormatString(props, fixedScriptPlaceholders, format);
}

export function getRange(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function parseIndexRange(ranges: string[]): number[] {
  return ranges.flatMap((range) => {
    const [start, end] = range.split('-');
    if (end) {
      return getRange(Number(start), Number(end));
    }
    return [Number(start)];
  });
}

export function* generateFixedScriptAddress(
  argv: KeyOptions & {
    network?: utxolib.Network;
    chain?: number[];
    format: string;
    index: number[];
  }
): Generator<FixedScriptAddressProperties> {
  const rootXpubs = getRootWalletKeys(argv);
  const chains = argv.chain ?? getDefaultChainCodes();
  for (const i of argv.index) {
    for (const chain of chains) {
      assert(utxolib.bitgo.isChainCode(chain));
      // yield formatAddress(rootXpubs, chain, i, argv.network ?? utxolib.networks.bitcoin, argv.format);
      yield getAddressProperties(rootXpubs, chain, i, argv.network ?? utxolib.networks.bitcoin);
    }
  }
}
