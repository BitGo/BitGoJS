export { derivePassword } from './derivePassword';
export { registerPasskey } from './registerPasskey';
export { deriveEnterpriseSalt } from './deriveEnterpriseSalt';
export { buildEvalByCredential, matchDeviceByCredentialId } from './prfHelpers';
export { removePasskeyFromAccount } from './removePasskeyFromAccount';
export type { WebAuthnOtpDevice, PasskeyAuthResult, PasskeyGetOptions, WebAuthnProvider } from './webAuthnTypes';
