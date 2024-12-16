import assert from 'assert';
import * as utxolib from '@bitgo/utxo-lib';
import { mockPsbtDefaultWithDescriptorTemplate } from '../../core/descriptor/psbt/mock.utils';
import { toBaseParsedTransactionOutputsFromPsbt } from '../../../src/transaction/descriptor/parse';
import { getDefaultXPubs, getDescriptorMap } from '../../core/descriptor/descriptor.utils';
import { assertEqualFixture } from './fixtures.utils';
import { toPlainObject } from '../../core/toPlainObject.utils';

function toRecipient(output: utxolib.PsbtTxOutput): {
  address: string;
  amount: string;
} {
  assert(output.address);
  return {
    address: output.address,
    amount: output.value.toString(),
  };
}

describe('parse', function () {
  describe('toBase', function () {
    it('should return the correct BaseParsedTransactionOutputs', async function () {
      const psbt = mockPsbtDefaultWithDescriptorTemplate('Wsh2Of3');
      await assertEqualFixture(
        'parseWithoutRecipients.json',
        toPlainObject(
          toBaseParsedTransactionOutputsFromPsbt(
            psbt,
            getDescriptorMap('Wsh2Of3', getDefaultXPubs('a')),
            [],
            psbt.network
          )
        )
      );
      await assertEqualFixture(
        'parseWithRecipient.json',
        toPlainObject(
          toBaseParsedTransactionOutputsFromPsbt(
            psbt,
            getDescriptorMap('Wsh2Of3', getDefaultXPubs('a')),
            [toRecipient(psbt.txOutputs[0])],
            psbt.network
          )
        )
      );
    });
  });
});
