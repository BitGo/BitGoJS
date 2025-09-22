import * as assert from 'assert';

import * as utxolib from '@bitgo-beta/utxo-lib';

import { buildToSpendTransaction } from './toSpend';

export type MessageInfo = {
  address: string;
  message: string;
  // Hex encoded pubkeys
  pubkeys: string[];
  scriptType: utxolib.bitgo.outputScripts.ScriptType2Of3;
};

export function assertBaseTx(tx: utxolib.bitgo.UtxoTransaction<bigint>): void {
  assert.deepStrictEqual(tx.version, 0, 'Transaction version must be 0.');
  assert.deepStrictEqual(tx.locktime, 0, 'Transaction locktime must be 0.');
  assert.deepStrictEqual(tx.outs.length, 1, 'Transaction must have exactly 1 output.');
  assert.deepStrictEqual(tx.outs[0].value, BigInt(0), 'Transaction output value must be 0.');
  assert.deepStrictEqual(tx.outs[0].script.toString('hex'), '6a', 'Transaction output script must be OP_RETURN.');
}

export function assertTxInput(
  tx: utxolib.bitgo.UtxoTransaction<bigint>,
  inputIndex: number,
  prevOuts: utxolib.TxOutput<bigint>[],
  info: MessageInfo,
  checkSignature: boolean
): void {
  assert.ok(
    inputIndex < tx.ins.length,
    `inputIndex ${inputIndex} is out of range for tx with ${tx.ins.length} inputs.`
  );
  const input = tx.ins[inputIndex];
  assert.deepStrictEqual(input.index, 0, `transaction input ${inputIndex} must have index=0.`);
  assert.deepStrictEqual(input.sequence, 0, `transaction input ${inputIndex} sequence must be 0.`);

  // Make sure that the message is correctly encoded into the input of the transaction and
  // verify that the message info corresponds
  const scriptPubKey = utxolib.bitgo.outputScripts.createOutputScript2of3(
    info.pubkeys.map((pubkey) => Buffer.from(pubkey, 'hex')),
    info.scriptType,
    tx.network
  ).scriptPubKey;
  assert.deepStrictEqual(
    info.address,
    utxolib.address.fromOutputScript(scriptPubKey, tx.network).toString(),
    `Address does not match derived scriptPubKey for input ${inputIndex}.`
  );

  const txid = utxolib.bitgo.getOutputIdForInput(input).txid;
  const toSpendTx = buildToSpendTransaction(scriptPubKey, info.message);
  assert.deepStrictEqual(
    txid,
    toSpendTx.getId(),
    `Input ${inputIndex} derived to_spend transaction is not encoded in the input.`
  );

  if (checkSignature) {
    const signatureScript = utxolib.bitgo.parseSignatureScript2Of3(input);
    const scriptType =
      signatureScript.scriptType === 'taprootKeyPathSpend'
        ? 'p2trMusig2'
        : signatureScript.scriptType === 'taprootScriptPathSpend'
        ? 'p2tr'
        : signatureScript.scriptType;
    assert.deepStrictEqual(scriptType, info.scriptType, 'Script type does not match.');
    utxolib.bitgo.verifySignatureWithPublicKeys(
      tx,
      inputIndex,
      prevOuts,
      info.pubkeys.map((pubkey) => Buffer.from(pubkey, 'hex'))
    );
  }
}

export function assertBip322TxProof(tx: utxolib.bitgo.UtxoTransaction<bigint>, messageInfo: MessageInfo[]): void {
  assertBaseTx(tx);
  assert.deepStrictEqual(
    tx.ins.length,
    messageInfo.length,
    'Transaction must have the same number of inputs as messageInfo entries.'
  );
  const prevOuts = messageInfo.map((info) => {
    return {
      value: 0n,
      script: utxolib.bitgo.outputScripts.createOutputScript2of3(
        info.pubkeys.map((pubkey) => Buffer.from(pubkey, 'hex')),
        info.scriptType,
        tx.network
      ).scriptPubKey,
    };
  });
  tx.ins.forEach((input, inputIndex) => assertTxInput(tx, inputIndex, prevOuts, messageInfo[inputIndex], true));
}

export function assertBip322PsbtProof(psbt: utxolib.bitgo.UtxoPsbt, messageInfo: MessageInfo[]): void {
  const unsignedTx = psbt.getUnsignedTx();

  assertBaseTx(unsignedTx);
  assert.deepStrictEqual(
    psbt.data.inputs.length,
    messageInfo.length,
    'PSBT must have the same number of inputs as messageInfo entries.'
  );

  const prevOuts = psbt.data.inputs.map((input, inputIndex) => {
    assert.ok(input.witnessUtxo, `PSBT input ${inputIndex} is missing witnessUtxo`);
    return input.witnessUtxo;
  });

  psbt.data.inputs.forEach((input, inputIndex) => {
    // Check that the metadata in the PSBT matches the messageInfo, then check the input data
    const info = messageInfo[inputIndex];

    // Check that the to_spend transaction is encoded in the nonWitnessUtxo
    assert.ok(input.nonWitnessUtxo, `PSBT input ${inputIndex} is missing nonWitnessUtxo`);
    const toSpendTx = buildToSpendTransaction(prevOuts[inputIndex].script, info.message);
    assert.deepStrictEqual(input.nonWitnessUtxo.toString('hex'), toSpendTx.toHex());

    if (input.bip32Derivation) {
      input.bip32Derivation.forEach((b) => {
        const pubkey = b.pubkey.toString('hex');
        assert.ok(
          info.pubkeys.includes(pubkey),
          `PSBT input ${inputIndex} has a pubkey in (tap)bip32Derivation that is not in messageInfo`
        );
      });
    } else if (!input.tapBip32Derivation) {
      throw new Error(`PSBT input ${inputIndex} is missing (tap)bip32Derivation when it should have it.`);
    }

    // Verify the signature on the input
    assert.ok(psbt.validateSignaturesOfInputCommon(inputIndex), `PSBT input ${inputIndex} has an invalid signature.`);

    // Do not check the signature when using the PSBT, the signature is not there. We are going
    // to signatures in the PSBT.
    assertTxInput(unsignedTx, inputIndex, prevOuts, info, false);
  });
}
