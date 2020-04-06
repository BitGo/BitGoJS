import should from 'should';
import { Transaction, signTx } from '../../../../src/coin/eth/signature';

const PRIVATE_KEY_OK = Buffer.from('A87A7FE4BE35945AEA728023EE0911F8E2DABD2AF95A7AEAFBFD7EBD04AEA662', 'hex');

const TX_OBJECT_OK = {
  nonce: '0x13',
  to: '0xBa8eA9C3729686d7DB120efCfC81cD020C8DC1CB',
  value: '0x2386f26fc10000',
  gasLimit: '0x5208',
  gasPrice: '0x2540be400',
};

const TX_OBJECT_FAIL_LONG_TO = {
  nonce: '0x13',
  to: '0xBa8eA9C3729686d7DB120efCfC81cD020C8DC1CBC',
  value: '0x2386f26fc10000',
  gasLimit: '0x5208',
  gasPrice: '0x2540be400',
};

const TX_OBJECT_FAIL_INVALID_V = {
  nonce: '0x13',
  to: '0xBa8eA9C3729686d7DB120efCfC81cD020C8DC1CB',
  value: '0x2386f26fc10000',
  gasLimit: '0x5208',
  gasPrice: '0x2540be400',
  v: '0x2540be400',
};

const SIGN_OK =
  'f86b138502540be40082520894ba8ea9c3729686d7db120efcfc81cd020c8dc1cb872386f26fc10000802fa01eb1473de60b7ea47424cebab7284a6230347f2bafa95e012b2431cbd82d836ea047985295854fb3a23f7cbd7c6daab1d50a15255c5d0daa0e7b17d8930059ca09';

describe('ETH signature', function() {
  describe('transaction', function() {
    it('should generate valid signature', async () => {
      const tx = new Transaction(TX_OBJECT_OK, 6);
      tx.sign(PRIVATE_KEY_OK);
      const serializedTx = tx.serialize();
      should.equal(serializedTx.toString('hex'), SIGN_OK);
    });
    it('should generate TX error', async () => {
      should.throws(() => new Transaction(TX_OBJECT_FAIL_LONG_TO, 6));
      should.throws(() => new Transaction(TX_OBJECT_FAIL_INVALID_V, 6));
    });
  });
  describe('sign', function() {
    it('should generate valid signature', async () => {
      const signature = await signTx(TX_OBJECT_OK, 6, PRIVATE_KEY_OK);
      should.equal(signature, SIGN_OK);
    });
  });
});
