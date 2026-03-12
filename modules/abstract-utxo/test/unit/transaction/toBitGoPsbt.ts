import assert from 'node:assert/strict';

import * as utxolib from '@bitgo/utxo-lib';

import { toBitGoPsbt, getVSize } from '../../../src/transaction/toBitGoPsbt';
import { hasKeyPathSpendInput } from '../../../src/transaction/fixedScript/musig2';
import type { UtxoCoinName } from '../../../src/names';

function getCoinName(network: utxolib.Network): UtxoCoinName {
  const map: Record<string, UtxoCoinName> = {
    bitcoin: 'btc',
    testnet: 'tbtc',
    bitcoincash: 'bch',
    bitcoincashTestnet: 'tbch',
    ecash: 'bcha',
    ecashTest: 'tbcha',
    bitcoingold: 'btg',
    dash: 'dash',
    dashTest: 'tdash',
    dogecoin: 'doge',
    dogecoinTest: 'tdoge',
    litecoin: 'ltc',
    litecoinTest: 'tltc',
    zcash: 'zec',
    zcashTest: 'tzec',
  };
  const name = utxolib.getNetworkName(network);
  assert(name, 'unknown network');
  const coinName = map[name];
  assert(coinName, `no coin name for network ${name}`);
  return coinName;
}

describe('toBitGoPsbt / getVSize', function () {
  utxolib.testutil.AcidTest.suite()
    .filter((test) => test.signStage === 'unsigned')
    .forEach((acidTest) => {
      describe(`${acidTest.name}`, function () {
        let psbtHex: string;

        before('prepare', function () {
          psbtHex = acidTest.createPsbt().toHex();
        });

        it('should round-trip through toBitGoPsbt', function () {
          const coinName = getCoinName(acidTest.network);
          const psbt = toBitGoPsbt(psbtHex, coinName);
          assert.ok(psbt);
        });

        it('should return a positive vSize', function () {
          const coinName = getCoinName(acidTest.network);
          const psbt = toBitGoPsbt(psbtHex, coinName);
          const vsize = getVSize(psbt);
          assert.ok(vsize > 0, `expected positive vSize, got ${vsize}`);
        });
      });
    });
});

describe('hasKeyPathSpendInput', function () {
  const network = utxolib.networks.bitcoin;
  const rootWalletKeys = utxolib.testutil.getDefaultWalletKeys();

  it('should return true for PSBT with taprootKeyPathSpend input', function () {
    const inputs: utxolib.testutil.Input[] = [
      { scriptType: 'taprootKeyPathSpend', value: BigInt(2000) },
      { scriptType: 'p2wsh', value: BigInt(2000) },
    ];
    const outputs: utxolib.testutil.Output[] = [
      { scriptType: 'p2sh', value: BigInt(3000) },
    ];
    const psbt = utxolib.testutil.constructPsbt(inputs, outputs, network, rootWalletKeys, 'unsigned', {
      deterministic: true,
      addGlobalXPubs: true,
    });
    const bitgoPsbt = toBitGoPsbt(psbt.toHex(), 'btc');
    assert.strictEqual(hasKeyPathSpendInput(bitgoPsbt, 'btc'), true);
  });

  it('should return false for PSBT without taprootKeyPathSpend input', function () {
    const inputs: utxolib.testutil.Input[] = [
      { scriptType: 'p2wsh', value: BigInt(2000) },
      { scriptType: 'p2tr', value: BigInt(2000) },
    ];
    const outputs: utxolib.testutil.Output[] = [
      { scriptType: 'p2sh', value: BigInt(3000) },
    ];
    const psbt = utxolib.testutil.constructPsbt(inputs, outputs, network, rootWalletKeys, 'unsigned', {
      deterministic: true,
      addGlobalXPubs: true,
    });
    const bitgoPsbt = toBitGoPsbt(psbt.toHex(), 'btc');
    assert.strictEqual(hasKeyPathSpendInput(bitgoPsbt, 'btc'), false);
  });
});
