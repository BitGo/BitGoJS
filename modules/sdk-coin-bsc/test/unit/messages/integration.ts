import 'should';
import { MessageStandardType } from '@bitgo-beta/sdk-core';
import { coins } from '@bitgo-beta/statics';
import { MessageBuilderFactory } from '../../../src';
import { fixtures } from './fixtures';

describe('BSC Message Builder Integration Tests', () => {
  describe('End-to-end message building workflow', () => {
    it('should complete full message lifecycle from factory to broadcast format', async () => {
      // Create factory with BSC coin configuration
      const factory = new MessageBuilderFactory(fixtures.coin);

      // Get EIP-191 builder
      const builder = factory.getMessageBuilder(MessageStandardType.EIP191);

      // Build message with BSC-specific metadata
      builder
        .setPayload('Integration test message for BSC')
        .setMetadata({
          network: 'bsc',
          chainId: 97,
          timestamp: Date.now(),
          dapp: 'BitGo BSC Integration',
        })
        .addSigner(fixtures.eip191.signer)
        .addSignature(fixtures.eip191.signature);

      const message = await builder.build();

      // Verify message properties
      message.getType().should.equal(MessageStandardType.EIP191);
      message.getPayload().should.equal('Integration test message for BSC');
      message.getSigners().should.containEql(fixtures.eip191.signer);
      message.getSignatures().should.containEql(fixtures.eip191.signature);

      // Verify BSC-specific metadata
      const metadata = message.getMetadata()!;
      metadata.should.have.property('network', 'bsc');
      metadata.should.have.property('chainId', 97);
      metadata.should.have.property('dapp', 'BitGo BSC Integration');
      metadata.should.have.property('encoding', 'utf8');

      // Convert to broadcast format
      const broadcastFormat = await message.toBroadcastFormat();
      broadcastFormat.should.have.property('type', MessageStandardType.EIP191);
      broadcastFormat.should.have.property('payload', 'Integration test message for BSC');
      broadcastFormat.should.have.property('signers');
      broadcastFormat.should.have.property('serializedSignatures');
      broadcastFormat.should.have.property('metadata');

      // Reconstruct from broadcast format
      const rebuiltMessage = await builder.fromBroadcastFormat(broadcastFormat);
      rebuiltMessage.getPayload().should.equal(message.getPayload());
      rebuiltMessage.getType().should.equal(message.getType());
      rebuiltMessage.getSigners().should.deepEqual(message.getSigners());
    });

    it('should work with production BSC coin configuration', async () => {
      const bscCoin = coins.get('bsc'); // Production BSC
      const factory = new MessageBuilderFactory(bscCoin);

      const builder = factory.getMessageBuilder(MessageStandardType.EIP191);
      builder.setPayload('Production BSC message test');

      const message = await builder.build();

      message.getType().should.equal(MessageStandardType.EIP191);
      message.getPayload().should.equal('Production BSC message test');

      // Verify it uses production BSC configuration
      bscCoin.name.should.equal('bsc');
      bscCoin.network.family.should.equal('bsc');
    });

    it('should handle complex BSC transaction metadata', async () => {
      const factory = new MessageBuilderFactory(fixtures.coin);
      const builder = factory.getMessageBuilder(MessageStandardType.EIP191);

      const complexMetadata = {
        network: 'bsc',
        chainId: 56,
        transactionType: 'token_transfer',
        tokenContract: '0x55d398326f99059fF775485246999027B3197955', // USDT on BSC
        amount: '1000000000000000000', // 1 token with 18 decimals
        recipient: '0x742d35Cc6634C0532925a3b8D431C2FE1e05dB2b',
        gasLimit: '21000',
        gasPrice: '5000000000',
        nonce: 42,
        dappUrl: 'https://pancakeswap.finance',
        userAgent: 'BitGo SDK BSC Integration Test',
      };

      builder
        .setPayload('Complex BSC transaction approval')
        .setMetadata(complexMetadata)
        .addSigner(fixtures.eip191.signer);

      const message = await builder.build();
      const metadata = message.getMetadata()!;

      // Verify all complex metadata is preserved
      metadata.should.have.property('tokenContract', '0x55d398326f99059fF775485246999027B3197955');
      metadata.should.have.property('amount', '1000000000000000000');
      metadata.should.have.property('recipient', '0x742d35Cc6634C0532925a3b8D431C2FE1e05dB2b');
      metadata.should.have.property('gasLimit', '21000');
      metadata.should.have.property('nonce', 42);
      metadata.should.have.property('dappUrl', 'https://pancakeswap.finance');
      metadata.should.have.property('encoding', 'utf8'); // Should be overridden
    });
  });
});
