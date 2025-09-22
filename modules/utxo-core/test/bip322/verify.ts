import * as assert from 'assert';

import * as utxolib from '@bitgo-beta/utxo-lib';

import * as bip322 from '../../src/bip322';

import * as testutils from './bip322.utils';

const opReturnOutput = { value: 0n, script: Buffer.from('6a', 'hex') };

describe('Verify BIP322 proofs', function () {
  describe('assertBaseTx', function () {
    it('should pass for a valid bip322 transaction', function () {
      assert.doesNotThrow(() => bip322.assertBaseTx(testutils.BIP322_FIXTURE_HELLO_WORLD_TOSIGN_PSBT.getUnsignedTx()));
    });

    it('should reject if the outputs are not conformed correctly', function () {
      let psbt = utxolib.bitgo.createPsbtForNetwork({
        network: utxolib.networks.bitcoin,
      });
      psbt.addOutput(opReturnOutput);
      psbt.addOutput({ value: 1n, script: Buffer.from('6a', 'hex') });
      psbt.setVersion(0);
      psbt.setLocktime(0);
      assert.throws(() => bip322.assertBaseTx(psbt.getUnsignedTx()), /Transaction must have exactly 1 output./);

      psbt = utxolib.bitgo.createPsbtForNetwork({
        network: utxolib.networks.bitcoin,
      });
      psbt.setVersion(0);
      psbt.setLocktime(0);
      psbt.addOutput({ value: 1n, script: Buffer.from('6a', 'hex') });
      assert.throws(() => bip322.assertBaseTx(psbt.getUnsignedTx()), /Transaction output value must be 0./);

      psbt = utxolib.bitgo.createPsbtForNetwork({
        network: utxolib.networks.bitcoin,
      });
      psbt.setVersion(0);
      psbt.setLocktime(0);
      psbt.addOutput({
        value: 0n,
        script: utxolib.bitgo.outputScripts.createOutputScript2of3(
          utxolib.testutil.getDefaultWalletKeys().deriveForChainAndIndex(0, 0).publicKeys,
          'p2wsh',
          utxolib.networks.bitcoin
        ).scriptPubKey,
      });
      assert.throws(() => bip322.assertBaseTx(psbt.getUnsignedTx()), /Transaction output script must be OP_RETURN./);
    });

    it('should reject if version is not 0', function () {
      const psbt = utxolib.bitgo.createPsbtForNetwork({
        network: utxolib.networks.bitcoin,
      });
      psbt.addOutput({ value: 1n, script: Buffer.from('6a', 'hex') });
      psbt.setVersion(1);
      assert.throws(() => bip322.assertBaseTx(psbt.getUnsignedTx()), /Transaction version must be 0./);
    });

    it('should reject if locktime is not 0', function () {
      const psbt = utxolib.bitgo.createPsbtForNetwork({
        network: utxolib.networks.bitcoin,
      });
      psbt.setVersion(0);
      psbt.addOutput({ value: 1n, script: Buffer.from('6a', 'hex') });
      psbt.setLocktime(1);
      assert.throws(() => bip322.assertBaseTx(psbt.getUnsignedTx()), /Transaction locktime must be 0./);
    });
  });

  describe('assertTxInput', function () {
    it('should fail if input index is out of range', function () {
      const tx = utxolib.bitgo.createPsbtForNetwork({ network: utxolib.networks.bitcoin }).getUnsignedTx();
      assert.throws(
        () => bip322.assertTxInput(tx, 1, [], { address: '', message: '', pubkeys: [], scriptType: 'p2wsh' }, false),
        /inputIndex 1 is out of range for tx with 0 inputs./
      );
    });

    it('should fail if txInput index is not 0', function () {
      const psbt = utxolib.bitgo.createPsbtForNetwork({
        network: utxolib.networks.bitcoin,
      });
      psbt.setVersion(0);
      psbt.setLocktime(0);
      psbt.addOutput(opReturnOutput);
      psbt.addInput({
        index: 1,
        hash: Buffer.alloc(32),
      });
      assert.throws(
        () =>
          bip322.assertTxInput(
            psbt.getUnsignedTx(),
            0,
            [],
            { address: '', message: '', pubkeys: [], scriptType: 'p2wsh' },
            false
          ),
        /transaction input 0 must have index=0./
      );
    });

    it('should fail if txInput sequence is not 0', function () {
      const psbt = utxolib.bitgo.createPsbtForNetwork({
        network: utxolib.networks.bitcoin,
      });
      psbt.setVersion(0);
      psbt.setLocktime(0);
      psbt.addOutput(opReturnOutput);
      psbt.addInput({
        index: 0,
        hash: Buffer.alloc(32),
        sequence: 1,
      });
      assert.throws(
        () =>
          bip322.assertTxInput(
            psbt.getUnsignedTx(),
            0,
            [],
            { address: '', message: '', pubkeys: [], scriptType: 'p2wsh' },
            false
          ),
        /transaction input 0 sequence must be 0./
      );
    });

    it('should fail if the scriptPubKey created by the public keys does not match the address provided in the messageInfo', function () {
      const rootWalletKeys = utxolib.testutil.getDefaultWalletKeys();
      const psbt = bip322.createBaseToSignPsbt(rootWalletKeys);
      const message = 'to be or not to be';
      bip322.addBip322InputWithChainAndIndex(psbt, message, rootWalletKeys, {
        chain: 20,
        index: 0,
      });
      assert.ok(psbt.data.inputs[0]?.witnessUtxo?.script);
      const address = utxolib.address.fromOutputScript(
        psbt.data.inputs[0].witnessUtxo.script,
        utxolib.networks.bitcoin
      );
      const wrongPublicKeys = rootWalletKeys.deriveForChainAndIndex(20, 1).publicKeys.map((p) => p.toString('hex'));
      assert.throws(
        () =>
          bip322.assertTxInput(
            psbt.getUnsignedTx(),
            0,
            [],
            { address, message, pubkeys: wrongPublicKeys, scriptType: 'p2wsh' },
            false
          ),
        /Address does not match derived scriptPubKey for input 0./
      );
    });

    it('should fail if the txid of the input does not match the derived to_spend transaction', function () {
      const rootWalletKeys = utxolib.testutil.getDefaultWalletKeys();
      const psbt = bip322.createBaseToSignPsbt(rootWalletKeys);
      const message = 'to be or not to be';

      const output = utxolib.bitgo.outputScripts.createOutputScript2of3(
        rootWalletKeys.deriveForChainAndIndex(20, 0).publicKeys,
        'p2wsh',
        psbt.network
      );
      bip322.addBip322Input(psbt, message, output);
      assert.ok(psbt.data.inputs[0]?.witnessUtxo?.script);
      const address = utxolib.address.fromOutputScript(output.scriptPubKey, utxolib.networks.bitcoin);
      const pubkeys = rootWalletKeys.deriveForChainAndIndex(20, 0).publicKeys.map((p) => p.toString('hex'));
      assert.throws(() =>
        bip322.assertTxInput(
          psbt.getUnsignedTx(),
          0,
          [],
          {
            address,
            message: 'that is the question',
            pubkeys,
            scriptType: 'p2wsh',
          },
          false
        )
      );
    });

    describe('checkSignature=true', function () {
      it('should fail if the scriptType is not a 2of3 script', function () {
        const rootWalletKeys = utxolib.testutil.getDefaultWalletKeys();
        const psbt = bip322.createBaseToSignPsbt(rootWalletKeys);
        const message = 'to be or not to be';
        const derivedWalletKeys = rootWalletKeys.deriveForChainAndIndex(20, 0).publicKeys;

        const output = utxolib.payments.p2pkh({
          pubkey: rootWalletKeys.publicKeys[0],
          network: psbt.network,
        }).output;
        assert.ok(output);
        bip322.addBip322Input(psbt, message, {
          scriptPubKey: Buffer.from(output),
        });
        psbt.signAllInputs(rootWalletKeys.user);
        assert.throws(() =>
          bip322.assertTxInput(
            psbt.getUnsignedTx(),
            0,
            [],
            {
              // Make the messageInfo self consistent, but not match the non-2of3 address in the PSBT
              address: utxolib.address.fromOutputScript(
                utxolib.bitgo.outputScripts.createOutputScript2of3(derivedWalletKeys, 'p2wsh', psbt.network)
                  .scriptPubKey,
                psbt.network
              ),
              message,
              pubkeys: derivedWalletKeys.map((k) => k.toString('hex')),
              scriptType: 'p2wsh',
            },
            false
          )
        );
      });

      utxolib.bitgo.outputScripts.scriptTypes2Of3.forEach((scriptType) => {
        describe(scriptType + ' address', function () {
          it('should pass with a full signed tx', function () {
            const rootWalletKeys = utxolib.testutil.getDefaultWalletKeys();
            const psbt = bip322.createBaseToSignPsbt(rootWalletKeys);
            const message = 'to be or not to be';
            const chainCode = utxolib.bitgo.getExternalChainCode(scriptType);
            const derivedWalletKeys = rootWalletKeys.deriveForChainAndIndex(chainCode, 0).publicKeys;
            const address = utxolib.address.fromOutputScript(
              utxolib.bitgo.outputScripts.createOutputScript2of3(derivedWalletKeys, scriptType, psbt.network)
                .scriptPubKey,
              psbt.network
            );

            bip322.addBip322InputWithChainAndIndex(psbt, message, rootWalletKeys, { chain: chainCode, index: 0 });
            if (scriptType === 'p2trMusig2') {
              psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
              psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo);
            }
            psbt.signAllInputsHD(rootWalletKeys.user);
            psbt.signAllInputsHD(rootWalletKeys.bitgo);

            psbt.validateSignaturesOfAllInputs();
            psbt.finalizeAllInputs();
            const tx = psbt.extractTransaction();

            assert.doesNotThrow(() =>
              bip322.assertTxInput(
                tx,
                0,
                [
                  {
                    value: 0n,
                    script: utxolib.address.toOutputScript(address, psbt.network),
                  },
                ],
                {
                  // Make the messageInfo self consistent, but not match the non-2of3 address in the PSBT
                  address,
                  message,
                  pubkeys: derivedWalletKeys.map((k) => k.toString('hex')),
                  scriptType,
                },
                true
              )
            );
          });
        });
      });
    });

    describe('checkSignature=false', function () {
      it('should not throw if the input is not signed', function () {
        const rootWalletKeys = utxolib.testutil.getDefaultWalletKeys();
        const psbt = bip322.createBaseToSignPsbt(rootWalletKeys);
        const message = 'to be or not to be';

        const output = utxolib.bitgo.outputScripts.createOutputScript2of3(
          rootWalletKeys.deriveForChainAndIndex(20, 0).publicKeys,
          'p2wsh',
          psbt.network
        );
        bip322.addBip322Input(psbt, message, output);
        const address = utxolib.address.fromOutputScript(output.scriptPubKey, utxolib.networks.bitcoin);
        assert.doesNotThrow(() =>
          bip322.assertTxInput(
            psbt.getUnsignedTx(),
            0,
            [],
            {
              address,
              message,
              pubkeys: rootWalletKeys.deriveForChainAndIndex(20, 0).publicKeys.map((p) => p.toString('hex')),
              scriptType: 'p2wsh',
            },
            false
          )
        );
      });
    });
  });

  describe('assertBip322TxProof', function () {
    const messageInfo: bip322.MessageInfo[] = [];
    let tx: utxolib.bitgo.UtxoTransaction<bigint>;
    before(function () {
      const rootWalletKeys = utxolib.testutil.getDefaultWalletKeys();
      const psbt = bip322.createBaseToSignPsbt(rootWalletKeys);
      utxolib.bitgo.outputScripts.scriptTypes2Of3.forEach((scriptType, index) => {
        const chain = utxolib.bitgo.getExternalChainCode(scriptType);
        const message = `message for ${scriptType}`;
        const derivedKeys = rootWalletKeys.deriveForChainAndIndex(chain, index).publicKeys;
        messageInfo.push({
          address: utxolib.address.fromOutputScript(
            utxolib.bitgo.outputScripts.createOutputScript2of3(derivedKeys, scriptType, psbt.network).scriptPubKey,
            psbt.network
          ),
          message,
          pubkeys: derivedKeys.map((p) => p.toString('hex')),
          scriptType,
        });

        bip322.addBip322InputWithChainAndIndex(psbt, message, rootWalletKeys, { chain, index });
      });

      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo);
      psbt.signAllInputsHD(rootWalletKeys.user);
      psbt.signAllInputsHD(rootWalletKeys.bitgo);
      assert.ok(psbt.validateSignaturesOfAllInputs(), `All signatures on the inputs should be valid`);
      psbt.finalizeAllInputs();
      tx = psbt.extractTransaction();
    });
    it('should pass if the messageInfo matches the transaction', function () {
      assert.doesNotThrow(() => bip322.assertBip322TxProof(tx, messageInfo));
    });

    it('should fail if the messageInfo does not match the transaction', function () {
      assert.throws(() =>
        bip322.assertBip322TxProof(
          tx,
          messageInfo.map((m) => ({ ...m, message: m.message + ' altered' }))
        )
      );
    });
  });

  describe('assertBip322PsbtProof', function () {
    const messageInfo: bip322.MessageInfo[] = [];
    const rootWalletKeys = utxolib.testutil.getDefaultWalletKeys();
    const psbt = bip322.createBaseToSignPsbt(rootWalletKeys);
    before(function () {
      utxolib.bitgo.outputScripts.scriptTypes2Of3.forEach((scriptType, index) => {
        const chain = utxolib.bitgo.getExternalChainCode(scriptType);
        const message = `message for ${scriptType}`;
        const derivedKeys = rootWalletKeys.deriveForChainAndIndex(chain, index).publicKeys;
        messageInfo.push({
          address: utxolib.address.fromOutputScript(
            utxolib.bitgo.outputScripts.createOutputScript2of3(derivedKeys, scriptType, psbt.network).scriptPubKey,
            psbt.network
          ),
          message,
          pubkeys: derivedKeys.map((p) => p.toString('hex')),
          scriptType,
        });

        bip322.addBip322InputWithChainAndIndex(psbt, message, rootWalletKeys, { chain, index });
      });

      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo);
      psbt.signAllInputsHD(rootWalletKeys.user);
      psbt.signAllInputsHD(rootWalletKeys.bitgo);
      assert.ok(psbt.validateSignaturesOfAllInputs(), `All signatures on the inputs should be valid`);
    });

    it('should work when the message info matches what is in the PSBT', function () {
      assert.doesNotThrow(() => bip322.assertBip322PsbtProof(psbt, messageInfo));
    });

    it('should fail when the message info does not match what is in the PSBT', function () {
      assert.throws(() =>
        bip322.assertBip322PsbtProof(
          psbt,
          messageInfo.map((m) => ({ ...m, message: m.message + ' altered' }))
        )
      );
    });
  });
});
