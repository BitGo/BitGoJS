import * as assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';
import { BIP32Interface } from '@bitgo/utxo-lib';

import { DescriptorTemplate, getPsbtParams } from '../descriptor.utils';
import { getFixture } from '../../fixtures.utils';
import { finalizePsbt } from '../../../../src/core/descriptor';
import { getKeyTriple } from '../../key.utils';

import { mockPsbtDefaultWithDescriptorTemplate } from './mock.utils';
import { toPlainObjectFromPsbt, toPlainObjectFromTx } from './psbt.utils';

async function assertEqualsFixture(t: DescriptorTemplate, filename: string, value: unknown) {
  filename = __dirname + '/fixtures/' + t + '.' + filename;
  if (value instanceof Buffer) {
    return assert.deepStrictEqual(value.toString('hex'), (await getFixture<Buffer>(filename, value)).toString('hex'));
  }

  if (value instanceof utxolib.Psbt) {
    return assert.deepStrictEqual(
      toPlainObjectFromPsbt(value),
      await getFixture(filename, toPlainObjectFromPsbt(value))
    );
  }

  if (value instanceof utxolib.Transaction) {
    return assert.deepStrictEqual(toPlainObjectFromTx(value), await getFixture(filename, toPlainObjectFromTx(value)));
  }

  throw new Error(`unknown value type: ${typeof value}`);
}

function describeCreatePsbt(t: DescriptorTemplate) {
  describe(`createPsbt ${t}`, function () {
    const keysA = getKeyTriple('a');

    function getSignedPsbt(psbt: utxolib.bitgo.UtxoPsbt, keys: BIP32Interface[]) {
      const cloned = utxolib.bitgo.createPsbtFromBuffer(psbt.toBuffer(), psbt.network);
      for (const key of keys) {
        cloned.signAllInputsHD(key);
      }
      return cloned;
    }

    it('creates psbt with expected properties', async function () {
      const psbt = mockPsbtDefaultWithDescriptorTemplate(t, getPsbtParams(t));
      await assertEqualsFixture(t, 'createPsbt.json', psbt);
      const psbtSignedA = getSignedPsbt(psbt, keysA.slice(0, 1));
      await assertEqualsFixture(t, 'createPsbtSignedA.json', psbtSignedA);
      const psbtSignedAB = getSignedPsbt(psbt, keysA.slice(0, 2));
      await assertEqualsFixture(t, 'createPsbtSignedAB.json', psbtSignedAB);
      const psbtFinal = psbtSignedAB.clone();
      finalizePsbt(psbtFinal);
      await assertEqualsFixture(t, 'createPsbtFinal.json', psbtFinal);
      const networkTx = psbtFinal.extractTransaction();
      await assertEqualsFixture(t, 'createPsbtFinalTx.json', networkTx);
      await assertEqualsFixture(t, 'createPsbtFinalTx.hex', networkTx.toBuffer());
    });
  });
}

describeCreatePsbt('Wsh2Of3');
describeCreatePsbt('ShWsh2Of3CltvDrop');
