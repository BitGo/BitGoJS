import { resolve } from 'node:path';

import { parseBitGoCoin, parseBitGoEnvironment, parseBitGoWalletType } from './bitgo-api';
import {
  executeMatrix,
  isStrictFailure,
  matrixSummary,
  operations as supportedOperations,
  type Cell,
  type Operation,
} from './live-matrix';
import { createLiveHandlers } from './live-matrix-live';
import { loadLocalPox5Environment } from './live-matrix-provision';

function argumentsForRun(args: string[]): {
  selection: Partial<Cell>;
  reportPath: string;
  operations: Operation[];
  operationWasSelected: boolean;
} {
  const options = new Map<string, string>();
  const selectedOperations: Operation[] = [];
  for (let index = 0; index < args.length; index += 2) {
    const name = args[index];
    const value = args[index + 1];
    if (name === '--operation') {
      if (!value || value.startsWith('--') || !supportedOperations.some((operation) => operation === value)) {
        throw new Error(`Invalid matrix operation; choose one of: ${supportedOperations.join(', ')}`);
      }
      selectedOperations.push(value as Operation);
      continue;
    }
    if (
      !['--environment', '--coin', '--wallet-type', '--report'].includes(name) ||
      !value ||
      value.startsWith('--') ||
      options.has(name)
    ) {
      throw new Error(
        'Invalid live matrix argument; use --environment, --coin, --wallet-type, --report, or --operation'
      );
    }
    options.set(name, value);
  }
  const selection: Partial<Cell> = {};
  if (options.has('--environment')) selection.environment = parseBitGoEnvironment(options.get('--environment'));
  if (options.has('--coin')) selection.coin = parseBitGoCoin(options.get('--coin'));
  if (options.has('--wallet-type')) selection.walletType = parseBitGoWalletType(options.get('--wallet-type'));
  const report = options.get('--report') ?? process.env.POX5_LIVE_REPORT;
  if (!report) throw new Error('A stable --report path or POX5_LIVE_REPORT is required for interrupted-run safety');
  const reportPath = resolve(report);
  return {
    selection,
    reportPath,
    operations: selectedOperations.length > 0 ? selectedOperations : [...supportedOperations],
    operationWasSelected: selectedOperations.length > 0,
  };
}

async function main(): Promise<void> {
  await loadLocalPox5Environment();
  const { selection, reportPath, operations, operationWasSelected } = argumentsForRun(process.argv.slice(2));
  const pace = Number(process.env.POX5_LIVE_PACE_MS ?? '2000');
  console.log(`Redacted matrix artifact: ${reportPath}`);
  const report = await executeMatrix(reportPath, createLiveHandlers(process.env), selection, pace, operations);
  console.log(matrixSummary(report));
  console.log('BTC lockup/reclaim only; Stacks bond registration was not tested.');
  if (isStrictFailure(report) || (operationWasSelected && report.rows.some((row) => row.status !== 'PASS'))) {
    process.exitCode = 1;
  }
}

main().catch(() => {
  // Do not expose process environment, remote response bodies, or SDK request objects.
  console.error('Live matrix failed before completion; inspect its partial artifact and secure service logs.');
  process.exitCode = 1;
});
