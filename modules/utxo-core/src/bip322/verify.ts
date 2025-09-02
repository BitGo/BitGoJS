import assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';

import { buildToSpendTransaction } from './toSpend';

export type VerificationInfo = {
  message: string;
  address: string;
};

/**
 *
 * @param toSignTx
 * @param verificationInfo
 * @param network
 */
export function verifyFixedScriptToSignTxWithInfo(
  toSignTx: utxolib.Transaction<bigint>,
  verificationInfo: VerificationInfo[],
  network: utxolib.Network
): void {
  assert.deepStrictEqual(
    toSignTx.ins.length,
    verificationInfo.length,
    'to_sign transaction must have one input per message'
  );

  // Verify the transaction structure
  assert.deepStrictEqual(toSignTx.version, 0, 'to_sign transaction version must be 0');
  assert.deepStrictEqual(toSignTx.locktime, 0, 'to_sign transaction locktime must be 0');
  assert.deepStrictEqual(toSignTx.outs.length, 1, 'to_sign transaction must have one output');
  assert.deepStrictEqual(toSignTx.outs[0].value, BigInt(0), 'to_sign transaction output value must be 0');
  assert.deepStrictEqual(
    toSignTx.outs[0].script.toString('hex'),
    '6a',
    'to_sign transaction output script must be OP_RETURN'
  );

  // Verify the messages against the transaction inputs
  toSignTx.ins.forEach((input, inputIndex) => {
    // Check that the expected to_spend transaction matches
    const scriptPubKey = utxolib.address.toOutputScript(verificationInfo[inputIndex].address, network);
    const toSpendTx = buildToSpendTransaction(scriptPubKey, verificationInfo[inputIndex].message);
    assert.deepStrictEqual(
      utxolib.bitgo.getOutputIdForInput(toSignTx.ins[inputIndex]).txid,
      toSpendTx.getId(),
      'to_sign transaction input must reference the to_spend transaction'
    );
    assert.deepStrictEqual(input.index, 0, `to_sign transaction input ${inputIndex} index must be 0`);
    assert.deepStrictEqual(input.sequence, 0, `to_sign transaction input ${inputIndex} sequence must be 0`);
  });
}
