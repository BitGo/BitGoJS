import assert from 'node:assert/strict';
import * as utxolib from '@bitgo/utxo-lib';
import type { BitGoAPI } from '@bitgo/sdk-api';

import { networkForCoin } from './bitgo-api-helpers';
import {
  fetchAwaitingSignatureExport,
  ovcSigningEnabled,
  ovcUploadEnabled,
  resolveOfflineCustodialSignature,
  uploadSignedApproval,
  type ResolveOfflineCustodialArgs,
} from './custodial-offline';
import { MatrixPrerequisite, type Cell, type Evidence } from './live-matrix';
import type { OvcSignerOutput } from './ovc-signer';

const CELL: Cell = { environment: 'test', coin: 'tbtcstxsignet', walletType: 'custodial' };
const APPROVAL_ID = 'pa-1';
const KEY_PASSWORD = 'unit-test-key-password';

function fakeBitGo(
  getHandler?: (url: string) => unknown,
  putHandler?: (url: string, body?: unknown) => unknown
): { bitgo: BitGoAPI; gets: { url: string }[]; puts: { url: string; body?: unknown }[] } {
  const gets: { url: string }[] = [];
  const puts: { url: string; body?: unknown }[] = [];
  const bitgo = {
    url: (path: string, version = 1) => `/api/v${version}${path}`,
    get: (url: string) => {
      gets.push({ url });
      return { result: async () => (getHandler ? getHandler(url) : undefined) };
    },
    put: (url: string) => {
      const entry: { url: string; body?: unknown } = { url };
      puts.push(entry);
      return {
        send: (payload: unknown) => {
          entry.body = payload;
          return { result: async () => (putHandler ? putHandler(url, entry.body) : undefined) };
        },
        result: async () => (putHandler ? putHandler(url) : undefined),
      };
    },
  } as unknown as BitGoAPI;
  return { bitgo, gets, puts };
}

function exportedTransaction(psbtHex: string): Record<string, unknown> {
  return {
    coin: 'tbtcstxsignet',
    pendingApprovalId: APPROVAL_ID,
    keyDerivationPath: '256659441783558',
    coinSpecific: { txHex: psbtHex },
  };
}

