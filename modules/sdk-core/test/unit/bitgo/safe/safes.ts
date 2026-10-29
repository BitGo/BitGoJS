import * as sinon from 'sinon';
import 'should';
import { InitializeSafeResponse } from '@bitgo/public-types';
import { bip32 } from '@bitgo/utxo-lib';
import { Enterprise, Safe, SafeKeys, Safes, encodeEd25519StrKeyPublicKey } from '../../../../src';

/** A derivable slot-④ root: raw 32-byte public key plus raw 32-byte chain code in base32. */
const COMPOSITE_BACKUP_PUB =
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKXK5LVOV2XKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

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

    it('sends externalBackupSlots and decodes them from the response', async function () {
      const wire = { id: 'test-safe-id', status: 'initializing', externalBackupSlots: ['secp256k1Multisig'] };
      const send = sinon.stub().returns({ result: sinon.stub().resolves(wire) });
      mockBitGo.post.returns({ send });

      const result = await safes.initializeSafe({ label: 'my safe', externalBackupSlots: ['secp256k1Multisig'] });

      sinon.assert.calledWith(send, { label: 'my safe', externalBackupSlots: ['secp256k1Multisig'] });
      result.externalBackupSlots?.should.deepEqual(['secp256k1Multisig']);
    });

    it('rejects an MPC slot in externalBackupSlots before sending anything', async function () {
      const send = sinon.stub().returns({ result: sinon.stub().resolves({}) });
      mockBitGo.post.returns({ send });

      await safes.initializeSafe({ label: 'my safe', externalBackupSlots: ['ecdsaMpc'] as any }).should.be.rejected();
      sinon.assert.notCalled(send);
    });

    it('decodes enabledRootSlots when the server returns them', async function () {
      const initializeResponseWire = {
        id: 'test-safe-id',
        status: 'initializing',
        enabledRootSlots: ['secp256k1Multisig', 'ecdsaMpc'],
      };
      const send = sinon.stub().returns({ result: sinon.stub().resolves(initializeResponseWire) });
      mockBitGo.post.returns({ send });

      const result = await safes.initializeSafe({ label: 'my safe' });

      if (result.enabledRootSlots === undefined) {
        throw new Error('expected enabledRootSlots');
      }
      result.enabledRootSlots.should.deepEqual(['secp256k1Multisig', 'ecdsaMpc']);
    });
  });

  // A real account-level (depth 3) xpub and its private counterpart. BitGo encodes every coin's keys
  // as xpub/xprv, testnet roots included.
  const EXTERNAL_PRV_ROOT = bip32.fromSeed(Buffer.alloc(32, 0x09)).derivePath("m/44'/0'/0'");
  const EXTERNAL_XPUB = EXTERNAL_PRV_ROOT.neutered().toBase58();
  const EXTERNAL_XPRV = EXTERNAL_PRV_ROOT.toBase58();
  // Slot ④ caller key as a Stellar StrKey, the format a caller's HSM or wallet usually exports.
  const ED25519_STRKEY = encodeEd25519StrKeyPublicKey(Buffer.alloc(32, 7));

  describe('createSafeKeys', function () {
    // Per-coin keychains() mock: multisig coins use create/add/createBackup/createBitGo; MPC coins
    // use createMpc. Ids are derived from the coin name so we can assert per-slot coin routing.
    function makeKeychains(coin: string) {
      return {
        create: sinon.stub().returns({ pub: `${coin}-pub`, prv: `${coin}-prv` }),
        add: sinon.stub().resolves({ id: `${coin}-user` }),
        // txlm is the ed25519Multisig root coin, so its backup pub is neutral raw derivation material.
        createBackup: sinon.stub().resolves({
          id: `${coin}-backup`,
          ...(coin === 'txlm' || coin === 'xlm' ? { pub: COMPOSITE_BACKUP_PUB } : {}),
        }),
        createBitGo: sinon.stub().resolves({
          id: `${coin}-bitgo`,
          ...(coin === 'txlm' || coin === 'xlm' ? { pub: COMPOSITE_BACKUP_PUB } : {}),
        }),
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
        // mirrors the real utxo coin check: a base58 key that is neutered (an xpub, never an xprv)
        return {
          keychains: () => keychainsByCoin[name],
          isValidPub: (pub: string) => {
            try {
              return bip32.fromBase58(pub).isNeutered();
            } catch (e) {
              return false;
            }
          },
        };
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

    it('rejects an ed25519Multisig backup root that came back non-derivable', async function () {
      // A bare Stellar StrKey is not the neutral raw root format.
      keychainsByCoin['txlm'] = makeKeychains('txlm');
      keychainsByCoin['txlm'].createBackup.resolves({
        id: 'txlm-backup',
        pub: 'GA5WUJ54Z23KILLCUOUNAKTPBVZWKMQVO4O6EQ5GHLAERIMLLHNCSKYH',
      });

      await safes
        .createSafeKeys({ label: 'my safe', passphrase: 'pw', safeId: 'safe-1' })
        .should.be.rejectedWith(/ed25519Multisig roots are not derivable/);
    });

    it('rejects an ed25519Multisig BitGo root that came back non-derivable', async function () {
      // The BitGo root is composed server-side; if it ever comes back as a bare Stellar StrKey
      // instead of the neutral raw root format, wallets minted from it are unrecoverable.
      keychainsByCoin['txlm'] = makeKeychains('txlm');
      keychainsByCoin['txlm'].createBitGo.resolves({
        id: 'txlm-bitgo',
        pub: 'GA5WUJ54Z23KILLCUOUNAKTPBVZWKMQVO4O6EQ5GHLAERIMLLHNCSKYH',
      });

      await safes
        .createSafeKeys({ label: 'my safe', passphrase: 'pw', safeId: 'safe-1' })
        .should.be.rejectedWith(/ed25519Multisig roots are not derivable/);
    });

    it('does not apply the derivable check to the secp256k1Multisig slot', async function () {
      // Slot ① backup roots are xpubs, which already carry a chain code and are never composed.
      keychainsByCoin['tbtc'] = makeKeychains('tbtc');
      keychainsByCoin['tbtc'].createBackup.resolves({ id: 'tbtc-backup' });

      await safes.createSafeKeys({ label: 'my safe', passphrase: 'pw', safeId: 'safe-1' }).should.be.fulfilled();
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
      keychainsByCoin['txlm'].createBitGo = gated({ id: 'txlm-bitgo', pub: COMPOSITE_BACKUP_PUB });
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

    it('runs only the enabled ceremonies when enabledRootSlots is a subset', async function () {
      const result = await safes.createSafeKeys({
        label: 'my safe',
        passphrase: 'pw',
        safeId: 'safe-1',
        enabledRootSlots: ['ecdsaMpc', 'eddsaMpc'],
      });

      result.should.deepEqual({
        rootKeys: {
          hot: {
            ecdsaMpc: ['hteth-user', 'hteth-backup', 'hteth-bitgo'],
            eddsaMpc: ['tsol-user', 'tsol-backup', 'tsol-bitgo'],
          },
        },
      });
      keychainsByCoin.should.not.have.property('tbtc');
      keychainsByCoin.should.not.have.property('txlm');
    });

    describe('external (BYOK) backup roots', function () {
      const archiveOk = () => {
        const send = sinon.stub().returns({ result: sinon.stub().resolves({ ...safeDataWire, status: 'archived' }) });
        mockBitGo.post.returns({ send });
      };

      it('registers a supplied secp256k1 backup xpub as a pub-only backup key and never generates one', async function () {
        const result = await safes.createSafeKeys({
          label: 'my safe',
          passphrase: 'pw',
          safeId: 'safe-1',
          multisigRoots: { secp256k1Multisig: { backupXpub: EXTERNAL_XPUB } },
          externalBackupSlots: ['secp256k1Multisig'],
        });

        const btc = keychainsByCoin['tbtc'];
        sinon.assert.notCalled(btc.createBackup);
        sinon.assert.calledWith(btc.add, {
          pub: EXTERNAL_XPUB,
          source: 'backup',
          safeId: 'safe-1',
          enterprise: 'test-enterprise-id',
        });
        // user key add is untouched, and the other slots still generate a local backup
        sinon.assert.calledWithMatch(btc.add, { source: 'user', safeId: 'safe-1' });
        sinon.assert.calledWithMatch(keychainsByCoin['txlm'].createBackup, { passphrase: 'pw', safeId: 'safe-1' });
        result.rootKeys.hot.secp256k1Multisig?.should.deepEqual(['tbtc-user', 'tbtc-user', 'tbtc-bitgo']);
      });

      it('converts a slot ④ StrKey into the derivable format before registering it', async function () {
        keychainsByCoin['txlm'] = makeKeychains('txlm');
        keychainsByCoin['txlm'].add = sinon
          .stub()
          .callsFake(async (params: any) => ({ id: 'txlm-user', pub: params.pub }));

        await safes.createSafeKeys({
          label: 'my safe',
          passphrase: 'pw',
          safeId: 'safe-1',
          multisigRoots: { ed25519Multisig: { backupXpub: ED25519_STRKEY } },
          externalBackupSlots: ['ed25519Multisig'],
        });

        const txlm = keychainsByCoin['txlm'];
        sinon.assert.notCalled(txlm.createBackup);
        const backupAdd = txlm.add.getCalls().find((call: any) => call.args[0].source === 'backup');
        if (!backupAdd) {
          throw new Error('expected the backup key to be added');
        }
        backupAdd.args[0].pub.should.have.length(103);
        // the derivable pub starts with the caller's raw public key, followed by the fresh chain code
        backupAdd.args[0].pub.should.not.equal(ED25519_STRKEY);
        sinon.assert.calledWithMatch(txlm.add, {
          source: 'backup',
          safeId: 'safe-1',
          enterprise: 'test-enterprise-id',
        });
      });

      it('registers an already-derivable slot ④ pub as is', async function () {
        keychainsByCoin['txlm'] = makeKeychains('txlm');
        keychainsByCoin['txlm'].add = sinon
          .stub()
          .callsFake(async (params: any) => ({ id: 'txlm-user', pub: params.pub }));

        await safes.createSafeKeys({
          label: 'my safe',
          passphrase: 'pw',
          safeId: 'safe-1',
          multisigRoots: { ed25519Multisig: { backupXpub: COMPOSITE_BACKUP_PUB } },
          externalBackupSlots: ['ed25519Multisig'],
        });

        sinon.assert.calledWithMatch(keychainsByCoin['txlm'].add, { pub: COMPOSITE_BACKUP_PUB, source: 'backup' });
      });

      it('rejects a slot ④ backup that is not an ed25519 key before creating any key for the slot', async function () {
        archiveOk();
        await safes
          .createSafeKeys({
            label: 'my safe',
            passphrase: 'pw',
            safeId: 'safe-1',
            multisigRoots: { ed25519Multisig: { backupXpub: 'not-a-key' } },
            externalBackupSlots: ['ed25519Multisig'],
            enabledRootSlots: ['ed25519Multisig'],
          })
          .should.be.rejectedWith(
            /Safe key generation failed for 1 root.*ed25519Multisig backupXpub must be an ed25519/
          );
        sinon.assert.notCalled(keychainsByCoin['txlm'].add);
        sinon.assert.notCalled(keychainsByCoin['txlm'].createBitGo);
      });

      it('rejects a private key as the slot ① backup and creates no key for the slot', async function () {
        archiveOk();
        await safes
          .createSafeKeys({
            label: 'my safe',
            passphrase: 'pw',
            safeId: 'safe-1',
            multisigRoots: { secp256k1Multisig: { backupXpub: EXTERNAL_XPRV } },
            externalBackupSlots: ['secp256k1Multisig'],
            enabledRootSlots: ['secp256k1Multisig'],
          })
          .should.be.rejectedWith(/backupXpub must be a valid xpub/);
        sinon.assert.notCalled(keychainsByCoin['tbtc'].add);
        sinon.assert.notCalled(keychainsByCoin['tbtc'].createBitGo);
      });

      it('throws and archives when a backup key is supplied for a slot the server did not declare', async function () {
        archiveOk();
        await safes
          .createSafeKeys({
            label: 'my safe',
            passphrase: 'pw',
            safeId: 'safe-1',
            multisigRoots: { secp256k1Multisig: { backupXpub: EXTERNAL_XPUB } },
          })
          .should.be.rejectedWith(/supplied but not declared at initialize: secp256k1Multisig.*has been archived/);
        sinon.assert.calledWith(mockBitGo.post, '/enterprise/test-enterprise-id/safes/safe-1/archive');
        keychainsByCoin.should.not.have.property('tbtc');
      });

      it('throws when the server declared an external slot but no backup key was supplied', async function () {
        archiveOk();
        await safes
          .createSafeKeys({
            label: 'my safe',
            passphrase: 'pw',
            safeId: 'safe-1',
            externalBackupSlots: ['ed25519Multisig'],
          })
          .should.be.rejectedWith(/declared at initialize but no backup key supplied: ed25519Multisig/);
      });

      it('throws when the supplied slot is not an enabled slot', async function () {
        archiveOk();
        await safes
          .createSafeKeys({
            label: 'my safe',
            passphrase: 'pw',
            safeId: 'safe-1',
            multisigRoots: { secp256k1Multisig: { backupXpub: EXTERNAL_XPUB } },
            externalBackupSlots: ['secp256k1Multisig'],
            enabledRootSlots: ['ed25519Multisig'],
          })
          .should.be.rejectedWith(/slot that is not enabled: secp256k1Multisig/);
      });

      it('rejects a non-multisig key in multisigRoots, so an MPC ceremony never sees the option', async function () {
        await safes
          .createSafeKeys({
            label: 'my safe',
            passphrase: 'pw',
            safeId: 'safe-1',
            multisigRoots: { ecdsaMpc: { backupXpub: EXTERNAL_XPUB } } as any,
          })
          .should.be.rejectedWith(/multisigRoots only supports the multisig slots.*ecdsaMpc/);
        keychainsByCoin.should.not.have.property('hteth');
      });

      it('passes no external option to the MPC ceremonies', async function () {
        await safes.createSafeKeys({
          label: 'my safe',
          passphrase: 'pw',
          safeId: 'safe-1',
          multisigRoots: { secp256k1Multisig: { backupXpub: EXTERNAL_XPUB } },
          externalBackupSlots: ['secp256k1Multisig'],
        });

        for (const coin of ['hteth', 'tsol']) {
          const callArgs = keychainsByCoin[coin].createMpc.firstCall.args[0];
          Object.keys(callArgs).should.deepEqual(['multisigType', 'passphrase', 'enterprise', 'safeId']);
        }
      });

      it('rejects an empty backupXpub', async function () {
        await safes
          .createSafeKeys({
            label: 'my safe',
            passphrase: 'pw',
            safeId: 'safe-1',
            multisigRoots: { secp256k1Multisig: { backupXpub: '' } },
          })
          .should.be.rejectedWith(/multisigRoots.secp256k1Multisig.backupXpub must be a non-empty string/);
      });
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
    it('chains initialize → createSafeKeys → finalize, threading the safeId and enabledRootSlots', async function () {
      const initializing: InitializeSafeResponse = {
        id: 'test-safe-id',
        status: 'initializing',
        enabledRootSlots: ['ecdsaMpc', 'eddsaMpc'],
      };
      const rootKeys: SafeKeys = { rootKeys: { hot: {} } };
      const initStub = sinon.stub(safes, 'initializeSafe').resolves(initializing);
      const keysStub = sinon.stub(safes, 'createSafeKeys').resolves(rootKeys);
      const finalizeStub = sinon.stub(safes, 'finalizeSafe').resolves(new Safe(mockBitGo, safeDataWire as any));

      const result = await safes.generateSafe({ label: 'my safe', passphrase: 'pw' });

      sinon.assert.calledWithMatch(initStub, { label: 'my safe' });
      sinon.assert.calledWithMatch(keysStub, {
        label: 'my safe',
        passphrase: 'pw',
        safeId: 'test-safe-id',
        enabledRootSlots: ['ecdsaMpc', 'eddsaMpc'],
      });
      sinon.assert.calledWith(finalizeStub, 'test-safe-id', rootKeys);
      sinon.assert.callOrder(initStub, keysStub, finalizeStub);
      result.status().should.equal('active');
      // no multisigRoots: initialize carries only the label, as before
      sinon.assert.calledWith(initStub, { label: 'my safe' });
    });

    it('declares the supplied backup slots at initialize and threads the server echo into the ceremonies', async function () {
      const initializing: InitializeSafeResponse = {
        id: 'test-safe-id',
        status: 'initializing',
        externalBackupSlots: ['ed25519Multisig', 'secp256k1Multisig'],
      };
      const initStub = sinon.stub(safes, 'initializeSafe').resolves(initializing);
      const keysStub = sinon.stub(safes, 'createSafeKeys').resolves({ rootKeys: { hot: {} } });
      sinon.stub(safes, 'finalizeSafe').resolves(new Safe(mockBitGo, safeDataWire as any));
      const multisigRoots = {
        secp256k1Multisig: { backupXpub: EXTERNAL_XPUB },
        ed25519Multisig: { backupXpub: ED25519_STRKEY },
      };

      await safes.generateSafe({ label: 'my safe', passphrase: 'pw', multisigRoots });

      // declared in canonical slot order, whatever order the caller listed them in
      sinon.assert.calledWith(initStub, {
        label: 'my safe',
        externalBackupSlots: ['secp256k1Multisig', 'ed25519Multisig'],
      });
      sinon.assert.calledWithMatch(keysStub, {
        label: 'my safe',
        passphrase: 'pw',
        safeId: 'test-safe-id',
        multisigRoots,
        externalBackupSlots: ['ed25519Multisig', 'secp256k1Multisig'],
      });
    });

    it('rejects an invalid multisigRoots before initializing, so no safe is created', async function () {
      const initStub = sinon.stub(safes, 'initializeSafe');

      await safes
        .generateSafe({ label: 'my safe', passphrase: 'pw', multisigRoots: { eddsaMpc: { backupXpub: 'x' } } as any })
        .should.be.rejectedWith(/multisigRoots only supports the multisig slots/);
      sinon.assert.notCalled(initStub);
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
