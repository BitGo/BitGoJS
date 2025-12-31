import { describe, it } from 'mocha';
import { Tip20TransactionBuilder } from '../../src/lib/transactionBuilder';
import type { Address } from 'viem';
import { coins } from '@bitgo/statics';

const mockCoinConfig = coins.get('ttempo');

describe('TIP-20 Integration Tests', () => {
  const ALPHA_USD_TOKEN = '0x...' as Address;
  const BETA_USD_TOKEN = '0x...' as Address;
  const THETA_USD_TOKEN = '0x...' as Address;
  const RECEIVER_ADDRESS = '0x...' as Address;

  describe.skip('Single Transfer', () => {
    it('should build single TIP-20 transfer without memo', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder.addOperation({
        token: ALPHA_USD_TOKEN,
        to: RECEIVER_ADDRESS,
        amount: '1.0',
      });
      builder.feeToken(ALPHA_USD_TOKEN);
      // TODO: const tx = await builder.build();
    });

    it('should build single TIP-20 transfer with memo', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder.addOperation({
        token: ALPHA_USD_TOKEN,
        to: RECEIVER_ADDRESS,
        amount: '1.0',
        memo: '12345',
      });
      builder.feeToken(ALPHA_USD_TOKEN);
      // TODO: const tx = await builder.build();
    });
  });

  describe.skip('Batch Transfer', () => {
    it('should build batch transfer with multiple memos', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder
        .addOperation({
          token: ALPHA_USD_TOKEN,
          to: RECEIVER_ADDRESS,
          amount: '0.5',
          memo: '1001',
        })
        .addOperation({
          token: ALPHA_USD_TOKEN,
          to: RECEIVER_ADDRESS,
          amount: '0.3',
          memo: '1002',
        })
        .addOperation({
          token: ALPHA_USD_TOKEN,
          to: RECEIVER_ADDRESS,
          amount: '0.2',
          memo: '1003',
        });
      builder.feeToken(ALPHA_USD_TOKEN);
      // TODO: const tx = await builder.build();
    });

    it('should build multi-token batch transfer', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder
        .addOperation({
          token: ALPHA_USD_TOKEN,
          to: RECEIVER_ADDRESS,
          amount: '1.5',
          memo: '2001',
        })
        .addOperation({
          token: BETA_USD_TOKEN,
          to: RECEIVER_ADDRESS,
          amount: '2.0',
          memo: '2002',
        })
        .addOperation({
          token: THETA_USD_TOKEN,
          to: RECEIVER_ADDRESS,
          amount: '0.75',
          memo: '2003',
        });
      builder.feeToken(BETA_USD_TOKEN);
      // TODO: const tx = await builder.build();
    });
  });

  describe.skip('Transaction Signing', () => {
    it('should sign and serialize transaction', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder.addOperation({
        token: ALPHA_USD_TOKEN,
        to: RECEIVER_ADDRESS,
        amount: '1.0',
        memo: '9999',
      });
      builder.feeToken(ALPHA_USD_TOKEN);
      // TODO: Implement signing with viem privateKeyToAccount
      // TODO: const tx = await builder.build();
      // TODO: tx.setSignature(signature);
      // TODO: const serialized = await tx.toBroadcastFormat();
    });
  });

  describe.skip('Fee Token Selection', () => {
    it('should pay fees with different token than transfer', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder.addOperation({
        token: ALPHA_USD_TOKEN,
        to: RECEIVER_ADDRESS,
        amount: '1.0',
        memo: '5555',
      });
      builder.feeToken(BETA_USD_TOKEN);
      // TODO: const tx = await builder.build();
    });
  });
});
