import { randomUUID } from 'node:crypto';
import { access, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import { createBitGoApiClient } from './bitgo-api';
import { checkedEvidence, type Cell, type Checkpoint, type Evidence, MatrixPrerequisite } from './live-matrix';
import {
  authenticateLiveActor,
  dedicatedLabel,
  dedicatedMainWallet,
  ensureEnterpriseApproverMembership,
  ensureCustodialApproverWalletAccess,
  loadLocalPox5Environment,
  liveApprover,
  liveContext,
  type LiveContext,
  liveUnlockOtp,
} from './live-matrix-provision';
import { isRecord } from './rpc';

type Environment = 'test' | 'staging';
type ProvisionStatus = 'RUNNING' | 'PASS' | 'NOT_READY' | 'BLOCKED' | 'UNSUPPORTED' | 'FAIL';

type ProvisionReport = {
  runId: string;
  createdAt: string;
  startedAt: string;
  finishedAt?: string;
  environment: Environment;
  coin: 'tbtcstxsignet';
  walletType: 'custodial';
  status: ProvisionStatus;
  failureHttpStatus?: number;
  reason?: string;
  evidence: Evidence;
};

type Options = {
  environment: Environment;
  reportPath: string;
  createWallet: boolean;
  createEnterprise: boolean;
};

function parseArguments(args: string[]): Options {
  let environment: Environment | undefined;
  let reportPath: string | undefined;
  let createWallet = false;
  let createEnterprise = false;

  for (let i = 0; i < args.length; i += 1) {
    switch (args[i]) {
      case '--environment': {
        const value = args[++i];
        if (value !== 'test' && value !== 'staging') throw new Error('Environment must be test or staging');
        environment = value;
        break;
      }
      case '--report': {
        const value = args[++i];
        if (!value) throw new Error('A report path is required');
        reportPath = resolve(value);
        break;
      }
      case '--create-wallet':
        createWallet = true;
        break;
      case '--create-enterprise':
        createEnterprise = true;
        break;
      default:
        throw new Error(
          'Usage: provision-approver --environment test|staging --report PATH [--create-wallet] [--create-enterprise]'
        );
    }
  }

  if (!environment || !reportPath) {
    throw new Error(
      'Usage: provision-approver --environment test|staging --report PATH [--create-wallet] [--create-enterprise]'
    );
  }
  if (createEnterprise && !createWallet) {
    throw new Error('--create-enterprise also requires --create-wallet');
  }
  return { environment, reportPath, createWallet, createEnterprise };
}

function safeHttpStatus(error: unknown): number | undefined {
  if (!isRecord(error)) return undefined;
  const status = typeof error.status === 'number' ? error.status : error.statusCode;
  return typeof status === 'number' && Number.isSafeInteger(status) && status >= 400 && status <= 599
    ? status
    : undefined;
}

function safeReason(error: unknown): string {
  if (error instanceof MatrixPrerequisite && /^[a-zA-Z0-9 ,._/-]{1,160}$/.test(error.safeReason)) {
    return error.safeReason;
  }
  const status = safeHttpStatus(error);
  if (status !== undefined) return `Provisioning API request failed with HTTP ${status}`;
  return 'Provisioning failed; detailed error output was redacted';
}

async function ensureNewReport(path: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  try {
    await access(path);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return;
    throw new Error('Unable to check provisioning report path');
  }
  throw new Error('Provisioning report already exists; reconcile it and choose a new path');
}

async function persistEnterpriseOverride(environment: Environment, enterpriseId: string): Promise<void> {
  const envPath = join(process.cwd(), 'test/integration/pox5/.env');
  let contents = '';
  try {
    contents = await readFile(envPath, 'utf8');
  } catch (error) {
    if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) {
      throw new Error('Unable to read the local PoX-5 environment file');
    }
  }

  const key = `POX5_LIVE_ENTERPRISE_${environment.toUpperCase()}`;
  const lines = contents.split(/\r?\n/);
  const active = new RegExp(`^\\s*(?:export\\s+)?${key}\\s*=`);
  const commented = new RegExp(`^\\s*#\\s*(?:export\\s+)?${key}\\s*=`);
  const activeIndexes = lines.flatMap((line, index) => (active.test(line) ? [index] : []));
  if (activeIndexes.length > 1) {
    throw new MatrixPrerequisite(
      'BLOCKED',
      'Multiple staging enterprise overrides exist in the local environment file'
    );
  }
  const index = activeIndexes[0] ?? lines.findIndex((line) => commented.test(line));
  if (index >= 0) lines[index] = `${key}=${enterpriseId}`;
  else lines.push(`${key}=${enterpriseId}`);

  const temp = `${envPath}.${process.pid}.tmp`;
  await writeFile(temp, lines.join('\n').replace(/\n*$/, '\n'), { mode: 0o600 });
  await rename(temp, envPath);
}

