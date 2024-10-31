import * as assert from 'assert';
import * as utxolib from '@bitgo/utxo-lib';
import { Descriptor } from '@bitgo/wasm-miniscript';

import { createMultiSigDescriptor } from '../../src/descriptor';
import { finalizePsbt, getFixture, updateInputWithDescriptor } from './utils';

describe('descriptor', function () {
  const baseFixturePath = 'test/fixtures/descriptor/';
  const rootWalletKeys = utxolib.testutil.getDefaultWalletKeys();
  const key1 = rootWalletKeys.triple[0];
  const key2 = rootWalletKeys.triple[1];
  const key3 = rootWalletKeys.triple[2];
  const validLocktime = 2048;

  it('should fail if m is longer than the number of keys or not at least 1', function () {
    assert.throws(() => {
      createMultiSigDescriptor('sh', validLocktime, 3, [key1, key2], false);
    });

    assert.throws(() => {
      createMultiSigDescriptor('sh', validLocktime, 0, [key1, key2], false);
    });
  });

  it('should fail if locktime is invalid', function () {
    assert.throws(() => {
      createMultiSigDescriptor('sh', 0, 2, [key1, key2], false);
    });
  });

  async function runTestForParams(scriptType: 'sh' | 'sh-wsh', m: number, keys: utxolib.BIP32Interface[]) {
    const fixturePath = baseFixturePath + `${scriptType}-${m}of${keys.length}`;
    describe(`should create a ${m} of ${keys.length} multi-sig ${scriptType} descriptor`, function () {
      it('has expected descriptor string', async function () {
        const descriptorString = createMultiSigDescriptor(scriptType, validLocktime, m, keys, false);
        assert.strictEqual(
          descriptorString,
          await getFixture(fixturePath + `-string.txt`, descriptorString),
          descriptorString
        );
      });

      it('has expected AST', async function () {
        const descriptor = Descriptor.fromString(
          createMultiSigDescriptor(scriptType, validLocktime, m, keys, false),
          'derivable'
        );

        assert.deepStrictEqual(descriptor.node(), await getFixture(fixturePath + '-ast.json', descriptor.node()));
      });

      it('has expected asm', async function () {
        const descriptor = Descriptor.fromString(
          createMultiSigDescriptor(scriptType, validLocktime, m, keys, false),
          'derivable'
        );
        const asmString = descriptor.atDerivationIndex(0).toAsmString();
        assert.strictEqual(asmString, await getFixture(fixturePath + '-asm.txt', asmString), asmString);
      });

      it('can be signed', async function () {
        // Derive the script from the descriptor
        const descriptor = Descriptor.fromString(
          createMultiSigDescriptor(scriptType, validLocktime, m, keys, false),
          'derivable'
        );
        const descriptorAt0 = descriptor.atDerivationIndex(0);
        const script = Buffer.from(descriptorAt0.scriptPubkey());

        // Make the prevTx
        const prevPsbt = utxolib.testutil.constructPsbt(
          [{ scriptType: 'p2wsh', value: BigInt(1.1e8) }],
          [{ script: script.toString('hex'), value: BigInt(1e8) }],
          utxolib.networks.bitcoin,
          rootWalletKeys,
          'fullsigned'
        );
        const prevTx = prevPsbt.finalizeAllInputs().extractTransaction();

        // Create the PSBT and sign
        const psbt = Object.assign(new utxolib.Psbt({ network: utxolib.networks.bitcoin }), {
          locktime: validLocktime,
        });
        psbt.addInput({
          hash: prevTx.getId(),
          index: 0,
          sequence: 0xfffffffe,
        });
        if (scriptType === 'sh-wsh') {
          psbt.updateInput(0, { witnessUtxo: { script, value: BigInt(1e8) } });
        } else {
          psbt.updateInput(0, { nonWitnessUtxo: prevTx.toBuffer() });
        }
        psbt.addOutput({ script, value: BigInt(0.9e8) });
        updateInputWithDescriptor(psbt, 0, descriptorAt0);
        keys.forEach((signer, i) => {
          if (i >= m) {
            return;
          }
          psbt.signAllInputsHD(signer);
        });

        // Get the fully signed transaction and check
        const signedTx = finalizePsbt(psbt).extractTransaction().toBuffer();
        assert.strictEqual(
          signedTx.toString('hex'),
          await getFixture(fixturePath + '-tx.txt', signedTx.toString('hex'))
        );
      });
    });
  }

  runTestForParams('sh', 2, [key1, key2]);
  runTestForParams('sh-wsh', 2, [key1, key2]);
  runTestForParams('sh', 3, [key1, key2, key3]);
});
