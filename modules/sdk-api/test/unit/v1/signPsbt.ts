import * as assert from 'assert';
import * as utxolib from '@bitgo/utxo-lib';
import { signPsbtRequest } from '../../../src/v1/signPsbt';

describe('signPsbt', function () {
  it('signs psbt', function () {
    const keys = utxolib.testutil.getDefaultWalletKeys();
    const psbt = utxolib.testutil.constructPsbt(
      [{ scriptType: 'p2sh', value: BigInt(1e8) }],
      [{ scriptType: 'p2sh', value: BigInt(1e8 - 1000) }],
      utxolib.networks.bitcoin,
      keys,
      'unsigned'
    );
    const result = signPsbtRequest({
      psbt: psbt.toHex(),
      keychain: {
        xprv: keys.triple[0].toBase58(),
      },
    });
    const halfSignedPsbt = utxolib.bitgo.createPsbtFromBuffer(
      Buffer.from(result.psbt, 'hex'),
      utxolib.networks.bitcoin
    );
    assert.ok(halfSignedPsbt.validateSignaturesOfInputHD(0, keys.triple[0]));
  });
});
