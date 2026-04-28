// TODO: replace with: export type { WebAuthnOtpDevice } from '@bitgo/public-types'
export interface WebAuthnOtpDevice {
  id: string; // serialized MongoDB _id — used for DELETE
  credentialId: string; // from authenticatorInfo.credID
  prfSalt?: string;
  isPasskey?: boolean;
  extensions?: Record<string, boolean>;
}
