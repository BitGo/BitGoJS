import assert from 'node:assert/strict';

import { loadPox5LocalConfig } from './config';

describe('PoX-5 localhost configuration', function () {
  it('defaults all RPC endpoints to loopback', function () {
    const config = loadPox5LocalConfig(
      {
        STACKS_REGTEST_ENV_ROOT: '/tmp/stacks-regtest-env',
        POX5_COMPOSE_BASE_FILE: '/tmp/stacks-regtest-env/docker-compose.yml',
      },
      '/tmp/bitgojs'
    );

    assert.equal(config.bitcoin.rpcUrl, 'http://127.0.0.1:18443');
    assert.equal(config.bitcoin.network, 'regtest');
    assert.equal(config.stacks.nodeUrl, 'http://127.0.0.1:20443');
    assert.equal(config.stacks.apiUrl, 'http://127.0.0.1:3999');
  });

  it('rejects non-local RPC endpoints', function () {
    assert.throws(
      () =>
        loadPox5LocalConfig(
          {
            STACKS_REGTEST_ENV_ROOT: '/tmp/stacks-regtest-env',
            POX5_COMPOSE_BASE_FILE: '/tmp/stacks-regtest-env/docker-compose.yml',
            POX5_BITCOIN_RPC_URL: 'https://mainnet.example',
          },
          '/tmp/bitgojs'
        ),
      /must point to localhost/
    );
  });

  it('uses the deterministic local regtest accounts', function () {
    const config = loadPox5LocalConfig(
      {
        STACKS_REGTEST_ENV_ROOT: '/tmp/stacks-regtest-env',
        POX5_COMPOSE_BASE_FILE: '/tmp/stacks-regtest-env/docker-compose.yml',
      },
      '/tmp/bitgojs'
    );

    assert.equal(config.accounts.stakerAddress, 'ST319CF5WV77KYR1H3GT0GZ7B8Q4AQPY42ETP1VPF');
  });

  it('selects the public tbtcstx profile', function () {
    const config = loadPox5LocalConfig(
      {
        POX5_NETWORK: 'tbtcstx',
        POX5_INDEXER_UTXO_ROOT: '/tmp/indexer-utxo',
        STACKS_JS_ROOT: '/tmp/stacks.js-pox5',
        POX5_STACKS_STAKER_ADDRESS: 'ST1TEST',
      },
      '/tmp/bitgojs'
    );

    assert.equal(config.coinName, 'tbtcstx');
    assert.equal(config.bitcoin.composeService, 'tbtcstx-bitcoin');
    assert.equal(config.bitcoin.rpcUrl, 'http://127.0.0.1:18443');
    assert.equal(config.bitcoin.canMine, false);
    assert.equal(config.stacks.chainId, 0x80000000);
    assert.equal(config.stacks.nodeUrl, 'https://api.testnet.hiro.so');
    assert.equal(config.stacks.pox5ActivationHeight, 2702);
  });

  it('loads the shared profile without indexer-utxo in direct mode', function () {
    const config = loadPox5LocalConfig(
      {
        POX5_NETWORK: 'tbtcstx',
        POX5_FULLNODE_MODE: 'direct',
        STACKS_JS_ROOT: '/tmp/stacks.js-pox5',
        POX5_STACKS_STAKER_ADDRESS: 'ST1TEST',
      },
      '/tmp/bitgojs'
    );

    assert.equal(config.fullnodeMode, 'direct');
    assert.equal(config.stacks.addressNetwork, 'devnet');
    assert.match(config.composeFiles[0], /direct-fullnode\.compose\.yaml$/);
  });

  it('uses the private-1 signer-manager default and leaves bond discovery dynamic', function () {
    const config = loadPox5LocalConfig({
      POX5_NETWORK: 'tbtcstxprivate1',
      POX5_FULLNODE_MODE: 'direct',
      STACKS_JS_ROOT: '/tmp/stacks.js-pox5',
    });

    assert.equal(config.stacks.bondIndex, undefined);
    assert.equal(config.stacks.signerManager, 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP.signer-manager');
  });

  it('accepts bond index zero for live PoX-5 requests', function () {
    const config = loadPox5LocalConfig({
      POX5_NETWORK: 'tbtcstxprivate1',
      POX5_FULLNODE_MODE: 'direct',
      POX5_BOND_INDEX: '0',
    });

    assert.equal(config.stacks.bondIndex, 0);
    assert.throws(
      () =>
        loadPox5LocalConfig({
          POX5_NETWORK: 'tbtcstxprivate1',
          POX5_FULLNODE_MODE: 'direct',
          POX5_BOND_INDEX: '1e2',
        }),
      /POX5_BOND_INDEX must be a non-negative integer/
    );
  });

  it('selects the private-1 profile with its shorter PoX schedule', function () {
    const config = loadPox5LocalConfig(
      {
        POX5_NETWORK: 'tbtcstxprivate1',
        POX5_INDEXER_UTXO_ROOT: '/tmp/indexer-utxo',
        STACKS_JS_ROOT: '/tmp/stacks.js-pox5',
        POX5_STACKS_STAKER_ADDRESS: 'ST1TEST',
      },
      '/tmp/bitgojs'
    );

    assert.equal(config.coinName, 'tbtcstxprivate1');
    assert.equal(config.bitcoin.composeService, 'tbtcstxprivate1-bitcoin');
    assert.equal(config.bitcoin.rpcUrl, 'http://127.0.0.1:40443');
    assert.equal(config.bitcoin.canMine, false);
    assert.equal(config.stacks.chainId, 0x100);
    assert.equal(config.stacks.nodeUrl, 'https://api.private-1.hiro.so');
    assert.equal(config.stacks.pox5ActivationHeight, 202);
  });
});
