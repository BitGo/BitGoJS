export interface InitiateRecoveryOptions {
  userKey: string;
  backupKey: string;
  bitgoKey?: string; // optional for xrp recoveries
  recoveryDestination: string;
  walletPassphrase?: string;
}
