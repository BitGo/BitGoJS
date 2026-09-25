import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGo } from 'bitgo';
import { common, decodeOrElse } from '@bitgo/sdk-core';
import nock from 'nock';

import 'should-http';
import 'should-sinon';
import '../../lib/asserts';

import { ExpressApiRouteRequest } from '../../../src/typedRoutes/api';
import { handleV2GenerateSafe, handleV2GenerateSafeKeys, handleV2GenerateSafeWallet } from '../../../src/clientRoutes';
import { GenerateSafeResponse } from '../../../src/typedRoutes/api/v2/generateSafe';
import { GenerateSafeKeysResponse } from '../../../src/typedRoutes/api/v2/generateSafeKeys';
import { GenerateSafeWalletResponse } from '../../../src/typedRoutes/api/v2/generateSafeWallet';

const ENTERPRISE_ID = '6a217b164ae0ae10226a16569d3682ec';
const SAFE_ID = 'safe123';
const PASSPHRASE = 'mySecurePassphrase123';
const USER_ROOT_ID = 'tbtc-user-root';
const BACKUP_ROOT_ID = 'tbtc-backup-root';
const BITGO_ROOT_ID = 'tbtc-bitgo-root';

function safeDataWire(
  overrides: {
    label?: string;
    status?: string;
    rootKeys?: {
      hot?: {
        secp256k1Multisig?: [string, string, string];
      };
    };
  } = {}
) {
  return {
    id: SAFE_ID,
    enterpriseId: ENTERPRISE_ID,
    label: overrides.label ?? 'Test Safe',
    status: overrides.status ?? 'active',
    creator: 'user1',
    users: [{ userId: 'user1', permissions: ['admin', 'spend'] }],
    createdAt: '2026-07-07T00:00:00.000Z',
    rootKeys: overrides.rootKeys,
  };
}

function nockSecp256k1MultisigRootKeys(bgUrl: string) {
  return [
    nock(bgUrl)
      .post('/api/v2/tbtc/key', (body: { source?: string; safeId?: string }) => {
        return body.source === 'user' && body.safeId === SAFE_ID;
      })
      .reply(200, { id: USER_ROOT_ID }),
    nock(bgUrl)
      .post('/api/v2/tbtc/key', (body: { source?: string; safeId?: string }) => {
        return body.source === 'backup' && body.safeId === SAFE_ID;
      })
      .reply(200, { id: BACKUP_ROOT_ID }),
    nock(bgUrl)
      .post('/api/v2/tbtc/key', (body: { source?: string; safeId?: string }) => {
        return body.source === 'bitgo' && body.safeId === SAFE_ID;
      })
      .reply(200, { id: BITGO_ROOT_ID, pub: 'bitgo-pub' }),
  ];
}

