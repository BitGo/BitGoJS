/**
 * @prettier
 */
import * as assert from 'assert';
import { Network } from '../src/networkTypes';
import { createTransactionBuilderFromTransaction, createTransactionFromBuffer } from '../src/bitgo';

export function parseTransactionRoundTrip(
  buf: Buffer,
  network: Network,
  inputs?: [txid: string, index: number, value: number][]
) {
  const tx = createTransactionFromBuffer(buf, network);
  assert.strictEqual(tx.byteLength(), buf.length);
  assert.strictEqual(tx.toBuffer().toString('hex'), buf.toString('hex'));

  // Test `Transaction.clone()` implementation
  assert.strictEqual(tx.clone().toBuffer().toString('hex'), buf.toString('hex'));

  // Test `TransactionBuilder.fromTransaction()` implementation
  if (inputs) {
    inputs.forEach(([txid, index, value], i) => {
      tx.ins[i].value = value;
    });
    assert.strictEqual(
      createTransactionBuilderFromTransaction(tx).build().toBuffer().toString('hex'),
      buf.toString('hex')
    );
  }

  return tx;
}
