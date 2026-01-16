export const LIGHTNING_INVOICE = 'invoice';

export function isBolt11Invoice(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  if (value.startsWith('lnbc') || value.startsWith('lntb')) {
    return true;
  }
  return false;
}
