import * as utxolib from '@bitgo/utxo-lib';
import { Descriptor, ast } from '@bitgo/wasm-miniscript';

/** Expand a template with the given root wallet keys and chain code */
function expand(rootWalletKeys: utxolib.bitgo.RootWalletKeys, keyIndex: number, chainCode: number): string {
  if (keyIndex !== 0 && keyIndex !== 1 && keyIndex !== 2) {
    throw new Error('Invalid key index');
  }
  const xpub = rootWalletKeys.triple[keyIndex].neutered().toBase58();
  const prefix = rootWalletKeys.derivationPrefixes[keyIndex];
  return xpub + '/' + prefix + '/' + chainCode + '/*';
}

/**
 * Get a standard output descriptor that corresponds to the proprietary HD wallet setup
 * used in BitGo wallets.
 * Only supports a subset of script types.
 */
export function getDescriptorForScriptType(
  rootWalletKeys: utxolib.bitgo.RootWalletKeys,
  scriptType: 'p2sh' | 'p2shP2wsh' | 'p2wsh',
  scope: 'internal' | 'external'
): Descriptor {
  const chain =
    scope === 'external'
      ? utxolib.bitgo.getExternalChainCode(scriptType)
      : utxolib.bitgo.getInternalChainCode(scriptType);
  const multi: ast.MiniscriptNode = {
    multi: [2, ...rootWalletKeys.triple.map((_, i) => expand(rootWalletKeys, i, chain))],
  };
  switch (scriptType) {
    case 'p2sh':
      return Descriptor.fromString(ast.formatNode({ sh: multi }), 'derivable');
    case 'p2shP2wsh':
      return Descriptor.fromString(ast.formatNode({ sh: { wsh: multi } }), 'derivable');
    case 'p2wsh':
      return Descriptor.fromString(ast.formatNode({ wsh: multi }), 'derivable');
    default:
      throw new Error(`Unsupported script type ${scriptType}`);
  }
}

function isSupportedScriptType(
  scriptType: utxolib.bitgo.outputScripts.ScriptType2Of3
): scriptType is 'p2sh' | 'p2shP2wsh' | 'p2wsh' {
  return ['p2sh', 'p2shP2wsh', 'p2wsh'].includes(scriptType);
}

/**
 * Get a map of named descriptors for the given root wallet keys.
 * Unsupported script types will have a value of null.
 * Currently supports p2sh, p2shP2wsh, and p2wsh script types.
 * @param rootWalletKeys
 */
export function getNamedDescriptorsForRootWalletKeys(
  rootWalletKeys: utxolib.bitgo.RootWalletKeys
): Map<string, Descriptor | null> {
  const scopes = ['external', 'internal'] as const;
  return new Map(
    utxolib.bitgo.outputScripts.scriptTypes2Of3.flatMap((scriptType) =>
      scopes.map((scope) => [
        `${scriptType}/${scope}`,
        isSupportedScriptType(scriptType) ? getDescriptorForScriptType(rootWalletKeys, scriptType, scope) : null,
      ])
    )
  );
}
