# BitGo abstract-lightning

## Custodial userAuth key reset

A custody lightning wallet's userAuth key is encrypted with the wallet password. If the customer forgets it, they
can replace the key, with BitGo support approving the request.

```ts
const wallet = new CustodialLightningWallet(sdkWallet);

// 1. Start a reset with the NEW passphrase.
const { requestId, status, verificationCode } = await wallet.requestUserAuthKeyReset({
  passphrase: newPassphrase,
  encryptionVersion,
});
// show `verificationCode` to the customer; they read it to BitGo support

// 2. Show progress. Rejects with an error whose `status` is 404 when there is no request.
const { status, completedAt, releasedAt } = await wallet.getUserAuthKeyResetRequest();

// 3. Cancel while the request is still `requested`.
await wallet.cancelUserAuthKeyResetRequest(requestId);
```

`requestUserAuthKeyReset` creates the new key locally, encrypts it with the passphrase, registers the encrypted key, signs
a proof with the new key and queues the request. The private key and the passphrase are never sent unencrypted. The
verification code is computed locally and is never taken from a server response.

`status` is one of `requested`, `canceled`, `expired`, `pending`, `dnr_held`, `wp_swapped`, `completed`, `failed`.
"Released" is not a status: the wallet is usable again once `releasedAt` is set on a `completed` request.

After a successful reset, other wallet members lose access until the customer re-shares the wallet to them with
`wallets.reshareWalletWithSpenders(walletId, passphrase, encryptionVersion, { includeAdmins: true, onlyNeedsRecovery: true })`.

`computeUserAuthResetVerificationCode(walletId, newUserAuthKeyPub)` and `compareUserAuthResetVerificationCodes(a, b)` are
exported so BitGo services and tools compute and compare the code identically.
