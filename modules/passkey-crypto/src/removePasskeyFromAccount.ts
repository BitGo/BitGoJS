import { BitGoBase } from '@bitgo/sdk-core';
import type { WebAuthnOtpDevice } from '@bitgo/public-types';

/**
 * Permanently removes a passkey credential from the user's account.
 * Call removePasskeyFromWallet() for all affected wallets before calling this.
 */
export async function removePasskeyFromAccount(params: { bitgo: BitGoBase; device: WebAuthnOtpDevice }): Promise<void> {
  const { bitgo, device } = params;
  if (!device.id) {
    throw new Error('device.id is required to remove a passkey from the account');
  }
  await bitgo.del(bitgo.url(`/user/otp/${device.id}`)).result();
}
