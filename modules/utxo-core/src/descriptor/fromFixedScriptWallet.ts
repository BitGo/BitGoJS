import * as utxolib from '@bitgo/utxo-lib';
import { Descriptor, ast } from '@bitgo/wasm-miniscript';

import { DescriptorMap } from './DescriptorMap';

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

export function getNamedDescriptorsForRootWalletKeys(rootWalletKeys: utxolib.bitgo.RootWalletKeys): DescriptorMap {
  const scriptTypes = ['p2sh', 'p2shP2wsh', 'p2wsh'] as const;
  const scopes = ['external', 'internal'] as const;
  return new Map(
    scriptTypes.flatMap((scriptType) =>
      scopes.map((scope) => [`${scriptType}/${scope}`, getDescriptorForScriptType(rootWalletKeys, scriptType, scope)])
    )
  );
}
