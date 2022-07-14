import { TransactionBuilderFactory } from '../../src';
import { coins } from '@bitgo/statics';

describe('Polkadot and Westend Address Validation', function () {
  describe('Polkadot Address Validation', function () {
    it('should have polkadot address (starting with 1) in input and output after building transaction', async () => {
      const senderAddress = '13QgbfCNWka9Cz8BaYjzCiSYq8dA3fdfC8MCwwZ4GMh3AeYY';
      const receiverAddress = '14q3D8ZHe89jpFSi3bwXJXnaKcWuHSUPCBhHwy6UF7UmQ4E7';

      const factory = new TransactionBuilderFactory(coins.get('dot'));
      const txBulider = factory
        .getTransferBuilder()
        .amount('90034235235322')
        .sender({ address: senderAddress })
        .to({ address: receiverAddress })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      const tx = await txBulider.build();

      tx.outputs[0].address.should.equal(receiverAddress);
      tx.inputs[0].address.should.equal(senderAddress);
    });
  });

  describe('Westend Address Validation', function () {
    it('should have substrate address (starting with 5) in input and output after building transaction', async () => {
      const senderAddress = '5DLkMpzjemtsMh4kkEJ1jmu3kYagqJ4QWZShrg4MYDknGcah';
      const receiverAddress = '5F5jseDA8j47dUdGznCic6ZxqfZBS77j12avJxqK8gx5PHRE';

      const factory = new TransactionBuilderFactory(coins.get('tdot'));
      const txBulider = factory
        .getTransferBuilder()
        .amount('90034235235322')
        .sender({ address: senderAddress })
        .to({ address: receiverAddress })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      const tx = await txBulider.build();

      tx.outputs[0].address.should.equal(receiverAddress);
      tx.inputs[0].address.should.equal(senderAddress);
    });
  });
});
