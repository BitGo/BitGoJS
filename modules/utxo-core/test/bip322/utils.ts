import assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';

import { addBip322ProofMessage, getBip322ProofInputIndex, psbtIsBip322Proof } from '../../src/bip322';

import { BIP322_FIXTURE_HELLOW_WORLD_TOSIGN_PSBT } from './bip322.utils';

describe('BIP322 Proof utils', function () {
  it('should add a BIP322 proof message to a PSBT input', function () {
    const psbt = utxolib.bitgo.createPsbtFromBuffer(
      BIP322_FIXTURE_HELLOW_WORLD_TOSIGN_PSBT.toBuffer(),
      utxolib.networks.bitcoin
    );
    const inputIndex = 0;
    const message = Buffer.from('Hello World');
    addBip322ProofMessage(psbt, inputIndex, message);

    const proprietaryKeyVals = utxolib.bitgo.getPsbtInputProprietaryKeyVals(psbt.data.inputs[inputIndex], {
      identifier: utxolib.bitgo.PSBT_PROPRIETARY_IDENTIFIER,
      subtype: utxolib.bitgo.ProprietaryKeySubtype.BIP322_MESSAGE,
    });

    assert.ok(proprietaryKeyVals.length === 1);
    assert.ok(proprietaryKeyVals[0].value.equals(message));
    assert.ok(proprietaryKeyVals[0].key.keydata.length === 0); // keydata should be empty
    assert.ok(proprietaryKeyVals[0].key.identifier === utxolib.bitgo.PSBT_PROPRIETARY_IDENTIFIER);
    assert.ok(proprietaryKeyVals[0].key.subtype === utxolib.bitgo.ProprietaryKeySubtype.BIP322_MESSAGE);
  });

  it('should return the input index of a BIP322 proof message', function () {
    const psbt = utxolib.bitgo.createPsbtFromBuffer(
      BIP322_FIXTURE_HELLOW_WORLD_TOSIGN_PSBT.toBuffer(),
      utxolib.networks.bitcoin
    );
    assert.ok(!psbtIsBip322Proof(psbt)); // initially should not be a BIP322 proof

    const inputIndex = 0;
    const message = Buffer.from('Hello World');
    addBip322ProofMessage(psbt, inputIndex, message);

    const resultIndex = getBip322ProofInputIndex(psbt);
    assert.strictEqual(resultIndex, inputIndex);
    assert.ok(psbtIsBip322Proof(psbt));
  });
});
