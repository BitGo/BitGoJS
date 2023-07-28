import * as assert from 'assert';
import * as utxolib from '@bitgo/utxo-lib';

export function* generateAddress(argv: {
  network?: utxolib.Network;
  userKey: string;
  backupKey: string;
  bitgoKey: string;
  chain?: number[];
  limit: number;
  showDerivationPath?: boolean;
}): Generator<string> {
  const xpubs = [argv.userKey, argv.backupKey, argv.bitgoKey].map((k) => utxolib.bip32.fromBase58(k));
  assert(utxolib.bitgo.isTriple(xpubs));
  const rootXpubs = new utxolib.bitgo.RootWalletKeys(xpubs);
  const chains =
    argv.chain ??
    utxolib.bitgo.chainCodes.filter(
      // these are rare and show an annoying warning in stderr
      (c) => utxolib.bitgo.scriptTypeForChain(c) !== 'p2tr' && utxolib.bitgo.scriptTypeForChain(c) !== 'p2trMusig2'
    );
  for (let i = 0; i < argv.limit; i++) {
    for (const chain of chains) {
      assert(utxolib.bitgo.isChainCode(chain));
      const scripts = utxolib.bitgo.getWalletOutputScripts(rootXpubs, chain, i);
      const parts = [];
      if (argv.showDerivationPath) {
        // FIXME: can be different for other keys
        parts.push(rootXpubs.getDerivationPath(rootXpubs.user, chain, i));
      }
      parts.push(utxolib.address.fromOutputScript(scripts.scriptPubKey, argv.network ?? utxolib.networks.bitcoin));
      yield parts.join('\t');
    }
  }
}
