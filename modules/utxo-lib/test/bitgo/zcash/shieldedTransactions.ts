import * as assert from 'assert';
import * as shieldedTransactionJson from './fixtures/zcash-shielded-transaction.json';
import { ZcashTransaction } from '../../../src/bitgo';
import { networks } from '../../../src/networks';

describe('Deserialize shielded Zcash transactions', function () {
  it('should be able to deserialize transaction', async function () {
    const tx = ZcashTransaction.fromBuffer(
      Buffer.from(shieldedTransactionJson.hex, 'hex'),
      true,
      'bigint',
      networks.zcash
    );
    assert(tx);
  });
});
