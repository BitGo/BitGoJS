import assert from 'node:assert/strict';

import {
  bitGoWalletCreationCoins,
  getBitGoApiToken,
  outpointFromUnspent,
  parseBitGoEnvironment,
  redactBitGoError,
  responseUnspents,
  summarizeUnspent,
  type BitGoWalletCreationCoinName,
} from './bitgo-api';
import { Cell, Evidence } from './live-matrix';
import { fundLiveWallet } from './live-matrix-live';
import { confirmNetworkTx, defaultPollingTimeoutMs, liveEndpoints } from './live-matrix-network';
import {
  dedicatedLabel,
  dedicatedMainWallet,
  indexedDeposit,
  liveContext,
  liveWalletPassphrase,
} from './live-matrix-provision';

function fundingCoins(): readonly BitGoWalletCreationCoinName[] {
  const selected = process.env.POX5_NETWORK?.trim();
  if (!selected) return bitGoWalletCreationCoins;
  const coin = bitGoWalletCreationCoins.find((candidate) => candidate === selected);
  if (!coin) throw new Error('POX5_NETWORK must be tbtcstx, tbtcstxprivate1, or tbtcstxsignet');
  return [coin];
}

const environment = parseBitGoEnvironment(process.env.POX5_BITGO_API_ENV ?? 'staging');
const coins = fundingCoins();

describe(`BitGo API PoX-5 funding integration (${environment})`, function () {
  for (const coin of coins) {
    it(`dedicated hot wallet funding confirms and indexes on ${coin}`, async function (this: Mocha.Context) {
      this.timeout(1_500_000);
      const token = getBitGoApiToken(environment);
      const passphrase = liveWalletPassphrase(environment, process.env);
      const secrets = [token, passphrase];
      try {
        const context = await liveContext(environment, coin, process.env);
        const cell: Cell = { environment, coin, walletType: 'hot' };
        const evidence: Evidence = {};
        const checkpoint = async (update: Evidence): Promise<void> => {
          Object.assign(evidence, update);
        };
        const { wallet } = await dedicatedMainWallet(cell, context, dedicatedLabel(cell, 'fund'), false, checkpoint);
        const forceFaucet = process.env.POX5_FUND_FORCE_FAUCET;
        if (forceFaucet !== undefined && forceFaucet !== '1') {
          throw new Error('POX5_FUND_FORCE_FAUCET must be unset or 1');
        }
        const existing = responseUnspents(await wallet.unspents({ limit: 100, minConfirms: 0 }))
          .filter((unspent) => {
            const amountSats = summarizeUnspent(unspent).amountSats;
            return (
              outpointFromUnspent(unspent) !== undefined &&
              typeof amountSats === 'string' &&
              /^[1-9][0-9]*$/.test(amountSats)
            );
          })
          .sort((left, right) => {
            const leftAmount = summarizeUnspent(left).amountSats;
            const rightAmount = summarizeUnspent(right).amountSats;
            return Number(rightAmount) - Number(leftAmount);
          })[0];
        if (existing && forceFaucet !== '1') {
          const outpoint = outpointFromUnspent(existing);
          const amountSats = summarizeUnspent(existing).amountSats;
          const address = summarizeUnspent(existing).address;
          assert.ok(outpoint && typeof amountSats === 'string' && typeof address === 'string');
          const txid = outpoint.split(':')[0];
          console.log(`${environment}/${coin}: resuming confirmation for existing faucet tx ${txid}`);
          const { btcApi } = liveEndpoints(coin, process.env);
          const timeoutMs = Number(process.env.POX5_LIVE_TIMEOUT_MS ?? defaultPollingTimeoutMs(coin));
          const confirmation = await confirmNetworkTx(coin, txid, btcApi, timeoutMs);
          const indexed = await indexedDeposit(wallet, txid, address, timeoutMs);
          assert.equal(indexed.outpoint, outpoint);
          assert.equal(String(indexed.amountSats), amountSats);
          console.log(
            `${environment}/${coin}: revalidated existing ${amountSats}-sat deposit ${txid} ` +
              `at height ${confirmation.blockHeight}; BitGo indexed the exact output; no duplicate faucet request`
          );
          return;
        }
        const funded = await fundLiveWallet(cell, wallet, process.env, checkpoint);
        assert.equal(funded.walletId, wallet.id());
        assert.match(funded.txid ?? '', /^[0-9a-f]{64}$/i);
        assert.match(funded.outpoint ?? '', /^[0-9a-f]{64}:(0|[1-9][0-9]*)$/i);
        assert.ok(typeof funded.amountSats === 'number' && funded.amountSats > 0);
        assert.ok(typeof funded.confirmations === 'number' && funded.confirmations > 0);
        assert.ok(typeof funded.observedHeight === 'number' && funded.observedHeight > 0);
        console.log(
          `${environment}/${coin}: confirmed ${funded.txid} at height ${funded.observedHeight}; ` +
            `BitGo indexed ${funded.amountSats} sats at ${funded.outpoint}`
        );
      } catch (error) {
        throw new Error(redactBitGoError(error, secrets));
      }
    });
  }
});
