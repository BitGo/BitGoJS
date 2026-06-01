import assert from 'assert';

import * as testutils from '@bitgo/wasm-utxo/testutils';

import { verifyTransaction } from '../../../../src/transaction/descriptor/verifyTransaction';
import { toExtendedAddressFormat } from '../../../../src/transaction/recipient';
import { getUtxoCoin } from '../../util';

const { getDefaultXPubs, getDescriptor, getDescriptorMap, mockPsbt } = testutils.descriptor;

describe('descriptor verifyTransaction - quantum-resistant sweep', function () {
  const coin = getUtxoCoin('tbtc');

  const xpubsSelf = getDefaultXPubs('a');
  const xpubsOther = getDefaultXPubs('b');
  const descriptorSelf = getDescriptor('Wsh2Of3', xpubsSelf);
  const descriptorOther = getDescriptor('Wsh2Of3', xpubsOther);
  const descriptorMap = getDescriptorMap('Wsh2Of3', xpubsSelf);

  function buildPsbtAllInternal() {
    return mockPsbt(
      [
        { descriptor: descriptorSelf, index: 0 },
        { descriptor: descriptorSelf, index: 1, id: { vout: 1 } },
      ],
      [
        { descriptor: descriptorSelf, index: 0, value: BigInt(4e5) },
        { descriptor: descriptorSelf, index: 1, value: BigInt(4e5) },
      ]
    );
  }

  function buildPsbtWithExternal() {
    return mockPsbt(
      [
        { descriptor: descriptorSelf, index: 0 },
        { descriptor: descriptorSelf, index: 1, id: { vout: 1 } },
      ],
      [
        { descriptor: descriptorOther, index: 0, value: BigInt(4e5), external: true },
        { descriptor: descriptorSelf, index: 0, value: BigInt(4e5) },
      ]
    );
  }

  it('should reject when external outputs exist and qr is true', async function () {
    const psbt = buildPsbtWithExternal();
    const externalScript = Buffer.from(descriptorOther.atDerivationIndex(0).scriptPubkey());
    const externalAddress = toExtendedAddressFormat(externalScript, 'tbtc');

    await assert.rejects(
      verifyTransaction(
        coin,
        {
          txParams: {
            qr: true,
            recipients: [{ address: externalAddress, amount: '400000' }],
          },
          txPrebuild: { txHex: Buffer.from(psbt.serialize()).toString('hex') },
          wallet: {} as any,
        },
        descriptorMap
      ),
      /quantum-resistant sweep transactions must only contain wallet-internal outputs/
    );
  });

  it('should pass when all outputs are internal and qr is true', async function () {
    const psbt = buildPsbtAllInternal();

    const result = await verifyTransaction(
      coin,
      {
        txParams: { qr: true, recipients: [] },
        txPrebuild: { txHex: Buffer.from(psbt.serialize()).toString('hex') },
        wallet: {} as any,
      },
      descriptorMap
    );

    assert.strictEqual(result, true);
  });

  it('should not apply qr check when qr is not set (internal-only outputs pass normally)', async function () {
    const psbt = buildPsbtAllInternal();

    const result = await verifyTransaction(
      coin,
      {
        txParams: { recipients: [] },
        txPrebuild: { txHex: Buffer.from(psbt.serialize()).toString('hex') },
        wallet: {} as any,
      },
      descriptorMap
    );

    assert.strictEqual(result, true);
  });
});
