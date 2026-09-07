import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

export const environments = ['test', 'staging'] as const;
export const coins = ['tbtcstx', 'tbtcstxprivate1', 'tbtcstxsignet'] as const;
export const walletTypes = ['hot', 'custodial'] as const;
export const operations = [
  'walletCreation',
  'faucetFunding',
  'pairedStake',
  'pairedPostCltvRecovery',
  'standaloneStake',
  'standalonePostCltvRecovery',
] as const;

export type Environment = (typeof environments)[number];
export type Coin = (typeof coins)[number];
export type WalletType = (typeof walletTypes)[number];
export type Operation = (typeof operations)[number];
export type Status = 'NOT_RUN' | 'PASS' | 'FAIL' | 'NOT_READY' | 'BLOCKED' | 'UNSUPPORTED';
export type Cell = { environment: Environment; coin: Coin; walletType: WalletType };
export type Evidence = {
  label?: string;
  descriptorLabel?: string;
  address?: string;
  walletId?: string;
  descriptorWalletId?: string;
  pairedWalletId?: string;
  enterpriseId?: string;
  approverWalletShareId?: string;
  pendingApprovalId?: string;
  enterpriseInviteApprovalId?: string;
  stakingRequestId?: string;
  txid?: string;
  outpoint?: string;
  amountSats?: number;
  feeSats?: number;
  observedHeight?: number;
  unlockHeight?: number;
  bondIndex?: number;
  bondSource?: 'CONFIGURED' | 'DISCOVERED';
  fundingSource?: 'PINNED' | 'EXISTING' | 'FAUCET';
  confirmations?: number;
  provisioning?: 'CREATED' | 'REUSED';
  signedWith?: 'OVC';
  enterpriseProvisioning?: 'CREATED' | 'REUSED';
  enterpriseAccess?: 'PROVISIONED' | 'REUSED';
  approverAccess?: 'PROVISIONED' | 'REUSED';
};
export type Row = Cell & {
  operation: Operation;
  status: Status;
  reason?: string;
  requestId?: string;
  startedAt?: string;
  finishedAt?: string;
  evidence: Evidence;
};
export type Report = { runId: string; createdAt: string; rows: Row[] };
export type Checkpoint = (evidence: Evidence) => Promise<void>;
export type Handler = (
  cell: Cell,
  row: Readonly<Row>,
  checkpoint: Checkpoint,
  report: Readonly<Report>
) => Promise<Evidence>;
export type Handlers = Record<Operation, Handler>;

export class MatrixPrerequisite extends Error {
  constructor(readonly status: 'NOT_READY' | 'BLOCKED' | 'UNSUPPORTED', readonly safeReason: string) {
    super(safeReason);
  }
}

/** Generic failure reason with the HTTP status only; server messages can carry sensitive text. */
function failureReason(error: unknown): string {
  const fallback = 'Operation failed; inspect secure service logs';
  if (typeof error !== 'object' || error === null || !('status' in error) || typeof error.status !== 'number') {
    return fallback;
  }
  return `${fallback}, HTTP ${error.status}`;
}

export function matrixCells(selection: Partial<Cell> = {}): Cell[] {
  return environments.flatMap((environment) =>
    coins.flatMap((coin) =>
      walletTypes
        .filter(
          (walletType) =>
            (!selection.environment || selection.environment === environment) &&
            (!selection.coin || selection.coin === coin) &&
            (!selection.walletType || selection.walletType === walletType)
        )
        .map((walletType) => ({ environment, coin, walletType }))
    )
  );
}

function selectedOperations(values: readonly Operation[]): Operation[] {
  if (
    values.length === 0 ||
    new Set(values).size !== values.length ||
    values.some((value) => !operations.includes(value))
  ) {
    throw new Error('Matrix operation selection must be nonempty and unique');
  }
  return [...values];
}

export function newReport(
  selection: Partial<Cell> = {},
  operationSelection: readonly Operation[] = operations
): Report {
  const selected = selectedOperations(operationSelection);
  return {
    runId: randomUUID(),
    createdAt: new Date().toISOString(),
    rows: matrixCells(selection).flatMap((cell) =>
      selected.map((operation) => ({ ...cell, operation, status: 'NOT_RUN' as const, evidence: {} }))
    ),
  };
}

