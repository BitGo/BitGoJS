import * as assert from 'assert';
import * as utxolib from '@bitgo/utxo-lib';

function getDefaultChainCodes(): number[] {
  return utxolib.bitgo.chainCodes.filter(
    // these are rare and show an annoying warning in stderr
    (c) => utxolib.bitgo.scriptTypeForChain(c) !== 'p2tr' && utxolib.bitgo.scriptTypeForChain(c) !== 'p2trMusig2'
  );
}

type AddressProperties = {
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

const placeholders = {
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

export function getAddressPlaceholderDescription(): string {
  return Object.entries(placeholders)
    .map(([placeholder, prop]) => `${placeholder} -> ${prop}`)
    .join('\n');
}

function getAddressProperties(
  keys: utxolib.bitgo.RootWalletKeys,
  chain: utxolib.bitgo.ChainCode,
  index: number,
  network: utxolib.Network
): AddressProperties {
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

function formatAddress(
  keys: utxolib.bitgo.RootWalletKeys,
  chain: utxolib.bitgo.ChainCode,
  index: number,
  network: utxolib.Network,
  format: string
): string {
  const props = getAddressProperties(keys, chain, index, network);

  // replace all patterns with a % prefix from format string with the corresponding property
  // e.g. %p0 -> userPath, %k1 -> backupKey, etc.
  return format.replace(/%[a-z0-9]+/gi, (match) => {
    if (match in placeholders) {
      const prop = placeholders[match as keyof typeof placeholders];
      return String(props[prop]);
    }
    return match;
  });
}

export function* generateAddress(argv: {
  network?: utxolib.Network;
  userKey: string;
  backupKey: string;
  bitgoKey: string;
  chain?: number[];
  format: string;
  limit: number;
}): Generator<string> {
  const xpubs = [argv.userKey, argv.backupKey, argv.bitgoKey].map((k) => utxolib.bip32.fromBase58(k));
  assert(utxolib.bitgo.isTriple(xpubs));
  const rootXpubs = new utxolib.bitgo.RootWalletKeys(xpubs);
  const chains = argv.chain ?? getDefaultChainCodes();
  for (let i = 0; i < argv.limit; i++) {
    for (const chain of chains) {
      assert(utxolib.bitgo.isChainCode(chain));
      yield formatAddress(rootXpubs, chain, i, argv.network ?? utxolib.networks.bitcoin, argv.format);
    }
  }
}
