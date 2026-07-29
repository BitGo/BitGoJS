export function isBolt11Invoice(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  if (value.startsWith('lnbc') || value.startsWith('lntb')) {
    return true;
  }
  return false;
}

export interface CreateLightningInvoiceParams {
  valueSat?: number;
  memo?: string;
  expiry?: number;
}

export interface LightningInvoiceResponse {
  valueMsat: bigint;
  paymentHash: string;
  invoice: string;
  walletId: string;
  status: 'open' | 'settled' | 'canceled';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  valueSat?: number;
  memo?: string;
  amtPaidMsat?: bigint;
}