// Only these scalar identifiers and counters can enter an artifact. Never serialize SDK responses.
export function checkedEvidence(evidence: Evidence): Evidence {
  const result: Evidence = {};
  for (const key of [
    'label',
    'descriptorLabel',
    'address',
    'walletId',
    'descriptorWalletId',
    'pairedWalletId',
    'enterpriseId',
    'approverWalletShareId',
    'pendingApprovalId',
    'enterpriseInviteApprovalId',
    'stakingRequestId',
    'txid',
    'outpoint',
  ] as const) {
    const value = evidence[key];
    if (value !== undefined) {
      if (!/^[a-zA-Z0-9:_-]{1,128}$/.test(value)) {
        throw new Error(`Unsafe ${key} in matrix evidence`);
      }
      result[key] = value;
    }
  }
  for (const key of [
    'amountSats',
    'feeSats',
    'observedHeight',
    'unlockHeight',
    'bondIndex',
    'confirmations',
  ] as const) {
    const value = evidence[key];
    if (value !== undefined) {
      if (!Number.isSafeInteger(value) || value < 0) {
        throw new Error(`Invalid ${key} in matrix evidence`);
      }
      result[key] = value;
    }
  }
  if (evidence.provisioning !== undefined) {
    if (evidence.provisioning !== 'CREATED' && evidence.provisioning !== 'REUSED') {
      throw new Error('Invalid provisioning in matrix evidence');
    }
    result.provisioning = evidence.provisioning;
  }
  if (evidence.bondSource !== undefined) {
    if (evidence.bondSource !== 'CONFIGURED' && evidence.bondSource !== 'DISCOVERED') {
      throw new Error('Invalid bond source in matrix evidence');
    }
    result.bondSource = evidence.bondSource;
  }
  if (evidence.signedWith !== undefined) {
    if (evidence.signedWith !== 'OVC') {
      throw new Error('Invalid signing source in matrix evidence');
    }
    result.signedWith = 'OVC';
  }
  if (evidence.fundingSource !== undefined) {
    if (!['PINNED', 'EXISTING', 'FAUCET'].includes(evidence.fundingSource)) {
      throw new Error('Invalid funding source in matrix evidence');
    }
    result.fundingSource = evidence.fundingSource;
  }
  if (evidence.enterpriseProvisioning !== undefined) {
    if (evidence.enterpriseProvisioning !== 'CREATED' && evidence.enterpriseProvisioning !== 'REUSED') {
      throw new Error('Invalid enterprise provisioning status in matrix evidence');
    }
    result.enterpriseProvisioning = evidence.enterpriseProvisioning;
  }
  if (evidence.approverAccess !== undefined) {
    if (evidence.approverAccess !== 'PROVISIONED' && evidence.approverAccess !== 'REUSED') {
      throw new Error('Invalid approver access status in matrix evidence');
    }
    result.approverAccess = evidence.approverAccess;
  }
  if (evidence.enterpriseAccess !== undefined) {
    if (evidence.enterpriseAccess !== 'PROVISIONED' && evidence.enterpriseAccess !== 'REUSED') {
      throw new Error('Invalid enterprise access status in matrix evidence');
    }
    result.enterpriseAccess = evidence.enterpriseAccess;
  }
  return result;
}

export function isStrictFailure(report: Report): boolean {
  return report.rows.some(
    (row) =>
      row.status === 'FAIL' ||
      row.status === 'BLOCKED' ||
      row.status === 'UNSUPPORTED' ||
      ((row.operation === 'walletCreation' || row.operation === 'faucetFunding') && row.status !== 'PASS')
  );
}

export function matrixSummary(report: Report): string {
  const lines = [
    'Early exit is a separate diagnostic, not post-CLTV recovery or matrix coverage.',
    'environment coin wallet operation status wallet txid reason',
  ];
  for (const row of report.rows) {
    lines.push(
      [
        row.environment,
        row.coin,
        row.walletType,
        row.operation,
        row.status,
        row.evidence.walletId ?? '-',
        row.evidence.txid ?? '-',
        row.reason ?? '-',
      ].join(' ')
    );
  }
  return lines.join('\n');
}

export async function executeMatrix(
  path: string,
  handlers: Handlers,
  selection: Partial<Cell> = {},
  paceMs = 0,
  operationSelection: readonly Operation[] = operations
): Promise<Report> {
  if (!Number.isSafeInteger(paceMs) || paceMs < 0 || paceMs > 60_000) {
    throw new Error('Live matrix pace must be between zero and 60000 ms');
  }
  const selected = selectedOperations(operationSelection);
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  let report: Report;
  try {
    report = JSON.parse(await readFile(path, 'utf8')) as Report;
    const expected = newReport(selection, selected).rows;
    if (
      !Array.isArray(report.rows) ||
      report.rows.length !== expected.length ||
      report.rows.some(
        (row, index) =>
          row.environment !== expected[index].environment ||
          row.coin !== expected[index].coin ||
          row.walletType !== expected[index].walletType ||
          row.operation !== expected[index].operation
      )
    ) {
      throw new Error('Existing report does not match the selected matrix');
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
    report = newReport(selection, selected);
    await persist();
  }

  async function persist(): Promise<void> {
    const temp = `${path}.${process.pid}.tmp`;
    await writeFile(temp, JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
    await rename(temp, path);
  }

  for (const row of report.rows) {
    if (row.status !== 'NOT_RUN') {
      continue;
    }
    // An unfinished attempt might have broadcast before the process died. Never automatically replay it.
    if (row.startedAt) {
      row.status = 'BLOCKED';
      row.reason = 'Interrupted operation needs manual transaction reconciliation';
      row.finishedAt = new Date().toISOString();
      await persist();
      continue;
    }
    const cell = { environment: row.environment, coin: row.coin, walletType: row.walletType };
    row.requestId = randomUUID();
    row.startedAt = new Date().toISOString();
    await persist();
    try {
      const result = await handlers[row.operation](
        cell,
        row,
        async (evidence) => {
          row.evidence = { ...row.evidence, ...checkedEvidence(evidence) };
          await persist();
        },
        report
      );
      row.evidence = { ...row.evidence, ...checkedEvidence(result) };
      if (row.operation === 'walletCreation' && row.evidence.provisioning !== 'CREATED') {
        throw new Error('Fresh wallet creation was not verified');
      }
      row.status = 'PASS';
    } catch (error) {
      row.status = error instanceof MatrixPrerequisite ? error.status : 'FAIL';
      // Do not put unknown error messages, request bodies, or SDK objects in JSON or terminal output.
      // HTTP status and a short allowlisted server message are kept so the failing call is identifiable.
      row.reason =
        error instanceof MatrixPrerequisite && /^[a-zA-Z0-9 ,._/():;-]{1,256}$/.test(error.safeReason)
          ? error.safeReason
          : failureReason(error);
    }
    row.finishedAt = new Date().toISOString();
    await persist();
    if (paceMs) await sleep(paceMs);
  }
  return report;
}