describe('Generate Safe (typed handler)', () => {
  let bitgo: TestBitGoAPI;
  let bgUrl: string;

  before(async function () {
    if (!nock.isActive()) {
      nock.activate();
    }

    bitgo = TestBitGo.decorate(BitGo, { env: 'test' });
    bitgo.initializeTestVars();

    bgUrl = common.Environments[bitgo.getEnv()].uri;

    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });

  afterEach(() => {
    nock.cleanAll();
  });

  after(() => {
    if (nock.isActive()) {
      nock.restore();
    }
  });

  it('should initialize, mint the enabled secp256k1Multisig root, and finalize', async () => {
    const label = 'Test Safe';
    const initializeNock = nock(bgUrl)
      .post(`/api/v2/enterprise/${ENTERPRISE_ID}/safes`, { label })
      .reply(200, {
        id: SAFE_ID,
        status: 'initializing',
        enabledRootSlots: ['secp256k1Multisig'],
      });

    const keyNocks = nockSecp256k1MultisigRootKeys(bgUrl);

    const finalizeNock = nock(bgUrl)
      .post(`/api/v2/enterprise/${ENTERPRISE_ID}/safes/${SAFE_ID}/finalize`, (body: { rootKeys?: unknown }) => {
        return (
          JSON.stringify(body.rootKeys) ===
          JSON.stringify({
            hot: {
              secp256k1Multisig: [USER_ROOT_ID, BACKUP_ROOT_ID, BITGO_ROOT_ID],
            },
          })
        );
      })
      .reply(
        200,
        safeDataWire({
          label,
          rootKeys: {
            hot: {
              secp256k1Multisig: [USER_ROOT_ID, BACKUP_ROOT_ID, BITGO_ROOT_ID],
            },
          },
        })
      );

    const req = {
      bitgo,
      params: {
        enterpriseId: ENTERPRISE_ID,
      },
      query: {},
      body: {
        label,
        passphrase: PASSPHRASE,
      },
      decoded: {
        enterpriseId: ENTERPRISE_ID,
        label,
        passphrase: PASSPHRASE,
      },
    } as unknown as ExpressApiRouteRequest<'express.v2.safes.generate', 'post'>;

    const res = await handleV2GenerateSafe(req);
    decodeOrElse('GenerateSafeResponse', GenerateSafeResponse[200], JSON.parse(JSON.stringify(res)), (errors) => {
      throw new Error(`Response did not match expected codec: ${JSON.stringify(errors)}`);
    });

    res.should.have.property('id', SAFE_ID);
    res.should.have.property('label', label);
    res.should.have.property('status', 'active');

    initializeNock.done();
    keyNocks.forEach((scope) => scope.done());
    finalizeNock.done();
  });

  it('should archive the safe and throw when a root ceremony fails', async () => {
    const label = 'Test Safe';
    nock(bgUrl)
      .post(`/api/v2/enterprise/${ENTERPRISE_ID}/safes`, { label })
      .reply(200, {
        id: SAFE_ID,
        status: 'initializing',
        enabledRootSlots: ['secp256k1Multisig'],
      });

    nock(bgUrl)
      .post('/api/v2/tbtc/key', (body: { source?: string }) => body.source === 'user')
      .reply(500, { error: 'user key boom' });
    nock(bgUrl)
      .post('/api/v2/tbtc/key', (body: { source?: string }) => body.source === 'backup')
      .reply(200, { id: BACKUP_ROOT_ID });
    nock(bgUrl)
      .post('/api/v2/tbtc/key', (body: { source?: string }) => body.source === 'bitgo')
      .reply(200, { id: BITGO_ROOT_ID, pub: 'bitgo-pub' });

    const archiveNock = nock(bgUrl)
      .post(`/api/v2/enterprise/${ENTERPRISE_ID}/safes/${SAFE_ID}/archive`)
      .reply(200, safeDataWire({ status: 'archived' }));

    const req = {
      bitgo,
      params: {
        enterpriseId: ENTERPRISE_ID,
      },
      query: {},
      body: {
        label,
        passphrase: PASSPHRASE,
      },
      decoded: {
        enterpriseId: ENTERPRISE_ID,
        label,
        passphrase: PASSPHRASE,
      },
    } as unknown as ExpressApiRouteRequest<'express.v2.safes.generate', 'post'>;

    await handleV2GenerateSafe(req).should.be.rejectedWith(/has been archived/);
    archiveNock.done();
  });

  it('should run Phase-2 key ceremonies for an already-initialized safe', async () => {
    const keyNocks = nockSecp256k1MultisigRootKeys(bgUrl);

    const req = {
      bitgo,
      params: {
        enterpriseId: ENTERPRISE_ID,
        safeId: SAFE_ID,
      },
      query: {},
      body: {
        passphrase: PASSPHRASE,
        enabledRootSlots: ['secp256k1Multisig'],
      },
      decoded: {
        enterpriseId: ENTERPRISE_ID,
        safeId: SAFE_ID,
        passphrase: PASSPHRASE,
        enabledRootSlots: ['secp256k1Multisig' as const],
      },
    } as unknown as ExpressApiRouteRequest<'express.v2.safes.keys.generate', 'post'>;

    const res = await handleV2GenerateSafeKeys(req);
    decodeOrElse('GenerateSafeKeysResponse', GenerateSafeKeysResponse[200], res, (errors) => {
      throw new Error(`Response did not match expected codec: ${JSON.stringify(errors)}`);
    });

    res.should.have.property('rootKeys');
    res.rootKeys.should.have.property('hot');
    res.rootKeys.hot.should.have.property('secp256k1Multisig', [USER_ROOT_ID, BACKUP_ROOT_ID, BITGO_ROOT_ID]);

    keyNocks.forEach((scope) => scope.done());
  });

  it('should mint an onchain child wallet from a safe', async () => {
    const label = 'Safe Child';
    const walletId = 'wallet-from-safe';
    const childKeyId = 'tbtc-child-user';
    const userKeyPair = bitgo.coin('tbtc').keychains().create();
    const encryptedPrv = await bitgo.encrypt({ input: userKeyPair.prv, password: PASSPHRASE });

    const getSafeNock = nock(bgUrl)
      .get(`/api/v2/enterprise/${ENTERPRISE_ID}/safes/${SAFE_ID}`)
      .reply(
        200,
        safeDataWire({
          rootKeys: {
            hot: {
              secp256k1Multisig: [USER_ROOT_ID, BACKUP_ROOT_ID, BITGO_ROOT_ID],
            },
          },
        })
      );

    const derivationNock = nock(bgUrl)
      .get(`/api/v2/enterprise/${ENTERPRISE_ID}/safes/${SAFE_ID}/derivation-index`)
      .query({ slot: 'secp256k1Multisig' })
      .reply(200, { slot: 'secp256k1Multisig', index: 0 });

    const getRootKeyNock = nock(bgUrl).get(`/api/v2/tbtc/key/${USER_ROOT_ID}`).reply(200, {
      id: USER_ROOT_ID,
      pub: userKeyPair.pub,
      source: 'user',
      encryptedPrv,
    });

    const addChildNock = nock(bgUrl)
      .post('/api/v2/tbtc/key', (body: { parent?: string; safeId?: string; source?: string }) => {
        return body.parent === USER_ROOT_ID && body.safeId === SAFE_ID && body.source === 'user';
      })
      .reply(200, { id: childKeyId });

    const mintNock = nock(bgUrl)
      .post(`/api/v2/enterprise/${ENTERPRISE_ID}/safes/${SAFE_ID}/wallets`, {
        coin: 'tbtc',
        label,
        type: 'hot',
        multisigType: 'onchain',
        keys: [childKeyId],
      })
      .reply(200, {
        id: walletId,
        label,
        coin: 'tbtc',
        keys: [childKeyId],
        type: 'hot',
        multisigType: 'onchain',
      });

    const req = {
      bitgo,
      params: {
        enterpriseId: ENTERPRISE_ID,
        safeId: SAFE_ID,
      },
      query: {},
      body: {
        coin: 'tbtc',
        label,
        passphrase: PASSPHRASE,
      },
      decoded: {
        enterpriseId: ENTERPRISE_ID,
        safeId: SAFE_ID,
        coin: 'tbtc',
        label,
        passphrase: PASSPHRASE,
      },
    } as unknown as ExpressApiRouteRequest<'express.v2.safes.wallet.generate', 'post'>;

    const res = await handleV2GenerateSafeWallet(req);
    decodeOrElse('GenerateSafeWalletResponse', GenerateSafeWalletResponse[200], res, (errors) => {
      throw new Error(`Response did not match expected codec: ${JSON.stringify(errors)}`);
    });

    res.should.have.property('id', walletId);
    res.should.have.property('label', label);
    res.should.have.property('coin', 'tbtc');

    getSafeNock.done();
    derivationNock.done();
    getRootKeyNock.done();
    addChildNock.done();
    mintNock.done();
  });
});
