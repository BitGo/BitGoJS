import assert from 'assert';

import { coins } from '@bitgo/statics';

import { StxLib } from '../../../src';
import * as testData from '../resources';

describe('Stx TransactionBuilder validators', function () {
  const factory = new StxLib.TransactionBuilderFactory(coins.get('tstx'));
  const validAddress = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
  const pubKey = '02f6d0597fb6d5467203d080e17f7b4f767ead59fc303b7d7261a832cb44305bb0';

  it('rejects an empty raw transaction', function () {
    assert.throws(() => factory.getTransferBuilder().from(''), /Raw transaction is empty/);
  });

  it('wraps a malformed raw transaction in a parse error', function () {
    assert.throws(
      () => factory.getTransferBuilder().from('deadbeef'),
      /There was an error parsing the raw transaction/
    );
  });

  it('rejects an invalid public key', function () {
    assert.throws(() => factory.getTransferBuilder().fromPubKey('not-a-public-key'), /Invalid public key/);
  });

  it('rejects an invalid recipient address', function () {
    assert.throws(() => factory.getTransferBuilder().to('not-an-address'), /Invalid address/);
  });

  it('rejects an invalid address on validateAddress', function () {
    assert.throws(() => factory.getTransferBuilder().validateAddress({ address: 'not-an-address' }), /Invalid address/);
  });

  it('rejects negative fee and signature values', function () {
    assert.throws(() => factory.getTransferBuilder().fee({ fee: '-1' }), /Value cannot be less than zero/);
    assert.throws(() => factory.getTransferBuilder().numberSignatures(-1), /Value cannot be less than zero/);
  });

  it('rejects an invalid key pair on validateKey', function () {
    assert.throws(() => factory.getTransferBuilder().validateKey({ key: 'invalid' }), /Unsupported private key/);
  });

  it('rejects building a transaction without a fee', async function () {
    const builder = factory.getTransferBuilder();
    builder.to(validAddress);
    builder.amount('100');
    builder.fromPubKey(pubKey);
    builder.numberSignatures(1);
    builder.nonce(1);
    await assert.rejects(builder.build(), /Invalid transaction: missing fee/);
  });

  it('rejects building a transaction without a nonce', async function () {
    const builder = factory.getTransferBuilder();
    builder.fee({ fee: '180' });
    builder.to(validAddress);
    builder.amount('100');
    builder.fromPubKey(pubKey);
    builder.numberSignatures(1);
    await assert.rejects(builder.build(), /Invalid transaction: missing nonce/);
  });

  it('rejects signing twice with the same key', function () {
    const builder = factory.getTransferBuilder();
    builder.fee({ fee: '180' });
    builder.to(validAddress);
    builder.amount('100');
    builder.nonce(1);
    builder.numberSignatures(1);
    builder.sign({ key: testData.secretKey1 });
    assert.throws(() => builder.sign({ key: testData.secretKey1 }), /Repeated sign/);
  });

  it('rejects a transfer init with a missing or non-transfer payload', function () {
    const builder = factory.getTransferBuilder();
    assert.throws(
      () => builder.initBuilder({ toJson: () => ({ payload: undefined }) } as never),
      /payload must not be undefined/
    );
    assert.throws(
      () => builder.initBuilder({ toJson: () => ({ payload: { payloadType: 2 } }) } as never),
      /Transaction should be transfer/
    );
  });

  it('rejects a transaction without a spending condition', function () {
    const builder = factory.getTransferBuilder();
    const fakeTx = {
      toJson: () => ({ payload: { payloadType: 0, to: validAddress, amount: '100' } }),
      stxTransaction: { auth: {} },
    };
    assert.throws(() => builder.initBuilder(fakeTx as never), /spending condition cannot be undefined/);
  });

  it('rejects building a transfer without a public key', async function () {
    const builder = factory.getTransferBuilder();
    builder.fee({ fee: '180' });
    builder.nonce(1);
    builder.to(validAddress);
    builder.amount('100');
    await assert.rejects(builder.build(), /supply at least 1 public key/);
  });
});
