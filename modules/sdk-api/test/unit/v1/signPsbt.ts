import * as assert from 'assert';
import * as utxolib from '@bitgo/utxo-lib';
import { signPsbtRequest } from '../../../src/v1/signPsbt';

describe('signPsbt', function () {
  const keys = utxolib.testutil.getDefaultWalletKeys();
  const network = utxolib.networks.bitcoin;

  function constructUnsignedPsbt(
    inputs: { scriptType: 'p2sh' | 'p2shP2wsh' | 'p2wsh'; value: bigint }[],
    params?: { skipNonWitnessUtxo?: boolean }
  ): utxolib.bitgo.UtxoPsbt {
    const total = inputs.reduce((sum, input) => sum + input.value, BigInt(0));
    return utxolib.testutil.constructPsbt(
      inputs,
      [{ scriptType: 'p2sh', value: total - BigInt(1000) }],
      network,
      keys,
      'unsigned',
      params
    );
  }

  function sign(psbt: utxolib.bitgo.UtxoPsbt): utxolib.bitgo.UtxoPsbt {
    const result = signPsbtRequest({ psbt: psbt.toHex(), keychain: { xprv: keys.triple[0].toBase58() } });
    return utxolib.bitgo.createPsbtFromBuffer(Buffer.from(result.psbt, 'hex'), network);
  }

  it('signs psbt', function () {
    const halfSignedPsbt = sign(constructUnsignedPsbt([{ scriptType: 'p2sh', value: BigInt(1e8) }]));
    assert.ok(halfSignedPsbt.validateSignaturesOfInputHD(0, keys.triple[0]));
  });

  it('signs segwit inputs that only carry witnessUtxo', function () {
    const psbt = constructUnsignedPsbt(
      [
        { scriptType: 'p2shP2wsh', value: BigInt(1e8) },
        { scriptType: 'p2wsh', value: BigInt(1e8) },
      ],
      { skipNonWitnessUtxo: true }
    );
    assert.strictEqual(psbt.data.inputs[0].nonWitnessUtxo, undefined);
    const halfSignedPsbt = sign(psbt);
    assert.ok(halfSignedPsbt.validateSignaturesOfInputHD(0, keys.triple[0]));
    assert.ok(halfSignedPsbt.validateSignaturesOfInputHD(1, keys.triple[0]));
  });

  it('refuses a p2sh input without nonWitnessUtxo', function () {
    const psbt = constructUnsignedPsbt([{ scriptType: 'p2sh', value: BigInt(1e8) }], { skipNonWitnessUtxo: true });
    assert.ok(psbt.data.inputs[0].witnessUtxo);
    assert.strictEqual(psbt.data.inputs[0].nonWitnessUtxo, undefined);
    assert.throws(() => sign(psbt), /input 0 is a non-segwit input without nonWitnessUtxo/);
  });

  it('refuses the whole psbt if one p2sh input has no nonWitnessUtxo', function () {
    const full = constructUnsignedPsbt([
      { scriptType: 'p2wsh', value: BigInt(1e8) },
      { scriptType: 'p2sh', value: BigInt(1e8) },
    ]);
    const lite = utxolib.bitgo.clonePsbtWithoutNonWitnessUtxo(full);
    assert.strictEqual(lite.data.inputs[1].nonWitnessUtxo, undefined);
    assert.throws(() => sign(lite), /input 1 is a non-segwit input without nonWitnessUtxo/);
  });

  it('refuses a p2sh input whose nonWitnessUtxo is not the transaction it spends', function () {
    const psbt = constructUnsignedPsbt([
      { scriptType: 'p2sh', value: BigInt(1e8) },
      { scriptType: 'p2sh', value: BigInt(2e8) },
    ]);
    // Swap in the previous transaction of the other input
    psbt.data.inputs[0].nonWitnessUtxo = psbt.data.inputs[1].nonWitnessUtxo;
    assert.throws(() => sign(psbt), /input 0 nonWitnessUtxo does not match the txid the input spends/);
  });
});
