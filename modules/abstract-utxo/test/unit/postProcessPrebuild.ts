import 'should';

import { type TestBitGoAPI, TestBitGo } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { fixedScriptWallet } from '@bitgo/wasm-utxo';
import * as testutils from '@bitgo/wasm-utxo/testutils';

import { Tbtc } from '../../src/impl/btc';

import { constructPsbt } from './util';

const { BitGoPsbt } = fixedScriptWallet;

describe('Post Build Validation', function () {
  let bitgo: TestBitGoAPI;
  let coin: Tbtc;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.safeRegister('tbtc', Tbtc.createInstance);
    bitgo.initializeTestVars();
    coin = bitgo.coin('tbtc') as Tbtc;
  });

  it('should not modify locktime on postProcessPrebuild', async function () {
    const walletKeys = testutils.getDefaultWalletKeys();

    // Create a PSBT with lockTime=0 and sequence=0xffffffff
    const psbt = constructPsbt(
      [{ scriptType: 'p2wsh' as const, value: BigInt(100000) }],
      [{ address: 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7', value: BigInt(90000) }],
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
