import * as utxolib from '@bitgo/utxo-lib';
import { Parser } from './Parser';
import { formatTree } from './format';

type GenerateAddressParams = {
  network: utxolib.Network;
  xpubs: string[];
  chain: number;
  index: number;
};

export function generateAddress(params: GenerateAddressParams): void {
  const keys = params.xpubs.map((xpub) => utxolib.bip32.fromBase58(xpub));
  if (!utxolib.bitgo.isTriple(keys)) {
    throw new Error(`must provide three xpubs (user, backup, bitgo)`);
  }
  if (!utxolib.bitgo.isChainCode(params.chain)) {
    throw new Error(`invalid chain code ${params.chain}`);
  }
  const scriptType = utxolib.bitgo.scriptTypeForChain(params.chain);
  const walletKeys = new utxolib.bitgo.RootWalletKeys(keys);
  const derivedKeys = walletKeys.deriveForChainAndIndex(params.chain, params.index);
  const scripts = utxolib.bitgo.outputScripts.createOutputScript2of3(derivedKeys.publicKeys, scriptType);
  const address = utxolib.address.fromOutputScript(scripts.scriptPubKey, params.network);

  const parser = new Parser();
  const root = parser.node('address', undefined, [
    parser.node(
      'addressKeys',
      undefined,
      walletKeys.triple.map((k, i) => {
        const name = ['user', 'backup', 'bitgo'][i];
        const path = walletKeys.getDerivationPath(k, params.chain, params.index);
        return parser.node(name, undefined, [
          parser.node('derivationPath', path),
          parser.node('xpub', k.derivePath(path).toBase58()),
        ]);
      })
    ),
    parser.node('chain', params.chain),
    parser.node('index', params.index),
    parser.node('scriptPubKey', scripts.scriptPubKey),
    parser.node('scriptType', scriptType),
    parser.node('encoded', address),
  ]);
  console.log(formatTree(root));
}