describe('Custodial offline loop (custodial-offline)', function () {
  let psbtHex: string;
  let txid: string;
  let recipient: string;
  let otherPsbtHex: string;

  before(function () {
    const network = networkForCoin('tbtcstxsignet');
    const pubkey = Buffer.from('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798', 'hex');
    const funding = utxolib.payments.p2wpkh({ pubkey, network });
    recipient = utxolib.payments.p2wpkh({ pubkey, network }).address!;
    const psbt = new utxolib.Psbt({ network });
    psbt.addInput({ hash: Buffer.alloc(32, 0x11), index: 0, witnessUtxo: { script: funding.output!, value: 40000n } });
    psbt.addOutput({ address: recipient, value: 30000n });
    psbtHex = psbt.toHex();
    txid = utxolib.bitgo.createPsbtFromBuffer(Buffer.from(psbtHex, 'hex'), network).getUnsignedTx().getId();
    const other = new utxolib.Psbt({ network });
    other.addInput({ hash: Buffer.alloc(32, 0x11), index: 0, witnessUtxo: { script: funding.output!, value: 50000n } });
    other.addOutput({ address: recipient, value: 31000n });
    otherPsbtHex = other.toHex();
  });

  describe('flag gating', function () {
    it('defaults both flags to off and requires SIGN for UPLOAD', function () {
      assert.equal(ovcSigningEnabled({}), false);
      assert.equal(ovcSigningEnabled({ POX5_LIVE_OVC_SIGN: 'true' }), true);
      assert.equal(ovcSigningEnabled({ POX5_LIVE_OVC_SIGN: '1' }), true);
      assert.equal(ovcSigningEnabled({ POX5_LIVE_OVC_SIGN: 'yes' }), false);
      assert.equal(ovcUploadEnabled({ POX5_LIVE_OVC_UPLOAD: 'true' }), false);
      assert.equal(ovcUploadEnabled({ POX5_LIVE_OVC_SIGN: 'true', POX5_LIVE_OVC_UPLOAD: 'true' }), true);
      assert.equal(ovcUploadEnabled({ POX5_LIVE_OVC_SIGN: 'true', POX5_LIVE_OVC_UPLOAD: '1' }), true);
    });
  });

  describe('fetchAwaitingSignatureExport', function () {
    it('fetches via the non-admin route with id and coins filters', async function () {
      const { bitgo, gets } = fakeBitGo(() => ({ transactions: [exportedTransaction('aabb')], errors: [] }));
      const exportResponse = await fetchAwaitingSignatureExport(bitgo, 'tbtcstxsignet', APPROVAL_ID);
      assert.equal(exportResponse.transactions.length, 1);
      assert.equal(gets.length, 1);
      assert.match(gets[0].url, /\/api\/v2\/pendingapprovals\/awaitingSignature\?id=pa-1&coins=tbtcstxsignet$/);
    });

    it('rejects responses without exactly one signed-shape transaction', async function () {
      const two = fakeBitGo(() => ({
        transactions: [exportedTransaction('aabb'), exportedTransaction('ccdd')],
      }));
      await assert.rejects(
        fetchAwaitingSignatureExport(two.bitgo, 'tbtcstxsignet', APPROVAL_ID),
        /expected exactly one/
      );
      const noPsbt = fakeBitGo(() => ({ transactions: [{ coin: 'tbtcstxsignet', coinSpecific: {} }] }));
      await assert.rejects(
        fetchAwaitingSignatureExport(noPsbt.bitgo, 'tbtcstxsignet', APPROVAL_ID),
        /no coinSpecific.txHex/
      );
      const malformed = fakeBitGo(() => ({ transactions: 'nope' }));
      await assert.rejects(
        fetchAwaitingSignatureExport(malformed.bitgo, 'tbtcstxsignet', APPROVAL_ID),
        /no transactions list/
      );
    });
  });

  describe('uploadSignedApproval', function () {
    it('resolves the approval with the OVC upload body', async function () {
      const { bitgo, puts } = fakeBitGo(undefined, () => ({ id: APPROVAL_ID, state: 'approved' }));
      await uploadSignedApproval(bitgo, 'tbtcstxsignet', APPROVAL_ID, { txHex: 'aabb' }, { source: 'unit-test' });
      assert.equal(puts[0].url, '/api/v2/tbtcstxsignet/pendingapprovals/pa-1');
      assert.deepEqual(puts[0].body, {
        state: 'approved',
        txHex: 'aabb',
        isSigned: true,
        diagnostics: { source: 'unit-test' },
      });
    });

    it('passes halfSigned through and uses its txHex when the top level has none', async function () {
      const { bitgo, puts } = fakeBitGo(undefined, () => ({ id: APPROVAL_ID, state: 'approved' }));
      await uploadSignedApproval(
        bitgo,
        'tbtcstxsignet',
        APPROVAL_ID,
        { halfSigned: { txHex: 'ccdd' } },
        { source: 'unit-test' }
      );
      assert.deepEqual(puts[0].body, {
        state: 'approved',
        txHex: 'ccdd',
        isSigned: true,
        diagnostics: { source: 'unit-test' },
        halfSigned: { txHex: 'ccdd' },
      });
      const empty = fakeBitGo();
      await assert.rejects(
        uploadSignedApproval(empty.bitgo, 'tbtcstxsignet', APPROVAL_ID, {}, {}),
        /neither txHex nor halfSigned/
      );
    });
  });

  describe('resolveOfflineCustodialSignature', function () {
    type SignerOverride = (exportResponse: unknown) => OvcSignerOutput;

    function cannedSignOutput(signedHex = psbtHex): OvcSignerOutput {
      return {
        mode: 'sign',
        coin: 'tbtcstxsignet',
        pendingApprovalId: APPROVAL_ID,
        explanation: { outputs: [{ address: recipient, amount: '30000' }], changeOutputs: [], fee: 10000 },
        signatures: [{ user: true, backup: false, bitgo: false }],
        transactions: [{ isHalfSigned: true, txHex: signedHex }],
      };
    }

    function args(overrides: {
      env?: NodeJS.ProcessEnv;
      exportPsbtHex?: string;
      signFunction?: typeof import('./ovc-signer').signWithOvc;
      expected?: Partial<ResolveOfflineCustodialArgs['expected']>;
    }): {
      args: ResolveOfflineCustodialArgs;
      checkpoints: Evidence[];
      approver: ReturnType<typeof fakeBitGo>;
      admin: ReturnType<typeof fakeBitGo>;
    } {
      const approverApi = fakeBitGo(() => ({
        transactions: [exportedTransaction(overrides.exportPsbtHex ?? psbtHex)],
        errors: [],
      }));
      const adminApi = fakeBitGo(
        (url: string) =>
          url.includes('awaitingSignature') ? { transactions: [] } : { id: APPROVAL_ID, state: 'approved' },
        () => ({ id: APPROVAL_ID, state: 'approved' })
      );
      const approver = { bitgo: approverApi.bitgo, actorId: 'approver-user' };
      const checkpoints: Evidence[] = [];
      return {
        args: {
          cell: CELL,
          env: overrides.env ?? {
            POX5_LIVE_OVC_SIGN: 'true',
            POX5_OVC_DIR: '/tmp/unit-ovc',
            POX5_OVC_KEY_PASSWORD: KEY_PASSWORD,
          },
          approver,
          approvalId: APPROVAL_ID,
          expected: {
            psbtHex,
            txid,
            address: recipient,
            amountSats: '30000',
            feeSats: '10000',
            ...(overrides.expected ?? {}),
          },
          evidence: { walletId: 'main-wallet', txid },
          checkpoint: async (evidence) => {
            checkpoints.push(evidence);
          },
          signFunction: overrides.signFunction ?? (async () => cannedSignOutput()),
          custodyAdminClient: adminApi.bitgo,
        },
        checkpoints,
        approver: approverApi,
        admin: adminApi,
      };
    }

    it('stays BLOCKED awaiting the offline signature by default', async function () {
      let signed = 0;
      const { args: resolveArgs } = args({
        env: {},
        signFunction: async () => {
          signed += 1;
          return cannedSignOutput();
        },
      });
      await assert.rejects(resolveOfflineCustodialSignature(resolveArgs), (error: unknown) => {
        assert((error as MatrixPrerequisite).status === 'BLOCKED');
        assert.match((error as Error).message, /awaits the offline BitGo Trust signature/);
        return true;
      });
      assert.equal(signed, 0, 'the signer must not run when the flag is off');
    });

    it('BLOCKs after signing when upload is not enabled, checkpointing the signature evidence', async function () {
      const { args: resolveArgs, checkpoints, approver } = args({});
      await assert.rejects(resolveOfflineCustodialSignature(resolveArgs), (error: unknown) => {
        assert((error as MatrixPrerequisite).status === 'BLOCKED');
        assert.match((error as Error).message, /POX5_LIVE_OVC_UPLOAD/);
        return true;
      });
      assert.equal(approver.gets.length, 1, 'the export fetch used the approver client');
      assert.equal(checkpoints.length, 1);
      assert.equal(checkpoints[0].signedWith, 'OVC');
      assert.equal(checkpoints[0].pendingApprovalId, APPROVAL_ID);
      assert.equal(checkpoints[0].walletId, 'main-wallet');
    });

    it('rejects an export that differs from the inspected PSBT', async function () {
      const { args: resolveArgs } = args({ exportPsbtHex: 'deadbeef' });
      await assert.rejects(resolveOfflineCustodialSignature(resolveArgs), /differs from the inspected/);
    });

    it('uploads via the custodyadmin client and returns the signed evidence', async function () {
      const {
        args: resolveArgs,
        checkpoints,
        approver,
        admin,
      } = args({
        env: {
          POX5_LIVE_OVC_SIGN: 'true',
          POX5_LIVE_OVC_UPLOAD: 'true',
          POX5_OVC_DIR: '/tmp/unit-ovc',
          POX5_OVC_KEY_PASSWORD: KEY_PASSWORD,
        },
      });
      const evidence = await resolveOfflineCustodialSignature(resolveArgs);
      assert.equal(evidence.signedWith, 'OVC');
      assert.equal(approver.puts.length, 0, 'the approver never uploads (one resolution per user)');
      assert.equal(admin.puts.length, 1);
      assert.equal(admin.puts[0].url, '/api/v2/tbtcstxsignet/pendingapprovals/pa-1');
      const body = admin.puts[0].body as Record<string, unknown>;
      assert.equal(body.state, 'approved');
      assert.equal(body.isSigned, true);
      assert.equal(body.txHex, psbtHex);
      assert.deepEqual(body.diagnostics, {
        source: 'pox5-live-matrix',
        signedWith: 'ovc-sign-export',
        environment: 'test',
        coin: 'tbtcstxsignet',
      });
      assert.equal(checkpoints[checkpoints.length - 1]?.signedWith, 'OVC');
    });

    it('accepts a resolved-and-removed approval after upload', async function () {
      // The platform deletes resolved approvals shortly after upload; the upload
      // response may carry no state and the follow-up GET may 404. Both mean resolved.
      const { args: resolveArgs } = args({
        env: {
          POX5_LIVE_OVC_SIGN: 'true',
          POX5_LIVE_OVC_UPLOAD: 'true',
          POX5_OVC_DIR: '/tmp/unit-ovc',
          POX5_OVC_KEY_PASSWORD: KEY_PASSWORD,
        },
      });
      resolveArgs.custodyAdminClient = fakeBitGo(
        () => {
          const error = new Error('pending approval not found') as Error & { status?: number };
          error.status = 404;
          throw error;
        },
        () => ({ id: APPROVAL_ID })
      ).bitgo;
      const evidence = await resolveOfflineCustodialSignature(resolveArgs);
      assert.equal(evidence.signedWith, 'OVC');
    });

    it('rejects a follow-up state that is not approved', async function () {
      const { args: resolveArgs } = args({
        env: {
          POX5_LIVE_OVC_SIGN: 'true',
          POX5_LIVE_OVC_UPLOAD: 'true',
          POX5_OVC_DIR: '/tmp/unit-ovc',
          POX5_OVC_KEY_PASSWORD: KEY_PASSWORD,
        },
      });
      resolveArgs.custodyAdminClient = fakeBitGo(
        () => ({ state: 'awaitingSignature' }),
        () => ({ id: APPROVAL_ID })
      ).bitgo;
      await assert.rejects(
        resolveOfflineCustodialSignature(resolveArgs),
        /left the approval in state awaitingSignature/
      );
    });

    it('cross-checks the signed transaction against the inspected PSBT', async function () {
      const mismatched = args({
        signFunction: async () => cannedSignOutput(otherPsbtHex),
      });
      await assert.rejects(resolveOfflineCustodialSignature(mismatched.args), /changed the unsigned transaction/);
    });

    it('requires the OVC explanation to pay the expected recipient and amount', async function () {
      const wrongRecipient = args({
        signFunction: async () => ({
          ...cannedSignOutput(),
          explanation: { outputs: [{ address: 'tb1qwrong', amount: '30000' }], changeOutputs: [] },
        }),
      });
      await assert.rejects(
        resolveOfflineCustodialSignature(wrongRecipient.args),
        /does not pay the expected recipient/
      );
      const wrongFee = args({
        signFunction: async () => ({
          ...cannedSignOutput(),
          explanation: { outputs: [{ address: recipient, amount: '30000' }], changeOutputs: [], fee: 999 },
        }),
      });
      await assert.rejects(resolveOfflineCustodialSignature(wrongFee.args), /differs from the inspected fee/);
    });

    it('requires a user signature on the signed transaction', async function () {
      const unsigned = args({
        signFunction: async () => {
          const output = cannedSignOutput();
          delete output.signatures;
          return output;
        },
      });
      await assert.rejects(resolveOfflineCustodialSignature(unsigned.args), /no user signature/);
    });

    it('rejects a signature for a different approval', async function () {
      const otherApproval = args({
        signFunction: async () => ({ ...cannedSignOutput(), pendingApprovalId: 'pa-other' }),
      });
      await assert.rejects(resolveOfflineCustodialSignature(otherApproval.args), /different pending approval/);
    });
  });
});
