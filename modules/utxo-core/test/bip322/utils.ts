import assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';

import { getBip322ProofMessageAtIndex } from '../../src/bip322';

import { BIP322_FIXTURE_HELLO_WORLD_TOSIGN_PSBT } from './bip322.utils';

describe('BIP322 Proof utils', function () {
  it('should add a BIP322 proof message to a PSBT input', function () {
    const psbt = utxolib.bitgo.createPsbtFromBuffer(
      BIP322_FIXTURE_HELLO_WORLD_TOSIGN_PSBT.toBuffer(),
      utxolib.networks.bitcoin
    );

    const proprietaryKeyVals = utxolib.bitgo.getPsbtInputProprietaryKeyVals(psbt.data.inputs[0], {
      identifier: utxolib.bitgo.PSBT_PROPRIETARY_IDENTIFIER,
      subtype: utxolib.bitgo.ProprietaryKeySubtype.BIP322_MESSAGE,
    });

    assert.ok(proprietaryKeyVals.length === 1);
    assert.ok(proprietaryKeyVals[0].value.equals(Buffer.from('Hello World')));
    assert.ok(proprietaryKeyVals[0].key.keydata.length === 0); // keydata should be empty
    assert.ok(proprietaryKeyVals[0].key.identifier === utxolib.bitgo.PSBT_PROPRIETARY_IDENTIFIER);
    assert.ok(proprietaryKeyVals[0].key.subtype === utxolib.bitgo.ProprietaryKeySubtype.BIP322_MESSAGE);
  });

  it('should return the input index of a BIP322 proof message', function () {
    const psbt = utxolib.bitgo.createPsbtFromBuffer(
      BIP322_FIXTURE_HELLO_WORLD_TOSIGN_PSBT.toBuffer(),
      utxolib.networks.bitcoin
    );

    const messageBuffer = getBip322ProofMessageAtIndex(psbt, 0);
    assert.ok(messageBuffer, 'Message buffer should not be undefined');
    assert.deepStrictEqual(messageBuffer.toString('utf-8'), 'Hello World', 'Message does not match expected value');
  });
});
