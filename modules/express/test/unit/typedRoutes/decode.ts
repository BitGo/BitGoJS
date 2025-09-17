import * as assert from 'assert';
import * as t from 'io-ts';
import { DecryptRequestBody } from '../../../src/typedRoutes/api/common/decrypt';
import { EncryptRequestBody } from '../../../src/typedRoutes/api/common/encrypt';
import { LoginRequest } from '../../../src/typedRoutes/api/common/login';
import { VerifyAddressBody } from '../../../src/typedRoutes/api/common/verifyAddress';
import { VerifyAddressV2Body, VerifyAddressV2Params } from '../../../src/typedRoutes/api/v2/verifyAddress';
import { SimpleCreateRequestBody } from '../../../src/typedRoutes/api/v1/simpleCreate';
import {
  LightningInitWalletBody,
  LightningInitWalletParams,
} from '../../../src/typedRoutes/api/v2/lightningInitWallet';
import { agent as supertest } from 'supertest';
import nock from 'nock';
import { DefaultConfig } from '../../../src/config';
import { app as expressApp } from '../../../src/expressApp';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';

export function assertDecode<T>(codec: t.Type<T, unknown>, input: unknown): T {
  const result = codec.decode(input);
  if (result._tag === 'Left') {
    const errors = JSON.stringify(result.left, null, 2);
    assert.fail(`Decode failed with errors:\n${errors}`);
  }
  return result.right;
}

describe('io-ts decode tests', function () {
  it('express.login', function () {
    // password is required field
    assert.throws(() =>
      assertDecode(t.type(LoginRequest), {
        username: 'user',
      })
    );

    assertDecode(t.type(LoginRequest), {
      username: 'user',
      password: 'password',
    });
  });
  it('express.decrypt', function () {
    // input is required field
    assert.throws(() =>
      assertDecode(t.type(DecryptRequestBody), {
        password: 'hello',
      })
    );

    assertDecode(t.type(DecryptRequestBody), {
      input: 'input',
      password: 'password',
    });
  });
  it('express.encrypt', function () {
    // input is required field
    assert.throws(() =>
      assertDecode(t.type(EncryptRequestBody), {
        password: 'password',
      })
    );

    // input must be a string
    assert.throws(() =>
      assertDecode(t.type(EncryptRequestBody), {
        input: 123,
      })
    );

    // valid with just input
    assertDecode(t.type(EncryptRequestBody), {
      input: 'data to encrypt',
    });

    // valid with input and password
    assertDecode(t.type(EncryptRequestBody), {
      input: 'data to encrypt',
      password: 'password',
    });

    // valid with all fields
    assertDecode(t.type(EncryptRequestBody), {
      input: 'data to encrypt',
      password: 'password',
      adata: 'additional authenticated data',
    });

    // password and adata are optional, should accept undefined
    assertDecode(t.type(EncryptRequestBody), {
      input: 'data to encrypt',
      password: undefined,
      adata: undefined,
    });
  });
  it('express.verifyaddress', function () {
    assert.throws(() =>
      assertDecode(t.type(VerifyAddressBody), {
        address: 1123,
      })
    );
    assertDecode(t.type(VerifyAddressBody), {
      address: 'some-address',
    });
  });
  it('express.verifycoinaddress', function () {
    // invalid coin param type
    assert.throws(() =>
      assertDecode(t.type(VerifyAddressV2Params), {
        coin: 123,
      })
    );
    // valid coin param
    assertDecode(t.type(VerifyAddressV2Params), {
      coin: 'btc',
    });

    // invalid address type in body
    assert.throws(() =>
      assertDecode(t.type(VerifyAddressV2Body), {
        address: 123,
      })
    );
    // valid body without optional flag
    assertDecode(t.type(VerifyAddressV2Body), {
      address: 'some-address',
    });
    // valid body with optional flag
    assertDecode(t.type(VerifyAddressV2Body), {
      address: 'some-address',
      supportOldScriptHashVersion: true,
    });
  });
  it('express.v1.wallet.simplecreate', function () {
    // passphrase is required
    assert.throws(() => assertDecode(t.type(SimpleCreateRequestBody), {}));

    assertDecode(t.type(SimpleCreateRequestBody), {
      passphrase: 'pass',
    });
  });
  it('express.lightning.initWallet params', function () {
    // missing walletId
    assert.throws(() => assertDecode(t.type(LightningInitWalletParams), { coin: 'ltc' }));
    // valid
    assertDecode(t.type(LightningInitWalletParams), { coin: 'ltc', walletId: 'wallet123' });
  });
  it('express.lightning.initWallet body', function () {
    // missing passphrase
    assert.throws(() => assertDecode(t.type(LightningInitWalletBody), {}));
    // passphrase must be string
    assert.throws(() => assertDecode(t.type(LightningInitWalletBody), { passphrase: 123 }));
    // expressHost optional and must be string if provided
    assert.throws(() => assertDecode(t.type(LightningInitWalletBody), { passphrase: 'p', expressHost: 99 }));
    // valid minimal
    assertDecode(t.type(LightningInitWalletBody), { passphrase: 'p' });
    // valid with expressHost
    assertDecode(t.type(LightningInitWalletBody), { passphrase: 'p', expressHost: 'host.example' });
  });
});

