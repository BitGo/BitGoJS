import * as assert from 'assert';
import * as desc from '@saravanan7mani/descriptors';
import * as ms from '@bitcoinerlab/miniscript';
import { ecc } from '../../noble_ecc';
import { getMainnet, Network, networks } from '../../networks';
import { filterByMasterFingerprint, getIndexValueOfBip32Path } from '../PsbtUtil';
import { PsbtInput } from 'bip174/src/lib/interfaces';
import { Psbt } from 'bitcoinjs-lib/src/psbt';
import { checkForInput } from 'bip174/src/lib/utils';

export const scriptTypesOfDescriptor = ['p2pk', 'p2pkh', 'p2wpkh', 'p2shP2wpkh', 'p2sh', 'p2wsh', 'p2shP2wsh'] as const;
export type ScriptTypeOfDescriptor = (typeof scriptTypesOfDescriptor)[number];

export type DescriptorWithExpansion = {
  descriptor: string;
  expansion: desc.Expansion;
};
export type DescriptorWithOptionalExpansion = {
  descriptor: string;
  expansion?: desc.Expansion;
};

export interface Timelocks {
  locktime: number;
  sequence?: number;
}

export interface ParsedScriptsByDescriptor {
  redeemScript?: Buffer;
  witnessScript?: Buffer;
}

export interface ParsedExtendedKeyInfoByDescriptor {
  keyId: string;
  pubkey: Buffer;
  path?: string;
  signature?: Buffer;
}

export interface ParsedPsbtInputWithDescriptor {
  descriptor: string;
  index?: number;
  scriptType: ScriptTypeOfDescriptor;
  address: string;
  scripts: ParsedScriptsByDescriptor;
  extendedKeyInfos: ParsedExtendedKeyInfoByDescriptor[];
  timelocks: Timelocks;
}

const { expand, Output } = desc.DescriptorsFactory(ecc);

export function isDescriptorSupported(network: Network): boolean {
  return getMainnet(network) === networks.bitcoin;
}

export function assertDescriptorSupport(network: Network): void {
  assert(isDescriptorSupported(network), 'Descriptors are supported only for the Bitcoin');
}

