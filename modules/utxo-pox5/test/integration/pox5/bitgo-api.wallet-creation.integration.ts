import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  bitGoWalletCreationCoins,
  createBitGoApiClient,
  createBitGoWallet,
  getBitGoApiToken,
  isFixedScriptMainWallet,
  listBitGoWallets,
  parseBitGoEnvironment,
  redactBitGoError,
  type BitGoWalletCreationCoinName,
} from './bitgo-api';
import { liveUnlockOtp, liveWalletPassphrase } from './live-matrix-provision';

describe('BitGo API testnet wallet-creation integration', function () {
  it('creates or verifies a hot on-chain wallet on each Stacks Bitcoin testnet', async function (this: Mocha.Context) {
    if (process.env.POX5_ENABLE_LIVE_WALLET_CREATION !== '1') {
      throw new Error('Set POX5_ENABLE_LIVE_WALLET_CREATION=1 to enable the live wallet-creation test');
    }

    const localEnvPath = resolve(__dirname, '.env');
    if (existsSync(localEnvPath)) {
      const processEnvironment = { ...process.env };
      process.loadEnvFile(localEnvPath);
      Object.assign(process.env, processEnvironment);
    }

    const environment = parseBitGoEnvironment(process.env.POX5_BITGO_API_ENV ?? 'staging');
    const token = getBitGoApiToken(environment);
    const bitgo = createBitGoApiClient(environment, token);
    const walletPassphrase = liveWalletPassphrase(environment, process.env);
    const enterprise = process.env.POX5_BITGO_ENTERPRISE_ID?.trim() || undefined;
    const secrets = [token, walletPassphrase];
    this.timeout(180_000);

    let currentCoin: BitGoWalletCreationCoinName | undefined;
    try {
      await bitgo.get(bitgo.url('/user/me')).result();
      await bitgo.unlock({ otp: liveUnlockOtp(environment, process.env), duration: 3600 });

      for (const coinName of bitGoWalletCreationCoins) {
        currentCoin = coinName;
        const label = `pox5-wallet-creation-${coinName}`;
        const existingWallets = (await listBitGoWallets(bitgo, coinName)).filter((wallet) => wallet.label === label);
        assert.ok(existingWallets.length <= 1, `Multiple wallets found with label ${label}`);

        const summary =
          existingWallets[0] ??
          (await createBitGoWallet(bitgo, coinName, {
            label,
            walletPassphrase,
            ...(enterprise ? { enterprise } : {}),
          }));
        assert.equal(summary.coin, coinName, `${coinName} wallet was created for a different coin`);
        assert.equal(isFixedScriptMainWallet(summary), true, `${coinName} wallet is not a hot on-chain main wallet`);

        const wallet = await bitgo.coin(coinName).wallets().get({ id: summary.id });
        assert.equal(wallet.coin(), coinName, `${coinName} wallet could not be retrieved from its coin API`);
        assert.equal(wallet.label(), label);
        assert.equal(wallet.type(), 'hot');
        assert.equal(wallet.multisigType(), 'onchain');
        console.log(`${coinName}: verified hot on-chain wallet ${wallet.id()}`);
      }
    } catch (error) {
      const coin = currentCoin ? ` for ${currentCoin}` : '';
      throw new Error(`Failed to create or verify a testnet wallet${coin}: ${redactBitGoError(error, secrets)}`);
    }
  });
});