describe('e2e tests for io-ts routes', function () {
  let agent;
  let authenticateStub: sinon.SinonStub;
  let walletsStub: sinon.SinonStub;
  let decryptStub: sinon.SinonStub;
  let encryptStub: sinon.SinonStub;
  let verifyAddressStub: sinon.SinonStub;
  before(function () {
    nock.restore();

    const args = {
      ...DefaultConfig,
      debug: false,
      env: 'test' as const,
      logfile: '/dev/null',
    };

    const app = expressApp(args);
    agent = supertest(app);

    authenticateStub = sinon.stub(BitGo.prototype, 'authenticate').callsFake(async (body: any) => {
      return {
        email: `${body.username}@example.com`,
        password: body.password,
        forceSMS: false,
      } as any;
    });
    encryptStub = sinon.stub(BitGo.prototype, 'encrypt').callsFake((params: any) => `enc:${params.input}`);
    decryptStub = sinon.stub(BitGo.prototype, 'decrypt').callsFake((params: any) => {
      const inputStr = String(params.input);
      return inputStr.startsWith('enc:') ? inputStr.substring(4) : inputStr;
    });
    verifyAddressStub = sinon.stub(BitGo.prototype, 'verifyAddress').callsFake((_params: any) => true);
    walletsStub = sinon.stub(BitGo.prototype, 'wallets').callsFake(() => {
      return {
        createWalletWithKeychains: async () => ({
          wallet: 'wallet-id-123',
          userKeychain: 'user-keychain',
          backupKeychain: 'backup-keychain',
        }),
      };
    });
  });
  beforeEach(function () {
    authenticateStub.resetHistory();
    walletsStub.resetHistory();
    decryptStub.resetHistory();
    encryptStub.resetHistory();
    verifyAddressStub.resetHistory();
  });
  after(function () {
    authenticateStub.restore();
    walletsStub.restore();
    decryptStub.restore();
    encryptStub.restore();
    verifyAddressStub.restore();
  });

  it('POST /api/v2/user/login success', async function () {
    const res = await agent.post('/api/v2/user/login').send({ username: 'alice', password: 'pw' });
    res.status.should.equal(200);
    res.body.email.should.equal('alice@example.com');
    res.body.password.should.equal('pw');
    sinon.assert.calledOnce(authenticateStub);
    sinon.assert.calledWithMatch(authenticateStub, { username: 'alice', password: 'pw' });
  });

  it('POST /api/v2/user/login decode failure', async function () {
    const res = await agent.post('/api/v2/user/login').send({ username: 'alice' });
    res.status.should.equal(400);
    sinon.assert.notCalled(authenticateStub);
  });

  it('POST /api/v2/encrypt success', async function () {
    const res = await agent.post('/api/v2/encrypt').send({ input: 'hello' });
    res.status.should.equal(200);
    res.body.encrypted.should.equal('enc:hello');
    sinon.assert.calledOnce(encryptStub);
    sinon.assert.calledWithMatch(encryptStub, { input: 'hello' });
  });

  it('POST /api/v2/encrypt decode failure', async function () {
    const res = await agent.post('/api/v2/encrypt').send({ input: 123 });
    res.status.should.equal(400);
    sinon.assert.notCalled(encryptStub);
  });

  it('POST /api/v2/decrypt success', async function () {
    const res = await agent.post('/api/v2/decrypt').send({ input: 'enc:secret', password: 'pw' });
    res.status.should.equal(200);
    res.body.decrypted.should.equal('secret');
    sinon.assert.calledOnce(decryptStub);
    sinon.assert.calledWithMatch(decryptStub, { input: 'enc:secret', password: 'pw' });
  });

  it('POST /api/v2/decrypt decode failure', async function () {
    const res = await agent.post('/api/v2/decrypt').send({ password: 'pw' });
    res.status.should.equal(400);
    sinon.assert.notCalled(decryptStub);
  });

  it('POST /api/v2/verifyaddress success', async function () {
    const res = await agent.post('/api/v2/verifyaddress').send({ address: 'addr1' });
    res.status.should.equal(200);
    res.body.should.have.property('verified', true);
    sinon.assert.calledOnce(verifyAddressStub);
  });

  it('POST /api/v2/verifyaddress decode failure - invalid address', async function () {
    const res = await agent.post('/api/v2/verifyaddress').send({ address: 42 });
    res.status.should.equal(400);
    sinon.assert.notCalled(verifyAddressStub);
  });

  it('POST /api/v1/wallets/simplecreate success', async function () {
    const res = await agent.post('/api/v1/wallets/simplecreate').send({ passphrase: 'pass' });
    res.status.should.equal(200);
    res.body.wallet.should.equal('wallet-id-123');
    sinon.assert.calledOnce(walletsStub);
  });

  it('POST /api/v1/wallets/simplecreate decode - missing passphrase', async function () {
    const res = await agent.post('/api/v1/wallets/simplecreate').send({});
    res.status.should.equal(400);
    sinon.assert.notCalled(walletsStub);
  });
});
