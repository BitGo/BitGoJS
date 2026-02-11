import 'should';

import { fixedScriptWallet } from '@bitgo/wasm-utxo';
import * as testutils from '@bitgo/wasm-utxo/testutils';

import { constructPsbt, getWalletAddress, getUtxoCoin } from './util';

const { BitGoPsbt } = fixedScriptWallet;

describe('Post Build Validation', function () {
  const coin = getUtxoCoin('tbtc');

  it('should not modify locktime on postProcessPrebuild', async function () {
    const walletKeys = testutils.getDefaultWalletKeys();
    const walletAddress = getWalletAddress('tbtc', walletKeys);

    // Create a PSBT with lockTime=0 and sequence=0xffffffff
    const psbt = constructPsbt(
      [{ scriptType: 'p2wsh' as const, value: BigInt(100000) }],
      [{ address: walletAddress, value: BigInt(90000) }],
      'tbtc',
      walletKeys,
      { lockTime: 0, sequence: 0xffffffff }
    );

    const txHex = Buffer.from(psbt.serialize()).toString('hex');
    const blockHeight = 100;
    const preBuild = { txHex, blockHeight };
    const postProcessBuilt = await coin.postProcessPrebuild(preBuild);

    // Parse result as PSBT
    const resultPsbt = BitGoPsbt.fromBytes(Buffer.from(postProcessBuilt.txHex as string, 'hex'), 'tbtc');

    resultPsbt.lockTime.should.equal(0);

    // Check sequences via parseTransactionWithWalletKeys
    const parsed = resultPsbt.parseTransactionWithWalletKeys(walletKeys, { publicKeys: [] });
    for (const input of parsed.inputs) {
      input.sequence.should.equal(0xffffffff);
    }
  });
});
