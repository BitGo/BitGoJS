import * as p from '@clack/prompts';
import type { CoinConfig } from './types';
import { PluginRegistry } from '../plugins';

/**
 * Prompt user for coin configuration
 */
export async function promptUser(registry: PluginRegistry): Promise<CoinConfig> {
  console.clear();

  p.intro('🚀 BitGo SDK Coin Generator V2');

  // Display examples from all registered plugins
  const examples = registry.getAllExamples();
  const exampleText = examples
    .map((e) => `${e.chainType}:\n${e.examples.map((ex) => `  • ${ex}`).join('\n')}`)
    .join('\n\n');

  p.note(exampleText, '📚 Examples of existing coins');

  const group = await p.group(
    {
      coinName: () =>
        p.text({
          message: 'What is the coin name?',
          placeholder: 'Canton Coin',
          validate: (value) => {
            if (!value) return 'Coin name is required';
          },
        }),
      symbol: () =>
        p.text({
          message: 'What is the mainnet symbol?',
          placeholder: 'canton',
          validate: (value) => {
            if (!value) return 'Symbol is required';
            if (!/^[a-z][a-z0-9]*$/.test(value)) {
              return 'Symbol must be lowercase alphanumeric and start with a letter';
            }
          },
        }),
      testnetSymbol: ({ results }) =>
        p.text({
          message: 'What is the testnet symbol?',
          placeholder: `t${results.symbol}`,
          initialValue: `t${results.symbol}`,
          validate: (value) => {
            if (!value) return 'Testnet symbol is required';
            if (!/^[a-z][a-z0-9]*$/.test(value)) {
              return 'Testnet symbol must be lowercase alphanumeric and start with a letter';
            }
          },
        }),
      baseFactor: () =>
        p.text({
          message: 'What is the base factor?',
          placeholder: '1e10',
          validate: (value) => {
            if (!value) return 'Base factor is required';

            // Only allow safe numeric formats: plain numbers or scientific notation (e.g., 1e10, 1.5e18)
            if (!/^[0-9]+(\.[0-9]+)?(e[0-9]+)?$/i.test(value)) {
              return 'Base factor must be a number or scientific notation (e.g., 1e10, 1.5e18)';
            }

            try {
              const factor = Number(value);
              if (isNaN(factor) || factor <= 0 || !isFinite(factor)) {
                return 'Base factor must be a positive number';
              }
            } catch {
              return 'Invalid base factor';
            }
          },
        }),
      keyCurve: () =>
        p.select({
          message: 'Which key curve?',
          options: [
            { value: 'ed25519', label: 'ed25519', hint: 'Edwards-curve (Canton, TAO)' },
            { value: 'secp256k1', label: 'secp256k1', hint: 'ECDSA (ICP, Bitcoin-like)' },
          ],
          initialValue: 'ed25519',
        }),
      supportsTss: () =>
        p.confirm({
          message: 'Does it support TSS?',
          initialValue: true,
        }),
      mpcAlgorithm: ({ results }) => {
        if (!results.supportsTss) return Promise.resolve(undefined);

        // Auto-determine based on key curve
        const autoMpc = results.keyCurve === 'ed25519' ? 'eddsa' : 'ecdsa';
        p.note(`Auto-set to: ${autoMpc}`, '🔐 MPC Algorithm');
        return Promise.resolve(autoMpc as 'eddsa' | 'ecdsa');
      },
      chainType: () =>
        p.select({
          message: 'What is the chain type?',
          options: registry.getChainTypeOptions(),
          initialValue: 'generic-l1',
        }),
      withTokenSupport: () =>
        p.confirm({
          message: 'Include token support?',
          initialValue: false,
        }),
    },
    {
      onCancel: () => {
        p.cancel('Operation cancelled');
        process.exit(0);
      },
    }
  );

  return {
    coinName: group.coinName as string,
    symbol: (group.symbol as string).toLowerCase(),
    testnetSymbol: (group.testnetSymbol as string).toLowerCase(),
    baseFactor: group.baseFactor as string,
    keyCurve: group.keyCurve as 'ed25519' | 'secp256k1',
    supportsTss: group.supportsTss as boolean,
    mpcAlgorithm: group.mpcAlgorithm as 'eddsa' | 'ecdsa' | undefined,
    chainType: group.chainType as string,
    withTokenSupport: group.withTokenSupport as boolean,
  };
}
