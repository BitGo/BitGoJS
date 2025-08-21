import * as fs from 'fs';
import assert from 'assert';

import * as bitcoinjs from 'bitcoinjs-lib';
import * as utxolib from '@bitgo/utxo-lib';
import * as wasmMiniscript from '@bitgo/wasm-miniscript';

// demonstrate https://github.com/babylonlabs-io/btc-staking-ts/issues/71
describe('btc-staking-ts bug #71', function () {
  let buf: Buffer;
  before('load half-signed transaction', async function () {
    const fixture = JSON.parse(
      await fs.promises.readFile(__dirname + '/../../fixtures/babylon/txTree.testnet.json', 'utf-8')
    );
    const base64 = fixture.slashingSignedBase64;
    assert(typeof base64 === 'string');
    buf = Buffer.from(base64, 'base64');
  });

  it('can finalize with bitcoinjs-lib', function () {
    const psbt = bitcoinjs.Psbt.fromBuffer(buf);
    // this does not throw because of a bug in bitcoinjs-lib
    psbt.finalizeAllInputs();
  });

  it('cannot finalize with utxolib', function () {
    const psbt = utxolib.Psbt.fromBuffer(buf);
    assert.throws(() => {
      psbt.finalizeAllInputs();
    }, /Error: Can not finalize input #0/);
  });

  it('cannot finalize with wasm-miniscript', function () {
    const psbt = wasmMiniscript.Psbt.deserialize(buf);
    assert.throws(() => {
      psbt.finalize();
    }, /CouldNotSatisfyTr/);
  });

  it('cannot finalize with bitcoind', async function (this: Mocha.Context) {
    let cookie: string;
    try {
      cookie = await fs.promises.readFile(process.env.HOME + '/.bitcoin/regtest/.cookie', 'utf-8');
    } catch (e) {
      if (e.code === 'ENOENT') {
        console.log('No cookie file found, skipping test');
        this.skip();
      }
      throw e;
    }
    // make regtest JSON-RPC request with cookie
    const url = 'http://localhost:18443';
    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(cookie, 'utf-8').toString('base64'),
    };

    // Create the request payload for finalizepsbt RPC call
    const body = JSON.stringify({
      jsonrpc: '1.0',
      id: 'bitgo-test',
      method: 'finalizepsbt',
      params: [buf.toString('base64')],
    });

    // Make the RPC request
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    assert.deepStrictEqual((await response.json()).result, {
      // the response psbt is the same as the input psbt - not finalized
      psbt: buf.toString('base64'),
      complete: false,
    });
  });
});