export function endsWithWildcard(path: string): boolean {
  return /\*([hH'])?$/.test(path);
}

export function isHardenedPath(path: string): boolean {
  return /['Hh]/g.test(path);
}

export function sanitizeHardenedMarker(path: string): string {
  return path.replace(/[Hh]/g, "'");
}

export function assertDescriptorPlaceholders(placeholders: string[], prefix: '@' | '#' | '$'): void {
  const re = { '@': /^@(\d|[1-9]\d+)$/, '#': /^#(\d|[1-9]\d+)$/, $: /^\$(\d|[1-9]\d+)$/ };

  const distinctPlaceholders = [...new Set(placeholders)];
  distinctPlaceholders.forEach((ph) =>
    assert(re[prefix].test(ph), `${ph} does not match the expanded placeholder format`)
  );
}

export function expandNonKeyLocks(descriptorOrMiniscript: string): string {
  const expandConfigs: { pattern: RegExp; prefix: '#' | '$' }[] = [
    { pattern: /(?:older|after)\((\d+)\)/g, prefix: '#' },
    { pattern: /(?:sha256|hash256|ripemd160|hash160)\(([0-9a-fA-F]{64})\)/g, prefix: '$' },
  ];

  return expandConfigs.reduce((expanded, { pattern, prefix }) => {
    let counter = 0;
    return expanded.replace(pattern, (match, n) => match.replace(n, `${prefix}${counter++}`));
  }, descriptorOrMiniscript);
}

export function isAddrDescriptor(descriptor: string): boolean {
  return descriptor.startsWith('addr(');
}

export function parseScriptType(descriptor: string): ScriptTypeOfDescriptor {
  if (descriptor.startsWith('pk(')) {
    return 'p2pk';
  }
  if (descriptor.startsWith('pk(')) {
    return 'p2pkh';
  }
  if (descriptor.startsWith('wpkh(')) {
    return 'p2wpkh';
  }
  if (descriptor.startsWith('sh(wpkh(')) {
    return 'p2shP2wpkh';
  }
  if (descriptor.startsWith('sh(')) {
    return 'p2sh';
  }
  if (descriptor.startsWith('wsh(')) {
    return 'p2wsh';
  }
  if (descriptor.startsWith('sh(wsh(')) {
    return 'p2shP2wsh';
  }
  throw new Error('Unknown script type');
}

export function expandDescriptor({
  descriptor,
  network,
  index,
  checksumRequired = true,
  allowMiniscriptInP2SH,
}: {
  descriptor: string;
  network: Network;
  index?: number;
  checksumRequired?: boolean;
  allowMiniscriptInP2SH?: boolean;
}): desc.Expansion {
  assertDescriptorSupport(network);
  return expand({
    descriptor,
    network,
    index,
    checksumRequired,
    allowMiniscriptInP2SH,
  });
}

export function expandDescriptors({
  descriptors,
  network,
  index,
  checksumRequired = true,
  allowMiniscriptInP2SH,
}: {
  descriptors: string[];
  network: Network;
  index?: number;
  checksumRequired?: boolean;
  allowMiniscriptInP2SH?: boolean;
}): DescriptorWithExpansion[] {
  assertDescriptorSupport(network);
  return descriptors.map((descriptor) => {
    const expansion = expandDescriptor({
      descriptor,
      network,
      index,
      checksumRequired,
      allowMiniscriptInP2SH,
    });
    return { descriptor, expansion };
  });
}

export function createOutputDescriptor({
  descriptor,
  index,
  network,
  checksumRequired = true,
  allowMiniscriptInP2SH,
}: {
  descriptor: string;
  network: Network;
  index?: number;
  checksumRequired?: boolean;
  allowMiniscriptInP2SH?: boolean;
}): desc.OutputInstance {
  assertDescriptorSupport(network);
  return new Output({ descriptor, index, network, allowMiniscriptInP2SH, checksumRequired });
}

export function findKeyWithBip32WildcardPath(keys: desc.KeyInfo[]): desc.KeyInfo | undefined {
  return keys.find((key) => key.keyPath && endsWithWildcard(key.keyPath));
}

export function findWildcardPathMatch(paths: string[], wildcardPath: string): string | undefined {
  const sanitizedWildcardPath = sanitizeHardenedMarker(wildcardPath).slice(2);
  return paths.find((path) => {
    const index = getIndexValueOfBip32Path(path);
    const sanitizedPath = sanitizedWildcardPath.replace(/[*]/g, index.toString());
    const pathToCompare = path.replace(/^m\//, '');
    return sanitizedPath === pathToCompare;
  });
}

export function findValueOfWildcard(input: PsbtInput, keyInfo: desc.KeyInfo): number | undefined {
  assert(
    keyInfo?.bip32 && keyInfo?.path && input.bip32Derivation?.length,
    'Missing required data to find wildcard value'
  );
  const derivations = filterByMasterFingerprint(
    input.bip32Derivation,
    keyInfo.masterFingerprint || keyInfo.bip32.fingerprint
  );
  const paths = derivations.map((v) => v.path);
  const path = findWildcardPathMatch(paths, keyInfo.path);
  return path ? getIndexValueOfBip32Path(path) : undefined;
}

export function getValueForDescriptorWildcardIndex(input: PsbtInput, expansion: desc.Expansion): number | undefined {
  if (!expansion.isRanged) {
    return undefined;
  }
  assert(expansion.expansionMap, 'Missing expansionMap');
  const keys = Object.values(expansion.expansionMap);
  const key = findKeyWithBip32WildcardPath(keys);
  assert(key, 'Missing key with wildcard path');
  const index = findValueOfWildcard(input, key);
  assert(index !== undefined, 'Missing index value');
  return index;
}

export function assertDescriptorKey({
  key,
  allowPrivateKeys,
  allowXpubHardenedKeyPath,
  allowKeyPathWithoutWildcardIndex,
}: {
  key: desc.KeyInfo;
  allowPrivateKeys?: boolean;
  allowXpubHardenedKeyPath?: boolean;
  allowKeyPathWithoutWildcardIndex?: boolean;
}): void {
  const hasPrivateKey =
    !!(key.bip32 && !key.bip32.isNeutered()) || !!(key.ecpair && Buffer.isBuffer(key.ecpair.privateKey));

  assert(allowPrivateKeys || !hasPrivateKey, 'Descriptor with a private key is not supported');

  const hasHardenedKeyPath = key.keyPath && isHardenedPath(key.keyPath);
  assert(
    allowXpubHardenedKeyPath || hasPrivateKey || !hasHardenedKeyPath,
    'Descriptor with a hardened key path for extended public key is not supported'
  );

  const wildcardCount = (key.keyPath?.match(/\*/g) || []).length;

  assert(wildcardCount <= 1, 'Descriptor key path should have at most 1 wildcard index');
  assert(allowKeyPathWithoutWildcardIndex || wildcardCount === 1, 'Descriptor key path should have wildcard index');
  assert(
    wildcardCount === 0 || (key.keyPath && endsWithWildcard(key.keyPath)),
    'If wildcard index is used in the descriptor key path, it should be the last index'
  );
}

export function assertDescriptorKeys({
  keys,
  allowPrivateKeys,
  allowXpubHardenedKeyPath,
  allowKeyPathWithoutWildcardIndex,
}: {
  keys: desc.KeyInfo[];
  allowPrivateKeys?: boolean;
  allowXpubHardenedKeyPath?: boolean;
  allowKeyPathWithoutWildcardIndex?: boolean;
}): void {
  keys.forEach((key) =>
    assertDescriptorKey({ key, allowPrivateKeys, allowXpubHardenedKeyPath, allowKeyPathWithoutWildcardIndex })
  );
}

export function assertMiniscript(expandedMiniscript: string): void {
  const { issane } = ms.compileMiniscript(expandedMiniscript);
  assert(issane, 'Invalid miniscript');
}

export function assertDescriptor({
  descriptor,
  network,
  allowPrivateKeys,
  allowXpubHardenedKeyPath,
  allowKeyPathWithoutWildcardIndex,
  allowWithNoKey,
  allowNonMiniscript,
  allowMiniscriptInP2SH,
  checksumRequired = true,
}: {
  descriptor: string;
  network: Network;
  allowPrivateKeys?: boolean;
  allowXpubHardenedKeyPath?: boolean;
  allowKeyPathWithoutWildcardIndex?: boolean;
  allowWithNoKey?: boolean;
  allowMiniscriptInP2SH?: boolean;
  allowNonMiniscript?: boolean;
  checksumRequired?: boolean;
}): void {
  assertDescriptorSupport(network);
  const { expandedMiniscript, expansionMap } = expandDescriptor({
    descriptor,
    network,
    checksumRequired,
    allowMiniscriptInP2SH,
  });
  if (expansionMap) {
    assertDescriptorKeys({
      keys: Object.values(expansionMap),
      allowPrivateKeys,
      allowXpubHardenedKeyPath,
      allowKeyPathWithoutWildcardIndex,
    });
  } else {
    assert(allowWithNoKey, 'Descriptor without keys is not supported');
  }
  if (expandedMiniscript) {
    assertMiniscript(expandedMiniscript);
  } else {
    assert(allowNonMiniscript, 'Descriptor without miniscript is not supported');
  }
}

export function assertDifferenceForInternalExternal({
  descriptorA,
  descriptorB,
  network,
}: {
  descriptorA: string;
  descriptorB: string;
  network: Network;
}): void {
  assertDescriptorSupport(network);
  assert(!isAddrDescriptor(descriptorA) && !isAddrDescriptor(descriptorB), 'Address descriptors are not supported');

  const getExpansion = (descriptor: string) =>
    expandDescriptor({
      descriptor,
      network,
      checksumRequired: false,
      allowMiniscriptInP2SH: true,
    });

  const expansionA = getExpansion(descriptorA);
  const expansionB = getExpansion(descriptorB);

  assert(expansionA.expansionMap && expansionB.expansionMap, 'Descriptor without key locks');
  assert(expansionA.expandedExpression === expansionB.expandedExpression, 'Descriptors do not match');
  assert(expansionA.isRanged === expansionB.isRanged, 'Wildcard index mismatch');

  const expansionMapA = expansionA.expansionMap;
  const expansionMapB = expansionB.expansionMap;
  const keysIdsA = Object.keys(expansionMapA);
  const keysIdsB = Object.keys(expansionMapB);
  assert(keysIdsA.length === keysIdsB.length, 'Number of keys does not match');

  const getKeyExprWithoutKeyPath = (key: desc.KeyInfo) =>
    key.keyPath ? key.keyExpression.slice(0, -key.keyPath.length) : key.keyExpression;

  keysIdsA.forEach((keyId) => {
    const keysA = expansionMapA[keyId];
    const keysB = expansionMapB[keyId];
    const KeyExprWithoutKeyPathA = getKeyExprWithoutKeyPath(keysA);
    const KeyExprWithoutKeyPathB = getKeyExprWithoutKeyPath(keysB);
    assert(KeyExprWithoutKeyPathA === KeyExprWithoutKeyPathB, 'Keys do not match');
  });

  const getAddress = (descriptor: string, expansion: desc.Expansion) =>
    expansion.payment?.address ||
    createOutputDescriptor({
      descriptor,
      index: 0,
      network,
      checksumRequired: false,
      allowMiniscriptInP2SH: true,
    }).getAddress();

  const addressA = getAddress(descriptorA, expansionA);
  const addressB = getAddress(descriptorB, expansionB);

  assert(addressA !== addressB, 'Descriptors are the same');
}

function hasExpansions(
  descriptorWithOptionalExpansion: DescriptorWithOptionalExpansion[]
): descriptorWithOptionalExpansion is DescriptorWithExpansion[] {
  const expandedExternals = descriptorWithOptionalExpansion.every((expansion) => !!expansion);
  const expandedInternals = descriptorWithOptionalExpansion.every((expansion) => !!expansion);
  return expandedExternals && expandedInternals;
}

function areScriptsMatching(input: PsbtInput, outputDescriptor: desc.OutputInstance): boolean {
  const redeemScript = outputDescriptor.getRedeemScript();
  const witnessScript = outputDescriptor.getWitnessScript();
  assert(input.redeemScript || input.witnessScript, 'Psbt input is missing both redeemScript and witnessScript');
  assert(redeemScript || witnessScript, 'Output descriptor is missing both redeemScript and witnessScript');

  const witnessScriptMatch =
    !!(!witnessScript && !input.witnessScript) ||
    !!(input.witnessScript && witnessScript && input.witnessScript.equals(witnessScript));

  const redeemScriptMatch =
    !!(!redeemScript && !input.redeemScript) ||
    !!(input.redeemScript && redeemScript && input.redeemScript.equals(redeemScript));

  return witnessScriptMatch && redeemScriptMatch;
}

export function getMatchingOutputDescriptor({
  input,
  descriptorsWithOptionalExpansions,
  network,
}: {
  input: PsbtInput;
  descriptorsWithOptionalExpansions: DescriptorWithOptionalExpansion[];
  network: Network;
}): { outputDescriptor: desc.OutputInstance; index?: number } & DescriptorWithExpansion {
  const descriptorsWithExpansions = hasExpansions(descriptorsWithOptionalExpansions)
    ? descriptorsWithOptionalExpansions
    : expandDescriptors({
        descriptors: descriptorsWithOptionalExpansions.map((descriptor) => descriptor.descriptor),
        network,
        checksumRequired: false,
        allowMiniscriptInP2SH: true,
      });

  function getOutputDescriptorIfMatches(descriptor: string, expansion: desc.Expansion) {
    const index = getValueForDescriptorWildcardIndex(input, expansion);
    const outputDescriptor = createOutputDescriptor({
      descriptor,
      index,
      network,
      checksumRequired: false,
    });
    return areScriptsMatching(input, outputDescriptor) ? { outputDescriptor, index } : undefined;
  }

  let outputDescriptorWithIndex: { outputDescriptor: desc.OutputInstance; index?: number } | undefined;
  const descriptorWithExpansion = descriptorsWithExpansions.find(({ descriptor, expansion }) => {
    outputDescriptorWithIndex = getOutputDescriptorIfMatches(descriptor, expansion);
    return !!outputDescriptorWithIndex;
  });

  assert(outputDescriptorWithIndex && descriptorWithExpansion, 'No matching output descriptor found');
  return { ...descriptorWithExpansion, ...outputDescriptorWithIndex };
}

export function getOutputDescriptors({
  psbt,
  descriptors,
  network,
}: {
  psbt: Psbt;
  descriptors: string[];
  network: Network;
}): ({ outputDescriptor: desc.OutputInstance } & DescriptorWithExpansion)[] {
  assertDescriptorSupport(network);
  const descriptorWithExpansion = expandDescriptors({
    descriptors,
    network,
    allowMiniscriptInP2SH: true,
  });
  return psbt.data.inputs.map((input) =>
    getMatchingOutputDescriptor({ input, descriptorsWithOptionalExpansions: descriptorWithExpansion, network })
  );
}

function parseScripts(outputDescriptor: desc.OutputInstance): ParsedScriptsByDescriptor {
  return { redeemScript: outputDescriptor.getRedeemScript(), witnessScript: outputDescriptor.getWitnessScript() };
}

function parseExtendedKeyInfos(
  input: PsbtInput,
  outputDescriptor: desc.OutputInstance
): ParsedExtendedKeyInfoByDescriptor[] {
  const expansionMap = outputDescriptor.expand().expansionMap;
  assert(expansionMap, 'Missing expansionMap for signature parsing');
  return Object.keys(expansionMap).map((keyId) => {
    const pubkey = expansionMap[keyId].pubkey;
    assert(pubkey);
    const pSig = input.partialSig?.find((pSig) => pubkey.equals(pSig.pubkey));
    return { ...pSig, pubkey, keyId, path: expansionMap[keyId].path };
  });
}

function parseTimelocks(psbt: Psbt, inputIndex: number): { locktime: number; sequence?: number } {
  const locktime = psbt.locktime;
  const sequence = psbt.txInputs[inputIndex].sequence;
  return { locktime, sequence };
}

export function parsePsbtInputWithDescriptor({
  psbt,
  inputIndex,
  descriptorsWithOptionalExpansions,
  network,
}: {
  psbt: Psbt;
  inputIndex: number;
  descriptorsWithOptionalExpansions: DescriptorWithOptionalExpansion[];
  network: Network;
}): ParsedPsbtInputWithDescriptor {
  const input = checkForInput(psbt.data.inputs, inputIndex);
  const { descriptor, outputDescriptor, index } = getMatchingOutputDescriptor({
    input,
    descriptorsWithOptionalExpansions,
    network,
  });
  const scriptType = parseScriptType(descriptor);
  const address = outputDescriptor.getAddress();
  const scripts = parseScripts(outputDescriptor);
  const extendedKeyInfos = parseExtendedKeyInfos(input, outputDescriptor);
  const timelocks = parseTimelocks(psbt, inputIndex);
  return { descriptor, index, scriptType, address, scripts, extendedKeyInfos, timelocks };
}

export function parsePsbtWithDescriptor({
  psbt,
  descriptors,
  network,
}: {
  psbt: Psbt;
  descriptors: string[];
  network: Network;
}): ParsedPsbtInputWithDescriptor[] {
  const descriptorsWithExpansions = expandDescriptors({
    descriptors,
    network,
    checksumRequired: false,
    allowMiniscriptInP2SH: true,
  });
  return psbt.data.inputs.map((_, inputIndex) =>
    parsePsbtInputWithDescriptor({
      psbt,
      inputIndex,
      descriptorsWithOptionalExpansions: descriptorsWithExpansions,
      network,
    })
  );
}
