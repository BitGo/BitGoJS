import { beforeEach, describe, it } from 'node:test';
import assert from 'assert';
import { rawPrvToExtendedKeys, TransactionType } from '@bitgo/sdk-core';
import {
  UnsignedBuildTransaction,
  FirstSigOnBuildTransaction,
  FirstPrivateKey,
  SecondSigOnBuildTransaction,
  SecondPrivateKey,
  UnsignedAccountPermissionUpdateContractTx,
  AccountPermissionUpdateContractPriv,
  InvalidIDTransaction,
  UnsignedBuildInvalidIDTransaction,
  UnsignedInvalidExpirationBuildTransaction,
  UnsignedInvalidContractBuildTransaction,
  UnsignedBuildEmptyIDTransaction,
  UnsignedInvalidTimeStampBuildTransaction,
} from '../resources';
import { getBuilder } from '../../src/lib/builder';

describe('Tron TransactionBuilder', function () {
  let txBuilder;

  beforeEach(() => {
    txBuilder = getBuilder('ttrx');
  });

  describe('Transaction builder from method', () => {
    describe('should succeed to parse', () => {
      it('a transfer contract for an unsigned tx', () => {
        const txJson = JSON.stringify(UnsignedBuildTransaction);
        txBuilder.from(txJson);
      });

      it('a transfer contract for a half-signed tx', () => {
        const txJson = JSON.stringify(FirstSigOnBuildTransaction);
        txBuilder.from(txJson);
      });

      it('a transfer contract for a fully signed tx', () => {
        const txJson = JSON.stringify(SecondSigOnBuildTransaction);
        txBuilder.from(txJson);
      });
    });
  });

  describe('Transaction builder sign method', () => {
    describe('should succeed to sign', () => {
      it('an unsigned transaction', () => {
        const txJson = JSON.stringify(UnsignedBuildTransaction);
        txBuilder.from(txJson);
        txBuilder.sign({ key: FirstPrivateKey });
      });

      it('a transaction signed with a different key', () => {
        const txJson = JSON.stringify(FirstSigOnBuildTransaction);
        txBuilder.from(txJson);
        txBuilder.sign({ key: SecondPrivateKey });
      });

      it('a signed transaction with an xprv', async () => {
        txBuilder.from(FirstSigOnBuildTransaction);
        const SecondPrivateKeyXprv = rawPrvToExtendedKeys(SecondPrivateKey);
        txBuilder.sign({ key: SecondPrivateKeyXprv.xprv });
        const tx = await txBuilder.build();

        assert.equal(
          tx.toJson().signature[0],
          'bd08e6cd876bb573dd00a32870b58b70ea8b7908f5131686502589941bfa4fdda76b8c81bbbcfc549be6d4988657cea122df7da46c72041def2683d6ecb04a7401'
        );
        assert.equal(
          tx.toJson().signature[1],
          'f3cabe2f4aed13e2342c78c7bf4626ea36cd6509a44418c24866814d3426703686be9ef21bd993324c520565beee820201f2a50a9ac971732410d3eb69cdb2a600'
        );

        assert.equal(tx.id, '80b8b9eaed51c8bba3b49f7f0e7cc5f21ac99a6f3e2893c663b544bf2c695b1d');
        assert.equal(tx.type, TransactionType.Send);
        assert.equal(tx.inputs.length, 1);
        assert.equal(tx.inputs[0].address, 'TTsGwnTLQ4eryFJpDvJSfuGQxPXRCjXvZz');
        assert.equal(tx.inputs[0].value, '1718');
        assert.equal(tx.outputs.length, 1);
        assert.equal(tx.outputs[0].address, 'TNYssiPgaf9XYz3urBUqr861Tfqxvko47B');
        assert.equal(tx.outputs[0].value, '1718');
        assert.equal(tx.validFrom, 1571811410819);
        assert.equal(tx.validTo, 1571811468000);
      });
    });

    describe('should fail to sign', () => {
      it('a transaction with the same key', () => {
        const txJson = JSON.stringify(FirstSigOnBuildTransaction);
        txBuilder.from(txJson);
        assert.throws(() => txBuilder.sign({ key: FirstPrivateKey }));
      });
    });
  });

  describe('Transaction builder', () => {
    it('should build an update account tx', async () => {
      const txJson = JSON.stringify(UnsignedAccountPermissionUpdateContractTx);
      txBuilder.from(txJson);
      txBuilder.sign({ key: AccountPermissionUpdateContractPriv });
      const tx = await txBuilder.build();
      const signedTxJson = tx.toJson();

      assert.equal(signedTxJson.txID, UnsignedAccountPermissionUpdateContractTx.txID);
      assert.equal(signedTxJson.raw_data_hex, UnsignedAccountPermissionUpdateContractTx.raw_data_hex);
      assert.equal(
        JSON.stringify(signedTxJson.raw_data),
        JSON.stringify(UnsignedAccountPermissionUpdateContractTx.raw_data)
      );
      assert.equal(signedTxJson.signature.length, 1);
      assert.equal(
        signedTxJson.signature[0],
        '2bc5030727d42ed642c2806a3c1a5a0393408b159541f2163df4ba692c5c1240e2dde5a2aae4ecad465414e60b5aeca8522d0a2b6606f88a326658809161334f00'
      );
    });

    it('should build an half signed tx', async () => {
      const txJson = JSON.stringify(UnsignedBuildTransaction);
      txBuilder.from(txJson);
      txBuilder.sign({ key: FirstPrivateKey });
      const tx = await txBuilder.build();

      assert.equal(tx.id, '80b8b9eaed51c8bba3b49f7f0e7cc5f21ac99a6f3e2893c663b544bf2c695b1d');
      assert.equal(tx.type, TransactionType.Send);
      assert.equal(tx.inputs.length, 1);
      assert.equal(tx.inputs[0].address, 'TTsGwnTLQ4eryFJpDvJSfuGQxPXRCjXvZz');
      assert.equal(tx.inputs[0].value, '1718');
      assert.equal(tx.outputs.length, 1);
      assert.equal(tx.outputs[0].address, 'TNYssiPgaf9XYz3urBUqr861Tfqxvko47B');
      assert.equal(tx.outputs[0].value, '1718');
    });

    it('should build the right JSON after is half signed tx', async () => {
      const txJson = JSON.stringify(UnsignedBuildTransaction);
      txBuilder.from(txJson);
      txBuilder.sign({ key: FirstPrivateKey });
      const tx = await txBuilder.build();
      const signedTxJson = tx.toJson();

      assert.equal(signedTxJson.txID, UnsignedBuildTransaction.txID);
      assert.equal(signedTxJson.raw_data_hex, UnsignedBuildTransaction.raw_data_hex);
      assert.equal(JSON.stringify(signedTxJson.raw_data), JSON.stringify(UnsignedBuildTransaction.raw_data));
      assert.equal(signedTxJson.signature.length, 1);
      assert.equal(
        signedTxJson.signature[0],
        'bd08e6cd876bb573dd00a32870b58b70ea8b7908f5131686502589941bfa4fdda76b8c81bbbcfc549be6d4988657cea122df7da46c72041def2683d6ecb04a7401'
      );
    });

    it('should not extend a half signed tx', () => {
      const txJson = JSON.stringify(UnsignedBuildTransaction);
      txBuilder.from(txJson);
      txBuilder.sign({ key: FirstPrivateKey });

      assert.throws(() => txBuilder.extendValidTo(10000));
    });

    it('should extend an unsigned tx', async () => {
      const extendMs = 10000;
      txBuilder.from(JSON.parse(JSON.stringify(UnsignedBuildTransaction)));
      txBuilder.extendValidTo(extendMs);
      const tx = await txBuilder.build();

      assert.notEqual(tx.id, UnsignedBuildTransaction.txID);
      assert.equal(tx.id, '764aa8a72c2c720a6556def77d6092f729b6e14209d8130f1692d5aff13f2503');
      const oldExpiration = UnsignedBuildTransaction.raw_data.expiration;
      assert.equal(tx.validTo, oldExpiration + extendMs);
      assert.equal(tx.type, TransactionType.Send);
      assert.equal(tx.inputs.length, 1);
      assert.equal(tx.inputs[0].address, 'TTsGwnTLQ4eryFJpDvJSfuGQxPXRCjXvZz');
      assert.equal(tx.inputs[0].value, '1718');
      assert.equal(tx.outputs.length, 1);
      assert.equal(tx.outputs[0].address, 'TNYssiPgaf9XYz3urBUqr861Tfqxvko47B');
      assert.equal(tx.outputs[0].value, '1718');
      assert.equal(tx.validFrom, 1571811410819);
    });

    it('should catch an invalid id', async () => {
      const txJson = JSON.stringify(InvalidIDTransaction);
      assert.throws(() => txBuilder.from(txJson));
    });

    it('should throw exception of wrong id', () => {
      const txJson = JSON.stringify(UnsignedBuildInvalidIDTransaction);
      assert.throws(() => txBuilder.from(txJson));
    });

    it('should throw exception of empty id', () => {
      const txJson = JSON.stringify(UnsignedBuildEmptyIDTransaction);
      assert.throws(() => txBuilder.from(txJson));
    });

    it('should throw exception of invalid time stamp', () => {
      const txJson = JSON.stringify(UnsignedInvalidTimeStampBuildTransaction);
      assert.throws(() => txBuilder.from(txJson));
    });

    it('should throw exception of invalid expiration time', () => {
      const txJson = JSON.stringify(UnsignedInvalidExpirationBuildTransaction);
      assert.throws(() => txBuilder.from(txJson));
    });

    it('should throw exception of non-existence of contract', () => {
      const txJson = JSON.stringify(UnsignedInvalidContractBuildTransaction);
      assert.throws(() => txBuilder.from(txJson));
    });

    it('should validate JSON transaction', () => {
      const txJson = UnsignedAccountPermissionUpdateContractTx;
      assert.doesNotThrow(() => txBuilder.from(txJson));
    });

    it('should validate stringified JSON transaction', () => {
      const txJsonString = JSON.stringify(UnsignedBuildTransaction);
      assert.doesNotThrow(() => txBuilder.from(txJsonString));
    });
  });

  describe('#validateKey', () => {
    it('should not throw an error when the key is valid', () => {
      const key = '2DBEAC1C22849F47514445A56AEF2EF164528A502DE4BD289E23EA1E2D4C4B06';
      assert.doesNotThrow(() => txBuilder.validateKey({ key }));
    });

    it('should throw an error when the key is invalid', () => {
      const key = 'jiraiya';
      assert.throws(() => txBuilder.validateKey({ key }), /The provided key is not valid/);
    });
  });
});
