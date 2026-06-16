import * as assert from 'assert';
import 'should';
import 'should-http';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

/**
 * End-to-end tests for POST /api/v2/{coin}/address/derive.
 *
 * Unlike the unit tests in `deriveAddress.ts` (which stub `coin.deriveAddress`), these exercise
 * the *real* coin derivation through the HTTP endpoint — no mocks. They assert the endpoint
 * returns the exact, known-good address for each Phase 1 wallet kind, and that the derived
 * address round-trips through the coin's `isWalletAddress` verification.
 *
 * WCN-918
 */
describe('deriveAddress end-to-end (real derivation, no mocks)', function () {
  const agent = setupAgent();
  const authHeader = 'Bearer test_access_token_12345';

  // SDK instance used only for the offline derive→verify round-trip assertion.
  const bitgo = new BitGo({ env: 'test' });

  function post(coin: string, body: Record<string, unknown>) {
    return agent
      .post(`/api/v2/${coin}/address/derive`)
      .set('Authorization', authHeader)
      .set('Content-Type', 'application/json')
      .send(body);
  }

  describe('SOL (Stage A — EdDSA MPC)', function () {
    const commonKeychain =
      '8ea32ecacfc83effbd2e2790ee44fa7c59b4d86c29a12f09fb613d8195f93f4e21875cad3b98adada40c040c54c3569467df41a020881a6184096378701862bd';
    const expectedAddress = '7YAesfwPk41VChUgr65bm8FEep7ymWqLSW5rpYB5zZPY';

    it('derives the exact known address through the endpoint', async function () {
      const result = await post('tsol', { keychains: [{ commonKeychain }], index: 1 });
      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.address, expectedAddress);
      assert.strictEqual(result.body.derivationPath, 'm/1');
    });

    it('round-trips: the endpoint-derived address verifies via isWalletAddress', async function () {
      const result = await post('tsol', { keychains: [{ commonKeychain }], index: 1 });
      const verified = await bitgo
        .coin('tsol')
        .isWalletAddress({ keychains: [{ commonKeychain }], address: result.body.address, index: 1 } as never);
      verified.should.equal(true);
    });
  });

  describe('ETH (Stage A — secp256k1 MPC)', function () {
    const commonKeychain =
      '03f9c2fb2e5a8b78a44f5d1e4f906f8e3d7a0e6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9e8d7c6b5a4' +
      '93827160594857463728190a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';
    const expectedAddress = '0x01153f3adfe454a72589ca9ef74f013c19e54961';

    it('derives the exact known MPC address through the endpoint', async function () {
      const result = await post('teth', {
        keychains: [{ commonKeychain }, { commonKeychain }, { commonKeychain }],
        index: 0,
        walletVersion: 3,
      });
      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.address, expectedAddress);
    });

    it('rejects legacy forwarder wallet versions (1/2/4) with a 500', async function () {
      const result = await post('teth', {
        keychains: [{ commonKeychain }, { commonKeychain }, { commonKeychain }],
        index: 0,
        walletVersion: 1,
      });
      // Stage C (forwarder/CREATE2) is not yet implemented — surfaces as an error, not a wrong address.
      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });
  });

  describe('BTC (Stage B — UTXO multisig)', function () {
    const keychains = [
      {
        pub: 'xpub661MyMwAqRbcGiQhVk1J7cD1YodF9tc5Y1B8vpTjjB1pcB1J1m1QX8fMtYP2sYqFmW6J2ra69tNoARKjvTGo9cGUrbPbJdjwrSzGGzPzWWS',
      },
      {
        pub: 'xpub661MyMwAqRbcFzLXuganogQvd7MrefQQqCcJP2ZDumnCdQecf5cw1P1nD5qBz8SNS1yCLSC9VqpNUWnQU3V6qmnPt2r21oXhicQFzPA6Lby',
      },
      {
        pub: 'xpub661MyMwAqRbcFHpwWrzPB61U2CgBmdD21WNVM1JKUn9rEExkoGE4yafUVFbPSd78vdX8tWcEUQWaALFkU9fUbUM4Cc49DKEJSCYGRnbzCym',
      },
    ];

    it('derives the exact legacy P2SH address (chain 0) through the endpoint', async function () {
      const result = await post('btc', { keychains, chain: 0, index: 0 });
      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.address, '34TTD5CefzLXWjuiSPDjvpJJRZe3Tqu2Mj');
    });

    it('derives the exact bech32 P2WSH address (chain 20) through the endpoint', async function () {
      const result = await post('btc', { keychains, chain: 20, index: 0 });
      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.address, 'bc1qjpzgkka9lhs5l39shlr4d394tljw8p2v35sl88h82djvqp3mculqa08n0a');
    });

    it('round-trips: the endpoint-derived address verifies via isWalletAddress', async function () {
      const result = await post('btc', { keychains, chain: 20, index: 7 });
      const verified = await bitgo
        .coin('btc')
        .isWalletAddress({ address: result.body.address, keychains, chain: 20, index: 7 } as never);
      verified.should.equal(true);
    });
  });
});
