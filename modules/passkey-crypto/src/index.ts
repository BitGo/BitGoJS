export { derivePassword } from '@bitgo/sdk-core';
export { registerPasskey } from './registerPasskey';
export { deriveEnterpriseSalt } from '@bitgo/sdk-core';
export { buildEvalByCredential, matchDeviceByCredentialId } from './prfHelpers';
export { removePasskeyFromAccount } from './removePasskeyFromAccount';
export type { WebAuthnOtpDevice, PasskeyAuthResult, PasskeyGetOptions, WebAuthnProvider } from '@bitgo/sdk-core';
export { removePasskeyFromWallet } from './removePasskeyFromWallet';
export { attachPasskeyToWallet } from './attachPasskeyToWallet';
export { derivePasskeyPrfKey } from './derivePasskeyPrfKey';
