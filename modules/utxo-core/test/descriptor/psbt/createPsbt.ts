import * as assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';
import { BIP32Interface } from '@bitgo/utxo-lib';

import { DescriptorTemplate, getDescriptor, getPsbtParams } from '../../../src/testutil/descriptor/descriptors';
import { getFixture } from '../../../src/testutil/fixtures.utils';
import { finalizePsbt } from '../../../src/descriptor';
import { getKeyTriple } from '../../../src/testutil/key.utils';
import { mockPsbtDefault } from '../../../src/testutil/descriptor/mock.utils';
import { toPlainObjectFromPsbt, toPlainObjectFromTx } from '../../../src/testutil/descriptor/psbt.utils';

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
    const keysB = getKeyTriple('b');

    function getSignedPsbt(psbt: utxolib.bitgo.UtxoPsbt, keys: BIP32Interface[]) {
      const cloned = utxolib.bitgo.createPsbtFromBuffer(psbt.toBuffer(), psbt.network);
      for (const key of keys) {
        cloned.signAllInputsHD(key);
      }
      return cloned;
    }

    it('creates psbt with expected properties', async function () {
      const psbt = mockPsbtDefault({
        descriptorSelf: getDescriptor(t, keysA),
        descriptorOther: getDescriptor(t, keysB),
        params: getPsbtParams(t),
      });
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
describeCreatePsbt('Wsh2Of3CltvDrop');
describeCreatePsbt('Tr2Of3-NoKeyPath');