async function createSelfServeEnterprise(options: Options, cell: Cell, checkpoint: Checkpoint): Promise<string> {
  const key = `POX5_LIVE_ENTERPRISE_${options.environment.toUpperCase()}`;
  if (process.env[key]) {
    throw new MatrixPrerequisite('BLOCKED', 'An environment-specific enterprise is already configured');
  }
  const token = process.env[`BITGO_TOKEN_${options.environment.toUpperCase()}`];
  if (!token) throw new MatrixPrerequisite('BLOCKED', 'Missing mandatory environment API token');

  const bitgo = createBitGoApiClient(options.environment, token);
  await authenticateLiveActor(bitgo, liveUnlockOtp(options.environment, process.env));
  process.stdout.write('Provisioning status: creating a self-serve enterprise\n');
  const response: unknown = await bitgo.post(bitgo.url('/enterprise', 2)).send({}).result();
  const enterpriseId =
    isRecord(response) && typeof response.enterpriseId === 'string' ? response.enterpriseId : undefined;
  if (!enterpriseId) throw new Error('Enterprise creation response has no identifier');

  await checkpoint({ enterpriseId, enterpriseProvisioning: 'CREATED' });
  await persistEnterpriseOverride(options.environment, enterpriseId);
  process.env[key] = enterpriseId;

  const enterprises = await bitgo.coin(cell.coin).enterprises().list();
  const created = enterprises.find((enterprise) => enterprise.id === enterpriseId);
  if (!created) {
    throw new MatrixPrerequisite('NOT_READY', 'Created enterprise is not yet visible to the initiator');
  }
  return enterpriseId;
}

async function requireCustodialWalletEnabled(actor: LiveContext, coin: Cell['coin']): Promise<void> {
  const enterprise = await actor.bitgo.coin(coin).enterprises().get({ id: actor.enterprise });
  const data = isRecord(enterprise) && isRecord(enterprise._enterprise) ? enterprise._enterprise : undefined;
  if (data?.canCreateCustodialWallet !== true) {
    throw new MatrixPrerequisite('UNSUPPORTED', 'Configured enterprise is not enabled to create custodial wallets');
  }
}

async function run(): Promise<void> {
  await loadLocalPox5Environment();
  const options = parseArguments(process.argv.slice(2));
  await ensureNewReport(options.reportPath);

  const cell: Cell = {
    environment: options.environment,
    coin: 'tbtcstxsignet',
    walletType: 'custodial',
  };
  const report: ProvisionReport = {
    runId: randomUUID(),
    createdAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    environment: options.environment,
    coin: 'tbtcstxsignet',
    walletType: 'custodial',
    status: 'RUNNING',
    evidence: {},
  };

  async function persist(): Promise<void> {
    const temp = `${options.reportPath}.${process.pid}.tmp`;
    await writeFile(temp, JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
    await rename(temp, options.reportPath);
  }

  const checkpoint: Checkpoint = async (evidence) => {
    report.evidence = { ...report.evidence, ...checkedEvidence(evidence) };
    await persist();
  };

  await persist();
  try {
    if (options.createEnterprise) {
      await createSelfServeEnterprise(options, cell, checkpoint);
    }
    process.stdout.write('Provisioning status: authenticating the enterprise initiator\n');
    const actor = await liveContext(options.environment, cell.coin, process.env);
    process.stdout.write('Provisioning status: verifying custodial wallet entitlement\n');
    await requireCustodialWalletEnabled(actor, cell.coin);
    process.stdout.write('Provisioning status: authenticating the separate approver\n');
    const approver = await liveApprover(options.environment, actor, process.env);
    process.stdout.write('Provisioning status: creating or reusing the dedicated custodial wallet\n');
    const label = dedicatedLabel(cell, 'stake');
    const { wallet, provisioning } = await dedicatedMainWallet(
      cell,
      actor,
      label,
      false,
      checkpoint,
      options.createWallet
    );
    await checkpoint({ walletId: wallet.id(), provisioning });
    process.stdout.write('Provisioning status: inviting the approver with no enterprise permissions\n');
    const enterpriseAccess = await ensureEnterpriseApproverMembership(cell, actor, approver, checkpoint);
    process.stdout.write('Provisioning status: creating or accepting the wallet-scoped approver share\n');
    const access = await ensureCustodialApproverWalletAccess(cell, wallet, actor.userId, approver, checkpoint);
    report.status = 'PASS';
    report.evidence = { ...report.evidence, ...checkedEvidence(enterpriseAccess), ...checkedEvidence(access) };
  } catch (error) {
    report.status = error instanceof MatrixPrerequisite ? error.status : 'FAIL';
    report.failureHttpStatus = safeHttpStatus(error);
    report.reason = safeReason(error);
  }

  report.finishedAt = new Date().toISOString();
  await persist();
  process.stdout.write(
    JSON.stringify({
      status: report.status,
      report: options.reportPath,
      walletId: report.evidence.walletId,
      walletProvisioning: report.evidence.provisioning,
      enterpriseAccess: report.evidence.enterpriseAccess,
      enterpriseInviteApprovalId: report.evidence.enterpriseInviteApprovalId,
      approverAccess: report.evidence.approverAccess,
      failureHttpStatus: report.failureHttpStatus,
      reason: report.reason,
    }) + '\n'
  );
  if (report.status !== 'PASS') process.exitCode = 1;
}

run().catch(() => {
  process.stdout.write('Provisioning failed before completion; no detailed error output was emitted\n');
  process.exitCode = 1;
});
