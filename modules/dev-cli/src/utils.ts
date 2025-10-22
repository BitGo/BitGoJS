import chalk from 'chalk';

export function logSuccess(message: string): void {
  console.log(chalk.green('✓'), message);
}

export function logError(message: string): void {
  console.log(chalk.red('✗'), message);
}

export function logInfo(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}

export function logWarning(message: string): void {
  console.log(chalk.yellow('⚠'), message);
}

export function formatJSON(obj: any): string {
  return JSON.stringify(obj, null, 2);
}

export function logJSON(obj: any): void {
  console.log(formatJSON(obj));
}
