import * as sinon from 'sinon';
import 'should';
import { Enterprise, Safe, Safes } from '../../../../src';

describe('Safes', function () {
  let safes: Safes;
  let mockBitGo: any;
  const safeDataWire = {
    id: 'test-safe-id',
    enterpriseId: 'test-enterprise-id',
    label: 'my safe',
    status: 'active',
    creator: 'creator-id',
    users: [{ userId: 'creator-id', permissions: ['admin', 'spend'] }],
    createdAt: '2026-07-07T00:00:00.000Z',
  };

  beforeEach(function () {
    mockBitGo = {
      url: sinon.stub().callsFake((path: string) => path),
      post: sinon.stub(),
    };
    safes = new Safes(mockBitGo, 'test-enterprise-id');
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('initializeSafe', function () {
    it('POSTs to the safes collection URL and returns the initializing id/status', async function () {
      const initializeResponseWire = { id: 'test-safe-id', status: 'initializing' };
      const send = sinon.stub().returns({ result: sinon.stub().resolves(initializeResponseWire) });
      mockBitGo.post.returns({ send });

      const result = await safes.initializeSafe({ label: 'my safe' });

      result.id.should.equal('test-safe-id');
      result.status.should.equal('initializing');
      sinon.assert.calledWith(mockBitGo.post, '/enterprise/test-enterprise-id/safes');
      sinon.assert.calledWith(send, { label: 'my safe' });
    });
  });

  describe('createSafeKeys', function () {
    // Per-coin keychains() mock: multisig coins use create/add/createBackup/createBitGo; MPC coins
    // use createMpc. Ids are derived from the coin name so we can assert per-slot coin routing.
    function makeKeychains(coin: string) {
      return {
        create: sinon.stub().returns({ pub: `${coin}-pub`, prv: `${coin}-prv` }),
        add: sinon.stub().resolves({ id: `${coin}-user` }),
        createBackup: sinon.stub().resolves({ id: `${coin}-backup` }),
        createBitGo: sinon.stub().resolves({ id: `${coin}-bitgo` }),
        createMpc: sinon.stub().resolves({
          userKeychain: { id: `${coin}-user` },
          backupKeychain: { id: `${coin}-backup` },
          bitgoKeychain: { id: `${coin}-bitgo` },
        }),
      };
    }

    let keychainsByCoin: Record<string, ReturnType<typeof makeKeychains>>;

    beforeEach(function () {
      keychainsByCoin = {};
      mockBitGo.getEnv = sinon.stub().returns('test'); // testnet coin map
      mockBitGo.encrypt = sinon.stub().resolves('encrypted-prv');
      mockBitGo.coin = sinon.stub().callsFake((name: string) => {
        keychainsByCoin[name] = keychainsByCoin[name] || makeKeychains(name);
        return { keychains: () => keychainsByCoin[name] };
      });
    });

    it('runs the 4 root ceremonies and returns 12 ids as ordered triplets', async function () {
      const result = await safes.createSafeKeys({ label: 'my safe', passphrase: 'pw', safeId: 'safe-1' });

      result.should.deepEqual({
        rootKeys: {
          hot: {
            secp256k1Multisig: ['tbtc-user', 'tbtc-backup', 'tbtc-bitgo'],
            ecdsaMpc: ['hteth-user', 'hteth-backup', 'hteth-bitgo'],
            eddsaMpc: ['tsol-user', 'tsol-backup', 'tsol-bitgo'],
            ed25519Multisig: ['txlm-user', 'txlm-backup', 'txlm-bitgo'],
          },
        },
      });
    });

    it('tags every multisig key registration with safeId and the correct source', async function () {
      await safes.createSafeKeys({ label: 'my safe', passphrase: 'pw', safeId: 'safe-1' });

      const btc = keychainsByCoin['tbtc'];
      sinon.assert.calledWithMatch(btc.add, {
        pub: 'tbtc-pub',
        encryptedPrv: 'encrypted-prv',
        source: 'user',
        safeId: 'safe-1',
      });
      sinon.assert.calledWithMatch(btc.createBackup, { passphrase: 'pw', safeId: 'safe-1' });
      sinon.assert.calledWithMatch(btc.createBitGo, { enterprise: 'test-enterprise-id', safeId: 'safe-1' });
    });

    it('threads safeId + enterprise into both MPC ceremonies', async function () {
      await safes.createSafeKeys({ label: 'my safe', passphrase: 'pw', safeId: 'safe-1' });

      sinon.assert.calledWithMatch(keychainsByCoin['hteth'].createMpc, {
        multisigType: 'tss',
        passphrase: 'pw',
        enterprise: 'test-enterprise-id',
        safeId: 'safe-1',
      });
      sinon.assert.calledWithMatch(keychainsByCoin['tsol'].createMpc, {
        multisigType: 'tss',
        passphrase: 'pw',
        enterprise: 'test-enterprise-id',
        safeId: 'safe-1',
      });
    });

    it('selects mainnet coins in a prod environment', async function () {
      mockBitGo.getEnv = sinon.stub().returns('prod');
      await safes.createSafeKeys({ label: 'my safe', passphrase: 'pw', safeId: 'safe-1' });

      sinon.assert.calledWith(mockBitGo.coin, 'btc');
      sinon.assert.calledWith(mockBitGo.coin, 'eth');
      sinon.assert.calledWith(mockBitGo.coin, 'sol');
      sinon.assert.calledWith(mockBitGo.coin, 'xlm');
    });

    it('runs the 4 root ceremonies in parallel (none awaits another)', async function () {
      // Gate exactly one call per root on a shared latch that only opens once all 4 roots have
      // entered. If the roots ran sequentially, the first would await the latch forever → the
      // test would time out; completing proves all 4 were in flight concurrently.
      let release: () => void = () => undefined;
      const gate = new Promise<void>((resolve) => (release = resolve));
      let started = 0;
      const gated = (result: any) =>
        sinon.stub().callsFake(async () => {
          if (++started === 4) {
            release();
          }
          await gate;
          return result;
        });
      // one gated entry point per root: multisig roots via createBitGo, MPC roots via createMpc
      keychainsByCoin['tbtc'] = makeKeychains('tbtc');
      keychainsByCoin['tbtc'].createBitGo = gated({ id: 'tbtc-bitgo' });
      keychainsByCoin['txlm'] = makeKeychains('txlm');
      keychainsByCoin['txlm'].createBitGo = gated({ id: 'txlm-bitgo' });
      keychainsByCoin['hteth'] = makeKeychains('hteth');
      keychainsByCoin['hteth'].createMpc = gated({
        userKeychain: { id: 'hteth-user' },
        backupKeychain: { id: 'hteth-backup' },
        bitgoKeychain: { id: 'hteth-bitgo' },
      });
      keychainsByCoin['tsol'] = makeKeychains('tsol');
      keychainsByCoin['tsol'].createMpc = gated({
        userKeychain: { id: 'tsol-user' },
        backupKeychain: { id: 'tsol-backup' },
        bitgoKeychain: { id: 'tsol-bitgo' },
      });

      await safes.createSafeKeys({ label: 'my safe', passphrase: 'pw', safeId: 'safe-1' });
      started.should.equal(4);
    });

    it('archives the safe and throws listing every failed ceremony', async function () {
      // Two ceremonies fail (an MPC and a multisig root).
      keychainsByCoin['hteth'] = makeKeychains('hteth');
      keychainsByCoin['hteth'].createMpc = sinon.stub().rejects(new Error('dkls boom'));
      keychainsByCoin['txlm'] = makeKeychains('txlm');
      keychainsByCoin['txlm'].createBitGo = sinon.stub().rejects(new Error('bitgo key boom'));
      // archive succeeds, returning a valid (archived) SafeData
      const send = sinon.stub().returns({
        result: sinon.stub().resolves({ ...safeDataWire, status: 'archived' }),
      });
      mockBitGo.post.returns({ send });

      const err = await safes
        .createSafeKeys({ label: 'my safe', passphrase: 'pw', safeId: 'safe-1' })
        .should.be.rejectedWith(/Safe key generation failed for 2 root/);
      err.message.should.match(/ecdsaMpc: dkls boom/);
      err.message.should.match(/ed25519Multisig: bitgo key boom/);
      err.message.should.match(/has been archived/);
      err.message.should.not.match(/archiving the safe also failed/);
      sinon.assert.calledWith(mockBitGo.post, '/enterprise/test-enterprise-id/safes/safe-1/archive');
    });

    it('notes when archiving also fails', async function () {
      keychainsByCoin['tsol'] = makeKeychains('tsol');
      keychainsByCoin['tsol'].createMpc = sinon.stub().rejects(new Error('eddsa boom'));
      mockBitGo.post.returns({
        send: sinon.stub().returns({ result: sinon.stub().rejects(new Error('archive 500')) }),
      });

      await safes
        .createSafeKeys({ label: 'my safe', passphrase: 'pw', safeId: 'safe-1' })
        .should.be.rejectedWith(/archiving the safe also failed \(archive 500\).*archive it manually/);
    });
  });

  describe('finalizeSafe', function () {
    const rootKeys = {
      hot: {
        secp256k1Multisig: ['u1', 'b1', 'g1'] as [string, string, string],
        ecdsaMpc: ['u2', 'b2', 'g2'] as [string, string, string],
        eddsaMpc: ['u3', 'b3', 'g3'] as [string, string, string],
        ed25519Multisig: ['u4', 'b4', 'g4'] as [string, string, string],
      },
    };

    it('POSTs the rootKeys to the finalize URL and returns the active Safe', async function () {
      const send = sinon.stub().returns({ result: sinon.stub().resolves(safeDataWire) });
      mockBitGo.post.returns({ send });

      const result = await safes.finalizeSafe('test-safe-id', { rootKeys });

      result.should.be.instanceof(Safe);
      result.status().should.equal('active');
      sinon.assert.calledWith(mockBitGo.post, '/enterprise/test-enterprise-id/safes/test-safe-id/finalize');
      sinon.assert.calledWithMatch(send, { rootKeys });
    });
  });

  describe('archiveSafe', function () {
    it('POSTs to the archive URL and returns the archived Safe', async function () {
      const send = sinon.stub().returns({ result: sinon.stub().resolves({ ...safeDataWire, status: 'archived' }) });
      mockBitGo.post.returns({ send });

      const result = await safes.archiveSafe('test-safe-id');

      result.should.be.instanceof(Safe);
      result.status().should.equal('archived');
      sinon.assert.calledWith(mockBitGo.post, '/enterprise/test-enterprise-id/safes/test-safe-id/archive');
    });
  });

  describe('generateSafe', function () {
    it('chains initialize → createSafeKeys → finalize, threading the safeId', async function () {
      const initializing = { id: 'test-safe-id', status: 'initializing' as const };
      const rootKeys = { rootKeys: { hot: {} } } as any;
      const initStub = sinon.stub(safes, 'initializeSafe').resolves(initializing);
      const keysStub = sinon.stub(safes, 'createSafeKeys').resolves(rootKeys);
      const finalizeStub = sinon.stub(safes, 'finalizeSafe').resolves(new Safe(mockBitGo, safeDataWire as any));

      const result = await safes.generateSafe({ label: 'my safe', passphrase: 'pw' });

      sinon.assert.calledWithMatch(initStub, { label: 'my safe' });
      sinon.assert.calledWithMatch(keysStub, { label: 'my safe', passphrase: 'pw', safeId: 'test-safe-id' });
      sinon.assert.calledWith(finalizeStub, 'test-safe-id', rootKeys);
      sinon.assert.callOrder(initStub, keysStub, finalizeStub);
      result.status().should.equal('active');
    });
  });

  describe('get', function () {
    it('GETs the safe URL and returns a Safe', async function () {
      mockBitGo.get = sinon.stub().returns({ result: sinon.stub().resolves(safeDataWire) });

      const result = await safes.get({ id: 'test-safe-id' });

      result.should.be.instanceof(Safe);
      result.id().should.equal('test-safe-id');
      sinon.assert.calledWith(mockBitGo.get, '/enterprise/test-enterprise-id/safes/test-safe-id');
    });
  });

  describe('list', function () {
    it('GETs the safes collection and maps the response to Safes', async function () {
      const query = sinon.stub().returnsThis();
      const result = sinon.stub().resolves({ safes: [safeDataWire], nextBatchPrevId: 'next-page-id' });
      mockBitGo.get = sinon.stub().returns({ query, result });

      const page = await safes.list();

      page.safes.should.have.length(1);
      page.safes[0].should.be.instanceof(Safe);
      page.safes[0].id().should.equal('test-safe-id');
      page.should.have.property('nextCursor', 'next-page-id');
      sinon.assert.calledWith(mockBitGo.get, '/enterprise/test-enterprise-id/safes');
      // no cursor/limit passed → empty query
      sinon.assert.calledWith(query, {});
    });

    it('maps cursor→prevId and limit onto the query', async function () {
      const query = sinon.stub().returnsThis();
      const result = sinon.stub().resolves({ safes: [] });
      mockBitGo.get = sinon.stub().returns({ query, result });

      const page = await safes.list({ cursor: 'prev-page-id', limit: 50 });

      page.safes.should.have.length(0);
      // absent nextBatchPrevId → undefined nextCursor (last page)
      (page.nextCursor === undefined).should.be.true();
      sinon.assert.calledWith(query, { limit: 50, prevId: 'prev-page-id' });
    });
  });

  describe('Enterprise.safes() accessor', function () {
    it('returns a Safes instance scoped to the enterprise', function () {
      const enterprise = new Enterprise(mockBitGo, {} as any, { id: 'ent-id', name: 'ent' });
      enterprise.safes().should.be.instanceof(Safes);
    });
  });
});
